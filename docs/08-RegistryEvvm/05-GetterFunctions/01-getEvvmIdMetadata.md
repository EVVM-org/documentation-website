---
description: "View function retrieving complete metadata for a specific EVVM ID including chain ID and contract address"
sidebar_position: 1
---

# getEvvmIdMetadata

**Function Type**: `view`  
**Function Signature**: `getEvvmIdMetadata(uint256 evvmID) returns (Metadata memory)`

Retrieves the complete metadata for a specific EVVM ID, including the chain ID and contract address where the EVVM is deployed.

## Parameters

| Parameter | Type      | Description                        |
| --------- | --------- | ---------------------------------- |
| `evvmID`  | `uint256` | The EVVM ID to query metadata for |

## Return Value

| Type       | Description                                            |
| ---------- | ------------------------------------------------------ |
| `Metadata` | Struct containing chainId and evvmAddress information |

### Metadata Structure

```solidity
struct Metadata {
    uint256 chainId;      // Chain ID where the EVVM is deployed
    address evvmAddress;  // Contract address of the EVVM instance
}
```