---
title: "CoreHashUtils Library"
description: "Generates deterministic hashes for Core.sol payment operations in the signature system"
sidebar_position: 5
---

# CoreHashUtils Library

The `CoreHashUtils` library provides standardized hash generation for Core.sol payment operations. These hashes are used as the `hashPayload` parameter in the centralized signature verification system.

## Overview

**Package**: `@evvm/testnet-contracts`  
**Import Path**: `@evvm/testnet-contracts/library/utils/signature/CoreHashUtils.sol`  
**Solidity Version**: `^0.8.0`

**Purpose**: Generate deterministic `hashPayload` values for Core.sol operations that are used in EIP-191 signature construction.

## Signature Architecture

EVVM signatures follow a two-layer hashing pattern:

1. **Service-Specific Hash** (this library): `keccak256(abi.encode(functionName, param1, param2, ...))`
2. **Signature Payload**: `{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}`

The function-specific hash (`hashPayload`) ensures signatures are unique to each operation and its parameters.

## Functions

### hashDataForPay

**Function Type**: `public pure`  
**Function Signature**: `hashDataForPay(address,string,address,uint256,uint256)`

Generates a deterministic hash for single payment operations (`pay` function).

#### Parameters

| Parameter      | Type      | Description                              |
| -------------- | --------- | ---------------------------------------- |
| `to_address`   | `address` | Direct recipient address                 |
| `to_identity`  | `string`  | Username for NameService resolution      |
| `token`        | `address` | Token address                            |
| `amount`       | `uint256` | Token amount                             |
| `priorityFee`  | `uint256` | Fee for executor                         |

#### Return Value

| Type      | Description                                  |
| --------- | -------------------------------------------- |
| `bytes32` | Deterministic hash for signature validation  |

#### Hash Construction

```solidity
keccak256(abi.encode(
    "pay",
    to_address,
    to_identity,
    token,
    amount,
    priorityFee
))
```

#### Usage Example

```solidity
import {CoreHashUtils} from "@evvm/testnet-contracts/library/utils/signature/CoreHashUtils.sol";

// Generate hash for payment signature
bytes32 hashPayload = CoreHashUtils.hashDataForPay(
    recipientAddress,
    "alice", // username
    tokenAddress,
    1000000000000000000, // 1 token
    100000000000000000   // 0.1 token fee
);

// This hash is then used in signature construction:
// {evvmId},{coreAddress},{hashPayload},{executor},{nonce},{isAsyncExec}
```

---

### hashDataForDispersePay

**Function Type**: `internal pure`  
**Function Signature**: `hashDataForDispersePay((uint256,address,string)[],address,uint256,uint256)`

Generates a deterministic hash for multi-recipient distribution operations (`dispersePay` function).

#### Parameters

| Parameter      | Type                          | Description                          |
| -------------- | ----------------------------- | ------------------------------------ |
| `toData`       | `CoreStructs.DispersePayMetadata[]` | Array of recipients and amounts |
| `token`        | `address`                     | Token address                        |
| `amount`       | `uint256`                     | Total amount (must equal sum)        |
| `priorityFee`  | `uint256`                     | Fee for executor                     |

#### Return Value

| Type      | Description                                  |
| --------- | -------------------------------------------- |
| `bytes32` | Deterministic hash for signature validation  |

#### Hash Construction

```solidity
keccak256(abi.encode(
    "dispersePay",
    toData,
    token,
    amount,
    priorityFee
))
```

#### Usage Example

```solidity
import {CoreStructs} from "@evvm/testnet-contracts/library/structs/CoreStructs.sol";
import {CoreHashUtils} from "@evvm/testnet-contracts/library/utils/signature/CoreHashUtils.sol";

// Prepare recipient data
CoreStructs.DispersePayMetadata[] memory toData = 
    new CoreStructs.DispersePayMetadata[](2);

toData[0] = CoreStructs.DispersePayMetadata({
    amount: 500000000000000000,  // 0.5 tokens
    to_address: address(0x123...),
    to_identity: ""
});

toData[1] = CoreStructs.DispersePayMetadata({
    amount: 500000000000000000,  // 0.5 tokens
    to_address: address(0),
    to_identity: "bob"
});

// Generate hash for dispersePay signature
bytes32 hashPayload = CoreHashUtils.hashDataForDispersePay(
    toData,
    tokenAddress,
    1000000000000000000, // 1 token total
    100000000000000000   // 0.1 token fee
);
```

---

## Integration with Core.sol

Core.sol uses these hash functions internally during signature verification:

```solidity
// In Core.pay():
if (
    SignatureRecover.recoverSigner(
        AdvancedStrings.buildSignaturePayload(
            evvmMetadata.EvvmID,
            address(this),
            Hash.hashDataForPay(         // Uses CoreHashUtils
                to_address,
                to_identity,
                token,
                amount,
                priorityFee
            ),
            senderExecutor,
            nonce,
            isAsyncExec
        ),
        signature
    ) != from
) revert Error.InvalidSignature();
```

## Complete Signature Flow

For a `pay` operation:

1. **Generate Hash**:
   ```solidity
   bytes32 hash = CoreHashUtils.hashDataForPay(to, identity, token, amount, fee);
   ```

2. **Build Signature Payload**:
   ```solidity
   string payload = AdvancedStrings.buildSignaturePayload(
       evvmId, coreAddress, hash, executor, nonce, isAsyncExec
   );
   // Result: "1,0xCore...,0xhash...,0xexec...,42,true"
   ```

3. **Apply EIP-191**:
   ```
   "\x19Ethereum Signed Message:\n" + len(payload) + payload
   ```

4. **Sign with Private Key** → 65-byte signature

## Security Properties

**Deterministic Hashing:**
- Same inputs always produce same hash
- Ensures signature verification consistency
- Prevents parameter tampering

**Function Isolation:**
- Each function type has unique hash pattern
- `"pay"` vs `"dispersePay"` string prevents cross-function replay
- Parameter encoding ensures type safety

**Replay Protection:**
- Hash doesn't include nonce (handled at signature payload level)
- Allows signature reuse across nonces if intentional
- Nonce management handled by Core.sol centrally

## Related Documentation

- [Signature & Nonce Management](../../../04-Contracts/01-EVVM/03-SignatureAndNonceManagement.md) - Centralized signature system
- [AdvancedStrings Library](./01-AdvancedStrings.md) - String utilities for signature construction

## See Also

**Other HashUtils Libraries:**
- **NameServiceHashUtils** - Hash generation for NameService operations
- **StakingHashUtils** - Hash generation for Staking operations  
- **P2PSwapHashUtils** - Hash generation for P2PSwap operations
- **TreasuryCrossChainHashUtils** - Hash generation for Treasury operations

All HashUtils libraries follow the same pattern of generating deterministic `hashPayload` values for their respective service operations.
