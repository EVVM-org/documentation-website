---
description: "View function retrieving complete upgrade proposal governance data including proposed implementation and timeline"
sidebar_position: 8
---

# getUpgradeProposalData

**Function Type**: `view`  
**Function Signature**: `getUpgradeProposalData() returns (AddressTypeProposal memory)`

Retrieves complete upgrade proposal governance data including current implementation, proposed implementation, and acceptance timestamp information.

## Return Value

| Type                   | Description                                                                   |
| ---------------------- | ----------------------------------------------------------------------------- |
| `AddressTypeProposal`  | Struct containing current implementation, proposed implementation, and timing data |

### AddressTypeProposal Structure

```solidity
struct AddressTypeProposal {
    address current;        // Currently active implementation address (unused for upgrades)
    address proposal;       // Proposed new implementation address (0x0 if none)
    uint256 timeToAccept;   // Timestamp when proposal can be accepted (0 if none)
}
```

## Description

This function provides comprehensive information about pending contract upgrade proposals, including the proposed implementation address and acceptance timeline. It's essential for governance interfaces and monitoring systems that need to track contract upgrade processes.
