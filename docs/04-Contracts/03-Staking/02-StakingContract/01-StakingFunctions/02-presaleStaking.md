---
title: "presaleStaking"
description: "Detailed documentation of the EVVM Staking Contract's presaleStaking function for presale participant staking operations."
sidebar_position: 2
---

# presaleStaking

:::info[Signature Verification]
presaleStaking uses Core.sol's centralized verification via `validateAndConsumeNonce()` with `StakingHashUtils.hashDataForPresaleStake()`. Includes `originExecutor` parameter (EOA executor verified with tx.origin).
:::

**Function Type**: `external`  
**Function Signature**: `presaleStaking(address user, bool isStaking, address originExecutor, uint256 nonce, bytes signature, uint256 priorityFee_EVVM, uint256 nonceEvvm, bytes signatureEvvm)` 

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
| `originExecutor`    | address | EOA that will execute the transaction (verified with tx.origin) |
| `nonce`             | uint256 | Core nonce for this signature (prevents replay attacks) |
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

2. **Centralized Verification**: Validates signature and consumes nonce via Core.sol:
```solidity
core.validateAndConsumeNonce(
    user,
    Hash.hashDataForPresaleStake(isStaking, 1),  // Fixed amount = 1
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

3. **Presale Participant Verification**: Confirms the user is registered as a presale participant using `userPresaleStaker[user].isAllow`, reverts with `UserIsNotPresaleStaker()` if not authorized
4. **Limit Check**: Ensures `userPresaleStaker[user].stakingAmount < 2`, reverts with `UserPresaleStakerLimitExceeded()` if limit reached
5. **Counter Update**: Increments `userPresaleStaker[user].stakingAmount`
6. **Process Execution**: Calls the internal `stakingBaseProcess` function with:
   - User address and IsAService=false in AccountMetadata
   - Fixed amount of 1 staking token
   - Standard EVVM payment processing
   - Historical record updates and reward distribution

:::info

For detailed information about the `stakingBaseProcess` function, refer to the [stakingBaseProcess](../02-InternalStakingFunctions/01-stakingBaseProcess.md).

:::

## Unstaking Process

1. **Presale Staking Status**: Verifies `allowPresaleStaking.flag` is enabled and `allowPublicStaking.flag` is disabled, reverts with `PresaleStakingDisabled()` otherwise

2. **Centralized Verification**: Validates signature and consumes nonce via Core.sol (same as staking)

3. **Presale Participant Verification**: Confirms the user is registered as a presale participant using `userPresaleStaker[user].isAllow`, reverts with `UserIsNotPresaleStaker()` if not authorized
4. **Balance Check**: Ensures `userPresaleStaker[user].stakingAmount > 0`, reverts with `UserPresaleStakerLimitExceeded()` if no stakes to unstake
5. **Counter Decrement**: Decrements `userPresaleStaker[user].stakingAmount`
6. **Process Execution**: Calls the internal `stakingBaseProcess` function with:
   - User address and IsAService=false in AccountMetadata
   - Fixed amount of 1 staking token
   - Standard EVVM payment processing
   - Historical record updates and reward distribution

:::info

For detailed information about the `stakingBaseProcess` function, refer to the [stakingBaseProcess](../02-InternalStakingFunctions/01-stakingBaseProcess.md).

:::