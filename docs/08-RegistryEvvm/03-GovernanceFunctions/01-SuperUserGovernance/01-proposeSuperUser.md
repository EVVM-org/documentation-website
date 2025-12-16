---
sidebar_position: 1
---

# proposeSuperUser Function

**Function Type**: `external`  
**Access Control**: `isSuperUser`  
**Function Signature**: `proposeSuperUser(address)`

Proposes a new superUser address with a mandatory 7-day time delay before the proposal can be accepted. This function initiates the first step of the time-delayed governance process for changing the superUser, providing a security buffer against malicious or hasty changes. Only the current superUser can propose a new superUser.

### Parameters

| Field            | Type      | Description                                    |
|------------------|-----------|------------------------------------------------|
| `_newSuperUser`  | `address` | Address of the proposed new superUser         |

### Requirements

- Only callable by the current superUser
- The proposed address must not be the zero address
- The proposed address must be different from the current superUser

### Workflow

1. **Access Control**: Validates that the caller is the current superUser using the `isSuperUser` modifier. Reverts with `InvalidUser` if not authorized.
2. **Input Validation**: Checks that `_newSuperUser` is not the zero address and is different from the current superUser. Reverts on validation failure.
3. **Proposal Creation**: Sets the `superUser.proposal` to the new address and `superUser.timeToAccept` to current timestamp plus 7 days.
4. **Governance State Update**: Updates the proposal state to allow for later acceptance or rejection.
