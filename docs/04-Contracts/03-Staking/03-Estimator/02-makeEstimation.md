---
title: "makeEstimation"
description: "Detailed documentation of the EVVM Staking Contract's makeEstimation function for calculating and distributing epoch-based staking rewards."
sidebar_position: 2
---

# makeEstimation

**Function Type**: `external`  
**Access Control**: `onlyStaking`  
**Function Signature**: `makeEstimation(address)`  
**Returns**: `(bytes32,address,uint256,uint256,uint256)`

Calculates and distributes epoch-based staking rewards for a specific user based on their staking history and participation during the epoch period. This function implements a time-weighted average staking calculation to ensure fair reward distribution.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `_user` | address | Address of the user for whom to calculate rewards |

## Return Values

| Return | Type | Description |
|--------|------|-------------|
| `epochAnswer` | bytes32 | Epoch identifier (returns 0 if already processed) |
| `tokenAddress` | address | Address of the reward token pool |
| `amountTotalToBeRewarded` | uint256 | Total reward amount calculated for the user |
| `idToOverwrite` | uint256 | Index in user's history to overwrite with epoch data |
| `timestampToOverwrite` | uint256 | Timestamp to record in the overwritten history entry |

## Functionality

### Time-Weighted Average Calculation

The function implements the following formula for fair reward distribution:

$$
averageSm = \frac{\sum_{i=1}^{n} [(t_i - t_{i-1}) \times S_{i-1}] \times 10^{18}}{t_{Final} - t_{Start}}
$$

Where:
- `ti` = timestamp of current iteration
- `ti-1` = timestamp of previous iteration  
- `Si-1` = staked amount at previous timestamp
- `tFinal` = epoch end time
- `tStart` = epoch start time

### Reward Calculation Process

1. **History Analysis**: Iterates through user's staking history within the epoch period
2. **Time-Weighted Calculation**: Calculates the weighted average of staked amounts over time
3. **Proportional Distribution**: Applies the user's proportion of total staked amounts
4. **Pool Adjustment**: Updates epoch pool to reflect distributed rewards

### Edge Cases Handled

#### Already Processed Users
```solidity
if (h.transactionType == epochId) return (0, address(0), 0, 0, 0);
```
Returns zero values if user has already received rewards for this epoch.

#### Single History Entry
```solidity
if (size == 1) totSmLast = h.totalStaked;
```
Handles users with only one staking transaction in their history.

#### Future Timestamps
```solidity
if (h.timestamp > epoch.tFinal) {
    if (totSmLast > 0) sumSmT += (epoch.tFinal - tLast) * totSmLast;
    // Process remaining calculations...
}
```
Properly handles history entries that extend beyond the epoch end time.

## State Changes

### Epoch Pool Updates
- **Total Pool**: Reduces by the amount rewarded to the user
- **Total Staked**: Decreases by the user's final staked amount
- **Remaining Rewards**: Available for subsequent user reward calculations

## Access Control

- **Staking Contract Only**: Function can only be called by the registered staking contract
- **Authorization Protection**: Prevents unauthorized reward calculations and manipulations

## Integration Points

### With Staking Contract
- **History Access**: Reads user staking history from the staking contract
- **Reward Processing**: Coordinated reward distribution with staking operations
- **Data Consistency**: Ensures reward calculations match actual staking data

### With Epoch Management
- **Epoch Boundaries**: Uses epoch metadata for time-based calculations
- **Pool Management**: Manages reward pool depletion and allocation

## Mathematical Precision

### Scaling Factor
Uses `1e18` scaling factor to maintain precision in:
- Time-weighted average calculations
- Proportional reward distributions
- Final reward amount determinations

### Calculation Accuracy
The time-weighted approach ensures:
- **Fair Distribution**: Rewards proportional to actual staking participation
- **Time Consideration**: Longer staking periods receive proportionally higher rewards
- **Accurate Accounting**: Precise tracking of staking contributions over time

## Example Workflow

1. **Staking contract calls `makeEstimation`** for a user
2. **Function retrieves user's staking history** within epoch period  
3. **Time-weighted average is calculated** based on staking duration and amounts
4. **Proportional reward is determined** from the available epoch pool
5. **Epoch pool is updated** to reflect the distributed reward
6. **Return values provide** reward amount and history update information

