---
title: "Staking Integration Functions"
description: "Comprehensive documentation of the EVVM Core Contract's staking integration functions for managing staker status, privileges, and rewards."
sidebar_position: 9
---

# Staking Integration Functions

The EVVM contract integrates closely with the staking system to manage staker status, privileges, and rewards. This integration enables enhanced functionality for MATE token stakers while maintaining secure access control and reward distribution.

## Staking System Overview

The EVVM staking integration provides:

- **Staker Status Management**: Control over who can earn staking rewards
- **Enhanced Privileges**: Special access to staker-only functions
- **Reward Distribution**: Integrated MATE token rewards for stakers
- **Cross-Contract Communication**: Secure integration with staking contract

## Staker Status Functions

### pointStaker

**Function Type**: `public`  
**Function Signature**: `pointStaker(address,bytes1)`

Updates staker status for a user address, controlling access to staking privileges and rewards.

#### Input Parameters

| Parameter | Type      | Description                                      |
| --------- | --------- | ------------------------------------------------ |
| `user`    | `address` | Address to update staker status for              |
| `answer`  | `bytes1`  | Flag indicating staker status/type               |

#### Access Control

```solidity
if (msg.sender != stakingContractAddress) {
    revert();
}
```

**Security Features**:
- **Staking Contract Only**: Only the authorized staking contract can call this function
- **Centralized Control**: Ensures staker status changes are properly authorized
- **Integration Security**: Prevents unauthorized staker privilege escalation

#### Staker Status Values

The `answer` parameter uses standardized flag values:

| Value              | Meaning                | Description                           |
| ------------------ | ---------------------- | ------------------------------------- |
| `FLAG_IS_STAKER`   | Active Staker          | User has staking privileges           |
| `0x00`             | Non-Staker             | User has no staking privileges        |
| Other values       | Custom Status          | Future staker types or special status |

#### Integration Flow

1. **Staking Contract Event**: User stakes or unstakes MATE tokens
2. **Status Update**: Staking contract calls `pointStaker()` to update status
3. **EVVM Update**: User's staker status is updated in EVVM contract
4. **Privilege Changes**: User gains/loses automatic staker benefits when executing payments

### isAddressStaker

**Function Type**: `view`  
**Function Signature**: `isAddressStaker(address)`

Checks if an address is registered as an active staker with transaction processing privileges.

#### Input Parameters

| Parameter | Type      | Description                        |
| --------- | --------- | ---------------------------------- |
| `user`    | `address` | Address to check staker status for |

#### Return Value

| Type   | Description                                  |
| ------ | -------------------------------------------- |
| `bool` | True if the address is a registered staker   |

#### Implementation

```solidity
function isAddressStaker(address user) public view returns (bool) {
    return stakerList[user] == FLAG_IS_STAKER;
}
```

**Validation Logic**:
- Checks if user's status equals the active staker flag
- Returns boolean for easy integration in other functions
- Used throughout EVVM for privilege verification

## Staker Privileges

### Enhanced Payment Processing

Stakers receive special privileges in payment processing functions:

#### Staker Payment Benefits

- **Automatic Detection**: The `pay` function automatically detects if executor is a staker
- **Enhanced Rewards**: Staker executors receive MATE token rewards for processing
- **Priority Fees**: Staker executors collect priority fees from users
- **Batch Processing**: Special rewards for batch payment processing

#### Privilege Detection

```solidity
if (isAddressStaker(msg.sender)) {
    // Staker gets priority fee and rewards
    if (priorityFee > 0) {
        if (!_updateBalance(from, msg.sender, token, priorityFee))
            revert ErrorsLib.UpdateBalanceFailed();
    }
    _giveReward(msg.sender, 1);
}
```

This automatic detection is used in:
- `pay` (unified payment function)
- `payMultiple` (for enhanced rewards)
- `dispersePay` (single-source multi-recipient)
- Bridge operations

### Reward System Integration

#### Standard Rewards

Stakers receive base MATE rewards for transaction processing:

```solidity
_giveReward(msg.sender, 1);  // Single transaction reward
```

#### Batch Rewards

Enhanced rewards for batch processing:

```solidity
_giveReward(msg.sender, successfulTransactions);  // Multiple transaction rewards
```

#### Bridge Rewards

Special rewards for Fisher Bridge operations:

```solidity
balances[msg.sender][evvmMetadata.principalTokenAddress] += evvmMetadata.reward;
```

## Contract Integration

### Staking Contract Address

#### getStakingContractAddress

**Function Type**: `view`  
**Function Signature**: `getStakingContractAddress()`

Returns the authorized staking contract address that can modify staker status.

#### Setup and Configuration

The staking contract address is set during EVVM deployment:

```solidity
constructor(
    address _initialOwner,
    address _stakingContractAddress,
    EvvmMetadata memory _evvmMetadata
) {
    stakingContractAddress = _stakingContractAddress;
    // Initial MATE token allocation to staking contract
    balances[_stakingContractAddress][evvmMetadata.principalTokenAddress] = 
        getRewardAmount() * 2;
    // Register staking contract as staker
    stakerList[_stakingContractAddress] = FLAG_IS_STAKER;
}
```

**Initial Setup Features**:
- **Address Registration**: Sets authorized staking contract
- **Initial Funding**: Provides MATE tokens for reward distribution
- **Staker Status**: Grants staking contract staker privileges
- **Integration Ready**: Prepares for cross-contract communication

### Cross-Contract Communication

#### Staking Contract → EVVM

When users stake or unstake tokens:

1. **User Action**: Stakes/unstakes MATE tokens in staking contract
2. **Status Calculation**: Staking contract determines new staker status
3. **EVVM Update**: Staking contract calls `pointStaker()` to update status
4. **Privilege Change**: User gains/loses staker privileges in EVVM

#### EVVM → Staking Contract

EVVM provides reward distribution to the staking contract:

- **Initial Allocation**: MATE tokens provided during deployment
- **Ongoing Rewards**: System generates rewards for distribution
- **Contract Balance**: Staking contract maintains MATE balance for rewards

## Staker Economics

### Cost-Benefit Analysis

#### Staking Requirements

To become a staker, users typically need to:

1. **Stake MATE Tokens**: Lock tokens in staking contract
2. **Maintain Balance**: Keep minimum staking requirements
3. **Active Participation**: Process transactions to earn rewards
4. **Network Contribution**: Provide validation and processing services

#### Staker Benefits

| Benefit Type          | Description                                    | Value                    |
| --------------------- | ---------------------------------------------- | ------------------------ |
| MATE Rewards          | Base rewards for transaction processing        | Variable (era-based)     |
| Priority Fees         | User-paid fees for transaction processing      | Market-determined        |
| Bridge Fees           | Fees from Fisher Bridge operations            | User-paid + MATE rewards |
| Enhanced Access       | Access to staker-only functions               | Exclusive privileges     |
| Network Influence     | Participation in network validation           | Governance potential     |

### Reward Calculations

#### Single Transaction Rewards

```solidity
// Base MATE reward
uint256 baseReward = evvmMetadata.reward;

// Priority fee (if applicable)
uint256 priorityFee = userSpecifiedFee;

// Total earnings = Base reward + Priority fee
uint256 totalEarnings = baseReward + priorityFee;
```

#### Batch Transaction Rewards

```solidity
// Multiple base rewards
uint256 totalRewards = evvmMetadata.reward * successfulTransactions;

// Multiple priority fees (if applicable)
uint256 totalFees = sum(individualPriorityFees);

// Total earnings = Multiple rewards + Total fees
uint256 totalEarnings = totalRewards + totalFees;
```

## Integration Best Practices

### For Staking Contract Developers

#### Secure Integration

1. **Address Validation**: Ensure EVVM contract address is correct
2. **Access Control**: Properly restrict who can trigger status updates
3. **Error Handling**: Handle EVVM contract failures gracefully
4. **State Synchronization**: Keep staking and EVVM status in sync

#### Status Management

```solidity
// Example staking contract integration
function updateStakerStatus(address user) internal {
    if (isUserStaker(user)) {
        IEvvm(evvmAddress).pointStaker(user, FLAG_IS_STAKER);
    } else {
        IEvvm(evvmAddress).pointStaker(user, 0x00);
    }
}
```

### For EVVM Integrators

#### Staker Verification

Always verify staker status before granting privileges:

```solidity
function privilegedFunction() external {
    require(evvm.isAddressStaker(msg.sender), "Not a staker");
    // Privileged functionality here
}
```

#### Reward Distribution

Properly integrate reward distribution:

```solidity
function processTransaction() external {
    // Transaction processing logic
    
    if (evvm.isAddressStaker(msg.sender)) {
        // Grant rewards through EVVM internal function
        // This is handled automatically by EVVM functions
    }
}
```

### For Users

#### Becoming a Staker

1. **Research Requirements**: Understand staking token requirements
2. **Evaluate Economics**: Calculate potential rewards vs. staking costs
3. **Stake Tokens**: Follow staking contract procedures
4. **Verify Status**: Confirm staker status in EVVM using `isAddressStaker()`
5. **Start Processing**: Begin earning rewards through transaction processing

#### Maintaining Staker Status

1. **Monitor Requirements**: Keep track of minimum staking requirements
2. **Stay Active**: Regularly process transactions to earn rewards
3. **Manage Rewards**: Properly handle earned MATE tokens and fees
4. **Update Status**: Ensure status remains synchronized across contracts

## Security Considerations

### Access Control

#### Staking Contract Security

- **Single Authority**: Only one contract can update staker status
- **Address Verification**: Staking contract address must be validated
- **Function Restrictions**: `pointStaker()` is restricted to staking contract only

#### Status Manipulation Prevention

- **Centralized Control**: Prevents unauthorized staker privilege escalation
- **Contract-Only Updates**: EOAs cannot directly modify staker status
- **Synchronization**: Status changes must originate from staking contract

### Integration Risks

#### Contract Upgrade Risks

- **Address Changes**: Staking contract upgrades may require EVVM updates
- **Interface Changes**: Modified interfaces may break integration
- **State Migration**: Status synchronization during upgrades

#### Failure Scenarios

- **Staking Contract Failure**: EVVM continues operating with existing staker status
- **Communication Failure**: Status updates may be delayed or lost
- **Network Issues**: Cross-contract calls may fail during network congestion

## Monitoring and Maintenance

### Health Indicators

#### Integration Health

- **Status Synchronization**: Staking contract and EVVM status alignment
- **Update Frequency**: Rate of staker status changes
- **Reward Distribution**: Proper MATE reward allocation
- **Cross-Contract Calls**: Success rate of `pointStaker()` calls

#### System Metrics

- **Active Stakers**: Number of addresses with staker status
- **Reward Volume**: Total MATE rewards distributed to stakers
- **Transaction Processing**: Volume of staker-processed transactions
- **Integration Errors**: Failed cross-contract communications

### Troubleshooting

#### Common Issues

1. **Status Sync Failure**
   - Check staking contract integration
   - Verify EVVM contract address in staking contract
   - Review recent staker status changes

2. **Reward Distribution Issues**
   - Verify staker status using `isAddressStaker()`
   - Check MATE token balances
   - Review transaction processing logs

3. **Integration Breaks**
   - Validate contract addresses
   - Check interface compatibility
   - Review access control configurations

## Future Integration Enhancements

### Planned Features

- **Multi-Tier Staking**: Different staker levels with varying privileges
- **Governance Integration**: Staker voting rights in system governance
- **Cross-Chain Staking**: Staking integration across multiple chains
- **Advanced Rewards**: More sophisticated reward calculation mechanisms

### Extensibility

The current integration design supports:

- **Multiple Staker Types**: Using different flag values in `pointStaker()`
- **Enhanced Privileges**: New functions can easily check staker status
- **Reward Evolution**: Flexible reward system can accommodate changes
- **Protocol Evolution**: Integration can adapt to new staking mechanisms
