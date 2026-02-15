---
title: EVVM Signature Structures Overview
description: Centralized signature architecture for all EVVM operations
sidebar_position: 0
---

# EVVM Signature Structures Overview

All EVVM operations require EIP-191 cryptographic signatures for security. The platform uses **centralized signature verification** where Core.sol validates all operations using a unified signature format.

## Universal Signature Format

```
{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}
```

**Components:**
- `{evvmId}`: Network identifier (uint256, typically `1`)
- `{serviceAddress}`: Address of the service contract being called
- `{hashPayload}`: Service-specific hash of operation parameters (bytes32)
- `{executor}`: Authorized executor address (address, `0x0...0` for unrestricted)
- `{nonce}`: User's centralized nonce from Core.sol (uint256)
- `{isAsyncExec}`: Execution mode - `true` for async, `false` for sync (boolean)

## Two-Layer Signature Architecture

EVVM uses a **two-layer hashing system** for deterministic and gas-efficient signatures:

### Layer 1: Hash Payload Generation

Each service uses a dedicated HashUtils library to generate `hashPayload`:

```solidity
// Example: CoreHashUtils for payment operations
bytes32 hashPayload = CoreHashUtils.hashDataForPay(
    receiver,
    token,
    amount,
    priorityFee
);
```

**Available HashUtils Libraries:**
- **CoreHashUtils**: Payment operations (pay, batchPay, dispersePay)
- **NameServiceHashUtils**: Username operations (register, transfer, metadata)
- **StakingHashUtils**: Staking operations (stake, unstake, claim)
- **P2PSwapHashUtils**: Swap operations (makeOrder, dispatch, cancel)
- **TreasuryCrossChainHashUtils**: Cross-chain bridge operations

### Layer 2: Signature Construction

The `hashPayload` is combined with execution context to create the final message:

```solidity
// Signature message construction (simplified)
string memory message = string.concat(
    uintToString(evvmId),                    // Network ID
    ",",
    addressToString(serviceAddress),         // Service contract
    ",",
    bytes32ToString(hashPayload),            // Service-specific hash
    ",",
    addressToString(executor),               // Authorized executor
    ",",
    uintToString(nonce),                     // User's nonce
    ",",
    isAsyncExec ? "true" : "false"          // Execution mode
);
```

### Layer 3: EIP-191 Wrapping

The message is signed using the EIP-191 standard (same as MetaMask):

```solidity
bytes32 messageHash = keccak256(
    abi.encodePacked(
        "\x19Ethereum Signed Message:\n",
        uintToString(bytes(message).length),
        message
    )
);
```

## Centralized Verification Process

All signatures are verified by **Core.sol** using `validateAndConsumeNonce()`:

```solidity
// Service calls Core.sol for verification
Core(coreAddress).validateAndConsumeNonce(
    user,              // Signer address
    hashPayload,       // Service-specific hash
    executor,          // Who can execute
    nonce,             // User's nonce
    isAsyncExec,       // Execution mode
    signature          // EIP-191 signature
);
```

**What Core.sol Does:**
1. Verifies signature matches the signer (EIP-191 recovery)
2. Validates nonce (checks status, consumes if valid)
3. Checks executor authorization (if specified)
4. Optionally delegates to UserValidator (if configured)

## Example: Payment Signature

**Scenario:** Send 0.05 ETH to `0x742d...82d8c` with sync execution

**Step 1: Generate Hash Payload**
```solidity
bytes32 hashPayload = CoreHashUtils.hashDataForPay(
    0x742d7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c,  // receiver
    0x0000000000000000000000000000000000000000,  // token (ETH)
    50000000000000000,                            // amount (0.05 ETH)
    1000000000000000                              // priorityFee (0.001 ETH)
);
// Result: 0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
```

**Step 2: Construct Signature Message**
```
1,0xCoreContractAddress,0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1,0x0000000000000000000000000000000000000000,42,false
```

Components:
- `evvmId`: `1`
- `serviceAddress`: `0xCoreContractAddress` (Core.sol)
- `hashPayload`: `0xa7f3...` (from Step 1)
- `executor`: `0x0000...` (unrestricted)
- `nonce`: `42`
- `isAsyncExec`: `false` (sync)

**Step 3: Sign with Wallet**
User signs the message using MetaMask or another EIP-191 compatible wallet.

## Parameter Formatting Rules

### String Conversion
- **Numbers**: `"50000000000000000"` (decimal string, no scientific notation)
- **Addresses**: `"0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c"` (lowercase hex with `0x`)
- **Bytes32**: `"0xa7f3c2d8e9b4f1a6..."` (64-character hex with `0x`)
- **Booleans**: `"true"` or `"false"` (lowercase)
- **Strings**: As provided (e.g., `"alice"`)

### Formatting Utilities

Use `AdvancedStrings` library:
```solidity
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";

AdvancedStrings.uintToString(42);          // "42"
AdvancedStrings.addressToString(addr);     // "0x742c..."
AdvancedStrings.bytes32ToString(hash);     // "0xa7f3..."
```

## EVVM Services Overview

### Core.sol
**Payment operations:**
- `pay()`: Single payment to addresses or usernames
- `batchPay()`: Multiple payments in one transaction
- `dispersePay()`: Split payment to multiple recipients
- `caPay()`: Contract-only payments

### NameService
**Username management:**
- Registration (pre-register → register flow)
- Marketplace (offers, transfers)
- Metadata (custom fields)
- Renewals and cleanup

### Staking
**Token staking:**
- Presale and public staking
- Unstaking with time locks
- Reward distribution

### Treasury
**Cross-chain operations:**
- Bridge transfers (Axelar, LayerZero)
- Multi-chain asset management

### P2PSwap
**Decentralized exchange:**
- Order creation and cancellation
- Order dispatch (fills)
- Fee management

## Best Practices

### Security
- **Never reuse nonces**: Each signature must have a unique nonce
- **Validate executor**: Use `0x0...0` for public operations, specific address for restricted
- **Async for time-sensitive**: Use `isAsyncExec=true` for operations needing specific timing
- **Service address precision**: Always use the correct deployed service address

### Gas Optimization
- **Batch operations**: Use `batchPay()` instead of multiple `pay()` calls
- **Sync when possible**: Async execution costs more gas
- **Reuse hash payloads**: Cache `hashPayload` if making multiple signatures

### Development
- **Use HashUtils libraries**: Don't manually construct hashes
- **Test signature generation**: Verify message format matches expected structure
- **Handle nonce management**: Track used nonces client-side
- **Validate before signing**: Check parameters before generating signature

## Next Steps

Explore service-specific signature structures:

- **[Core Payment Signatures](./01-EVVM/01-SinglePaymentSignatureStructure.md)** - Payment operation signatures
- **[NameService Signatures](./02-NameService/01-preRegistrationUsernameStructure.md)** - Username and metadata operations
- **[Staking Signatures](./03-Staking/01-StandardStakingStructure.md)** - Staking and reward operations
- **[Treasury Signatures](./04-Treasury/01-FisherBridgeSignatureStructure.md)** - Cross-chain bridge operations
- **[P2PSwap Signatures](./05-P2PSwap/01-MakeOrderSignatureStructure.md)** - DEX order operations


