---
title: "prepareServiceStaking"
description: "Detailed documentation of the EVVM Staking Contract's prepareServiceStaking function for service staking operations."
sidebar_position: 2
---

# prepareServiceStaking

**Function Type**: `external`  
**Function Signature**: `prepareServiceStaking(uint256)`  
**Access Control**: `onlyCA` (Contract Accounts Only)

The `prepareServiceStaking` function is the first step in the service staking process. It records the pre-staking state and prepares the necessary metadata for validation. This function must be followed by payment via `EVVM.caPay()` and completion via `confirmServiceStaking()` in the same transaction.

:::warning[Critical Transaction Requirements]

All three steps MUST occur in the same transaction:
1. Call `prepareServiceStaking(amount)` - Records balances and metadata
2. Use `EVVM.caPay()` to transfer Principal Tokens to the staking contract  
3. Call `confirmServiceStaking()` - Validates payment and completes staking

**CRITICAL WARNING**: If the process is not completed properly (especially if caPay is called but confirmServiceStaking is not), the Principal Tokens will remain locked in the staking contract with no way to recover them. The service will lose the tokens permanently.

:::

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `amountOfStaking` | uint256 | Amount of staking tokens the service intends to stake |

## Workflow

### Preparation Process

1. **Access Control**: Verifies caller is a contract account using `onlyCA` modifier
2. **Metadata Recording**: Stores critical pre-staking information:
   - Service address (`msg.sender`)
   - Current timestamp
   - Intended staking amount
   - Service's Principal Token balance before staking
   - Staking contract's Principal Token balance before staking

### State Changes

The function populates the `serviceStakingData` struct with:

```solidity
struct ServiceStakingMetadata {
    address service;                      // Service contract address
    uint256 timestamp;                    // Block timestamp when prepare was called
    uint256 amountOfStaking;             // Intended staking amount
    uint256 amountServiceBeforeStaking;  // Service balance before staking
    uint256 amountStakingBeforeStaking;  // Contract balance before staking
}
```

## Integration Requirements

### Following Steps Required

After calling `prepareServiceStaking()`, the service must:

1. **Make Payment**: Use `EVVM.caPay()` to transfer `amountOfStaking * PRICE_OF_STAKING` Principal Tokens to the staking contract
2. **Confirm Staking**: Call `confirmServiceStaking()` to validate payment and complete the staking process

### Access Control

- **Only Contract Accounts**: Function restricted to smart contracts via `onlyCA` modifier
- **Same Transaction**: All steps must occur in a single transaction
- **Balance Validation**: Subsequent confirmation validates exact payment amounts

## Example Usage

```solidity
// Step 1: Prepare staking for 5 tokens
stakingContract.prepareServiceStaking(5);

// Step 2: Transfer required Principal Tokens  
uint256 cost = 5 * stakingContract.priceOfStaking();
evvmContract.caPay(address(stakingContract), PRINCIPAL_TOKEN_ADDRESS, cost);

// Step 3: Confirm and complete staking
stakingContract.confirmServiceStaking();
```

:::info

This function only records metadata and does not perform any token transfers. The actual payment and staking completion occurs in the subsequent steps.

:::

:::danger[Token Loss Warning]

Failure to complete all three steps in the same transaction will result in permanent loss of Principal Tokens. Always ensure proper transaction atomicity when implementing service staking.

:::