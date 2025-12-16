---
sidebar_position: 4
---

# getSuperUserData

**Function Type**: `view`  
**Function Signature**: `getSuperUserData() returns (AddressTypeProposal memory)`

Retrieves complete superUser governance data including current superUser, proposed superUser, and acceptance timestamp information.

## Return Value

| Type                   | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `AddressTypeProposal`  | Struct containing current superUser, proposed superUser, and timing data     |

### AddressTypeProposal Structure

```solidity
struct AddressTypeProposal {
    address current;        // Currently active superUser address
    address proposal;       // Proposed new superUser address (0x0 if none)
    uint256 timeToAccept;   // Timestamp when proposal can be accepted (0 if none)
}
```

## Description

This function provides comprehensive information about the superUser governance state, including any pending proposals and their acceptance timelines. It's essential for governance interfaces and monitoring systems that need to track superUser transitions.
