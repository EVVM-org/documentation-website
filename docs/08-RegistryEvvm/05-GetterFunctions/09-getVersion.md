---
sidebar_position: 9
---

# getVersion

**Function Type**: `pure`  
**Function Signature**: `getVersion() returns (uint256)`

Returns the current version number of the Registry EVVM contract for compatibility checks and version tracking.

## Return Value

| Type      | Description                              |
| --------- | ---------------------------------------- |
| `uint256` | Current version number of the contract   |

## Description

This function provides a simple way to query the contract version, enabling applications to verify compatibility, track upgrades, and implement version-specific logic. The version number is hardcoded in the contract and increments with each upgrade.
