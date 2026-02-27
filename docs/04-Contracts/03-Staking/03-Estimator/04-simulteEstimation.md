---
title: "simulteEstimation"
description: "Detailed documentation of the EVVM Estimator Contract's simulteEstimation function for previewing epoch rewards before claiming."
sidebar_position: 4
---

# simulteEstimation

**Function Type**: `external view`  
**Access Control**: `public`  
**Function Signature**: `simulteEstimation(address)`  
**Returns**: `(bytes32,address,uint256,uint256,uint256)`

View function that allows previewing potential epoch rewards for a specific user without executing any state changes. This enables users and interfaces to display estimated rewards before initiating the actual claim process.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `_user` | address | Address of the user to simulate rewards for |

## Return Values

| Return | Type | Description |
|--------|------|-------------|
| `epochAnswer` | bytes32 | Epoch identifier that would be recorded (returns 0 if already processed) |
| `tokenAddress` | address | Address of the reward token |
| `amountTotalToBeRewarded` | uint256 | Calculated reward amount the user would receive |
| `idToOverwrite` | uint256 | Index in user's history that would be updated |
| `timestampToOverwrite` | uint256 | Timestamp that would be recorded in the history |

## Functionality

### Reward Preview Calculation

The function mirrors the logic of `makeEstimation` but operates as a read-only view:

1. **History Iteration**: Reads through the user's staking history within the current epoch period
2. **Time-Weighted Average**: Calculates the weighted average of staked amounts over time
3. **Reward Estimation**: Computes proportional rewards based on the user's participation

### Time-Weighted Average Formula

The same formula used in `makeEstimation`:

$$
averageSm = \frac{\sum_{i=1}^{n} [(t_i - t_{i-1}) \times S_{i-1}] \times 10^{18}}{t_{Final} - t_{Start}}
$$

Where:
- `ti` = timestamp of current iteration
- `ti-1` = timestamp of previous iteration  
- `Si-1` = staked amount at previous timestamp
- `tFinal` = epoch end time
- `tStart` = epoch start time

### Edge Cases

#### Already Claimed Rewards
```solidity
if (h.transactionType == epochId) return (0, address(0), 0, 0, 0);
```
Returns zero values if the user has already claimed rewards for the current epoch.

#### Single History Entry
```solidity
if (size == 1) totSmLast = h.totalStaked;
```
Properly handles users with only one transaction in their staking history.

## Use Cases

### Frontend Integration
- **Reward Display**: Show users their estimated rewards before claiming
- **UI/UX Enhancement**: Provide real-time reward estimations
- **Decision Support**: Help users decide when to claim rewards

### Pre-Transaction Validation
- **Claim Verification**: Check if claiming would be worthwhile before paying gas
- **Already Claimed Detection**: Verify if rewards haven't been claimed yet

## Comparison with makeEstimation

| Aspect | simulteEstimation | makeEstimation |
|--------|-------------------|----------------|
| **Type** | view | external |
| **Access** | public | onlyStaking |
| **State Changes** | None | Updates epoch pool |
| **Purpose** | Preview | Execute |
| **Gas Cost** | Free (view) | Transaction gas |
