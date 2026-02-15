---
title: "withdrawOffer"
description: "Cancel a marketplace offer and retrieve locked principal tokens back to offeror"
sidebar_position: 4
---

# withdrawOffer

:::info[Signature Verification]
This function uses **Core.sol's centralized signature verification** via `validateAndConsumeNonce()`. All NameService operations use the universal signature format with `NameServiceHashUtils` for hash generation.
:::

**Function Type**: External  
**Function Signature**: `withdrawOffer(address user, string memory username, uint256 offerID, address originExecutor, uint256 nonce, bytes memory signature, uint256 priorityFeeEvvm, uint256 nonceEvvm, bytes memory signatureEvvm) external`

Allows the original offeror to cancel their marketplace offer and retrieve the locked principal tokens. This refunds the entire locked amount (99.5% offer + marketplace fees) back to the offeror. Can only be executed by the address that created the offer. Optional priority fee can be paid to incentivize faster execution.

## Function Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | The address that created the offer (offeror) |
| `username` | `string` | Username the offer was made for |
| `offerID` | `uint256` | Identifier of the offer being withdrawn |
| `originExecutor` | `address` | EOA that will execute the transaction (verified with tx.origin) |
| `nonce` | `uint256` | User's Core nonce for this signature (prevents replay attacks) |
| `signature` | `bytes` | EIP-191 signature from `user` (offeror) authorizing the withdrawal |
| `priorityFeeEvvm` | `uint256` | Optional priority fee for faster processing (paid to staker executor) |
| `nonceEvvm` | `uint256` | User's Core nonce for the payment signature |
| `signatureEvvm` | `bytes` | User's signature authorizing the priority fee payment (if > 0) |

## Signature Requirements

This function requires **one or two signatures** from the offeror:

### 1. NameService Withdraw Offer Signature (Required)

Authorizes the offer cancellation and refund:

```
Message Format: {evvmId},{serviceAddress},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
Hash Payload: NameServiceHashUtils.hashDataForWithdrawOffer(username, offerID)
Async Execution: true (always)
```

**Example**:
```solidity
string memory username = "alice";
uint256 offerID = 0;

bytes32 hashPayload = NameServiceHashUtils.hashDataForWithdrawOffer(
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

**Note**: The `requestPay` call uses `amount = 0` because only the priority fee is being paid. The offer refund comes from locked escrow, not the user's active balance.

## Execution Flow

### 1. Signature Verification (Centralized)

Core.sol validates the signature and consumes the nonce:

```solidity
core.validateAndConsumeNonce(
    user,
    Hash.hashDataForWithdrawOffer(username, offerID),
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

### 2. Offerer Verification

Validates that the signer is the original offer creator:

```solidity
if (usernameOffers[username][offerID].offerer != user)
    revert Error.UserIsNotOwnerOfOffer();
```

**Checks**:
- `user` must match the stored `offerer` address
- Only the offer creator can withdraw their offer
- Prevents unauthorized withdrawals

**Reverts With**:
- `UserIsNotOwnerOfOffer()` - Signer is not the offer creator

### 3. Optional Priority Fee Payment

If offeror provides a priority fee, processes the payment:

```solidity
if (priorityFeeEvvm > 0)
    requestPay(user, 0, priorityFeeEvvm, nonceEvvm, signatureEvvm);
```

**Payment Details**:
- Payer: Offeror (withdrawing user)
- Recipient: NameService contract
- Base amount: 0 (no additional payment, refund from escrow)
- Priority fee: Variable (set by offeror to incentivize execution)

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

### 4. Refund to Offeror

Returns the locked offer amount to the offeror:

```solidity
makeCaPay(user, usernameOffers[username][offerID].amount);
```

**Token Flow**:
- From: NameService locked funds
- To: Original offeror
- Amount: Net offer amount (99.5% of original commitment)

This internally calls `core.caPay()` to distribute from NameService reserves.

### 5. Offer Cleanup

Marks the offer as cancelled by clearing the offerer:

```solidity
usernameOffers[username][offerID].offerer = address(0);
```

**State Changes**:
- Offer slot becomes available for reuse
- Offer data remains but offerer = address(0) marks it invalid
- Prevents double withdrawal or acceptance

### 6. Staker Reward Distribution

If executor is a registered staker, distributes rewards:

```solidity
if (core.isAddressStaker(msg.sender)) {
    makeCaPay(
        msg.sender,
        core.getRewardAmount() +
            ((usernameOffers[username][offerID].amount * 1) / 796) +
            priorityFeeEvvm
    );
}
```

**Reward Calculation**:
```
Total Reward = Base Reward + Marketplace Fee Share + Priority Fee
             = 1x + (offerAmount / 796) + priorityFeeEvvm
             = 1x + ~0.1256% of offer + priorityFeeEvvm
```

**Example** (100 token offer, 1 token priority fee):
```
Base: 1x getRewardAmount() (e.g., 0.01 tokens)
Marketplace: 100 / 796 ≈ 0.1256 tokens (~0.1256%)
Priority: 1.0 tokens
Total: ~1.1356 tokens
```

### 7. Token Unlock Accounting

Updates the locked token accounting to reflect released funds:

```solidity
principalTokenTokenLockedForWithdrawOffers -=
    (usernameOffers[username][offerID].amount) +
    (((usernameOffers[username][offerID].amount * 1) / 199) / 4);
```

**Components Released**:
- Net offer amount: Refunded to offeror
- Marketplace fee portion: Used for staker reward
- Total unlocked from escrow

## Complete Usage Example

```solidity
// Setup (offeror withdrawing their offer)
address offeror = 0x123...;  // Original offer creator
string memory username = "alice";
uint256 offerID = 0;  // First offer on this username
address originExecutor = msg.sender;
uint256 nonce = core.getNonce(offeror, address(nameService));
uint256 priorityFee = 1000000000000000000; // 1 token

// Retrieve offer details (for reference)
OfferMetadata memory offer = nameService.usernameOffers(username, offerID);
// offer.offerer = 0x123...  (must match offeror)
// offer.expirationDate = 1800000000
// offer.amount = 99500000000000000000  (99.5 tokens net)

// Generate withdraw offer signature
bytes32 hashPayload = NameServiceHashUtils.hashDataForWithdrawOffer(
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

bytes memory signature = signMessage(offeror, message);

// Generate priority fee payment signature (if providing fee)
uint256 nonceEvvm = core.getNonce(offeror, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    offeror,
    address(nameService),
    priorityFee,  // Only the fee, base amount = 0
    nonceEvvm
);

// Execute offer withdrawal
nameService.withdrawOffer(
    offeror,
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
// - Offeror receives: 99.5 tokens (refund from escrow)
// - Offer marked cancelled (offerer set to address(0))
// - Staker receives: ~1x + 0.1256 tokens + 1 token priority
// - Locked tokens decreased by ~99.6256 tokens
```

## Gas Cost Estimation

| Operation | Approximate Gas |
|-----------|----------------|
| Core signature verification | ~25,000 |
| Offerer verification | ~5,000 |
| Refund to offeror (caPay) | ~30,000 |
| Offer cleanup | ~5,000 |
| Staker reward distribution | ~30,000 |
| Token unlock accounting | ~5,000 |
| Optional priority fee payment | ~85,000 |
| **Total (no priority fee)** | **~100,000 gas** |
| **Total (with priority fee)** | **~185,000 gas** |

*Gas costs vary based on whether priority fee is included and current network conditions.*

## Error Handling

### Core.sol Errors
- `Core__NonceAlreadyUsed()` - Signature nonce already consumed
- `Core__InvalidSignature()` - Invalid signature format or signer
- `Core__InvalidExecutor()` - msg.sender not authorized as executor

### NameService Validation Errors
- `UserIsNotOwnerOfOffer()` - Signer is not the offer creator

### Payment Errors
- Core.pay() errors (for priority fee payment)
- Core.caPay() errors (for refund payment)

## Economic Model

### Token Flow Diagram

**100 Token Offer Withdrawal Example**:
```
Locked Escrow (from makeOffer):
┌─────────────────────────────────────┐
│ Net Offer: 99.5 tokens              │
│ Marketplace Fee: 0.5 tokens         │
└─────────────────────────────────────┘
              ↓
        withdrawOffer()
              ↓
┌─────────────────────────────────────┐
│ Offeror Refund:                     │
│   └─ 99.5 tokens → Offeror          │  ← Full net offer returned
├─────────────────────────────────────┤
│ Staker Reward:                      │
│   ├─ Base: 1x getRewardAmount()     │
│   ├─ Share: ~0.1256 tokens (~0.126%)│  ← Portion of marketplace fee
│   └─ Priority: 1.0 tokens           │  ← Optional offeror incentive
│   Total: ~1.1356 tokens             │
├─────────────────────────────────────┤
│ Offer Status:                       │
│   └─ Cancelled (offerer = address(0))│
└─────────────────────────────────────┘
```

### Marketplace Fee Distribution on Withdrawal

The 0.5% marketplace fee from `makeOffer` reduces on withdrawal:
- **~25%** (0.125% of offer) → Staker executing withdrawal
- **~75%** (0.375% of offer) → Lost/retained by protocol (not refunded)

This creates an incentive structure:
- Stakers profit from processing withdrawals (~0.125%)
- Offerors receive full net amount back (99.5%)
- Protocol retains small fee for marketplace usage

### Priority Fee Dynamics

Offerors can offer priority fees to:
- Accelerate withdrawal processing during congestion
- Ensure timely refund before price volatility
- Compete for staker attention in busy markets

Priority fees go 100% to the executing staker.

## State Changes

1. **Offeror balance** → Increased by offer amount (via caPay refund)
2. **Offeror balance** (if priority fee) → Decreased by `priorityFeeEvvm`
3. **usernameOffers[username][offerID].offerer** → Set to address(0) (offer cancelled)
4. **principalTokenTokenLockedForWithdrawOffers** → Decreased by unlocked amount
5. **Core nonce** → Offeror's nonce marked as consumed
6. **Staker balance** (if applicable) → Increased by reward + priority fee

## Related Functions

- [makeOffer](./03-makeOffer.md) - Create the marketplace offer being withdrawn
- [acceptOffer](./05-acceptOffer.md) - Alternative to withdrawal (complete sale)
- [GetterFunctions - Offer Info](../05-GetterFunctions.md) - Query offer details before withdrawing

## Implementation Notes

### No Expiration Enforcement

Unlike `acceptOffer`, withdrawals work regardless of expiration:
- Expired offers can be withdrawn by offeror at any time
- No timestamp validation on withdrawal
- Offers don't "lock" after expiration; creator retains control

This allows offerors to reclaim funds whenever needed, even if their offer wasn't accepted before expiration.

### Zero Priority Fee Handling

When `priorityFeeEvvm = 0`:
- `requestPay` check skips the call entirely
- No payment signature required (`signatureEvvm` can be empty)
- Only the withdraw offer signature is validated
- Reduces gas cost significantly (~85,000 gas saved)

### Reward Calculation Precision

The marketplace reward uses a single division:
```solidity
(offerAmount * 1) / 796
```

This evaluates to approximately:
- `offerAmount / 796 ≈ 0.1256% of offer`

For a 100 token offer:
- `100 / 796 ≈ 0.1256 tokens`

The constant `796` is calibrated to distribute roughly 25% of the 0.5% marketplace fee (0.125%) to the executing staker.

### Token Unlock Accounting

The unlock calculation matches the lock calculation from `makeOffer`:
```solidity
unlock = netOfferAmount + (((netOfferAmount * 1) / 199) / 4)
```

This ensures:
- Net offer amount released: Refunded to offeror
- Fee portion released: Used for staker reward
- Total matches original lock, preventing accounting drift

### Offer Slot Reuse

After withdrawal:
- Offer slot becomes available (offerer = address(0))
- Future `makeOffer` can reuse this offerID
- Efficient slot management prevents unbounded growth
- `offerMaxSlots` doesn't decrease (tracks historical high water mark)
