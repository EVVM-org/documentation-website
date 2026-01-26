---
title: "presaleStaking"
description: "Detailed documentation of the EVVM Staking Contract's presaleStaking function for presale participant staking operations."
sidebar_position: 2
---

# presaleStaking

**Function Type**: `external`  
**Function Signature**: `presaleStaking(address,bool,uint256,bytes,uint256,uint256,bool,bytes)` 

The `presaleStaking` function enables presale participants to stake or unstake their MATE tokens under specific restrictions. This function ensures exclusive access for qualifying presale users while enforcing operational limits.

## Restrictions

- Fixed amount of 1 staking token per operation
- Maximum allocation of 2 staking tokens per user
- Requires active `allowPresaleStaking` flag
- Not available when `allowPublicStaking` flag is active (presale users must use `publicStaking` instead)

:::info

Note: In this repository's contract implementation the constructor enables `allowPublicStaking.flag` by default and leaves `allowPresaleStaking.flag` disabled. Deployments and testnets may use different defaults; consult the deployed contract metadata for runtime flag values.

:::

## Parameters

| Parameter           | Type    | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `user`              | address | Presale participant's wallet address                 |
| `isStaking`         | bool    | `true` = Stake, `false` = Unstake                    |
| `nonce`             | uint256 | Staking contract nonce for replay protection         |
| `signature`         | bytes   | User authorization signature                         |

> **Note:** For presale staking the function enforces a fixed amount of `1` token; therefore the signed message must include `_amountOfStaking = 1`.| `priorityFee_EVVM`  | uint256 | EVVM priority fee                                    |
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

1. **Presale Staking Status**: Verifies `allowPresaleStaking.flag` is enabled and `allowPublicStaking.flag` is disabled, reverts with `PresaleStakingDisabled()` otherwise
2. **Signature Verification**: Validates the authenticity of the user signature
3. **Presale Participant Verification**: Confirms the user is registered as a presale participant using `userPresaleStaker[user].isAllow`, reverts with `UserIsNotPresaleStaker()` if not authorized
4. **Nonce Validation**: Calls internal `verifyAsyncNonce(user, nonce)` which reverts with `AsyncNonceAlreadyUsed()` if the nonce was already used
5. **Limit Check**: Ensures `userPresaleStaker[user].stakingAmount < 2`, reverts with `UserPresaleStakerLimitExceeded()` if limit reached
6. **Counter Update**: Increments `userPresaleStaker[user].stakingAmount`
7. **Process Execution**: Calls the internal `stakingBaseProcess` function with:
   - User address and IsAService=false in AccountMetadata
   - Fixed amount of 1 staking token
   - Standard EVVM payment processing
   - Historical record updates and reward distribution
8. **Nonce Update**: Marks the staking nonce as used to prevent replay attacks

:::info

For detailed information about the `stakingBaseProcess` function, refer to the [stakingBaseProcess](../02-InternalStakingFunctions/01-stakingBaseProcess.md).

:::

![presaleStaking Staking Happy Path](./img/presaleStaking_Staking_HappyPath.svg)
![presaleStaking Staking Failed Path](./img/presaleStaking_Staking_FailedPath.svg)

## Unstaking Process

1. **Presale Staking Status**: Verifies `allowPresaleStaking.flag` is enabled and `allowPublicStaking.flag` is disabled, reverts with `PresaleStakingDisabled()` otherwise
2. **Signature Verification**: Validates the authenticity of the user signature
3. **Presale Participant Verification**: Confirms the user is registered as a presale participant using `userPresaleStaker[user].isAllow`, reverts with `UserIsNotPresaleStaker()` if not authorized
4. **Nonce Validation**: Calls internal `verifyAsyncNonce(user, nonce)` which reverts with `AsyncNonceAlreadyUsed()` if the nonce was already used
5. **Balance Check**: Ensures `userPresaleStaker[user].stakingAmount > 0`, reverts with `UserPresaleStakerLimitExceeded()` if no stakes to unstake
6. **Counter Decrement**: Decrements `userPresaleStaker[user].stakingAmount`
7. **Process Execution**: Calls the internal `stakingBaseProcess` function with:
   - User address and IsAService=false in AccountMetadata
   - Fixed amount of 1 staking token
   - Standard EVVM payment processing
   - Historical record updates and reward distribution
8. **Nonce Update**: Marks the staking nonce as used to prevent replay attacks

:::info

For detailed information about the `stakingBaseProcess` function, refer to the [stakingBaseProcess](../02-InternalStakingFunctions/01-stakingBaseProcess.md).

:::

![presaleStaking Unstaking Happy Path](./img/presaleStaking_Unstaking_HappyPath.svg)
![presaleStaking Unstaking Failed Path](./img/presaleStaking_Unstaking_FailedPath.svg)