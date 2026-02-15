---
title: "publicStaking"
description: "Detailed documentation of the EVVM Staking Contract's publicStaking function for universal staking operations."
sidebar_position: 3
---

# publicStaking

:::info[Signature Verification]
publicStaking uses Core.sol's centralized verification via `validateAndConsumeNonce()` with `StakingHashUtils.hashDataForPublicStake()`. Includes `originExecutor` parameter (EOA executor verified with tx.origin).
:::

**Function Type**: `external`  
**Function Signature**: `publicStaking(address user, bool isStaking, uint256 amountOfStaking, address originExecutor, uint256 nonce, bytes signature, uint256 priorityFee_EVVM, uint256 nonceEvvm, bytes signatureEvvm)`  
**Function Selector**: `0x21cc1749`

The `publicStaking` function enables universal access to MATE token staking when the `allowPublicStaking.flag` is enabled, regardless of presale participation status or account type.

:::info

Note: In this repository's contract implementation the constructor enables `allowPublicStaking.flag` by default and leaves `allowPresaleStaking.flag` disabled. Deployments and testnets may use different defaults; consult the deployed contract metadata for runtime flag values.

:::

## Parameters

| Parameter           | Type    | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `user`              | address | User address                                         |
| `isStaking`         | bool    | `true` = Stake, `false` = Unstake                    |
| `amountOfStaking`   | uint256 | Amount of staking tokens to stake/unstake            |
| `originExecutor`    | address | EOA that will execute the transaction (verified with tx.origin) |
| `nonce`             | uint256 | Core nonce for this signature (prevents replay attacks) |
| `signature`         | bytes   | User authorization signature                         |
| `priorityFee_EVVM`  | uint256 | EVVM priority fee                                    |
| `nonce_EVVM`        | uint256 | EVVM payment operation nonce                         |
| `priorityFlag_EVVM` | bool    | EVVM execution mode (`true` = async, `false` = sync) |
| `signature_EVVM`    | bytes   | EVVM payment authorization                           |

:::note

- If you want to know more about the signature structure, refer to the [Standard Staking/Unstaking Signature Structure](../../../../05-SignatureStructures/03-Staking/01-StandardStakingStructure.md).
- The EVVM payment signature (`signature_EVVM`) follows the [Single Payment Signature Structure](../../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).
  :::

## Workflow

The function supports two execution paths:

- **Fisher-Mediated**: A designated fisher captures the transaction from the fishing spot and submits it to the contract
- **Direct User Submission**: The user directly submits the transaction to the contract

## Staking Process

1. **Feature Status Verification**: Confirms `allowPublicStaking.flag` is enabled

2. **Centralized Verification**: Validates signature and consumes nonce via Core.sol:
```solidity
core.validateAndConsumeNonce(
    user,
    Hash.hashDataForPublicStake(isStaking, amountOfStaking),
    originExecutor,
    nonce,
    true,  // Always async
    signature
);
```

**Validates**:
- Signature authenticity via EIP-191
- Nonce hasn't been consumed
- Executor is the specified EOA (via `tx.origin`)

**On Failure**:
- `Core__InvalidSignature()` - Invalid signature
- `Core__NonceAlreadyUsed()` - Nonce consumed
- `Core__InvalidExecutor()` - Executing EOA doesn't match originExecutor

3. **Process Execution**: Calls the internal `stakingBaseProcess` function with:
   - User address and IsAService=false in AccountMetadata
   - Specified amount of staking tokens
   - Standard EVVM payment processing
   - Historical record updates and reward distribution

:::info

For detailed information about the `stakingBaseProcess` function, refer to the [stakingBaseProcess](../02-InternalStakingFunctions/01-stakingBaseProcess.md).

:::

## Unstaking Process

1. **Feature Status Verification**: Confirms `allowPublicStaking.flag` is enabled  

2. **Centralized Verification**: Validates signature and consumes nonce via Core.sol (same as staking)

3. **Process Execution**: Calls the internal `stakingBaseProcess` function with:
   - User address and IsAService=false in AccountMetadata
   - Specified amount of staking tokens
   - Standard EVVM payment processing
   - Historical record updates and reward distribution

:::info

For detailed information about the `stakingBaseProcess` function, refer to the [stakingBaseProcess](../02-InternalStakingFunctions/01-stakingBaseProcess.md).

:::