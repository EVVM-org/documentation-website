---
title: "Treasury Functions"
description: "Detailed documentation of the EVVM Core Contract's treasury functions for authorized balance management operations."
sidebar_position: 11
---

# Treasury Functions

The EVVM contract includes specialized functions that can only be called by the authorized Treasury contract. These functions provide controlled access to user balance management for treasury operations such as deposits, withdrawals, and automated distributions.

:::warning[Treasury Authorization Required]
These functions will revert with `SenderIsNotTreasury()` if called by any address other than the authorized treasury contract.
:::

## addAmountToUser

**Function Type**: `external`  
**Function Signature**: `addAmountToUser(address,address,uint256)`

Adds tokens to a user's balance in the EVVM system. This function is used by the treasury for deposit operations and reward distributions.

### Parameters

| Field    | Type      | Description                                    |
| -------- | --------- | ---------------------------------------------- |
| `user`   | `address` | Address of the user to receive the balance     |
| `token`  | `address` | Address of the token contract                  |
| `amount` | `uint256` | Amount of tokens to add to the user's balance |

### Workflow

1. **Authorization Check**: Validates that `msg.sender` is the authorized treasury contract, reverts with `SenderIsNotTreasury()` if unauthorized
2. **Balance Update**: Directly adds the specified `amount` to `balances[user][token]` mapping
3. **Immediate Effect**: Balance change takes effect immediately within the EVVM system

## removeAmountFromUser

**Function Type**: `external`  
**Function Signature**: `removeAmountFromUser(address,address,uint256)`

Removes tokens from a user's balance in the EVVM system. This function is used by the treasury for withdrawal operations and fee deductions.

### Parameters

| Field    | Type      | Description                                        |
| -------- | --------- | -------------------------------------------------- |
| `user`   | `address` | Address of the user to remove balance from        |
| `token`  | `address` | Address of the token contract                      |
| `amount` | `uint256` | Amount of tokens to remove from the user's balance |

### Workflow

1. **Authorization Check**: Validates that `msg.sender` is the authorized treasury contract, reverts with `SenderIsNotTreasury()` if unauthorized
2. **Balance Update**: Directly subtracts the specified `amount` from `balances[user][token]` mapping
3. **Underflow Risk**: No underflow protection - treasury must ensure sufficient balance exists (Solidity 0.8+ will revert on underflow)
4. **Immediate Effect**: Balance change takes effect immediately within the EVVM system
