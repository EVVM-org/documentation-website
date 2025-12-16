---
title: "Staking Service Overview"
description: "Overview of the EVVM Staking Service architecture and reward system"
sidebar_position: 1
---

# Staking Service Overview

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
- **EIP-191 Signatures**: Cryptographic authorization for all operations
- **Nonce Management**: Per-user replay protection
- **Time-Delayed Governance**: 24-hour administrative changes
- **Time-Locked Unstaking**: 21-day waiting period
- **Fixed Price**: 1 staking token = 5,083 MATE tokens
- **Enhanced Rewards**: 2x rewards for stakers validating transactions

### Reward System
- **Epoch-Based**: Time-weighted calculations ensuring fair distribution
- **Proportional**: Rewards based on staking duration and amount
- **Mathematical Precision**: Sophisticated algorithms for accurate reward allocation 