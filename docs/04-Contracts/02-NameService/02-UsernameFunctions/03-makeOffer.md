---
title: "makeOffer"
description: "Create a time-bound marketplace offer to purchase a registered username with locked principal tokens"
sidebar_position: 3
---

# makeOffer

:::info[Signature Verification]
This function uses **Core.sol's centralized signature verification** via `validateAndConsumeNonce()`. All NameService operations use the universal signature format with `NameServiceHashUtils` for hash generation.
:::

**Function Type**: External  
**Function Signature**: `makeOffer(address user, string memory username, uint256 amount, uint256 expirationDate, address originExecutor, uint256 nonce, bytes memory signature, uint256 priorityFeeEvvm, uint256 nonceEvvm, bytes memory signatureEvvm) external returns (uint256 offerID)`

Creates a formal, time-limited offer to purchase an existing username by locking principal tokens in the marketplace. The offer commits 99.5% of the amount to potential purchase (0.5% marketplace fee). Can be executed by any address, with staker rewards distributed to `msg.sender` if they are registered as a staker.

## Function Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | The address making the offer (offeror) |
| `username` | `string` | Target username for purchase offer |
| `amount` | `uint256` | Total principal tokens to commit (gross amount including 0.5% fee) |
| `expirationDate` | `uint256` | Unix timestamp when offer automatically expires |
| `originExecutor` | `address` | The address authorized to submit this specific signed transaction |
| `nonce` | `uint256` | User's Core nonce for this signature (prevents replay attacks) |
| `signature` | `bytes` | EIP-191 signature from `user` authorizing offer creation |
| `priorityFeeEvvm` | `uint256` | Optional priority fee for faster processing (paid to staker executor) |
| `nonceEvvm` | `uint256` | User's Core nonce for the payment signature |
| `signatureEvvm` | `bytes` | User's signature authorizing the payment transfer |

**Returns**: `uint256 offerID` - Sequential identifier assigned to the created offer

## Signature Requirements

This function requires **two signatures** from the user:

### 1. NameService Offer Signature

Authorizes the marketplace offer creation:

```
Message Format: {evvmId},{serviceAddress},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
Hash Payload: NameServiceHashUtils.hashDataForMakeOffer(username, amount, expirationDate)
Async Execution: true (always)
```

**Example**:
```solidity
string memory username = "alice";
uint256 amount = 50000000000000000000; // 50 tokens
uint256 expirationDate = 1800000000; // Far future timestamp

bytes32 hashPayload = NameServiceHashUtils.hashDataForMakeOffer(
    username,
    amount,
    expirationDate
);

string memory message = string.concat(
    Strings.toString(block.chainid),
    ",",
    Strings.toHexString(address(nameServiceContract)),
    ",",
    Strings.toHexString(uint256(hashPayload)),
    ",",
    Strings.toHexString(originExecutor),
    ",",
    Strings.toString(nonce),
    ",true"
);

bytes32 messageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n", Strings.toString(bytes(message).length), message));
(uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, messageHash);
bytes memory signature = abi.encodePacked(r, s, v);
```

### 2. Payment Signature (Core.sol)

Authorizes the payment of `amount + priorityFeeEvvm`:

```
Payment Amount: amount + priorityFeeEvvm
Recipient: address(nameServiceContract)
```

This uses the standard [Single Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).

## Execution Flow

### 1. Signature Verification (Centralized)

Core.sol validates the signature and consumes the nonce:

```solidity
core.validateAndConsumeNonce(
    user,
    Hash.hashDataForMakeOffer(username, amount, expirationDate),
    originExecutor,
    nonce,
    true,  // Always async execution
    signature
);
```

**Validation Steps**:
- Verifies nonce hasn't been used (prevents replay)
- Validates EIP-191 signature matches user + payload
- Confirms `tx.origin == originExecutor` (EOA verification)
- Marks nonce as consumed (prevents double-use)

**Reverts With**:
- `Core__NonceAlreadyUsed()` - Nonce already consumed
- `Core__InvalidSignature()` - Signature validation failed
- `Core__InvalidExecutor()` - Executing EOA doesn't match originExecutor

### 2. Username Validation

Validates the target username exists and is available for offers:

```solidity
if (
    identityDetails[username].flagNotAUsername == 0x01 ||
    !verifyIfIdentityExists(username)
) revert Error.InvalidUsername();
```

**Checks**:
- Username must be registered (not pre-registration)
- Username must not be flagged as invalid
- Username must exist in identity registry

**Reverts With**:
- `InvalidUsername()` - Username doesn't exist or is flagged

### 3. Offer Parameters Validation

Validates offer terms are reasonable:

```solidity
if (expirationDate <= block.timestamp)
    revert Error.CannotBeBeforeCurrentTime();

if (amount == 0)
    revert Error.AmountMustBeGreaterThanZero();
```

**Validation Rules**:
- Expiration must be in the future
- Amount must be greater than zero

**Reverts With**:
- `CannotBeBeforeCurrentTime()` - Expiration date has passed
- `AmountMustBeGreaterThanZero()` - Zero amount offer

### 4. Payment Processing

Transfers the offer amount from user to NameService contract:

```solidity
requestPay(user, amount, priorityFeeEvvm, nonceEvvm, signatureEvvm);
```

This internally calls:
```solidity
core.pay(
    user,                    // Payer
    address(this),          // Recipient (NameService)
    amount + priorityFeeEvvm,
    nonceEvvm,
    true,                   // Always async
    signatureEvvm
);
```

**Token Flow**:
- User → NameService: `amount + priorityFeeEvvm`
- Locked for potential username transfer

**Reverts With**: Any Core.pay() errors (insufficient balance, invalid signature)

### 5. Offer ID Assignment

Finds the next available sequential offer slot:

```solidity
uint256 offerID = 0;
while (usernameOffers[username][offerID].offerer != address(0))
    offerID++;
```

Increments through IDs until finding an empty slot (deleted or never used).

### 6. Offer Storage

Creates the marketplace offer with net amount (after 0.5% fee):

```solidity
uint256 amountToOffer = ((amount * 995) / 1000);  // 99.5%

usernameOffers[username][offerID] = Structs.OfferMetadata({
    offerer: user,
    expirationDate: expirationDate,
    amount: amountToOffer
});
```

**Fee Breakdown**:
- Net offer (locked for purchase): 99.5% of amount
- Marketplace fee: 0.5% of amount

### 7. Token Locking Accounting

Updates total locked tokens for withdrawal tracking:

```solidity
principalTokenTokenLockedForWithdrawOffers +=
    amountToOffer +      // Net offer (99.5%)
    (amount / 800);      // Fee portion (0.125%)
```

**Components**:
- Net offer amount: Used if offer is accepted
- Fee portion: Available for withdrawal refunds

### 8. Staker Reward Distribution

If executor is a registered staker, distributes rewards:

```solidity
if (core.isAddressStaker(msg.sender)) {
    makeCaPay(
        msg.sender,
        core.getRewardAmount() +         // Base reward (1x)
            ((amount * 125) / 100_000) + // 0.125% of offer
            priorityFeeEvvm              // Priority fee
    );
}
```

**Reward Calculation**:
```
Total Reward = Base Reward + Marketplace Incentive + Priority Fee
             = 1x + (amount × 0.125%) + priorityFeeEvvm
```

**Example** (50 token offer, 1 token priority fee):
```
Base: 1x getRewardAmount() (e.g., 0.01 tokens)
Marketplace: 50 × 0.00125 = 0.0625 tokens
Priority: 1.0 tokens
Total: ~1.0725 tokens
```

### 9. Offer Slot Management

Updates the maximum offer slot index for this username:

```solidity
if (offerID > identityDetails[username].offerMaxSlots) {
    identityDetails[username].offerMaxSlots++;
} else if (identityDetails[username].offerMaxSlots == 0) {
    identityDetails[username].offerMaxSlots++;
}
```

Tracks highest offer ID for efficient iteration.

## Complete Usage Example

```solidity
// Setup
address user = 0x123...;
string memory username = "bob";
uint256 amount = 100000000000000000000; // 100 tokens
uint256 expirationDate = block.timestamp + 30 days;
address originExecutor = msg.sender;
uint256 nonce = core.getNonce(user, address(nameService));
uint256 priorityFee = 5000000000000000000; // 5 tokens

// Generate offer signature
bytes32 hashPayload = NameServiceHashUtils.hashDataForMakeOffer(
    username,
    amount,
    expirationDate
);

string memory message = string.concat(
    Strings.toString(block.chainid),
    ",",
    Strings.toHexString(address(nameService)),
    ",",
    Strings.toHexString(uint256(hashPayload)),
    ",",
    Strings.toHexString(originExecutor),
    ",",
    Strings.toString(nonce),
    ",true"
);

bytes memory signature = signMessage(user, message);

// Generate payment signature (amount + priority fee)
uint256 nonceEvvm = core.getNonce(user, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    user,
    address(nameService),
    amount + priorityFee,
    nonceEvvm
);

// Execute offer creation
uint256 offerID = nameService.makeOffer(
    user,
    username,
    amount,
    expirationDate,
    originExecutor,
    nonce,
    signature,
    priorityFee,
    nonceEvvm,
    signatureEvvm
);

// offerID = 0 (first offer for this username)
// Net offer locked: 99.5 tokens (99.5%)
// Marketplace fee: 0.5 tokens (0.5%)
// Staker reward: ~1x + 0.125 tokens + 5 tokens priority
```

## Gas Cost Estimation

| Operation | Approximate Gas |
|-----------|----------------|
| Core signature verification | ~25,000 |
| Username validation | ~5,000 |
| Payment processing (Core.pay) | ~85,000 |
| Offer storage (new slot) | ~45,000 |
| Staker reward distribution | ~30,000 |
| **Total Estimate** | **~190,000 gas** |

*Gas costs vary based on offer slot reuse and current network conditions.*

## Error Handling

### Core.sol Errors
- `Core__NonceAlreadyUsed()` - Signature nonce already consumed
- `Core__InvalidSignature()` - Invalid signature format or signer
- `Core__InvalidExecutor()` - msg.sender not authorized as executor

### NameService Validation Errors
- `InvalidUsername()` - Username doesn't exist or is pre-registration
- `CannotBeBeforeCurrentTime()` - Expiration date in the past
- `AmountMustBeGreaterThanZero()` - Offer amount is zero

### Payment Errors
- Core.pay() errors (insufficient balance, invalid payment signature)

## Economic Model

### Offer Amount Distribution

**100 Token Offer Example**:
```
┌────────────────────────────────────┐
│ User Pays: 100 tokens              │
├────────────────────────────────────┤
│ Net Offer (locked): 99.5 tokens    │  ← Transferred if accepted
│ Marketplace Fee: 0.5 tokens        │  ← NameService revenue
└────────────────────────────────────┘

Staker Reward Breakdown:
├─ Base Reward: 1x getRewardAmount()
├─ Marketplace Incentive: 0.125 tokens (0.125% of 100)
└─ Priority Fee: Variable (set by user)
```

### Fee vs Reward Split

The 0.5% marketplace fee splits into:
- **25%** (0.125% of offer) → Immediate staker reward
- **75%** (0.375% of offer) → Retained by protocol

This creates a marketplace incentive for stakers to process offers while maintaining protocol sustainability.

## State Changes

1. **User balance** → Decreased by `amount + priorityFeeEvvm`
2. **NameService balance** → Increased by `amount + priorityFeeEvvm`
3. **usernameOffers[username][offerID]** → New offer metadata stored
4. **principalTokenTokenLockedForWithdrawOffers** → Increased by locked amount
5. **identityDetails[username].offerMaxSlots** → Potentially incremented
6. **Core nonce** → User's nonce marked as consumed
7. **Staker balance** (if applicable) → Increased by reward + priority fee

## Related Functions

- [acceptOffer](./05-acceptOffer.md) - Accept a marketplace offer and transfer username
- [withdrawOffer](./04-withdrawOffer.md) - Cancel offer and reclaim locked tokens
- [getPriceOfRegistration](../05-GetterFunctions.md#getpriceofregistration) - Uses market offers for pricing
- [preRegistrationUsername](./01-preRegistrationUsername.md) - Initial username registration flow

## Implementation Notes

### Offer Expiration

Offers don't automatically expire:
- Expired offers can still be withdrawn by offerer
- Current owner can reject expired offers via acceptOffer validation
- Expiration acts as a commitment deadline, not automatic cleanup

### Sequential Offer IDs

Offer IDs are assigned sequentially per username:
- First offer: ID 0
- Deleted offers leave gaps that are reused
- `offerMaxSlots` tracks the highest ever used ID

### Token Locking Precision

The locked amount calculation ensures accurate accounting:
```solidity
netOffer = (amount * 995) / 1000        // 99.5%
locked = netOffer + (amount / 800)       // Add 0.125% for tracking
```

The additional 0.125% ensures the marketplace fee portion is accounted for in withdrawal scenarios.
