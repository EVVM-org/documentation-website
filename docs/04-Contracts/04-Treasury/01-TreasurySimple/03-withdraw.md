---
title: Withdraw Function
description: Detailed documentation of the Treasury Contract's withdraw function for transferring host chain coins or ERC20 tokens from the EVVM virtual blockchain back to the user's wallet on the host blockchain.
sidebar_position: 3
---

# withdraw

**Function Type**: `external`  
**Function Signature**: `withdraw(address,uint256)`  
**Returns**: `void`

Withdraws host chain coins or ERC20 tokens from the EVVM virtual blockchain back to the user's wallet on the host blockchain. This function includes principal token protection to prevent withdrawal of the ecosystem's core token.

## Parameters

| Parameter | Type      | Description                                           |
| --------- | --------- | ----------------------------------------------------- |
| `token`   | `address` | Token contract address or `address(0)` for host chain coin |
| `amount`  | `uint256` | Amount to withdraw                                   |

## Workflow

1. **Principal Token Protection**: Checks if the token is the ecosystem's principal token using `getEvvmMetadata().principalTokenAddress`. Reverts with `PrincipalTokenIsNotWithdrawable()` if attempting to withdraw the principal token.
2. **EVVM Balance Verification**: Validates that the user has sufficient balance in the EVVM virtual blockchain using `getBalance(msg.sender, token) < amount`. Reverts with `InsufficientBalance()` if the user lacks adequate funds.
3. **Conditional Transfer Flow**:
   - **Host Chain Coin Withdrawal** (`token == address(0)`): 
     - Calls `removeAmountFromUser(msg.sender, address(0), amount)` to debit the user's EVVM balance
     - Uses `SafeTransferLib.safeTransferETH(msg.sender, amount)` to transfer host chain coins from Treasury to user on the host blockchain
   - **ERC20 Withdrawal** (`token != address(0)`): 
     - Calls `removeAmountFromUser(msg.sender, token, amount)` to debit the user's EVVM balance
     - Executes `IERC20(token).transfer(msg.sender, amount)` to send tokens from Treasury to user on the host blockchain

## Errors

- `PrincipalTokenIsNotWithdrawable()` — Reverted when attempting to withdraw the configured Principal Token (see `getEvvmMetadata().principalTokenAddress`).
- `InsufficientBalance()` — Reverted when `getBalance(msg.sender, token) < amount`.

## Security & Notes

- The contract updates EVVM balances via `removeAmountFromUser(...)` before performing the external token/ETH transfer. This is a safe ordering (state change before external call) and helps prevent reentrancy issues on withdraw paths.
- For ETH transfers the contract uses `SafeTransferLib.safeTransferETH` which is recommended. For ERC20 transfers it uses `IERC20(token).transfer(...)` — consider using `SafeTransferLib.safeTransfer` for robustness against non-compliant tokens and to detect transfer failures.
- The correctness of `removeAmountFromUser`/`addAmountToUser` depends on the EVVM core contract having the Treasury as the authorized caller (i.e., `Evvm.treasuryAddress` must be set). Tests should ensure that `Evvm` is configured so that these treasury calls succeed.
- Add unit tests that cover: withdrawing the principal token (should revert), insufficient balance, successful ETH withdraw, successful ERC20 withdraw, and token transfer failures.