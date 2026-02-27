---
title: "acceptOffer"
description: "Accept a marketplace offer to transfer username ownership and complete the sale"
sidebar_position: 5
---

# acceptOffer

:::info[Signature Verification]
This function uses **Core.sol's centralized signature verification** via `validateAndConsumeNonce()`. All NameService operations use the universal signature format with `NameServiceHashUtils` for hash generation.
:::

**Function Type**: External  
**Function Signature**: `acceptOffer(address user, string memory username, uint256 offerID, address originExecutor, uint256 nonce, bytes memory signature, uint256 priorityFeeEvvm, uint256 nonceEvvm, bytes memory signatureEvvm) external`

Allows the current username owner to accept a marketplace offer, transferring ownership to the offeror and receiving the locked principal tokens. This completes the username sale transaction. Optional priority fee can be paid to incentivize faster execution by staker nodes.

## Function Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Current owner of the username (seller) |
| `username` | `string` | Username being sold |
| `offerID` | `uint256` | Identifier of the offer being accepted |
| `originExecutor` | `address` | The address authorized to submit this specific signed transaction |
| `nonce` | `uint256` | User's Core nonce for this signature (prevents replay attacks) |
| `signature` | `bytes` | EIP-191 signature from `user` (seller) authorizing the sale |
| `priorityFeeEvvm` | `uint256` | Optional priority fee for faster processing (paid to staker executor) |
| `nonceEvvm` | `uint256` | User's Core nonce for the payment signature |
| `signatureEvvm` | `bytes` | User's signature authorizing the priority fee payment (if > 0) |

## Signature Requirements

This function requires **one or two signatures** from the username owner:

### 1. NameService Accept Offer Signature (Required)

Authorizes the username sale and ownership transfer:

```
Message Format: {evvmId},{serviceAddress},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
Hash Payload: NameServiceHashUtils.hashDataForAcceptOffer(username, offerID)
Async Execution: true (always)
```

**Example**:
```solidity
string memory username = "alice";
uint256 offerID = 0; // First offer

bytes32 hashPayload = NameServiceHashUtils.hashDataForAcceptOffer(
    username,
    offerID
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

### 2. Payment Signature (Conditional - Only if priorityFeeEvvm > 0)

If providing a priority fee, authorizes payment to the executor:

```
Payment Amount: priorityFeeEvvm (only the fee, no base amount)
Recipient: address(nameServiceContract)
```

This uses the standard [Single Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).

**Note**: The `requestPay` call uses `amount = 0` because only the priority fee is being paid by the seller. The offer amount transfers from the locked escrow, not from the seller's active balance.

## Execution Flow

### 1. Signature Verification (Centralized)

Core.sol validates the signature and consumes the nonce:

```solidity
core.validateAndConsumeNonce(
    user,
    Hash.hashDataForAcceptOffer(username, offerID),
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

### 2. Ownership Verification

Validates that the signer is the current username owner:

```solidity
if (identityDetails[username].owner != user)
    revert Error.UserIsNotOwnerOfIdentity();
```

**Checks**:
- `user` must be the registered owner of `username`
- Only the owner can accept offers for their username

**Reverts With**:
- `UserIsNotOwnerOfIdentity()` - Signer doesn't own the username

### 3. Offer Validation

Validates the offer exists and is still active:

```solidity
if (
    usernameOffers[username][offerID].offerer == address(0) ||
    usernameOffers[username][offerID].expirationDate < block.timestamp
) revert Error.OfferInactive();
```

**Validation Rules**:
- Offer must exist (offerer != address(0))
- Offer must not have expired (expirationDate >= current time)

**Reverts With**:
- `OfferInactive()` - Offer doesn't exist or has expired

### 4. Optional Priority Fee Payment

If seller provides a priority fee, processes the payment:

```solidity
if (priorityFeeEvvm > 0) {
    requestPay(user, 0, priorityFeeEvvm, nonceEvvm, signatureEvvm);
}
```

**Payment Details**:
- Payer: Current owner (seller)
- Recipient: NameService contract
- Base amount: 0 (no additional payment, offer already locked)
- Priority fee: Variable (set by seller to incentivize execution)

This internally calls:
```solidity
core.pay(
    user,
    address(this),
    0 + priorityFeeEvvm,  // Only the fee
    nonceEvvm,
    true,
    signatureEvvm
);
```

**Reverts With**: Any Core.pay() errors (invalid signature, insufficient balance)

### 5. Payment to Seller

Transfers the locked offer amount to the current owner (seller):

```solidity
makeCaPay(user, usernameOffers[username][offerID].amount);
```

**Token Flow**:
- From: NameService locked funds
- To: Current owner (seller)
- Amount: Net offer amount (99.5% of original offer)

This internally calls `core.caPay()` to distribute from NameService reserves.

### 6. Ownership Transfer

Transfers username to the offeror (buyer):

```solidity
identityDetails[username].owner = usernameOffers[username][offerID].offerer;
```

**State Changes**:
- Previous owner: Receives payment, loses username
- New owner: Gains username, locked offer amount transferred
- All metadata remains intact (only ownership changes)

### 7. Offer Cleanup

Marks the offer as completed by clearing the offerer:

```solidity
usernameOffers[username][offerID].offerer = address(0);
```

This makes the offer slot available for reuse.

### 8. Staker Reward Distribution

If executor is a registered staker, distributes rewards:

```solidity
if (core.isAddressStaker(msg.sender)) {
    makeCaPay(
        msg.sender,
        (core.getRewardAmount()) +
            (((usernameOffers[username][offerID].amount * 1) / 199) / 4) +
            priorityFeeEvvm
    );
}
```

**Reward Calculation**:
```
Total Reward = Base Reward + Marketplace Fee Share + Priority Fee
             = 1x + (offerAmount / 199 / 4) + priorityFeeEvvm
             = 1x + ~0.1256% of offer + priorityFeeEvvm
```

**Example** (100 token offer, 2 token priority fee):
```
Base: 1x getRewardAmount() (e.g., 0.01 tokens)
Marketplace: 100 / 199 / 4 ≈ 0.1256 tokens (~0.1256%)
Priority: 2.0 tokens
Total: ~2.1356 tokens
```

### 9. Token Unlock Accounting

Updates the locked token accounting to reflect released funds:

```solidity
principalTokenTokenLockedForWithdrawOffers -=
    (usernameOffers[username][offerID].amount) +
    (((usernameOffers[username][offerID].amount * 1) / 199) / 4);
```

**Components Released**:
- Net offer amount: Paid to seller
- Marketplace reward portion: Paid to staker
- Total unlocked from escrow

## Complete Usage Example

```solidity
// Setup (owner accepting an offer)
address owner = 0x123...;  // Current username owner (seller)
string memory username = "alice";
uint256 offerID = 0;  // First offer on this username
address originExecutor = msg.sender;
uint256 nonce = core.getNonce(owner, address(nameService));
uint256 priorityFee = 2000000000000000000; // 2 tokens

// Retrieve offer details (for reference)
OfferMetadata memory offer = nameService.usernameOffers(username, offerID);
// offer.offerer = 0x456...  (buyer)
// offer.expirationDate = 1800000000
// offer.amount = 99500000000000000000  (99.5 tokens net)

// Generate accept offer signature
bytes32 hashPayload = NameServiceHashUtils.hashDataForAcceptOffer(
    username,
    offerID
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

bytes memory signature = signMessage(owner, message);

// Generate priority fee payment signature (if providing fee)
uint256 nonceEvvm = core.getNonce(owner, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    owner,
    address(nameService),
    priorityFee,  // Only the fee, base amount = 0
    nonceEvvm
);

// Execute offer acceptance
nameService.acceptOffer(
    owner,
    username,
    offerID,
    originExecutor,
    nonce,
    signature,
    priorityFee,
    nonceEvvm,
    signatureEvvm
);

// Result:
// - Owner receives: 99.5 tokens (from locked escrow)
// - Username transfers to: 0x456... (buyer/offeror)
// - Staker receives: ~1x + 0.125 tokens + 2 tokens priority
// - Offer marked complete (offerer set to address(0))
// - Locked tokens decreased by 99.625 tokens
```

## Gas Cost Estimation

| Operation | Approximate Gas |
|-----------|----------------|
| Core signature verification | ~25,000 |
| Ownership + offer validation | ~10,000 |
| Payment to seller (caPay) | ~30,000 |
| Ownership transfer | ~25,000 |
| Offer cleanup | ~5,000 |
| Staker reward distribution | ~30,000 |
| Token unlock accounting | ~5,000 |
| Optional priority fee payment | ~85,000 |
| **Total (no priority fee)** | **~130,000 gas** |
| **Total (with priority fee)** | **~215,000 gas** |

*Gas costs vary based on whether priority fee is included and current network conditions.*

## Error Handling

### Core.sol Errors
- `Core__NonceAlreadyUsed()` - Signature nonce already consumed
- `Core__InvalidSignature()` - Invalid signature format or signer
- `Core__InvalidExecutor()` - msg.sender not authorized as executor

### NameService Validation Errors
- `UserIsNotOwnerOfIdentity()` - Signer doesn't own the username
- `OfferInactive()` - Offer doesn't exist or has expired

### Payment Errors
- Core.pay() errors (for priority fee payment)
- Core.caPay() errors (for seller payment)

## Economic Model

### Token Flow Diagram

**100 Token Offer Acceptance Example**:
```
Locked Escrow (from makeOffer):
┌─────────────────────────────────────┐
│ Net Offer: 99.5 tokens              │
│ Marketplace Fee: 0.5 tokens         │
└─────────────────────────────────────┘
              ↓
        acceptOffer()
              ↓
┌─────────────────────────────────────┐
│ Seller Payment:                     │
│   └─ 99.5 tokens → Owner            │  ← Current owner receives sale amount
├─────────────────────────────────────┤
│ Staker Reward:                      │
│   ├─ Base: 1x getRewardAmount()     │
│   ├─ Share: ~0.125 tokens (~0.126%) │  ← Portion of marketplace fee
│   └─ Priority: 2.0 tokens           │  ← Optional seller incentive
│   Total: ~2.1356 tokens             │
├─────────────────────────────────────┤
│ Ownership Transfer:                 │
│   └─ Username → Offeror (buyer)     │
└─────────────────────────────────────┘
```

### Marketplace Fee Distribution

The 0.5% marketplace fee from `makeOffer` splits on acceptance:
- **~25%** (0.125% of offer) → Staker executing acceptOffer
- **~75%** (0.375% of offer) → Protocol retention

This incentivizes stakers to execute acceptances while maintaining protocol sustainability.

### Priority Fee Dynamics

Sellers can offer priority fees to:
- Accelerate offer acceptance during high demand
- Ensure timely execution before offer expiration
- Compete for staker attention in crowded markets

Priority fees go 100% to the executing staker, creating dynamic market incentives.

## State Changes

1. **Seller balance** → Increased by offer amount (via caPay)
2. **Seller balance** (if priority fee) → Decreased by `priorityFeeEvvm`
3. **Username ownership** → Transferred from seller to offeror
4. **usernameOffers[username][offerID].offerer** → Set to address(0) (offer complete)
5. **principalTokenTokenLockedForWithdrawOffers** → Decreased by unlocked amount
6. **Core nonce** → Seller's nonce marked as consumed
7. **Staker balance** (if applicable) → Increased by reward + priority fee

## Related Functions

- [makeOffer](./03-makeOffer.md) - Create the marketplace offer being accepted
- [withdrawOffer](./04-withdrawOffer.md) - Cancel offer (alternative to acceptance)
- [GetterFunctions - Username Info](../05-GetterFunctions.md) - Query offer details before accepting

## Implementation Notes

### Offer Expiration Enforcement

Expired offers are automatically rejected:
- `expirationDate < block.timestamp` triggers `OfferInactive()` revert
- No manual cleanup required; expiration is enforced on acceptance
- Expired offers can still be withdrawn by the offeror

### Zero Priority Fee Handling

When `priorityFeeEvvm = 0`:
- `requestPay` call is skipped entirely
- No payment signature required (`signatureEvvm` can be empty)
- Only the accept offer signature is validated
- Reduces gas cost significantly (~85,000 gas saved)

### Reward Precision

The marketplace reward calculation uses integer division:
```solidity
(((offerAmount * 1) / 199) / 4)
```

This evaluates to approximately:
- `offerAmount / 199 = ~0.5025% of offer`
- `divided by 4 = ~0.1256% of offer`

For a 100 token offer:
- `100 / 199 / 4 ≈ 0.1256 tokens`

The nested division prevents overflow while maintaining reasonable precision for typical offer amounts.

### Ownership Transfer Atomicity

The ownership transfer happens **after** all validations and payments:
1. Validate signature & ownership
2. Validate offer exists & active
3. Process payments (priority fee + seller payment)
4. **Then** transfer ownership

This ensures the seller receives payment before losing ownership, preventing edge cases where transfer succeeds but payment fails.
