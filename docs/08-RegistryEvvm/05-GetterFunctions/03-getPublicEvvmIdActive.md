---
description: "View function retrieving all active public EVVM IDs in the public range (1000+)"
sidebar_position: 3
---

# getPublicEvvmIdActive

**Function Type**: `view`  
**Function Signature**: `getPublicEvvmIdActive() returns (uint256[] memory)`

Retrieves all active public EVVM IDs in the public range (1000+), providing a complete list of community-deployed EVVM instances.

## Return Value

| Type        | Description                                                |
| ----------- | ---------------------------------------------------------- |
| `uint256[]` | Array of active EVVM IDs in the public range (1000+)     |

## Description

This function returns all EVVM IDs that have been registered through the public registration system with auto-incrementing IDs starting from 1000. It serves as a discovery mechanism for community-deployed EVVM instances that anyone can register on whitelisted testnets.

