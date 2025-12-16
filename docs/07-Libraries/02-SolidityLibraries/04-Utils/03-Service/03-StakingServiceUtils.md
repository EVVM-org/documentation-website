---
title: "StakingServiceUtils"
description: "Abstract contract for simplified service staking integration"
sidebar_position: 3
---

# StakingServiceUtils

The `StakingServiceUtils` abstract contract provides simplified helpers for service staking operations. It wraps the multi-step staking process into single-function calls, making it easier for services to stake and earn rewards.

## Overview

**Contract Type**: Abstract contract  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/utils/service/StakingServiceUtils.sol`

### Key Features

- **One-call staking** - stake in single transaction
- **One-call unstaking** - unstake with single function
- **Address management** for upgrades
- **Automatic EVVM integration** via staking contract

## Contract Structure

```solidity
abstract contract StakingServiceUtils {
    address stakingHookAddress;
    address evvmHookAddress;
    
    constructor(address _stakingAddress) {
        stakingHookAddress = _stakingAddress;
        evvmHookAddress = IStaking(stakingHookAddress).getEvvmAddress();
    }
    
    // Staking functions
    // Address management
}
```

## State Variables

### `stakingHookAddress`
```solidity
address stakingHookAddress;
```

**Description**: Address of the Staking contract

**Visibility**: Internal

**Initialized**: In constructor

### `evvmHookAddress`
```solidity
address evvmHookAddress;
```

**Description**: Address of the EVVM contract (fetched from Staking contract)

**Visibility**: Internal

**Initialized**: Automatically from `IStaking(stakingHookAddress).getEvvmAddress()`

## Functions

### `_makeStakeService`
```solidity
function _makeStakeService(uint256 amountToStake) internal
```

**Description**: Stakes tokens for the service in a single transaction

**Parameters**:
- `amountToStake`: Number of stake units to purchase

**Process** (Automated):
1. Calls `prepareServiceStaking(amountToStake)` on Staking contract
2. Transfers `priceOfStaking * amountToStake` MATE tokens to Staking contract via EVVM
3. Calls `confirmServiceStaking()` to finalize stake

**Requirements**:
- Service must have sufficient MATE token balance in EVVM
- Service must not have pending staking operations
- `amountToStake` must be greater than 0

**Effects**:
- Service becomes (or increases position as) a staker
- Service can earn automatic rewards on payment processing
- MATE tokens locked in staking contract

**Example**:
```solidity
contract MyService is StakingServiceUtils {
    address public owner;
    
    constructor(address _stakingAddress) 
        StakingServiceUtils(_stakingAddress) 
    {}
    
    function stake(uint256 amount) external {
        require(msg.sender == owner, "Not owner");
        _makeStakeService(amount);
    }
}
```

**Gas Cost**: ~100,000-150,000 (includes prepareServiceStaking + caPay + confirmServiceStaking)

### `_makeUnstakeService`
```solidity
function _makeUnstakeService(uint256 amountToUnstake) internal
```

**Description**: Unstakes tokens from the service staking position

**Parameters**:
- `amountToUnstake`: Number of stake units to release

**Process** (Automated):
1. Calls `serviceUnstaking(amountToUnstake)` on Staking contract
2. Staking contract releases MATE tokens back to service's EVVM balance

**Requirements**:
- Service must have staked tokens
- `amountToUnstake` must be ≤ current stake amount
- Unstaking may have cooldown periods (see Staking contract)

**Effects**:
- Reduces or removes service staker status
- MATE tokens returned to service's EVVM balance
- Service stops earning automatic rewards if fully unstaked

**Example**:
```solidity
function unstake(uint256 amount) external {
    require(msg.sender == owner, "Not owner");
    _makeUnstakeService(amount);
}
```

**Gas Cost**: ~50,000-80,000

### `_changeStakingAddress`
```solidity
function _changeStakingAddress(address newStakingAddress) internal
```

**Description**: Updates both the Staking contract address and automatically fetches the new EVVM address

**Parameters**:
- `newStakingAddress`: New Staking contract address

**Process**:
1. Updates `stakingHookAddress` to new address
2. Queries new Staking contract for EVVM address
3. Updates `evvmHookAddress` automatically

**Use Case**: When Staking contract is upgraded via proxy

**Example**:
```solidity
function updateStakingAddress(address newAddr) external {
    require(msg.sender == owner, "Not owner");
    _changeStakingAddress(newAddr);
}
```

### `_changeEvvmHookAddress`
```solidity
function _changeEvvmHookAddress(address newEvvmAddress) internal
```

**Description**: Manually updates the EVVM contract address

**Parameters**:
- `newEvvmAddress`: New EVVM contract address

**Use Case**: When EVVM contract is upgraded but Staking contract hasn't updated its reference yet

**Example**:
```solidity
function updateEvvmHookAddress(address newAddr) external {
    require(msg.sender == owner, "Not owner");
    _changeEvvmHookAddress(newAddr);
}
```

## Usage Patterns

### Pattern 1: Basic Service Staking
```solidity
contract CoffeeShop is StakingServiceUtils {
    address public owner;
    
    constructor(address stakingAddress, address _owner) 
        StakingServiceUtils(stakingAddress) 
    {
        owner = _owner;
    }
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    // Owner can stake to earn rewards
    function stakeShop(uint256 amount) external onlyOwner {
        _makeStakeService(amount);
    }
    
    // Owner can unstake to withdraw
    function unstakeShop(uint256 amount) external onlyOwner {
        _makeUnstakeService(amount);
    }
}
```

### Pattern 2: Gradual Staking
```solidity
contract GradualStaker is StakingServiceUtils {
    uint256 public currentStake;
    uint256 public targetStake;
    
    function increaseStake(uint256 additionalAmount) external {
        _makeStakeService(additionalAmount);
        currentStake += additionalAmount;
    }
    
    function reachTarget() external {
        require(currentStake < targetStake, "Already at target");
        uint256 toStake = targetStake - currentStake;
        _makeStakeService(toStake);
        currentStake = targetStake;
    }
}
```

### Pattern 3: Automatic Restaking
```solidity
contract AutoRestaker is StakingServiceUtils {
    uint256 public autoRestakeThreshold;
    
    function checkAndRestake() external {
        // Get current MATE balance
        uint256 balance = IEvvm(evvmHookAddress).getBalance(
            address(this),
            address(1) // MATE token
        );
        
        if (balance >= autoRestakeThreshold) {
            uint256 stakeUnits = balance / getStakePrice();
            if (stakeUnits > 0) {
                _makeStakeService(stakeUnits);
            }
        }
    }
    
    function getStakePrice() internal view returns (uint256) {
        return IStaking(stakingHookAddress).priceOfStaking();
    }
}
```

### Pattern 4: Emergency Unstake
```solidity
contract ServiceWithEmergency is StakingServiceUtils {
    address public owner;
    bool public emergencyMode;
    
    function emergencyUnstake() external {
        require(msg.sender == owner, "Not owner");
        require(emergencyMode, "Not in emergency mode");
        
        // Unstake all
        uint256 currentStake = getCurrentStake();
        if (currentStake > 0) {
            _makeUnstakeService(currentStake);
        }
    }
    
    function getCurrentStake() internal view returns (uint256) {
        return IStaking(stakingHookAddress).getUserAmountStaked(address(this));
    }
}
```

## Integration with EvvmService

`EvvmService` includes equivalent functionality:

### StakingServiceUtils
```solidity
abstract contract StakingServiceUtils {
    function _makeStakeService(uint256 amount) internal { }
    function _makeUnstakeService(uint256 amount) internal { }
}
```

### EvvmService (More Complete)
```solidity
abstract contract EvvmService is AsyncNonceService {
    IEvvm evvm;
    IStaking staking;
    
    function _makeStakeService(uint256 amount) internal { }
    function _makeUnstakeService(uint256 amount) internal { }
    
    // Plus: payment helpers, signature validation, nonce management
}
```

**Recommendation**: Use `EvvmService` for complete services, `StakingServiceUtils` for staking-only utilities

## Manual Staking Process (For Reference)

If you want to implement staking manually without this utility:

```solidity
// Step 1: Prepare staking
IStaking(stakingAddress).prepareServiceStaking(amountToStake);

// Step 2: Transfer MATE tokens
uint256 cost = IStaking(stakingAddress).priceOfStaking() * amountToStake;
IEvvm(evvmAddress).caPay(
    address(stakingAddress),
    address(1), // MATE token
    cost
);

// Step 3: Confirm staking
IStaking(stakingAddress).confirmServiceStaking();
```

**StakingServiceUtils simplifies this to**:
```solidity
_makeStakeService(amountToStake);
```

## Security Considerations

### 1. Protect Staking Functions
```solidity
// Good - access control
address public owner;

function stake(uint256 amount) external {
    require(msg.sender == owner, "Not owner");
    _makeStakeService(amount);
}

// Bad - anyone can stake (drains your MATE!)
function stake(uint256 amount) external {
    _makeStakeService(amount);
}
```

### 2. Check Balance Before Staking
```solidity
// Good - verify sufficient balance
uint256 mateBalance = IEvvm(evvmHookAddress).getBalance(
    address(this),
    address(1)
);
uint256 cost = getStakeCost(amount);
require(mateBalance >= cost, "Insufficient MATE");
_makeStakeService(amount);

// Bad - stake without checking (reverts, wastes gas)
_makeStakeService(amount);
```

### 3. Validate Unstake Amount
```solidity
// Good - check current stake
uint256 currentStake = IStaking(stakingHookAddress).getUserAmountStaked(address(this));
require(amount <= currentStake, "Insufficient stake");
_makeUnstakeService(amount);

// Bad - unstake without checking (reverts)
_makeUnstakeService(amount);
```

### 4. Protect Address Updates
```solidity
// Good - only owner can update
function updateStakingAddress(address newAddr) external {
    require(msg.sender == owner, "Not owner");
    require(newAddr != address(0), "Invalid address");
    _changeStakingAddress(newAddr);
}

// Bad - no protection
function updateStakingAddress(address newAddr) external {
    _changeStakingAddress(newAddr);
}
```

## Gas Optimization

### Tip 1: Batch Stake Operations
```solidity
// Good - stake once with total
uint256 totalToStake = calculateTotalStake();
_makeStakeService(totalToStake);

// Bad - multiple small stakes
_makeStakeService(10);
_makeStakeService(20);
_makeStakeService(30);
// Each call costs ~100k gas vs single 100k call
```

### Tip 2: Cache Addresses
```solidity
// Good - use state variable
function getStakePrice() internal view returns (uint256) {
    return IStaking(stakingHookAddress).priceOfStaking();
}

// Acceptable but redundant - requery address
function getStakePrice() internal view returns (uint256) {
    address staking = IStaking(stakingHookAddress).getEvvmAddress();
    return IStaking(staking).priceOfStaking();
}
```

### Tip 3: Unstake Strategically
```solidity
// Good - unstake all at once if leaving
uint256 allStake = IStaking(stakingHookAddress).getUserAmountStaked(address(this));
_makeUnstakeService(allStake);

// Bad - unstake in small increments unnecessarily
for (uint256 i = 0; i < 10; i++) {
    _makeUnstakeService(1);
}
```

## Common Patterns

### With Events
```solidity
event Staked(uint256 amount, uint256 totalStake);
event Unstaked(uint256 amount, uint256 remainingStake);

function stake(uint256 amount) external onlyOwner {
    _makeStakeService(amount);
    
    uint256 total = IStaking(stakingHookAddress).getUserAmountStaked(address(this));
    emit Staked(amount, total);
}

function unstake(uint256 amount) external onlyOwner {
    _makeUnstakeService(amount);
    
    uint256 remaining = IStaking(stakingHookAddress).getUserAmountStaked(address(this));
    emit Unstaked(amount, remaining);
}
```

### With Rewards Tracking
```solidity
uint256 public totalRewardsEarned;

function claimRewards() external {
    uint256 rewardBalance = IEvvm(evvmHookAddress).getBalance(
        address(this),
        address(1)
    );
    
    totalRewardsEarned += rewardBalance;
    
    // Transfer to owner or restake
    IEvvm(evvmHookAddress).caPay(owner, address(1), rewardBalance);
}
```

## Error Handling

Common errors when staking:

### "Insufficient MATE balance"
**Cause**: Service doesn't have enough MATE tokens  
**Solution**: Ensure service earns or receives MATE before staking

### "Pending staking operation"
**Cause**: Previous `prepareServiceStaking` not confirmed  
**Solution**: Call `confirmServiceStaking()` or wait for operation to clear

### "Insufficient stake"
**Cause**: Trying to unstake more than staked amount  
**Solution**: Check `getUserAmountStaked()` before unstaking

## Best Practices

### 1. Check Staking Status
```solidity
function getStakingInfo() external view returns (
    uint256 currentStake,
    uint256 stakingCost,
    bool isStaker
) {
    currentStake = IStaking(stakingHookAddress).getUserAmountStaked(address(this));
```

### 2. Implement Minimum Stake
```solidity
uint256 public constant MINIMUM_STAKE = 10; // 10 stake units

function stake(uint256 amount) external onlyOwner {
    require(amount >= MINIMUM_STAKE, "Below minimum");
    _makeStakeService(amount);
}
```

### 3. Create View Functions
```solidity
function canStake(uint256 amount) external view returns (bool) {
    uint256 cost = IStaking(stakingHookAddress).priceOfStaking() * amount;
    uint256 balance = IEvvm(evvmHookAddress).getBalance(
        address(this),
        address(1)
    );
    return balance >= cost;
}

function canUnstake(uint256 amount) external view returns (bool) {
    uint256 current = IStaking(stakingHookAddress).getUserAmountStaked(address(this));
    return current >= amount;
}
```

---

## See Also

- **[Staking Overview](../../../../04-Contracts/03-Staking/01-Overview.md)** - Complete staking system documentation
- **[EvvmService](../../02-EvvmService.md)** - Includes staking utilities plus more
- **[Service Staking Functions](../../../../04-Contracts/03-Staking/02-StakingContract/01-StakingFunctions/04-serviceStaking/01-Introduction.md)** - Underlying staking contract functions
