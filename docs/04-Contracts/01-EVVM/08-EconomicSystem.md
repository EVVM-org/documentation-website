---
title: "Economic System Functions"
description: "Comprehensive documentation of the EVVM Core Contract's economic system, including tokenomics, reward distribution, and era transition mechanisms."
sidebar_position: 8
---

# Economic System Functions

The EVVM ecosystem implements a sophisticated economic system with deflationary tokenomics, reward distribution, and era-based transitions. This section covers the economic functions that manage token supply, rewards, and the evolution of the system's monetary policy.

## Token Economics Overview

The EVVM economic system is built around the MATE token with several key features:

- **Deflationary Mechanism**: Reward halving through era transitions
- **Staker Incentives**: Enhanced rewards for network participants  
- **Random Bonuses**: Lottery-style rewards for era transition triggers
- **Supply Management**: Controlled token distribution and burning

## Era Transition System

### recalculateReward

**Function Type**: `public`  
**Function Signature**: `recalculateReward()`

Triggers a reward recalculation and era transition in the token economy when the total supply exceeds the current era threshold.

#### Era Transition Mechanism

The function implements a deflationary system where:

1. **Threshold Check**: Activates when `totalSupply > eraTokens`
2. **Era Adjustment**: Moves half of remaining tokens to next era threshold
3. **Reward Halving**: Cuts base reward amount in half for future transactions  
4. **Bonus Distribution**: Provides random MATE bonus to the caller (1-5083x reward)

#### Economic Formula

```solidity
// Era threshold update
evvmMetadata.eraTokens += ((evvmMetadata.totalSupply - evvmMetadata.eraTokens) / 2);

// Random bonus calculation
uint256 bonus = evvmMetadata.reward * getRandom(1, 5083);

// Reward halving
evvmMetadata.reward = evvmMetadata.reward / 2;
```

#### Economic Impact

- **Scarcity Creation**: Era thresholds become progressively harder to reach
- **Inflation Reduction**: Reward halving reduces token inflation over time
- **Early Incentive**: Higher rewards for early ecosystem participation
- **Random Incentive**: Lottery mechanism for era transition triggering

#### Workflow

1. **Eligibility Check**: Verifies total supply exceeds current era tokens threshold
2. **Era Calculation**: Updates era threshold by adding half the excess supply
3. **Bonus Award**: Grants random MATE bonus (1-5083x base reward) to caller
4. **Reward Halving**: Reduces base reward for all future transactions
5. **State Update**: Updates metadata to reflect new economic parameters

#### Access Control

- **Public Function**: Anyone can trigger when conditions are met
- **Conditional Execution**: Only works when total supply exceeds era threshold
- **Single Execution**: Each era transition can only occur once per threshold

---

### getRandom

**Function Type**: `internal view`  
**Function Signature**: `getRandom(uint256,uint256)`

Generates pseudo-random numbers for era transition bonuses and other system randomness needs.

#### Input Parameters

| Parameter | Type      | Description                    |
| --------- | --------- | ------------------------------ |
| `min`     | `uint256` | Minimum value (inclusive)      |
| `max`     | `uint256` | Maximum value (inclusive)      |

#### Return Value

| Type      | Description                                  |
| --------- | -------------------------------------------- |
| `uint256` | Random number between min and max (inclusive) |

#### Randomness Source

```solidity
return min + (uint256(
    keccak256(abi.encodePacked(block.timestamp, block.prevrandao))
) % (max - min + 1));
```

**Components**:
- **block.timestamp**: Current block timestamp for variability
- **block.prevrandao**: Validator randomness from consensus layer
- **Keccak256 Hashing**: Cryptographic mixing of randomness sources
- **Modulo Operation**: Maps to desired range

#### Security Considerations

- **Non-Critical Randomness**: Suitable for reward bonuses and incentives
- **Predictability**: Not suitable for high-stakes applications
- **Manipulation Resistance**: Difficult to manipulate but not impossible
- **Block-Based**: Updates with each new block

## Reward Distribution System

### _giveReward

**Function Type**: `internal`  
**Function Signature**: `_giveReward(address,uint256)`

Internal function that distributes MATE token rewards to stakers for transaction processing and network participation.

#### Input Parameters

| Parameter | Type      | Description                                    |
| --------- | --------- | ---------------------------------------------- |
| `user`    | `address` | Address of the staker to receive rewards       |
| `amount`  | `uint256` | Number of transactions or reward multiplier    |

#### Return Value

| Type   | Description                                      |
| ------ | ------------------------------------------------ |
| `bool` | True if reward distribution completed successfully |

#### Reward Calculation

```solidity
uint256 principalReward = evvmMetadata.reward * amount;
balances[user][evvmMetadata.principalTokenAddress] += principalReward;
```

**Formula**:
- **Total Reward** = Base Reward × Transaction Count
- **Base Reward**: Current system reward amount (halves with each era)
- **Transaction Count**: Number of successful operations processed

#### Use Cases

- **Single Payments**: 1x reward for processing individual payments
- **Batch Payments**: Multiple rewards based on successful transaction count
- **Bridge Operations**: Rewards for Fisher Bridge processing
- **Contract Operations**: Rewards for automated system operations

#### Integration Points

The reward system is integrated throughout EVVM functions:

```solidity
// Single payment reward
_giveReward(msg.sender, 1);

// Batch payment reward
_giveReward(msg.sender, successfulTransactions);

// Bridge operation reward  
_giveReward(msg.sender, 1);
```

## Economic State Functions

### Token Supply Management

#### getPrincipalTokenTotalSupply

**Function Type**: `view`  
**Function Signature**: `getPrincipalTokenTotalSupply()`

Returns the current total supply of MATE tokens used for era transition calculations.

#### getEraPrincipalToken

**Function Type**: `view`  
**Function Signature**: `getEraPrincipalToken()`

Returns the current era token threshold that triggers the next reward halving event.

#### getRewardAmount

**Function Type**: `view`  
**Function Signature**: `getRewardAmount()`

Returns the current base reward amount distributed to stakers for transaction processing.

### Economic Metadata

#### getEvvmMetadata

**Function Type**: `view`  
**Function Signature**: `getEvvmMetadata()`

Returns the complete economic configuration including token addresses, rewards, supply data, and era thresholds.

## Economic Scenarios

### Era Transition Example

Consider the following economic state:

```
Initial State:
- Total Supply: 1,000,000 MATE
- Era Tokens: 800,000 MATE  
- Base Reward: 100 MATE
- Excess Supply: 200,000 MATE (1,000,000 - 800,000)

After Era Transition:
- Era Tokens: 900,000 MATE (800,000 + 200,000/2)
- Base Reward: 50 MATE (100/2)
- Caller Bonus: 50-254,150 MATE (50 * random(1,5083))
- Next Threshold: 900,000 MATE
```

### Reward Halving Impact

| Era | Base Reward | Era Threshold | Economic Phase |
| --- | ----------- | ------------- | -------------- |
| 1   | 100 MATE    | 1M MATE       | High Inflation |
| 2   | 50 MATE     | ~1.5M MATE    | Moderate Inflation |
| 3   | 25 MATE     | ~2M MATE      | Low Inflation |
| 4   | 12.5 MATE   | ~2.5M MATE    | Deflationary |
| 5   | 6.25 MATE   | ~3M MATE      | Ultra Deflationary |

### Staker Economics

#### Transaction Processing Rewards

| Operation Type      | Base Reward | Additional Benefits |
| ------------------- | ----------- | ------------------- |
| Single Payment      | 1x reward   | Priority fees       |
| Batch Payment       | Nx reward   | Priority fees       |
| Bridge Operation    | 1x reward   | Bridge fees         |
| Contract Operation  | 1x reward   | Service fees        |

#### Era Transition Bonuses

Random bonus multipliers for triggering era transitions:

- **Minimum Bonus**: 1x base reward
- **Maximum Bonus**: 5083x base reward  
- **Average Bonus**: ~2542x base reward
- **Expected Value**: Significant incentive for monitoring

## Economic Security

### Inflation Control

- **Automatic Halving**: Reduces inflation with each era transition
- **Supply Caps**: Era thresholds create natural supply limits
- **Staker Distribution**: Rewards distributed to active participants only

### Economic Attacks

#### Era Manipulation
- **Attack Vector**: Attempting to manipulate era transition timing
- **Protection**: Public function allows anyone to trigger when eligible
- **Mitigation**: Random bonuses reduce predictable profit

#### Reward Farming
- **Attack Vector**: Gaming the reward system for excessive tokens
- **Protection**: Staker-only rewards and transaction validation
- **Mitigation**: Legitimate transaction processing required

#### Supply Inflation
- **Attack Vector**: Excessive reward distribution inflating supply
- **Protection**: Automatic halving mechanism reduces rewards over time
- **Mitigation**: Era thresholds become progressively harder to reach

## Integration Guidelines

### For Stakers

1. **Monitor Era Progress**: Track total supply approaching era thresholds
2. **Trigger Transitions**: Call `recalculateReward()` when eligible for bonuses  
3. **Optimize Processing**: Focus on high-volume periods for maximum rewards
4. **Long-term Planning**: Understand reward reduction trajectory

### For Developers

1. **Reward Integration**: Properly integrate `_giveReward()` in new functions
2. **Economic Queries**: Use getter functions for economic state information
3. **Era Monitoring**: Build tools to track era transition progress
4. **Reward Calculation**: Account for changing reward amounts in projections

### For Users

1. **Understand Economics**: Learn how era transitions affect system costs
2. **Timing Strategies**: Consider era transitions when planning large operations
3. **Staker Benefits**: Understand advantages of becoming a staker
4. **Long-term Value**: Recognize deflationary nature of tokenomics

## Economic Monitoring

### Key Metrics

- **Total Supply Growth**: Rate of MATE token creation
- **Era Progression**: Distance to next era transition
- **Reward Efficiency**: Rewards per transaction over time
- **Staker Participation**: Number of active reward recipients

### Health Indicators

- **Inflation Rate**: Current rate of token supply growth
- **Era Transition Frequency**: How often transitions occur
- **Reward Distribution**: Concentration of rewards among stakers
- **Economic Activity**: Transaction volume and reward generation

## Future Economic Evolution

### Predicted Trajectory

As the system matures:

1. **Early Growth**: High rewards attract initial stakers and users
2. **Expansion Phase**: Increased adoption drives era transitions
3. **Maturation**: Slower era transitions as thresholds become harder
4. **Stability**: Ultra-low inflation creates stable economic environment
5. **Sustainability**: System reaches long-term sustainable reward levels

### Adaptation Mechanisms

- **Community Governance**: Future economic parameter adjustments
- **Market Forces**: Natural balance between rewards and participation
- **Technical Evolution**: New features may introduce economic innovations
- **Cross-Chain Integration**: Economic effects of multi-chain expansion
