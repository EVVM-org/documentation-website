---
title: "addCustomMetadata"
description: "Add structured custom metadata to usernames using schema-based format for social profiles, contact info, and more"
sidebar_position: 1
---

# addCustomMetadata

:::info[Signature Verification]
This function uses **Core.sol's centralized signature verification** via `validateAndConsumeNonce()`. All NameService operations use the universal signature format with `NameServiceHashUtils` for hash generation.
:::

**Function Type**: External  
**Function Signature**: `addCustomMetadata(address user, string memory identity, string memory value, address originExecutor, uint256 nonce, bytes memory signature, uint256 priorityFeeEvvm, uint256 nonceEvvm, bytes memory signatureEvvm) external`

Associates custom metadata with a registered username using a structured schema format. Supports arbitrary key-value information like social media handles, email addresses, membership affiliations, and more. Each metadata entry is stored in a separate slot with sequential indexing.

## Function Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Current owner of the username |
| `identity` | `string` | Username to add metadata to |
| `value` | `string` | Metadata string following recommended schema format (must not be empty) |
| `originExecutor` | `address` | EOA that will execute the transaction (verified with tx.origin) |
| `nonce` | `uint256` | User's Core nonce for this signature (prevents replay attacks) |
| `signature` | `bytes` | EIP-191 signature from `user` authorizing metadata addition |
| `priorityFeeEvvm` | `uint256` | Optional priority fee for faster processing (paid to staker executor) |
| `nonceEvvm` | `uint256` | User's Core nonce for the payment signature |
| `signatureEvvm` | `bytes` | User's signature authorizing the metadata fee payment |

## Signature Requirements

This function requires **two signatures** from the username owner:

### 1. NameService Metadata Signature

Authorizes adding the metadata entry:

```
Message Format: {evvmId},{serviceAddress},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
Hash Payload: NameServiceHashUtils.hashDataForAddCustomMetadata(identity, value)
Async Execution: true (always)
```

**Example**:
```solidity
string memory identity = "alice";
string memory value = "socialMedia:x    >jistro";  // Padded subschema

bytes32 hashPayload = NameServiceHashUtils.hashDataForAddCustomMetadata(
    identity,
    value
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

Authorizes payment of the metadata fee:

```
Payment Amount: getPriceToAddCustomMetadata() + priorityFeeEvvm
Recipient: address(nameServiceContract)
```

**Fee Calculation**:
```solidity
uint256 metadataFee = nameService.getPriceToAddCustomMetadata();
// metadataFee = 10 * core.getRewardAmount()
```

This uses the standard [Single Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).

## Recommended Metadata Format

While not enforced on-chain, following this structure enables standardized parsing:

```
Format: [schema]:[subschema]>[value]

Components:
- schema:     Main category (5 chars, pad if needed)
- subschema:  Subcategory (5 chars, pad if needed, optional)
- value:      Actual data (any length)

Separators:
- ':' - Separates schema and subschema
- '>' - Separates metadata type from value
```

### Standard Schema Examples

**Social Media Profiles**:
```
socialMedia:x    >jistro           // Twitter/X handle
socialMedia:github>evvm-org        // GitHub username
socialMedia:linkedin>john-doe      // LinkedIn profile
```

**Contact Information**:
```
email:dev  >dev@evvm.org           // Development email
email:personal>contact@alice.xyz   // Personal email
phone:work >+1-555-0100            // Work phone
```

**Membership & Affiliations**:
```
memberOf:>EVVM                     // Organization membership
memberOf:>DAOName                  // DAO membership
role :>Developer                   // Role/title
```

**Web Presence**:
```
url  :personal>https://alice.xyz   // Personal website
url  :portfolio>https://work.me    // Portfolio
```

**Note**: Schemas should follow [Schema.org](https://schema.org/docs/schemas.html) standards when possible for maximum interoperability.

## Execution Flow

### 1. Signature Verification (Centralized)

Core.sol validates the signature and consumes the nonce:

```solidity
core.validateAndConsumeNonce(
    user,
    Hash.hashDataForAddCustomMetadata(identity, value),
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

Validates the signer owns the username:

```solidity
if (identityDetails[identity].owner != user)
    revert Error.UserIsNotOwnerOfIdentity();
```

**Checks**:
- Only the owner can add metadata
- Prevents unauthorized modifications

**Reverts With**:
- `UserIsNotOwnerOfIdentity()` - Signer doesn't own the username

### 3. Value Validation

Ensures the metadata value is not empty:

```solidity
if (bytes(value).length == 0) revert Error.EmptyCustomMetadata();
```

**Business Logic**:
- Empty strings waste storage and gas
- All metadata must contain meaningful data

**Reverts With**:
- `EmptyCustomMetadata()` - Value string is empty

### 4. Payment Processing

Transfers the metadata fee from user to NameService:

```solidity
requestPay(
    user,
    getPriceToAddCustomMetadata(),  // 10x reward amount
    priorityFeeEvvm,
    nonceEvvm,
    signatureEvvm
);
```

**Fee Structure**:
```solidity
metadataFee = 10 * core.getRewardAmount()
```

This internally calls:
```solidity
core.pay(
    user,
    address(this),
    metadataFee + priorityFeeEvvm,
    nonceEvvm,
    true,
    signatureEvvm
);
```

**Token Flow**:
- User → NameService: `10x reward + priorityFeeEvvm`
- Payment for metadata storage

**Reverts With**: Any Core.pay() errors (insufficient balance, invalid signature)

### 5. Staker Reward Distribution

If executor is a registered staker, distributes substantial rewards:

```solidity
if (core.isAddressStaker(msg.sender)) {
    makeCaPay(
        msg.sender,
        (5 * core.getRewardAmount()) +
            ((getPriceToAddCustomMetadata() * 50) / 100) +
            priorityFeeEvvm
    );
}
```

**Reward Calculation**:
```
Total Reward = Enhanced Base + 50% of Metadata Fee + Priority Fee
             = 5x base + (10x × 50%) + priorityFeeEvvm
             = 5x + 5x + priorityFeeEvvm
             = 10x base reward + priorityFeeEvvm
```

**Example** (base reward = 0.01 tokens, 1 token priority fee):
```
Enhanced Base: 5 × 0.01 = 0.05 tokens
Metadata Share: (10 × 0.01) × 50% = 0.05 tokens
Priority: 1.0 tokens
Total: 1.1 tokens
```

**Note**: This 100% reward return (10x earned on 10x cost) plus priority fee creates a neutral economic incentive for stakers while covering operational costs.

### 6. Metadata Storage

Stores the metadata in the next available slot:

```solidity
identityCustomMetadata[identity][
    identityDetails[identity].customMetadataMaxSlots
] = value;
```

**Storage Structure**:
- Mapping: `username → slot index → metadata value`
- Sequential indexing: 0, 1, 2, ...
- No gaps: All slots from 0 to maxSlots-1 are filled

### 7. Slot Counter Update

Increments the metadata slot counter:

```solidity
identityDetails[identity].customMetadataMaxSlots++;
```

**State Tracking**:
- Tracks total metadata entries
- Used for iteration and querying
- Monotonically increasing (never decreases, even on removal)

## Complete Usage Example

```solidity
// Setup
address owner = 0x123...;
string memory username = "alice";
string memory metadata = "socialMedia:x    >jistro";  // Twitter handle
address originExecutor = msg.sender;
uint256 nonce = core.getNonce(owner, address(nameService));
uint256 priorityFee = 1000000000000000000; // 1 token

// Query current metadata cost
uint256 metadataFee = nameService.getPriceToAddCustomMetadata();
// metadataFee = 10 × core.getRewardAmount() (e.g., 0.1 tokens)

// Generate metadata signature
bytes32 hashPayload = NameServiceHashUtils.hashDataForAddCustomMetadata(
    username,
    metadata
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

// Generate payment signature
uint256 nonceEvvm = core.getNonce(owner, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    owner,
    address(nameService),
    metadataFee + priorityFee,
    nonceEvvm
);

// Execute metadata addition
nameService.addCustomMetadata(
    owner,
    username,
    metadata,
    originExecutor,
    nonce,
    signature,
    priorityFee,
    nonceEvvm,
    signatureEvvm
);

// Result:
// - Owner pays: 0.1 tokens (metadata fee) + 1 token (priority) = 1.1 tokens
// - Metadata stored: identityCustomMetadata["alice"][0] = "socialMedia:x    >jistro"
// - Slot counter: customMetadataMaxSlots = 1
// - Staker receives: 0.1 tokens (100% of fee) + 1 token (priority) = 1.1 tokens
```

## Gas Cost Estimation

| Operation | Approximate Gas |
|-----------|----------------|
| Core signature verification | ~25,000 |
| Ownership + value validation | ~8,000 |
| Payment processing (Core.pay) | ~85,000 |
| Metadata storage (new slot) | ~45,000 |
| Slot counter update | ~5,000 |
| Staker reward distribution | ~30,000 |
| **Total Estimate** | **~198,000 gas** |

*Gas costs vary based on metadata value length and current network conditions.*

## Error Handling

### Core.sol Errors
- `Core__NonceAlreadyUsed()` - Signature nonce already consumed
- `Core__InvalidSignature()` - Invalid signature format or signer
- `Core__InvalidExecutor()` - Executing EOA doesn't match originExecutor

### NameService Validation Errors
- `UserIsNotOwnerOfIdentity()` - Signer doesn't own the username
- `EmptyCustomMetadata()` - Value string is empty

### Payment Errors
- Core.pay() errors (insufficient balance, invalid payment signature)

## Economic Model

### Fee Distribution

**0.1 Token Metadata Fee Example** (10x base reward):
```
┌──────────────────────────────────────┐
│ Owner Pays: 0.1 tokens               │
├──────────────────────────────────────┤
│ Staker Reward Breakdown:             │
│   ├─ Enhanced Base: 0.05 (5x)       │  ← 5x base reward
│   ├─ Fee Share: 0.05 (50%)          │  ← 50% of 10x fee
│   └─ Priority: 1.0 tokens           │  ← User incentive
│   Total: 1.1 tokens                 │
├──────────────────────────────────────┤
│ Protocol Retention: 0.05 tokens (50%)│  ← NameService revenue
└──────────────────────────────────────┘
```

### Staker Incentive Design

The reward structure creates neutral economics:
- **Fee paid by user**: 10x base reward
- **Staker receives**: 5x base (enhanced) + 5x (50% share) = 10x total
- **Net to staker**: Breaks even on reward distribution
- **Priority fee**: 100% profit for staker
- **Protocol share**: 50% of fee (5x base)

This ensures:
- Metadata operations are cost-neutral for stakers (excluding priority fees)
- Priority fees create profit incentive
- Protocol sustains metadata infrastructure with 50% retention

## State Changes

1. **User balance** → Decreased by `metadataFee + priorityFeeEvvm`
2. **NameService balance** → Increased by `metadataFee + priorityFeeEvvm`
3. **identityCustomMetadata[identity][slot]** → New metadata value stored
4. **identityDetails[identity].customMetadataMaxSlots** → Incremented by 1
5. **Core nonce** → User's nonce marked as consumed
6. **Staker balance** (if applicable) → Increased by substantial reward

## Related Functions

- [removeCustomMetadata](./02-RemoveCustomMetadata.md) - Delete specific metadata entry
- [flushCustomMetadata](./03-FlushCustomMetadata.md) - Delete all metadata entries
- [GetterFunctions - Metadata Query](../05-GetterFunctions.md) - Retrieve stored metadata

## Implementation Notes

### Sequential Slot Allocation

Metadata slots are allocated sequentially:
- First entry: slot 0
- Second entry: slot 1
- Nth entry: slot N-1

The `customMetadataMaxSlots` value equals the number of active entries (assuming no removals). However, **removal doesn't decrement this counter** - it remains as a high-water mark.

### Schema Padding Guidelines

For optimal parsing, pad short schema/subschema to 5 characters:
```
"x" → "x    "  (4 spaces)
"dev" → "dev  "  (2 spaces)
"email" → "email"  (already 5 chars)
```

This enables fixed-width parsing:
```javascript
const schema = metadata.substring(0, 5).trim();
const subschema = metadata.substring(6, 11).trim();
const value = metadata.substring(12);
```

### Unlimited Metadata

There is no hardcoded limit on the number of metadata entries:
- Users can add as many entries as desired
- Each addition costs 10x base reward
- Gas costs scale linearly with total entries
- Storage is persistent across renewals

### Metadata Persistence

Custom metadata persists through:
- Username renewals
- Ownership transfers (via acceptOffer)
- Username expiration (can be reclaimed with metadata intact)

Metadata is only removed via:
- Explicit `removeCustomMetadata` call
- Bulk `flushCustomMetadata` call
- Complete `flushUsername` deletion

### Value Content Flexibility

While the schema format is recommended, the contract accepts any string:
- No on-chain validation of format compliance
- Off-chain applications should validate schema adherence
- Malformed metadata is the owner's responsibility
- Consider validating before signing to avoid wasted fees