---
sidebar_position: 5
---

# getSuperUser

**Function Type**: `view`  
**Function Signature**: `getSuperUser() returns (address)`

Retrieves the current superUser address - the active governance authority for the Registry EVVM contract.

## Return Value

| Type      | Description                           |
| --------- | ------------------------------------- |
| `address` | Address of the current superUser      |

## Description

This function provides a simple way to query the current superUser address without the additional governance proposal data. It's useful for quick access control checks and basic governance queries.
