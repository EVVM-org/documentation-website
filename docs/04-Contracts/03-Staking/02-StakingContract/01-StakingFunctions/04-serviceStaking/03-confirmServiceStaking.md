---
title: "confirmServiceStaking"
description: "Detailed documentation of the EVVM Staking Contract's confirmServiceStaking function for service staking operations."
sidebar_position: 3
---

# confirmServiceStaking

**Function Type**: `external`  
**Function Signature**: `confirmServiceStaking()`  
**Access Control**: `onlyCA` (Contract Accounts Only)

The `confirmServiceStaking` function is the final step in the service staking process. It validates that payment was made correctly and completes the staking operation. This function must be called in the same transaction as `prepareServiceStaking()` and the EVVM payment.

## Parameters

None - The function uses data stored during `prepareServiceStaking()`.

## Workflow

### Validation Process

1. **Payment Verification**: Validates that the correct amount of Principal Tokens was transferred:
   - Service balance decreased by exactly `amountOfStaking * PRICE_OF_STAKING`
   - Staking contract balance increased by exactly `amountOfStaking * PRICE_OF_STAKING`

2. **Transaction Timing**: Confirms operation occurs in the same transaction as `prepareServiceStaking`:
   - Compares current `block.timestamp` with stored timestamp
   - Reverts with `ServiceDoesNotStakeInSameTx()` if timestamps differ

3. **Service Authentication**: Ensures caller matches the service that initiated preparation:
   - Compares `msg.sender` with stored service address
   - Reverts with `AddressMismatch()` if addresses don't match

### Completion Process

4. **Staking Execution**: Calls `stakingBaseProcess` with:
   - Service address and IsAService=true in AccountMetadata
   - Staking operation (isStaking=true)
   - Prepared staking amount
   - Zero values for EVVM parameters (no additional payment needed)

## Validation Errors

The function performs strict validation and reverts with specific errors:

| Error | Condition | Description |
|-------|-----------|-------------|
| `ServiceDoesNotFulfillCorrectStakingAmount()` | Incorrect payment amount | Service didn't transfer exactly the required amount |
| `ServiceDoesNotStakeInSameTx()` | Different timestamp | Function not called in same transaction as preparation |
| `AddressMismatch()` | Wrong caller | Caller doesn't match the service that prepared staking |

## Balance Calculations

The function calculates required payment as:
```solidity
uint256 totalStakingRequired = PRICE_OF_STAKING * serviceStakingData.amountOfStaking;
```

And validates:
```solidity
// Service balance must decrease by exact amount
serviceBalanceBefore - totalStakingRequired == serviceBalanceAfter

// Contract balance must increase by exact amount  
contractBalanceBefore + totalStakingRequired == contractBalanceAfter
```

## State Changes

Upon successful validation:

1. **Staker Status**: Service receives staker status via `Evvm(EVVM_ADDRESS).pointStaker(address, 0x01)`
2. **History Update**: Transaction recorded in service's staking history
3. **Metadata Cleared**: Service staking metadata is implicitly cleared for next operation

## Integration Points

### With stakingBaseProcess
- Calls core staking logic with service-specific parameters
- IsAService=true flag indicates contract account staking
- No additional EVVM payments required (already completed)

### With EVVM Contract
- Validates balance changes through EVVM balance queries
- Coordinates with EVVM for staker status assignment

## Example Complete Flow

```solidity
// Complete service staking in one transaction
function stakeAsService(uint256 amount) external {
    // Step 1: Prepare
    stakingContract.prepareServiceStaking(amount);
    
    // Step 2: Pay
    uint256 cost = amount * stakingContract.priceOfStaking();
    evvmContract.caPay(address(stakingContract), PRINCIPAL_TOKEN_ADDRESS, cost);
    
    // Step 3: Confirm (this function)
    stakingContract.confirmServiceStaking();
}
```

:::info

For detailed information about the core staking logic, refer to the [stakingBaseProcess](../../02-InternalStakingFunctions/01-stakingBaseProcess.md).

:::

:::warning

This function must be called immediately after payment via `EVVM.caPay()` in the same transaction. Any delay or separate transaction will cause validation failures.

:::