---
description: "SuperUser registration function for assigning whitelisted EVVM IDs in the reserved range (1-999)"
sidebar_position: 2
---

# sudoRegisterEvvm Function

**Function Type**: `external`  
**Access Control**: `isSuperUser`  
**Function Signature**: `sudoRegisterEvvm(uint256,uint256,address)`

SuperUser registration function for whitelisted EVVM IDs that allows the superUser to register EVVMs with specific IDs in the reserved range (1-999). These IDs are intended for official EVVM deployments that have been vetted and approved by the ecosystem governance. Only the current superUser can call this function, which is managed through a time-delayed governance system.

### Parameters

| Field         | Type      | Description                                              |
|---------------|-----------|----------------------------------------------------------|
| `evvmId`      | `uint256` | The specific reserved ID (1-999) to assign             |
| `chainId`     | `uint256` | The chain ID where the EVVM is deployed                |
| `evvmAddress` | `address` | The contract address of the EVVM instance              |

### Workflow

1. **Access Control**: Validates that the caller is the current superUser using the `isSuperUser` modifier. Reverts with `InvalidUser` if not authorized.
2. **Input Validation**: Checks that `evvmId` is within the reserved range (1-999), that both `chainId` and `evvmAddress` are not zero, and that the chain ID is registered. Reverts with `InvalidInput` on validation failure.
3. **Duplicate Prevention**: Verifies that the `evvmAddress` is not already registered for the specified `chainId` and that the `evvmId` is not already in use. Reverts with `AlreadyRegistered` or `EvvmIdAlreadyRegistered` respectively.
4. **Registration Storage**: Stores the metadata in the registry mapping and marks the address as registered for the chain.
5. **Return Assignment**: Returns the assigned EVVM ID (same as the input `evvmId`).