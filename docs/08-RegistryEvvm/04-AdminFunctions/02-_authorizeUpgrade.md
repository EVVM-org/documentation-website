---
title: "_authorizeUpgrade"
description: "Internal UUPS authorization function ensuring only authorized parties can upgrade the contract implementation"
sidebar_position: 2
slug: /RegistryEvvm/AdminFunctions/authorizeUpgrade
---

# _authorizeUpgrade

**Function Type**: `internal`  
**Access Control**: `isSuperUser`  
**Function Signature**: `_authorizeUpgrade(address newImplementation)`

Internal authorization function required by the UUPS (Universal Upgradeable Proxy Standard) pattern, ensuring only authorized parties can upgrade the contract implementation.

## Parameters

| Parameter            | Type      | Description                                    |
| -------------------- | --------- | ---------------------------------------------- |
| `newImplementation`  | `address` | Address of the new implementation (unused)     |

## Description

This function is an internal override required by OpenZeppelin's `UUPSUpgradeable` contract. It serves as the authorization gate for contract upgrades, but in this implementation, the actual authorization logic is handled by the time-delayed governance system in `acceptProposalUpgrade()`.

## Access Control

**Modifier**: `isSuperUser`

Only the current superUser can authorize upgrades, maintaining governance control over the upgrade process.

## Implementation Details

### Workflow

1. **Internal Access Control**: Called internally by `acceptProposalUpgrade()` which already validates the caller is the current superUser.
2. **Proposal Validation**: Verifies that a valid upgrade proposal exists with a non-zero implementation address.
3. **Time Delay Check**: Confirms that the 7-day waiting period has elapsed through the `timeElapsed` modifier.
4. **Upgrade Authorization**: Authorizes the UUPS proxy upgrade to proceed with the proposed implementation.
