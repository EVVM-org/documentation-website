---
title: "Staking Service"
description: "Documentation for the Staking service in evvm-js."
sidebar_position: 3
---

# Staking Service

The `Staking` service provides helpers to build signed staking-related actions.

## `presaleStaking`

Creates and signs a `presaleStaking` action.

- **Parameters:**
  - `user` (HexString, optional): User address. Defaults to signer's address.
  - `isStaking` (boolean): Whether the user is staking or unstaking.
  - `amountOfStaking` (bigint, optional): The amount to stake. Defaults to `0n`.
  - `nonce` (bigint): The stake nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): An optional EVVM `pay` signed action.
- **Returns:** `Promise<SignedAction<IPresaleStakingData>>`

## `publicStaking`

Creates and signs a `publicStaking` action.

- **Parameters:**
  - `user` (HexString, optional): User address. Defaults to signer's address.
  - `isStaking` (boolean): Whether the user is staking or unstaking.
  - `amountOfStaking` (bigint): The amount to stake.
  - `nonce` (bigint): The stake nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): An optional EVVM `pay` signed action.
- **Returns:** `Promise<SignedAction<IPublicStakingData>>`

## `goldenStaking`

Creates a `goldenStaking` action, typically used by a golden fisher. This action packages the staking amount and an optional EVVM signature. The on-chain verification is expected to use the EVVM signature provided in `evvmSignedAction`.

- **Parameters:**
  - `isStaking` (boolean): Whether the action is for staking or unstaking.
  - `amountOfStaking` (bigint): The amount to stake.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): An optional EVVM `pay` signed action containing the user's signature.
- **Returns:** `Promise<SignedAction<IGoldenStakingData>>`
