---
title: "Service Staking Introduction"
description: "Comprehensive introduction to service staking in the EVVM Staking system, including processes, integration methods, and best practices for smart contract staking."
sidebar_position: 1
---

# Service Staking Introduction

The EVVM Staking system provides native support for smart contracts (services) to participate in staking operations. Service staking is designed with enhanced security and atomicity requirements to prevent token loss while enabling Services to become network fishers.

## Overview

Service staking operates differently from user staking due to the nature of smart contracts:

- **Contract-Only Access**: Only smart contracts can use service staking functions (enforced by `onlyCA` modifier)
- **Atomic Operations**: Staking requires a three-phase atomic process to ensure transaction safety
- **Simplified Unstaking**: Direct unstaking without signatures or complex payment processing
- **Same Time Locks**: Subject to identical cooldown periods as user staking

## Three-Phase Service Staking Process

Service staking requires three sequential steps that MUST occur in the same transaction:

### Step 1: prepareServiceStaking
- **Function**: `prepareServiceStaking(uint256 amountOfStaking)`
- **Purpose**: Records pre-staking state and metadata
- **Process**: Stores service address, timestamp, intended amount, and balance snapshots
- **Access**: Contract accounts only (`onlyCA`)

### Step 2: EVVM Payment
- **Function**: `EVVM.caPay(address, address, uint256)`
- **Purpose**: Transfers Principal Tokens to staking contract
- **Amount**: `amountOfStaking * PRICE_OF_STAKING` Principal Tokens
- **Target**: Staking contract address

### Step 3: confirmServiceStaking
- **Function**: `confirmServiceStaking()`
- **Purpose**: Validates payment and completes staking
- **Validation**: Confirms exact payment amounts and same-transaction execution
- **Completion**: Calls `stakingBaseProcess` to finalize staking

:::warning[Critical Transaction Requirements]

All three steps MUST occur in the same transaction. If any step is missed or fails:
- **Token Loss Risk**: Principal Tokens may become permanently locked in the staking contract
- **No Recovery Mechanism**: There is no way to recover tokens from incomplete operations
- **Transaction Atomicity**: Use proper error handling to ensure all-or-nothing execution

:::

## Service Unstaking Process

Service unstaking is a simplified single-step process:

### Direct Unstaking
- **Function**: `serviceUnstaking(uint256 amountOfStaking)`
- **Process**: Direct call to `stakingBaseProcess` with service parameters
- **Access**: Contract accounts only (`onlyCA`)
- **Payment**: Returns `amountOfStaking * PRICE_OF_STAKING` Principal Tokens
- **No Signatures**: Unlike user unstaking, no signature validation required

### Time Lock Restrictions
Service unstaking follows the same time lock rules as user unstaking:
- **Re-staking Cooldown**: Must wait after complete unstaking before staking again
- **Full Unstaking Cooldown**: 21-day wait period for withdrawing all staked tokens

## Key Differences from User Staking

| Aspect | User Staking | Service Staking |
|--------|-------------|-----------------|
| **Access Control** | Any address | Contract accounts only (`onlyCA`) |
| **Staking Process** | Single function call with signatures | Three-phase atomic process |
| **Payment Method** | EVVM `pay()` with signatures | Direct `caPay()` transfer |
| **Unstaking** | Signature + nonce validation | Direct function call |
| **Time Locks** | Same cooldown periods | Same cooldown periods |
| **Rewards** | Standard reward distribution | Standard reward distribution |

## Integration Methods

### Method 1: Manual Three-Phase Process

Directly implement the three-step process in your service contract:

```solidity
contract MyService {
    address immutable STAKING_CONTRACT;
    address immutable EVVM_CONTRACT;
    
    function stakeTokens(uint256 amount) external {
        // Step 1: Prepare
        Staking(STAKING_CONTRACT).prepareServiceStaking(amount);
        
        // Step 2: Pay
        uint256 cost = amount * Staking(STAKING_CONTRACT).priceOfStaking();
        Evvm(EVVM_CONTRACT).caPay(
            STAKING_CONTRACT, 
            0x0000000000000000000000000000000000000001, // PRINCIPAL_TOKEN_ADDRESS
            cost
        );
        
        // Step 3: Confirm
        Staking(STAKING_CONTRACT).confirmServiceStaking();
    }
    
    function unstakeTokens(uint256 amount) external {
        Staking(STAKING_CONTRACT).serviceUnstaking(amount);
    }
}
```

### Method 2: StakingServiceHooks Library (Recommended)

Use the helper library available at `@evvm/testnet-contracts/library/StakingServiceHooks.sol` for simplified, atomic operations:

```solidity
import {StakingServiceHooks} from "@evvm/testnet-contracts/library/StakingServiceHooks.sol";

contract MyService is StakingServiceHooks {
    constructor(address stakingAddress) StakingServiceHooks(stakingAddress) {
        // StakingServiceHooks automatically:
        // - Sets stakingHookAddress = stakingAddress
        // - Retrieves and sets evvmHookAddress from staking contract
    }
    
    function stakeTokens(uint256 amount) external {
        // Atomic operation that handles all 3 steps automatically:
        // 1. prepareServiceStaking(amount)
        // 2. caPay(stakingContract, PRINCIPAL_TOKEN_ADDRESS, cost)
        // 3. confirmServiceStaking()
        _makeStakeService(amount);
    }
    
    function unstakeTokens(uint256 amount) external {
        // Direct wrapper for serviceUnstaking
        _makeUnstakeService(amount);
    }
    
    // Optional: Update staking contract address
    function updateStakingContract(address newStakingAddress) external onlyOwner {
        _changeStakingHookAddress(newStakingAddress);
    }
}
```

**Key StakingServiceHooks Features:**
- **Automatic Address Management**: Constructor sets both staking and EVVM addresses
- **Atomic Staking**: `makeStakeService()` prevents token loss through transaction atomicity  
- **Error Prevention**: Transaction reverts completely if any step fails
- **Simplified Integration**: No need to manage three separate contract calls
- **Address Updates**: Built-in functions to update contract addresses when needed

## StakingServiceHooks Library

The `StakingServiceHooks` is a helper abstract contract located at `@evvm/testnet-contracts/library/StakingServiceHooks.sol` that simplifies service staking integration by providing pre-built hooks for service contracts to safely interact with the EVVM staking system.

### Library Architecture

```solidity
abstract contract StakingServiceHooks {
    address stakingHookAddress;  // Staking contract address
    address evvmHookAddress;     // EVVM contract address
    
    constructor(address _stakingAddress) {
        stakingHookAddress = _stakingAddress;
        evvmHookAddress = Staking(_stakingAddress).getEvvmAddress();
    }
}
```

### Core Functions

#### makeStakeService(uint256 amountToStake)
- **Type**: `internal` function
- **Purpose**: Performs complete atomic staking operation
- **Process**: Executes all three staking steps in a single transaction:
  1. `Staking(stakingHookAddress).prepareServiceStaking(amountToStake)`
  2. `Evvm(evvmHookAddress).caPay(stakingContract, PRINCIPAL_TOKEN_ADDRESS, cost)`
  3. `Staking(stakingHookAddress).confirmServiceStaking()`
- **Safety**: Ensures atomicity - if any step fails, entire transaction reverts

#### makeUnstakeService(uint256 amountToUnstake)
- **Type**: `internal` function
- **Purpose**: Simplified unstaking wrapper
- **Process**: Direct call to `Staking(stakingHookAddress).serviceUnstaking(amountToUnstake)`
- **Returns**: `amountToUnstake * PRICE_OF_STAKING` Principal Tokens to the service

#### _changeStakingHookAddress(address newStakingAddress)
- **Type**: `internal` function
- **Purpose**: Updates both staking and EVVM contract addresses
- **Process**: Sets new staking address and automatically retrieves corresponding EVVM address
- **Use Case**: When staking contract is upgraded

#### changeEvvmHookAddress(address newEvvmAddress)
- **Type**: `internal` function  
- **Purpose**: Manually updates only the EVVM contract address
- **Use Case**: When EVVM contract is upgraded independently (rare)
- **Note**: Prefer using `_changeStakingHookAddress` for consistency

### Benefits of Using StakingServiceHooks

- **Token Loss Prevention**: Atomic operations ensure all-or-nothing execution
- **Simplified Integration**: Single inheritance provides all necessary functionality
- **Automatic Address Management**: Constructor and update functions handle contract addresses
- **Error Safety**: Complete transaction reversion prevents partial state updates
- **Reduced Gas Costs**: Optimized for minimal gas usage in atomic operations

## Validation and Error Handling

### Common Validation Errors

| Function | Error | Condition |
|----------|-------|-----------|
| `prepareServiceStaking` | `AddressIsNotAService()` | Called by EOA instead of contract |
| `confirmServiceStaking` | `ServiceDoesNotStakeInSameTx()` | Not called in same transaction as prepare |
| `confirmServiceStaking` | `ServiceDoesNotFulfillCorrectStakingAmount()` | Incorrect payment amount |
| `confirmServiceStaking` | `AddressMismatch()` | Different caller than prepare step |
| `serviceUnstaking` | `AddressMustWaitToFullUnstake()` | Full unstaking cooldown not met |

### Balance Requirements

Before staking, ensure the service contract has sufficient Principal Token balance:
```solidity
uint256 requiredBalance = amountToStake * stakingContract.priceOfStaking();
require(evvmContract.getBalance(address(this), PRINCIPAL_TOKEN_ADDRESS) >= requiredBalance, "Insufficient balance");
```

## Security Considerations

### Critical Safety Requirements

1. **Transaction Atomicity**: Never split the three-phase staking process across multiple transactions
2. **Balance Verification**: Always check Principal Token balance before initiating staking
3. **Error Handling**: Implement comprehensive error handling for all staking operations
4. **Access Control**: Restrict staking functions to authorized addresses within your service

### Time Lock Management

Service contracts must respect the same time lock restrictions as user staking:
- **Re-staking Cooldown**: Configurable wait period after complete unstaking
- **Full Unstaking Cooldown**: Default 21-day wait period for withdrawing all tokens
- **Balance Monitoring**: Track when cooldown periods will expire

## Best Practices

1. **Prefer StakingServiceHooks**: Use the helper library for most implementations
2. **Implement Balance Checks**: Verify sufficient funds before attempting staking operations
3. **Use Try-Catch Patterns**: Handle staking failures gracefully with proper error recovery
4. **Monitor Cooldowns**: Track time lock periods and notify users of waiting requirements
5. **Test Edge Cases**: Thoroughly test scenarios including insufficient balances and cooldown periods

The service staking system provides secure functionality for smart contracts to participate in the EVVM network while preventing common integration pitfalls that could result in token loss.