---
title: "renewUsername"
description: "Extend username registration by 366 days with dynamic pricing based on timing and marketplace demand"
sidebar_position: 6
---

# renewUsername

:::info[Signature Verification]
This function uses **Core.sol's centralized signature verification** via `validateAndConsumeNonce()`. All NameService operations use the universal signature format with `NameServiceHashUtils` for hash generation.
:::

**Function Type**: External  
**Function Signature**: `renewUsername(address user, string memory username, address originExecutor, uint256 nonce, bytes memory signature, uint256 priorityFeeEvvm, uint256 nonceEvvm, bytes memory signatureEvvm) external`

Extends a username registration by 366 days. The renewal cost is dynamically calculated based on marketplace activity and timing. Usernames can be renewed up to 100 years in advance. The renewal preserves ownership, metadata, and all settings - only the expiration date changes.

## Function Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Current owner of the username |
| `username` | `string` | Username to renew |
| `originExecutor` | `address` | The address authorized to submit this specific signed transaction |
| `nonce` | `uint256` | User's Core nonce for this signature (prevents replay attacks) |
| `signature` | `bytes` | EIP-191 signature from `user` authorizing the renewal |
| `priorityFeeEvvm` | `uint256` | Optional priority fee for faster processing (paid to staker executor) |
| `nonceEvvm` | `uint256` | User's Core nonce for the payment signature |
| `signatureEvvm` | `bytes` | User's signature authorizing the renewal payment |

## Signature Requirements

This function requires **two signatures** from the username owner:

### 1. NameService Renewal Signature

Authorizes the username renewal:

```
Message Format: {evvmId},{serviceAddress},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
Hash Payload: NameServiceHashUtils.hashDataForRenewUsername(username)
Async Execution: true (always)
```

**Example**:
```solidity
string memory username = "alice";

bytes32 hashPayload = NameServiceHashUtils.hashDataForRenewUsername(username);

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

Authorizes the renewal payment:

```
Payment Amount: seePriceToRenew(username) + priorityFeeEvvm
Recipient: address(nameServiceContract)
```

This uses the standard [Single Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).

**Note**: The renewal price is calculated dynamically. Users should query `seePriceToRenew(username)` before signing to know the exact amount.

## Execution Flow

### 1. Signature Verification (Centralized)

Core.sol validates the signature and consumes the nonce:

```solidity
core.validateAndConsumeNonce(
    user,
    Hash.hashDataForRenewUsername(username),
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

Validates the signer is the username owner:

```solidity
if (identityDetails[username].owner != user)
    revert Error.UserIsNotOwnerOfIdentity();
```

**Checks**:
- Only the current owner can renew
- Prevents unauthorized renewals

**Reverts With**:
- `UserIsNotOwnerOfIdentity()` - Signer doesn't own the username

### 3. Username Type Validation

Verifies the identity is a valid username:

```solidity
if (identityDetails[username].flagNotAUsername == 0x01)
    revert Error.IdentityIsNotAUsername();
```

**Checks**:
- Must be a completed registration (not pre-registration)
- Must be a username type identity

**Reverts With**:
- `IdentityIsNotAUsername()` - Identity is flagged as non-username

### 4. Renewal Time Limit Check

Prevents renewal beyond 100 years in advance:

```solidity
if (
    identityDetails[username].expirationDate >
    block.timestamp + 36500 days
) revert Error.RenewalTimeLimitExceeded();
```

**Business Logic**:
- Maximum forward registration: 100 years (36,500 days)
- Prevents excessive future locking
- Enables long-term ownership planning

**Reverts With**:
- `RenewalTimeLimitExceeded()` - Already renewed too far into future

### 5. Dynamic Price Calculation

Calculates the renewal cost based on marketplace activity:

```solidity
uint256 priceOfRenew = seePriceToRenew(username);
```

**Pricing Rules** (from `seePriceToRenew` function):
- **Within grace period** (expired < 30 days): Free (0 tokens)
- **Active offers exist**: Calculated based on highest active offer (variable)
- **No offers + renewing >1 year early**: 500,000 PT (fixed high cost)
- **Default**: Calculated based on registration cost model

This dynamic pricing:
- Incentivizes timely renewals (grace period)
- Reflects market demand (active offers)
- Discourages premature renewal (high cost for >1 year early)

### 6. Payment Processing

Transfers the renewal cost from user to NameService:

```solidity
requestPay(
    user,
    priceOfRenew,
    priorityFeeEvvm,
    nonceEvvm,
    signatureEvvm
);
```

This internally calls:
```solidity
core.pay(
    user,
    address(this),
    priceOfRenew + priorityFeeEvvm,
    nonceEvvm,
    true,
    signatureEvvm
);
```

**Token Flow**:
- User → NameService: `priceOfRenew + priorityFeeEvvm`
- Payment for 366-day extension

**Reverts With**: Any Core.pay() errors (insufficient balance, invalid signature)

### 7. Staker Reward Distribution

If executor is a registered staker, distributes substantial rewards:

```solidity
if (core.isAddressStaker(msg.sender)) {
    makeCaPay(
        msg.sender,
        core.getRewardAmount() +
            ((priceOfRenew * 50) / 100) +
            priorityFeeEvvm
    );
}
```

**Reward Calculation**:
```
Total Reward = Base Reward + 50% of Renewal Cost + Priority Fee
             = 1x + (priceOfRenew × 50%) + priorityFeeEvvm
```

**Example** (1000 token renewal, 10 token priority fee):
```
Base: 1x getRewardAmount() (e.g., 0.01 tokens)
Renewal Share: 1000 × 50% = 500 tokens (!)
Priority: 10 tokens
Total: 510.01 tokens
```

**Note**: The 50% reward share makes renewals highly incentivized for stakers. This encourages active marketplace participation and processing.

### 8. Expiration Extension

Extends the username registration by 366 days:

```solidity
identityDetails[username].expirationDate += 366 days;
```

**Duration Details**:
- Extension: 366 days (1 leap year)
- Preserves: Ownership, metadata, custom metadata, settings
- Changes: Only expiration date
- Stackable: Can renew multiple times up to 100-year limit

## Complete Usage Example

```solidity
// Setup
address owner = 0x123...;
string memory username = "alice";
address originExecutor = msg.sender;
uint256 nonce = core.getNonce(owner, address(nameService));
uint256 priorityFee = 10000000000000000000; // 10 tokens

// Query current expiration and renewal cost
uint256 currentExpiration = nameService.identityDetails(username).expirationDate;
uint256 renewalCost = nameService.seePriceToRenew(username);
// renewalCost = 1000000000000000000000 (1000 tokens)

// Generate renewal signature
bytes32 hashPayload = NameServiceHashUtils.hashDataForRenewUsername(username);

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

// Generate payment signature
uint256 nonceEvvm = core.getNonce(owner, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    owner,
    address(nameService),
    renewalCost + priorityFee,
    nonceEvvm
);

// Execute renewal
nameService.renewUsername(
    owner,
    username,
    originExecutor,
    nonce,
    signature,
    priorityFee,
    nonceEvvm,
    signatureEvvm
);

// Result:
// - Owner pays: 1000 tokens (renewal) + 10 tokens (priority) = 1010 tokens
// - New expiration: currentExpiration + 366 days
// - Staker receives: ~1x + 500 tokens (50%) + 10 tokens = ~510 tokens
// - NameService retains: 500 tokens (50% of renewal cost)
```

## Gas Cost Estimation

| Operation | Approximate Gas |
|-----------|----------------|
| Core signature verification | ~25,000 |
| Ownership + type validation | ~10,000 |
| Time limit check | ~5,000 |
| Price calculation (seePriceToRenew) | ~15,000 |
| Payment processing (Core.pay) | ~85,000 |
| Expiration update | ~5,000 |
| Staker reward distribution | ~30,000 |
| **Total Estimate** | **~175,000 gas** |

*Gas costs vary based on complexity of price calculation and current network conditions.*

## Error Handling

### Core.sol Errors
- `Core__NonceAlreadyUsed()` - Signature nonce already consumed
- `Core__InvalidSignature()` - Invalid signature format or signer
- `Core__InvalidExecutor()` - msg.sender not authorized as executor

### NameService Validation Errors
- `UserIsNotOwnerOfIdentity()` - Signer doesn't own the username
- `IdentityIsNotAUsername()` - Identity is not a valid registered username
- `RenewalTimeLimitExceeded()` - Already renewed beyond 100-year limit

### Payment Errors
- Core.pay() errors (insufficient balance, invalid payment signature)

## Dynamic Pricing Model

### Pricing Scenarios

The `seePriceToRenew(username)` function returns different costs based on context:

#### 1. Grace Period Renewal (Free)
```
Condition: expired < 30 days ago
Cost: 0 tokens
Reasoning: Encourage owners to reclaim recently expired usernames
```

#### 2. Market-Based Pricing
```
Condition: Active offers exist for the username
Cost: Calculated from highest active offer
Reasoning: Reflect true market demand/value
```

#### 3. Premature Renewal Penalty
```
Condition: Current expiration > 1 year in future
Cost: 500,000 PT (fixed high cost)
Reasoning: Discourage excessive future locking
```

#### 4. Standard Renewal
```
Condition: Default case
Cost: Based on standard registration cost model
Reasoning: Consistent baseline pricing
```

### Example Price Scenarios

**Scenario A - Grace Period**:
```
Username: "alice"
Expired: 15 days ago
Price: 0 PT (free reclaim)
```

**Scenario B - High Demand Username**:
```
Username: "crypto"
Active Offers: 5 offers, highest = 10,000 PT
Price: ~Calculated based on 10,000 PT offer
```

**Scenario C - Premature Renewal**:
```
Username: "bob"
Current Expiration: 400 days from now
Price: 500,000 PT (penalty pricing)
```

**Scenario D - Standard Renewal**:
```
Username: "alice123"
Expiring: In 30 days, no offers
Price: ~Standard cost (e.g., 100-1000 PT)
```

## Economic Model

### Revenue Distribution

**1000 Token Renewal Example**:
```
┌──────────────────────────────────────┐
│ Owner Pays: 1000 tokens              │
├──────────────────────────────────────┤
│ Staker Reward: 500 tokens (50%)     │  ← Executing staker
│ Protocol Retention: 500 tokens (50%) │  ← NameService revenue
└──────────────────────────────────────┘

Plus Priority Fee:
└─ 100% → Staker (e.g., 10 tokens)
```

### Staker Incentive Design

The 50% reward share creates strong incentives:
- **High-value renewals**: Stakers earn substantial rewards (50% of large amounts)
- **Processing priority**: Competition to execute high-cost renewals
- **Market efficiency**: Ensures timely processing of valuable operations
- **Sustainable rewards**: Base reward (1x) + major share (50%) + priority fee

This is the **highest percentage reward** in the NameService contract, reflecting the importance of renewal processing.

## State Changes

1. **User balance** → Decreased by `priceOfRenew + priorityFeeEvvm`
2. **NameService balance** → Increased by `priceOfRenew + priorityFeeEvvm`
3. **identityDetails[username].expirationDate** → Increased by 366 days
4. **Core nonce** → User's nonce marked as consumed
5. **Staker balance** (if applicable) → Increased by substantial reward (50% of cost + priority)

## Related Functions

- [registrationUsername](./02-registrationUsername.md) - Initial username creation (366-day ownership)
- [seePriceToRenew](../05-GetterFunctions.md#seepricetorenew) - Query renewal cost before executing
- [flushUsername](../03-CustomMetadataFunctions/04-FlushUsername.md) - Alternative to renewal (delete username)

## Implementation Notes

### 366-Day Extension

Usernames renew for 366 days (not 365):
- Accounts for leap years
- Maintains consistent anniversary dates
- Prevents gradual time drift over multiple renewals

### 100-Year Forward Limit

The 36,500-day (100-year) limit prevents:
- Infinite future locking
- Economic distortion from extremely long holds
- Contract state bloat from far-future expirations

Users can still achieve indefinite ownership through periodic renewals.

### Grace Period Strategy

The grace period (expired < 30 days = free) creates beneficial dynamics:
- Original owners have time to reclaim (no immediate loss)
- Reduces accidental expiration consequences
- Incentivizes quick reclamation over marketplace purchases

### Renewal vs Re-Registration

Renewal advantages over letting expire and re-registering:
- **Preserves**: All custom metadata, settings, history
- **Cheaper**: Often lower cost than fresh registration
- **Faster**: No commit-reveal required (immediate)
- **Continuous**: No gap in ownership/availability

### Premature Renewal Economics

The 500,000 PT cost for renewing >1 year early serves important functions:
- **Prevents hoarding**: Discourages locking up names far in advance
- **Market liquidity**: Encourages owners to potentially sell vs hold empty
- **Fair access**: Allows market to determine true value vs preemptive locking

Most users should renew within 1 year of expiration to avoid penalty pricing.
