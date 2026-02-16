---
title: "Testnet Exclusive Functions"
description: "Development faucet functions exclusively available in testnet deployments for testing and demonstration purposes"
sidebar_position: 10
---

# Testnet Exclusive Functions

:::warning[Testnet Only Functions]

These functions are exclusively available in testnet deployments and are **NOT** included in mainnet versions of the EVVM ecosystem contracts. They serve as development faucets for testing and demonstration purposes.

:::

:::info[Testnet Cooldown Configuration]

All cooldown timers in testnet deployments have been reduced to **1 minute** to facilitate faster testing and development. This includes cooldowns for transactions, staking operations, and any other time-locked features that may have longer cooldowns in mainnet.

:::

## addBalance

**Function Type**: `external`  
**Function Signature**: `addBalance(address,address,uint256)`

Testnet faucet function that directly adds token balance to any user's account, bypassing normal deposit flows. This allows developers and testers to quickly obtain tokens for testing EVVM functionality.

### Parameters

| Field      | Type      | Description                                              |
| ---------- | --------- | -------------------------------------------------------- |
| `user`     | `address` | The address of the user to receive the balance          |
| `token`    | `address` | The address of the token contract to add balance for    |
| `quantity` | `uint256` | The amount of tokens to add to the user's balance       |

### Workflow

1. **Direct Balance Addition**: Adds the specified `quantity` directly to `balances[user][token]` mapping
2. **No Authorization**: No checks or validations - anyone can call this function on testnet
3. **Immediate Effect**: Balance is available instantly for testing transactions

## setPointStaker

**Function Type**: `external`  
**Function Signature**: `setPointStaker(address,bytes1)`

Testnet faucet function that directly configures a user's staker status for testing purposes, bypassing normal staking registration and token requirements. This allows developers to quickly test staker-specific functionality.

### Parameters

| Field    | Type      | Description                                                 |
| -------- | --------- | ----------------------------------------------------------- |
| `user`   | `address` | The address of the user to set as staker                   |
| `answer` | `bytes1`  | The bytes1 value representing the staker status            |

### Workflow

1. **Direct Status Assignment**: Sets the staker status directly in `stakerList[user]` mapping to the provided `answer` value
2. **No Token Requirements**: No validation or token deposit checks - bypasses normal staking process
3. **Immediate Effect**: Staker status is active instantly for testing staker-specific features

### Staker Status Values

| Value  | Type           | Description                              |
| ------ | -------------- | ---------------------------------------- |
| `0x00` | Non-Staker     | Removes staker status (default state)   |
| `0x01` | Regular Staker | Standard staker with basic rewards       |
| `0x02` | Premium Staker | Enhanced staker with additional benefits |