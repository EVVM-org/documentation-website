---
sidebar_position: 6
---

# isChainIdRegistered

**Function Type**: `view`  
**Function Signature**: `isChainIdRegistered(uint256 chainId) returns (bool)`

Checks if a specific chain ID is whitelisted for EVVM registration, determining whether registrations are allowed on that blockchain network.

## Parameters

| Parameter | Type      | Description                              |
| --------- | --------- | ---------------------------------------- |
| `chainId` | `uint256` | The chain ID to check for whitelisting  |

## Return Value

| Type   | Description                                                     |
| ------ | --------------------------------------------------------------- |
| `bool` | `true` if the chain ID is whitelisted, `false` otherwise       |

## Description

This function provides a way to verify if EVVM registrations are allowed on a specific blockchain network. Only whitelisted chain IDs can be used for both public and superUser EVVM registrations, providing control over which testnets are supported.
