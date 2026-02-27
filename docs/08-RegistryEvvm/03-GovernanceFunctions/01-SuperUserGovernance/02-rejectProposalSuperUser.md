---
description: "Cancels pending superUser change proposals during the governance period"
sidebar_position: 2
---

# rejectProposalSuperUser

**Function Type**: `external`  
**Access Control**: `isSuperUser`  
**Function Signature**: `rejectProposalSuperUser()`

Cancels a pending superUser change proposal, resetting the governance state to allow for new proposals.

### Workflow

1. **Access Control**: Validates that the caller is the current superUser using the `isSuperUser` modifier. Reverts with `InvalidUser` if not authorized.
2. **Proposal Reset**: Clears the proposed superUser address immediately.
3. **State Cleanup**: Resets the timeToAccept timestamp to 0.
4. **Governance Security**: Prevents unwanted superUser changes and maintains current governance structure.