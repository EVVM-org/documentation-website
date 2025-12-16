---
title: Deposit Function
description: Detailed documentation of the Treasury Contract's deposit function for transferring host chain coins or ERC20 tokens into the EVVM virtual blockchain.
sidebar_position: 2
---

# deposit

**Function Type**: `external payable`  
**Function Signature**: `deposit(address,uint256)`  
**Returns**: `void`

Deposits host chain coins or ERC20 tokens from the host blockchain into the EVVM virtual blockchain. The function transfers assets from the user's wallet on the host blockchain to the Treasury contract and credits the equivalent balance in the EVVM system.

## Parameters

| Parameter | Type      | Description                                                    |
| --------- | --------- | -------------------------------------------------------------- |
| `token`   | `address` | Token contract address or `address(0)` for host chain coin   |
| `amount`  | `uint256` | Amount to deposit (must match `msg.value` for host chain coin) |

## Workflow

**Host Chain Coin Deposit Flow** (when `token == address(0)`):

1. **Zero Check**: Ensures `msg.value > 0`. Reverts with `DepositAmountMustBeGreaterThanZero` if zero host chain coin is sent.
2. **Amount Validation**: Verifies that `amount` exactly matches `msg.value`. Reverts with `InvalidDepositAmount` if they don't match.
3. **EVVM Balance Credit**: Calls `addAmountToUser(msg.sender, address(0), msg.value)` in the EVVM core contract to credit the user's internal host chain coin balance in the virtual blockchain.

**ERC20 Deposit Flow** (when `token != address(0)`):

1. **Host Chain Coin Validation**: Ensures `msg.value == 0` (no host chain coin should be sent with ERC20 deposits). Reverts with `InvalidDepositAmount` if host chain coin is sent.
2. **Amount Validation**: Ensures `amount > 0`. Reverts with `DepositAmountMustBeGreaterThanZero` if amount is zero.
3. **Host Blockchain Transfer**: Executes `transferFrom(msg.sender, address(this), amount)` to move tokens from user to Treasury contract on the host blockchain.
4. **EVVM Balance Credit**: Calls `addAmountToUser(msg.sender, token, amount)` in the EVVM core contract to credit the user's internal token balance in the virtual blockchain.