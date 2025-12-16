---
sidebar_position: 3
---

# acceptSuperUser

**Function Type**: `external`  
**Function Signature**: `acceptSuperUser()`

Accepts a pending superUser proposal and completes the superUser transition, transferring governance control to the proposed address.

### Workflow

1. **Access Control**: Validates that the caller is the proposed superUser using the `isSuperUser` modifier. Reverts with `InvalidUser` if not the proposed superUser.
2. **Time Validation**: Checks that the 7-day acceptance period has elapsed using the `timeElapsed` modifier. Reverts with `TimeNotElapsed` if called too early.
3. **State Update**: Sets the caller as the new superUser and clears the proposal data.
4. **Governance Transition**: Completes the superUser transition process and updates system governance.

### Governance Lifecycle
- [`proposeSuperUser()`](./01-proposeSuperUser.md) - Initiate superUser change
- [`rejectProposalSuperUser()`](./02-rejectProposalSuperUser.md) - Cancel proposals

### State Queries
- [`getSuperUserData()`](../../05-GetterFunctions/04-getSuperUserData.md) - Monitor proposal status
- [`getSuperUser()`](../../05-GetterFunctions/05-getSuperUser.md) - Verify current superUser

The `acceptSuperUser` function represents the final, irreversible step in the governance transition process, emphasizing the importance of careful consideration and preparation before execution.