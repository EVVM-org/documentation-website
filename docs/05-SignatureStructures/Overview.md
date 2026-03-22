---
title: EVVM Signature Structures Overview
description: Centralized signature architecture for all EVVM operations
sidebar_position: 0
---

# EVVM Signature Structures Overview

All EVVM operations require EIP-191 cryptographic signatures for security. The platform uses **centralized signature verification** where Core.sol validates all operations using a unified signature format.

## Universal Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

**Components:**
- `{evvmId}`: Network identifier (uint256, typically `1`)
- `{senderExecutor}`: Address that can call the function via msg.sender (`0x0...0` for anyone)
- `{hashPayload}`: Service-specific hash of operation parameters (bytes32)
- `{originExecutor}`: EOA that can initiate the transaction via tx.origin (`0x0...0` for anyone)
- `{nonce}`: User's centralized nonce from Core.sol (uint256)
- `{isAsyncExec}`: Execution mode - `true` for async, `false` for sync (boolean)

## Dual-Executor Transaction Model

EVVM uses a **dual-executor system** for flexible transaction control:

### senderExecutor (msg.sender control)
Controls which address can call the contract function:

```solidity
// Validated in Core.sol
if (senderExecutor != address(0) && msg.sender != senderExecutor) {
    revert Core__InvalidExecutor();
}
```

**Common Patterns**:
- `address(0)`: Anyone can execute (maximum flexibility)
- `specificAddress`: Only that address can call the function
- `serviceAddress`: Service can execute on behalf of user

**Use Case**: Allows users to restrict which contracts or addresses can execute their signed transactions (e.g., only through a specific relayer or service).

### originExecutor (tx.origin control)
Controls which EOA can initiate the entire transaction:

```solidity
// Validated in Core.sol
if (originExecutor != address(0) && tx.origin != originExecutor) {
    revert Core__InvalidExecutor();
}
```

**Common Patterns**:
- `address(0)`: Any EOA can initiate (maximum flexibility)
- `userEOA`: Only that EOA can initiate the transaction
- `trustedEOA`: Only specific EOA can initiate (delegation)

**Use Case**: Enables users to ensure only they (or a trusted party) can trigger the transaction, even if `msg.sender` is a contract.

### Flexibility Mechanism

Both executors support `address(0)` for maximum flexibility:

```solidity
// Example: Public execution (anyone can call, anyone can initiate)
senderExecutor = address(0);
originExecutor = address(0);

// Example: Personal execution only
senderExecutor = address(0);        // Any contract can call
originExecutor = user;              // But only user's EOA can initiate

// Example: Service-restricted
senderExecutor = serviceAddress;    // Only service contract can call
originExecutor = address(0);        // Any EOA can initiate

// Example: Fully restricted
senderExecutor = relayerContract;   // Only relayer can call
originExecutor = userEOA;           // Only user's EOA can initiate
```

### Hash Payload Independence

**Important**: The `hashPayload` does NOT include executor addresses. It contains only operation-specific parameters:

```solidity
// Example: CoreHashUtils.hashDataForPay
bytes32 hashPayload = keccak256(
    abi.encode(
        "pay",
        to_address,
        to_identity,
        token,
        amount,
        priorityFee
    )
);
// Executors are NOT in the hash - they're only in the signature payload
```

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
// Using AdvancedStrings.buildSignaturePayload
string memory message = AdvancedStrings.buildSignaturePayload(
    evvmId,            // Network ID
    senderExecutor,    // msg.sender control
    hashPayload,       // Service-specific hash
    originExecutor,    // tx.origin control
    nonce,             // User's nonce
    isAsyncExec        // Execution mode
);

// Returns: "{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}"
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
    senderExecutor,    // Who can call via msg.sender
    hashPayload,       // Service-specific hash
    originExecutor,    // Who can initiate via tx.origin
    nonce,             // User's nonce
    isAsyncExec,       // Execution mode
    signature          // EIP-191 signature
);
```

**What Core.sol Does:**
1. Verifies signature matches the signer (EIP-191 recovery)
2. Validates nonce (checks status, consumes if valid)
3. Checks senderExecutor authorization (if not `address(0)`, validates msg.sender)
4. Checks originExecutor authorization (if not `address(0)`, validates tx.origin)
5. Optionally delegates to UserValidator (if configured)

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
1,0x0000000000000000000000000000000000000000,0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1,0x0000000000000000000000000000000000000000,42,false
```

Components:
- `evvmId`: `1`
- `senderExecutor`: `0x0000...` (anyone can call)
- `hashPayload`: `0xa7f3...` (from Step 1)
- `originExecutor`: `0x0000...` (anyone can initiate)
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
- **Validate executors carefully**: 
  - Use `address(0)` for both executors for public operations
  - Use specific `senderExecutor` to restrict which contract can call
  - Use specific `originExecutor` to restrict which EOA can initiate
  - Use both for maximum security (specific contract + specific EOA)
- **Async for time-sensitive**: Use `isAsyncExec=true` for operations needing specific timing
- **Hash independence**: Executors are not part of hashPayload, only in signature message

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


