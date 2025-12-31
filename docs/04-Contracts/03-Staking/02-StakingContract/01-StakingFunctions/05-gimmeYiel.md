---
title: "gimmeYiel"
description: "Claim staking rewards (note exact function name spelled `gimmeYiel` in contract)."
sidebar_position: 5
---

# gimmeYiel

**Function Type**: `external`  
**Function Signature**: `gimmeYiel(address)`  
**Returns**: `(bytes32,address,uint256,uint256,uint256)`

## Parameters

| Parameter | Type | Description |
|---|---:|---|
| `user` | address | Address of the user claiming rewards |

## Return Values

| Return | Type | Description |
|---|---:|---|
| `epochAnswer` | bytes32 | Epoch identifier (0 if nothing to distribute) |
| `tokenToBeRewarded` | address | Token address used for the reward |
| `amountTotalToBeRewarded` | uint256 | Calculated reward amount for the user |
| `idToOverwriteUserHistory` | uint256 | Index in user history to update with reward record |
| `timestampToBeOverwritten` | uint256 | Timestamp to write into the updated history entry |

## Workflow

1. **History Check**: Ensures the user has staking history to evaluate
2. **Estimation Call**: Calls the configured `Estimator.makeEstimation(user)` which returns the epoch, token address and the computed reward amount plus history metadata indices
3. **Reward Distribution**: If `amountTotalToBeRewarded > 0`:
   - Transfers the reward to the user using `makeCaPay(tokenToBeRewarded, user, amountTotalToBeRewarded)`
   - Updates the user's `HistoryMetadata` entry at `idToOverwriteUserHistory` with the reward `transactionType`, `amount`, and `timestamp`
4. **Executor Incentive**: If the caller (`msg.sender`) is a registered staker (checked via `evvm.isAddressStaker(msg.sender)`), the function pays a small incentive to the caller as:
   - `makeCaPay(PRINCIPAL_TOKEN_ADDRESS, msg.sender, evvm.getRewardAmount() * 1)`

## Interaction Notes

- **Estimator Integration**: This function depends on accurate epoch data supplied to the `Estimator` (via `notifyNewEpoch`). The estimator performs time-weighted calculations and returns reward amounts and history indices for in-place updates.
- **Atomicity**: All distribution and history updates are performed within the same call to ensure consistent accounting.
- **No Extra Signature Required**: `gimmeYiel` is called by external accounts (e.g., relayers or stakers). The function does not require user signatures; it relies on historical data in the contract and Estimator's calculations.

## Examples

- A staker or any caller can trigger `gimmeYiel(user)` to calculate and distribute available rewards to `user`. If rewards are distributed, the caller may receive a small principal-token incentive if the caller is a staker.

:::info
This doc describes the exact implementation present in the current contract sources; if you prefer a different user-facing name for the function in docs, we can alias it (e.g., "claimYield") but the code will still use `gimmeYiel`.
:::
