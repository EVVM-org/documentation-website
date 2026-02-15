---
title: "Staking Service Overview"
description: "Overview of the EVVM Staking Service architecture and reward system"
sidebar_position: 1
---

# Staking Service Overview

:::info[Signature Verification]
User operations (`presaleStaking`, `publicStaking`) use **Core.sol's centralized verification** via `validateAndConsumeNonce()`. All staking signatures follow the universal EVVM format with `StakingHashUtils` for hash generation.
:::

The Staking service is a dual-contract system enabling users to stake MATE tokens and receive time-weighted rewards for participating as network fishers.

## Architecture

- **Staking Contract**: User operations, access tiers, and governance
- **Estimator Contract**: Epoch-based reward calculations with time-weighted algorithms

## Key Features

### Multi-Tier Access
- **Golden Staking**: Exclusive golden fisher access with EVVM nonce sync
- **Presale Staking**: 800 presale users, maximum 2 staking tokens each
- **Public Staking**: Open access when enabled
- **Service Staking**: Three-phase process (prepare → pay → confirm) plus direct unstaking

### Security & Economics
- **Centralized Verification**: Core.sol validates all user operations
- **EIP-191 Signatures**: Cryptographic authorization with originExecutor (EOA verification)
- **Nonce Management**: Core async nonces for universal replay protection
- **Time-Delayed Governance**: 24-hour administrative changes
- **Time-Locked Unstaking**: 5-day waiting period for full unstaking (configurable)
- **Fixed Price**: 1 staking token = 5,083 MATE tokens
- **Enhanced Rewards**: 2x rewards for stakers validating transactions

### Reward System
- **Epoch-Based**: Time-weighted calculations ensuring fair distribution
- **Proportional**: Rewards based on staking duration and amount
- **Mathematical Precision**: Sophisticated algorithms for accurate reward allocation 