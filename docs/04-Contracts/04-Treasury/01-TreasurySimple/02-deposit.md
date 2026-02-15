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

1. **Zero Check**: Ensures `msg.value > 0`. Reverts with `DepositAmountMustBeGreaterThanZero()` if zero host chain coin is sent.
2. **Amount Validation**: Verifies that `amount` exactly matches `msg.value`. Reverts with `InvalidDepositAmount()` if they don't match.
3. **EVVM Balance Credit**: Calls `core.addAmountToUser(msg.sender, address(0), msg.value)` to credit the user's host chain coin balance in EVVM.

**ERC20 Deposit Flow** (when `token != address(0)`):

1. **Host Chain Coin Validation**: Ensures `msg.value == 0` (no host chain coin should be sent with ERC20 deposits). Reverts with `DepositCoinWithToken()` if host chain coin is sent.
2. **Amount Validation**: Ensures `amount > 0`. Reverts with `DepositAmountMustBeGreaterThanZero()` if amount is zero.
3. **Host Blockchain Transfer**: Executes `IERC20(token).transferFrom(msg.sender, address(this), amount)` to move tokens from user to Treasury contract.
4. **EVVM Balance Credit**: Calls `core.addAmountToUser(msg.sender, token, amount)` to credit the user's token balance in EVVM.

## Errors

- `DepositAmountMustBeGreaterThanZero()` — Reverted when attempting to deposit zero host chain coin or zero ERC20 amount.
- `InvalidDepositAmount()` — Reverted when `amount` does not match `msg.value` for native coin deposits.
- `DepositCoinWithToken()` — Reverted when native coin is sent alongside an ERC20 deposit.

## Security & Notes

- ERC20 transfers use `IERC20(token).transferFrom(msg.sender, address(this), amount)` in the current implementation. Some tokens do not strictly follow the ERC20 spec (they may return `false` on failure or not return a boolean), so using a safe transfer helper (e.g., `SafeTransferLib.safeTransferFrom`) or validating the return value in tests is recommended.
- The ERC20 transfer occurs before calling `addAmountToUser(...)`. Be aware that non-standard tokens (or ERC777 hooks) could attempt reentrancy; tests should cover malicious token behaviour.
- When depositing native coin (`address(0)`), the function requires `msg.value == amount` — the `amount` parameter is validated against `msg.value` to avoid ambiguity. Consider calling `deposit(address(0), msg.value)` for clarity in integrations.