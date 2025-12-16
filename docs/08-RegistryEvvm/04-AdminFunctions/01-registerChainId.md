---
sidebar_position: 1
---

# registerChainId

**Function Type**: `external`  
**Access Control**: `isSuperUser`  
**Function Signature**: `registerChainId(uint256[] memory chainIds)`

Registers multiple chain IDs to the whitelist, enabling EVVM registration on those specific blockchain networks.

## Parameters

| Parameter  | Type        | Description                                              |
| ---------- | ----------- | -------------------------------------------------------- |
| `chainIds` | `uint256[]` | Array of chain IDs to whitelist for EVVM registration   |

## Description

This function allows the superUser to add multiple chain IDs to the whitelist in a single transaction. Only whitelisted chain IDs can be used for EVVM registration, providing control over which networks are supported and preventing accidental or malicious registration on inappropriate networks (such as mainnet).

## Access Control

**Modifier**: `isSuperUser`

Only the current superUser can add chain IDs to the whitelist, ensuring that network support decisions remain under governance control.

## Security Features

### Batch Operations
- Efficiently adds multiple chain IDs in a single transaction
- Reduces gas costs for managing multiple networks
- Atomic operation - all additions succeed or fail together

### Input Validation
- Validates that no chain ID in the array is zero
- Prevents registration of invalid networks
- Ensures data integrity in the whitelist

### Network Control
- Prevents mainnet registration by controlling which chains are supported
- Enables support for new testnets as they become available
- Provides fine-grained control over supported networks

### Workflow

1. **Access Control**: Validates that the caller is the current superUser using the `isSuperUser` modifier. Reverts with `InvalidUser` if not authorized.
2. **Input Validation**: Iterates through the provided chain IDs array and validates each ID is not zero. Reverts with `InvalidInput` if any chain ID is zero.
3. **Registration Loop**: For each valid chain ID, sets `isThisChainIdRegistered[chainId] = true` to enable support.
4. **State Update**: Updates the registry to support EVVM deployments on the newly registered chain IDs.
