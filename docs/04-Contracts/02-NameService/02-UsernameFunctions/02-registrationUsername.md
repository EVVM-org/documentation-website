---
title: "registrationUsername"
description: "Username registration completion using centralized Core.sol verification"
sidebar_position: 2
---

# registrationUsername

:::info[Centralized Verification]
This function uses Core.sol's `validateAndConsumeNonce()` for signature verification. Completes the commit-reveal scheme started by `preRegistrationUsername`.
:::

**Function Type**: `external`  
**Function Signature**: `registrationUsername(address,string,uint256,address,uint256,bytes,uint256,uint256,bytes)`

Completes username registration by revealing the username and lock number used in pre-registration. This function validates the reveal against the stored commitment, processes the registration fee payment, and grants 366 days of ownership.

**Requirements:**
- Valid pre-registration with matching hash must exist
- Pre-registration must belong to the same `user`
- Pre-registration must not be expired (within 30-minute window)
- Username must be available and valid format
- User must pay registration fee (100x EVVM reward or market-based)

## Parameters

| Parameter           | Type      | Description                                                                                                                       |
| ------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `user`              | `address` | The address of the registrant (must match pre-registration address).                           |
| `username`          | `string`  | The desired username being registered (revealed from commit phase).                            |
| `lockNumber`        | `uint256` | The secret number used during pre-registration. Proves ownership of commitment. |
| `originExecutor`    | `address` | Optional tx.origin restriction (use `address(0)` for unrestricted).                                                                        |
| `nonce`             | `uint256` | User's centralized Core nonce for this operation.                                                                        |
| `signature`         | `bytes`   | EIP-191 signature authorizing this operation (verified by Core.sol).                                                           |
| `priorityFeeEvvm`  | `uint256` | Optional fee paid to executor, added to registration fee payment.         |
| `nonceEvvm`        | `uint256` | User's Core nonce for the payment operation (registration fee + priority fee).                                                   |
| `signatureEvvm`    | `bytes`   | User's signature authorizing the payment (registration fee + priority fee).               |

:::note[Signature Requirements]

**NameService Signature** (`signature`):
- Uses `NameServiceHashUtils.hashDataForRegistrationUsername(username, lockNumber)`
- Reference: [Registration Signature Structure](../../../05-SignatureStructures/02-NameService/02-registrationUsernameStructure.md)

**Payment Signature** (`signatureEvvm`):
- Covers **total payment**: `getPriceOfRegistration(username) + priorityFeeEvvm`
- Uses `CoreHashUtils.hashDataForPay()`
- Reference: [Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md)

:::

## Execution Flow

### 1. Signature Verification (Core.sol)

```solidity
core.validateAndConsumeNonce(
    user,
    Hash.hashDataForRegistrationUsername(username, lockNumber),
    originExecutor,
    nonce,
    true,                                  // Async
    signature
);
```

**What Core.sol validates:**
- ✅ Signature matches `user` address
- ✅ Nonce is valid and available
- ✅ `tx.origin` matches `originExecutor` (if specified)
- ✅ Marks nonce as consumed

### 2. Username Validation

```solidity
// Admin bypass validation
if (admin.current != user && !IdentityValidation.isValidUsername(username)) {
    revert Error.InvalidUsername();
}

if (!isUsernameAvailable(username)) {
    revert Error.UsernameAlreadyRegistered();
}
```

**Validation Rules:**
- Alphanumeric characters only (a-z, 0-9, underscore)
- Length: 3-32 characters
- No leading/trailing underscores
- Not already registered (admin can override)

### 3. Registration Fee Payment

```solidity
uint256 registrationCost = getPriceOfRegistration(username);

requestPay(
    user,
    registrationCost,
    priorityFeeEvvm,
    nonceEvvm,
    signatureEvvm
);
```

Internally calls:
```solidity
core.pay(
    user,                                  // Payer
    address(this),                         // NameService receives
    "",                                    // No identity
    principalToken,                        // PT
    registrationCost + priorityFeeEvvm,    // Total
    priorityFeeEvvm,                       // Priority fee
    address(this),                         // Executor
    nonceEvvm,                             // Payment nonce
    true,                                  // Async
    signatureEvvm                          // Payment sig
);
```

**Registration Cost Calculation:**
```solidity
function getPriceOfRegistration(string memory username) public view returns (uint256) {
    return identityDetails[username].offerMaxSlots > 0
        ? seePriceToRenew(username)       // Market-based (if offers exist)
        : core.getRewardAmount() * 100;   // Standard rate
}
```

### 4. Pre-Registration Validation

```solidity
string memory key = string.concat(
    "@",
    AdvancedStrings.bytes32ToString(hashUsername(username, lockNumber))
);

// Validate commitment
if (
    identityDetails[key].owner != user ||
    identityDetails[key].expirationDate > block.timestamp
) {
    revert Error.PreRegistrationNotValid();
}
```

**Validates:**
- ✅ Pre-registration exists
- ✅ Matches same `user` address
- ✅ Waiting period has passed (30 minutes)
- ✅ Not expired

### 5. Username Registration

```solidity
identityDetails[username] = IdentityBaseMetadata({
    owner: user,
    expirationDate: block.timestamp + 366 days,
    customMetadataMaxSlots: 0,
    offerMaxSlots: 0,
    flagNotAUsername: 0x00                    // Marked as username
});
```

**Grants:**
- 366 days of ownership
- Metadata capabilities
- Marketplace participation

### 6. Staker Rewards (if executor is staker)

```solidity
if (core.isAddressStaker(msg.sender)) {
    makeCaPay(msg.sender, (50 * core.getRewardAmount()) + priorityFeeEvvm);
}
```

**Reward Breakdown:**
- Base reward: 50x `core.getRewardAmount()`
- Priority fee: Full `priorityFeeEvvm` amount
- Highest NameService reward (reflects registration importance)

### 7. Cleanup

```solidity
delete identityDetails[key];  // Remove pre-registration
```

Frees storage and gas refund.

## Complete Example

**Scenario:** Complete registration of "alice" after pre-registration

### Step 1: Recall Pre-Registration Details

```solidity
string memory username = "alice";
uint256 lockNumber = 987654321;  // Used in pre-registration

// Verify commitment matches
bytes32 expectedHash = keccak256(abi.encodePacked(username, lockNumber));
// Must match pre-registration hash
```

### Step 2: Calculate Registration Cost

```solidity
uint256 registrationCost = nameService.getPriceOfRegistration("alice");
// If no offers: 100x reward (e.g., 100 PT)
// If offers exist: Market-based pricing
```

### Step 3: Generate Signatures

```solidity
// Operation signature
bytes32 hashPayload = NameServiceHashUtils.hashDataForRegistrationUsername(
    username, 
    lockNumber
);

// Payment signature (covers total)
bytes32 paymentHash = CoreHashUtils.hashDataForPay(
    nameServiceAddress,                    // Receiver
    principalToken,
    registrationCost + priorityFee,
    priorityFee
);
```

### Step 4: Submit Registration

```solidity
nameService.registrationUsername(
    user,                                   // 0x742d...
    "alice",                                // Revealed username
    987654321,                              // Revealed lock number
    address(0),                             // Unrestricted
    nonce,                                  // 43
    signature,                              // Operation sig
    1000000000000000000,                    // 1 PT priority fee
    nonceEvvm,                              // 44
    signatureEvvm                           // Payment sig (covers 101 PT)
);
```

### Step 5: Username Registered

```solidity
// Now available for use
address owner = nameService.getOwnerOfIdentity("alice");        // user address
uint256 expires = nameService.getExpireDateOfIdentity("alice"); // now + 366 days
```

## Pricing Examples

### Standard Rate (No Offers)
```solidity
// No existing offers on username
registrationCost = 100 * core.getRewardAmount();
// Example: 100 * 1 PT = 100 PT
```

### Market-Based (With Offers)
```solidity
// Username has offers, uses seePriceToRenew()
// Price based on:
// - Time to expiration
// - Offer amounts
// - Market demand
registrationCost = seePriceToRenew("alice");
// Example: 150 PT (higher demand)
```

## Important Notes

### Time Constraints
- **Minimum wait**: 30 minutes after pre-registration
- **Maximum wait**: No hard limit, but pre-registration expires eventually
- **Best practice**: Register within 24 hours of pre-registration

### Lock Number Security
```solidity
// NEVER share lock number before registration
lockNumber = 987654321;  // Keep this secret!

// After registration, lock number can be public
// (but no harm in keeping it private)
```

### Username Validation
```solidity
// Valid usernames
"alice"          ✅  // lowercase letters
"alice123"       ✅  // letters + numbers
"alice_bob"      ✅  // underscores allowed

// Invalid usernames
"Alice"          ❌  // uppercase not allowed
"alice-bob"      ❌  // hyphens not allowed
"al"             ❌  // too short (< 3 chars)
"_alice"         ❌  // leading underscore
"alice_"         ❌  // trailing underscore
```

### Admin Override
```solidity
// Admin can bypass validation
if (admin.current == user) {
    // Skip validation
    // Allows admin to register any format
}
```

## Gas Costs

**Estimated Gas Usage:**
- Base operation: ~100,000 gas
- Core verification: ~5,000 gas
- Username validation: ~5,000 gas
- Payment processing: ~40,000 gas
- Storage (username): ~40,000 gas
- Cleanup (pre-reg): ~5,000 gas (refund)
- **Total**: ~195,000 gas

**Actual cost varies with:**
- Username length
- Market pricing calculations
- Staker reward distribution

## Error Handling

Common revert reasons:

```solidity
// From Core.sol
"Invalid signature"                 // Operation signature failed
"Nonce already used"                // Nonce consumed
"Invalid executor"                  // tx.origin mismatch

// From validation
"InvalidUsername"                   // Format validation failed
"UsernameAlreadyRegistered"         // Username taken

// From pre-registration check
"PreRegistrationNotValid"           // Commitment doesn't match
                                    // OR wrong owner
                                    // OR expired

// From payment
"Insufficient balance"              // User lacks PT
"Payment signature invalid"         // Payment sig failed
```

## Related Functions

- **[preRegistrationUsername](./01-preRegistrationUsername.md)** - Commit phase
- **[renewUsername](./06-renewUsername.md)** - Extend expiration
- **[Core.validateAndConsumeNonce](../../01-EVVM/03-SignatureAndNonceManagement.md)** - Verification system
