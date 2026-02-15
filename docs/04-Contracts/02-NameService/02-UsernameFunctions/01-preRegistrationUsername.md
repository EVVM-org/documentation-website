---
title: "preRegistrationUsername"
description: "Username pre-registration using centralized verification via Core.sol"
sidebar_position: 1
---

# preRegistrationUsername

:::info[Centralized Verification]
This function uses Core.sol's `validateAndConsumeNonce()` for signature verification. All NameService operations use **async execution** (`isAsyncExec = true`).
:::

**Function Type**: `external`  
**Function Signature**: `preRegistrationUsername(address,bytes32,address,uint256,bytes,uint256,uint256,bytes)`

Pre-registers a username hash to prevent front-running attacks during the registration process. This function creates a 30-minute reservation window using a commit-reveal scheme where users commit to a hash of their desired username plus a secret lock number.

## Parameters

| Parameter                   | Type      | Description                                                                                                                     |
| --------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `user`                      | `address` | The address of the end-user initiating the pre-registration.                                                                    |
| `hashPreRegisteredUsername` | `bytes32` | The commitment hash calculated as `keccak256(abi.encodePacked(username, lockNumber))`.                                      |
| `originExecutor`            | `address` | Optional tx.origin restriction (use `address(0)` for unrestricted execution).                                                   |
| `nonce`                     | `uint256` | User's centralized nonce from Core.sol for this operation.                           |
| `signature`                 | `bytes`   | EIP-191 signature authorizing this operation (verified by Core.sol).                                                     |
| `priorityFeeEvvm`          | `uint256` | Optional fee (in Principal Tokens) paid to `msg.sender` (executor) if they are a staker. |
| `nonceEvvm`                | `uint256` | **Required if `priorityFeeEvvm > 0`**. User's Core nonce for the payment operation.   |
| `signatureEvvm`            | `bytes`   | **Required if `priorityFeeEvvm > 0`**. User's signature authorizing the Core payment.           |

:::note[Signature Requirements]

**NameService Signature** (`signature`):
- Format: `{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}`
- Uses `NameServiceHashUtils.hashDataForPreRegistrationUsername(hashPreRegisteredUsername)`'
- Reference: [Pre-Registration Signature Structure](../../../05-SignatureStructures/02-NameService/01-preRegistrationUsernameStructure.md)

**Payment Signature** (`signatureEvvm`) - if `priorityFeeEvvm > 0`:
- Follows Core payment format
- Uses `CoreHashUtils.hashDataForPay()`
- Reference: [Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md)

:::

##Hash Username Structure

The `hashPreRegisteredUsername` is calculated off-chain:

```solidity
bytes32 hashPreRegisteredUsername = keccak256(abi.encodePacked(username, lockNumber));
```

**Components:**
- `username` (string): The desired username (kept secret during commit phase)
- `lockNumber` (uint256): Secret number (required later during `registrationUsername`)

**Security:** The hash conceals the actual username from front-runners. Only the user knows the `lockNumber` needed to complete registration.

## Execution Flow

### 1. Signature Verification (Core.sol)

```solidity
core.validateAndConsumeNonce(
    user,                                                      // Signer
    Hash.hashDataForPreRegistrationUsername(hashPreRegisteredUsername), // Hash payload
    originExecutor,                                            // tx.origin check
    nonce,                                                     // Core nonce
    true,                                                      // Async
    signature                                                  // EIP-191 signature
);
```

**What Core.sol validates:**
- ✅ Signature matches `user` address
- ✅ Nonce is valid and available
- ✅ `tx.origin` matches `originExecutor` (if specified)
- ✅ Marks nonce as consumed
- ✅ Optionally delegates to UserValidator

### 2. Priority Fee Processing (if > 0)

```solidity
if (priorityFeeEvvm > 0) {
    requestPay(user, 0, priorityFeeEvvm, nonceEvvm, signatureEvvm);
}
```

Internally calls:
```solidity
core.pay(
    user,                                  // Payer
    address(this),                         // NameService
    "",                                    // No identity
    principalToken,                        // PT
    priorityFeeEvvm,                       // Amount
    priorityFeeEvvm,                       // Priority fee
    address(this),                         // Executor
    nonceEvvm,                             // Payment nonce
    true,                                  // Async
    signatureEvvm                          // Payment sig
);
```

### 3. Commitment Storage

Stores the commitment for 30 minutes:

```solidity
string memory key = string.concat("@", AdvancedStrings.bytes32ToString(hashPreRegisteredUsername));

identityDetails[key] = IdentityBaseMetadata({
    owner: user,
    expirationDate: block.timestamp + 30 minutes,
    customMetadataMaxSlots: 0,
    offerMaxSlots: 0,
    flagNotAUsername: 0x01                    // Marked as pre-registration
});
```

**Key Format:** `@<hash_string>` (e.g., `@0xa7f3c2d8e9b4f1a6...`)

### 4. Staker Rewards (if executor is staker)

```solidity
if (core.isAddressStaker(msg.sender)) {
    makeCaPay(msg.sender, core.getRewardAmount() + priorityFeeEvvm);
}
```

**Reward Breakdown:**
- Base reward: 1x `core.getRewardAmount()`
- Priority fee: Full `priorityFeeEvvm` amount
- Distributed via `core.caPay()`

## Execution Methods

Can be executed by any address. Rewards only distributed if `msg.sender` is a staker.

### Fisher Execution (Off-Chain Executors)

1. User signs operation and payment (if priority fee)
2. Fisher captures and validates transaction
3. Fisher submits to NameService contract
4. If fisher is staker, receives rewards

### Direct Execution

1. User or service submits directly to contract
2. If executor is staker, receives rewards
3. No intermediary needed

## Complete Example

**Scenario:** User wants to reserve username "alice" for 30 minutes

### Step 1: Generate Commitment

```solidity
string memory username = "alice";
uint256 lockNumber = 987654321;  // Keep secret!

bytes32 hashPreRegisteredUsername = keccak256(
    abi.encodePacked(username, lockNumber)
);
// Result: 0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
```

### Step 2: Generate Operation Signature

```solidity
// Generate hash payload
bytes32 hashPayload = NameServiceHashUtils.hashDataForPreRegistrationUsername(
    hashPreRegisteredUsername
);

// Construct signature message (via Core)
// Format: {evvmId},{nameServiceAddress},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

### Step 3: Call Function

```solidity
nameService.preRegistrationUsername(
    user,                                   // 0x742d...
    hashPreRegisteredUsername,              // 0xa7f3...
    address(0),                             // Unrestricted
    nonce,                                  // 42
    signature,                              // Operation sig
    1000000000000000000,                    // 1 PT priority fee
    nonceEvvm,                              // 43
    signatureEvvm                           // Payment sig
);
```

### Step 4: Wait 30 Minutes

Commitment is now stored and valid for 30 minutes. Must complete registration within this window.

## Important Notes

### Time Window
- **Valid for**: 30 minutes from commitment
- **Must register**: Before `expirationDate` passes
- **If expired**: Must submit new pre-registration

### Lock Number Security
- **Randomness**: Use cryptographically secure random number
- **Secrecy**: Never share before registration
- **Storage**: Store safely client-side
- **Size**: uint256 (0 to 2^256-1)

### Front-Running Protection
```solidity
// Commit phase: Only hash is public
hashUsername = keccak256(abi.encodePacked("alice", 987654321))
// Front-runners see: 0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5...
// Front-runners cannot determine: "alice"

// Reveal phase (after 30 min): Username is revealed
regist rationUsername(..., "alice", 987654321, ...)
// Contract validates: keccak256("alice", 987654321) == stored hash
```

## Gas Costs

**Estimated Gas Usage:**
- Base operation: ~50,000 gas
- Core verification: ~5,000 gas
- Storage (commitment): ~20,000 gas
- Payment (if priority fee): ~30,000 gas
- **Total**: ~75,000 - 105,000 gas

## Error Handling

Common revert reasons:

```solidity
// From Core.sol validation
"Invalid signature"                 // Signature verification failed
"Nonce already used"                // Nonce was consumed
"Invalid executor"                  // tx.origin doesn't match originExecutor

// From payment processing (if priorityFeeEvvm > 0)
"Insufficient balance"              // User lacks PT for fee
"Payment signature invalid"         // Payment signature failed
```

## Related Functions

- **[registrationUsername](./02-registrationUsername.md)** - Complete registration (reveal phase)
- **[Core.validateAndConsumeNonce](../../01-EVVM/03-SignatureAndNonceManagement.md)** - Signature verification
