---
description: "Public registration function for registering EVVM deployments on whitelisted testnet chains with automatic ID assignment"
sidebar_position: 1
---

# registerEvvm Function

**Function Type**: `external`  
**Function Signature**: `registerEvvm(uint256,address)`

Public registration function for EVVM instances that allows anyone to register an EVVM deployment on whitelisted testnet chains. The function implements automatic ID assignment starting from 1000, ensuring no conflicts with the reserved range (1-999) used for official deployments managed by the superUser.

### Parameters

| Field         | Type      | Description                                              |
|---------------|-----------|----------------------------------------------------------|
| `chainId`     | `uint256` | The chain ID of the testnet where the EVVM is deployed  |
| `evvmAddress` | `address` | The contract address of the EVVM instance               |

### Workflow

1. **Access Control**: Validates that the caller is authorized using the appropriate modifier. Reverts with `InvalidUser` if not authorized.
2. **Input Validation**: Checks that the provided EVVM address is not the zero address and the chain ID is registered. Reverts with `InvalidInput` on validation failure.
3. **ID Assignment**: Assigns the next available ID from the public range (starting at 1000) to the new EVVM registration.
4. **Metadata Storage**: Stores the chain ID and EVVM address in the contract's metadata mapping for the assigned ID.
5. **State Update**: Updates the public EVVM ID counter and marks the registration as active.

---