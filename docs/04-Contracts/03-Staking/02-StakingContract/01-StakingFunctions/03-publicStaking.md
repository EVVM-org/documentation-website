---
title: "publicStaking"
description: "Detailed documentation of the EVVM Staking Contract's publicStaking function for universal staking operations."
sidebar_position: 3
---

# publicStaking

**Function Type**: `external`  
**Function Signature**: `publicStaking(address,bool,uint256,uint256,bytes,uint256,uint256,bool,bytes)`  
**Function Selector**: `0x21cc1749`

The `publicStaking` function enables universal access to MATE token staking when the `allowPublicStaking.flag` is enabled, regardless of presale participation status or account type.

:::info

For all EVVM testnets `allowPublicStaking.flag` is enabled by default.

:::

## Parameters

| Parameter           | Type    | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `user`              | address | User address                                         |
| `isStaking`         | bool    | `true` = Stake, `false` = Unstake                    |
| `amountOfStaking`   | uint256 | Amount of staking tokens to stake/unstake            |
| `nonce`             | uint256 | Staking contract nonce for replay protection         |
| `signature`         | bytes   | Staking contract signature for replay protection     |
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
2. **Signature Verification**: Validates the authenticity of the user signature
3. **Nonce Validation**: Confirms the contract nonce is valid and unused
4. **Process Execution**: Calls the internal `stakingBaseProcess` function with:
   - User address and IsAService=false in AccountMetadata
   - Specified amount of staking tokens
   - Standard EVVM payment processing
   - Historical record updates and reward distribution
5. **Nonce Update**: Marks the staking nonce as used to prevent replay attacks

:::info

For detailed information about the `stakingBaseProcess` function, refer to the [stakingBaseProcess](../02-InternalStakingFunctions/02-stakingBaseProcess.md).

:::

![publicStaking Staking Happy Path](./img/publicStaking_Staking_HappyPath.svg)
![publicStaking Staking Failed Path](./img/publicStaking_Staking_FailedPath.svg)

## Unstaking Process

1. **Feature Status Verification**: Confirms `allowPublicStaking.flag` is enabled  
2. **Signature Verification**: Validates the authenticity of the user signature
3. **Nonce Validation**: Confirms the contract nonce is valid and unused
4. **Process Execution**: Calls the internal `stakingBaseProcess` function with:
   - User address and IsAService=false in AccountMetadata
   - Specified amount of staking tokens
   - Standard EVVM payment processing
   - Historical record updates and reward distribution
5. **Nonce Update**: Marks the staking nonce as used to prevent replay attacks

:::info

For detailed information about the `stakingBaseProcess` function, refer to the [stakingBaseProcess](../02-InternalStakingFunctions/02-stakingBaseProcess.md).

:::

![publicStaking Unstaking Happy Path](./img/publicStaking_Unstaking_HappyPath.svg)
![publicStaking Unstaking Failed Path](./img/publicStaking_Unstaking_FailedPath.svg)