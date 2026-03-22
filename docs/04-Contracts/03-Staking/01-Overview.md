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

### Dual-Executor Transaction Model

Staking inherits the dual-executor system from Core.sol, providing flexible control over transaction execution for user operations (`presaleStaking`, `publicStaking`):

**Executor Parameters:**
- **senderExecutor**: Controls which address can call the function (`msg.sender`)
- **originExecutor**: Controls which address initiated the transaction (`tx.origin`)

**Flexibility Options:**
- Set to `address(0)`: No restriction, any address can execute
- Set to specific address: Only that address can execute (reverts otherwise)
- Both can be independently configured per transaction

**Common Usage Patterns:**
- User transactions: Both set to `address(0)` for maximum flexibility
- Fisher-mediated execution: `senderExecutor = fisher address`, `originExecutor = user address`
- Direct user execution: Both set to user's address for maximum security

**Signature Verification:**
```solidity
// User staking operations (presale/public) validate via Core
core.validateAndConsumeNonce(
    user,                                    // Signer address
    senderExecutor,                          // msg.sender restriction
    Hash.hashDataFor...(params),            // Operation-specific hash
    originExecutor,                         // tx.origin restriction
    nonce,                                  // User's Core nonce
    true,                                   // Always async
    signature                               // EIP-191 signature
);
```

**Note:** Golden staking and service staking do not use this dual-executor system as they have different access control mechanisms (goldenFisher-only and onlyCA respectively).

## Key Features

### Multi-Tier Access
- **Golden Staking**: Exclusive golden fisher access with EVVM nonce sync
- **Presale Staking**: 800 presale users, maximum 2 staking tokens each
- **Public Staking**: Open access when enabled
- **Service Staking**: Three-phase process (prepare → pay → confirm) plus direct unstaking

### Security & Economics
- **Centralized Verification**: Core.sol validates all user operations with dual-executor controls
- **EIP-191 Signatures**: Cryptographic authorization with flexible executor restrictions
- **Nonce Management**: Core async nonces for universal replay protection
- **Time-Delayed Governance**: 24-hour administrative changes
- **Time-Locked Unstaking**: 5-day waiting period for full unstaking (configurable)
- **Fixed Price**: 1 staking token = 5,083 MATE tokens
- **Enhanced Rewards**: 2x rewards for stakers validating transactions

### Reward System
- **Epoch-Based**: Time-weighted calculations ensuring fair distribution
- **Proportional**: Rewards based on staking duration and amount
- **Mathematical Precision**: Sophisticated algorithms for accurate reward allocation 