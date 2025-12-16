---
title: "notifyNewEpoch"
description: "Detailed documentation of the EVVM Staking Contract's notifyNewEpoch function for initializing new reward distribution epochs."
sidebar_position: 1
---

# notifyNewEpoch

**Function Type**: `external`  
**Access Control**: `onlyActivator`  
**Function Signature**: `notifyNewEpoch(address,uint256,uint256,uint256)`

Initializes a new reward distribution epoch by setting the epoch metadata. This function is called by the activator to establish the parameters for reward calculations during a specific time period.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `tokenPool` | address | Address of the token pool contract containing rewards |
| `totalPool` | uint256 | Total amount of tokens available for distribution in this epoch |
| `totalStaked` | uint256 | Total amount of tokens staked across all users at epoch start |
| `tStart` | uint256 | Timestamp when the epoch begins |

## Functionality

### Epoch Initialization
The function creates a new `EpochMetadata` struct with:
- **Token Pool**: Sets the reward pool contract address
- **Total Pool**: Establishes the total reward amount available
- **Total Staked**: Records the aggregate staked amount for proportional calculations
- **Time Final**: Automatically sets to current block timestamp (`block.timestamp`)
- **Time Start**: Uses the provided start timestamp parameter

### Access Control
- **Activator Only**: Function restricted to the activator address
- **Administrative Control**: Prevents unauthorized epoch manipulation

## Usage Context

This function is typically called:
1. **Epoch Transitions**: When starting a new reward distribution period
2. **Pool Updates**: When reward pools are refreshed or modified  
3. **Staking Adjustments**: After significant changes in total staked amounts

## State Changes

- **Epoch Metadata**: Completely overwrites the current epoch data
- **Reward Pool**: Establishes the available reward pool for calculations
- **Time Boundaries**: Sets the temporal boundaries for reward calculations

## Integration

### With Staking Contract
- Coordinates with staking contract for total staked amounts
- Ensures reward calculations align with actual staking data

### With Reward Distribution
- Provides the foundation for `makeEstimation` function calculations
- Establishes the parameters needed for proportional reward distribution

:::info

The epoch end time (`tFinal`) is automatically set to the current block timestamp when this function is called, creating a time window from `tStart` to `tFinal` for reward calculations.

:::

## Example Workflow

1. **Activator calls `notifyNewEpoch`** with new epoch parameters
2. **Epoch metadata is updated** with current timestamp as end time
3. **Reward calculations** can now be performed using `makeEstimation`
4. **Users receive rewards** proportional to their staking participation during the epoch
