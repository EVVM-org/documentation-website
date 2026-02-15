---
title: "EVVM Core Contract Overview"
description: "Overview of the EVVM Core Contract's payment processing, signature verification, nonce management, and treasury operations"
sidebar_position: 1
---

# EVVM Core Contract Overview

The EVVM (*E*thereum *V*irtual *V*irtual *M*achine) Core Contract (`Core.sol`) is the central infrastructure component of the EVVM ecosystem, providing unified payment processing, signature verification, centralized nonce management, and treasury operations.

## Core Features

### Payment System
- **`pay`**: Single payment function with automatic staker detection and reward distribution
- **`batchPay`**: Process multiple independent payments in a single transaction with individual success tracking
- **`dispersePay`**: Distribute tokens from one sender to multiple recipients with a single signature
- **Contract Payments**: `caPay` and `disperseCaPay` for smart contract integrations

### Centralized Nonce Management
- **Unified Nonce System**: Core.sol manages all nonces for the entire EVVM ecosystem (NameService, Staking, P2PSwap, Treasury)
- **Replay Attack Prevention**: Centralized nonce tracking prevents replay attacks across multi-service transactions
- **Dual Nonce Types**: Supports both synchronous (sequential) and asynchronous (parallel) execution modes
- **Service Integration**: All EVVM services use Core.sol for nonce validation and signature verification

### Token Management
- **Token Abstractions**: Internal token representation system using EIP-191 signatures
- **Balance Types**: Principal balances, reward balances, and cross-chain reserves
- **Transfer Authorization**: Signature-based validation for all operations

### System Integration
- **Name Service**: Username-based identity resolution for payments
- **Staking System**: MATE token staking and reward coordination
- **Treasury Operations**: Manages deposits, withdrawals, and cross-chain asset transfers
- **Service Integration**: Provides signature verification and nonce management for all EVVM services
- **Proxy Architecture**: Upgradeable contract with time-delayed governance

## Security Architecture

### Centralized Signature Verification
- **EIP-191 Standard**: All transactions require cryptographic signatures validated by Core.sol
- **Unified Verification**: Single point of signature validation for the entire ecosystem
- **Service-Specific Hashing**: Each service uses dedicated hash functions (e.g., `CoreHashUtils`, `NameServiceHashUtils`) for payload construction
- **Signature Payload Format**: `{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}`

### Replay Protection
- **Centralized Nonce Tracking**: Core.sol manages all nonces to prevent replay attacks across services
- **Multi-Service Security**: Single nonce system prevents cross-service transaction replay
- **Dual Nonce Support**: Both sync (sequential) and async (parallel) nonce modes available

### Governance System
- **Time-Delayed Changes**: 30-day delay for proxy implementation changes, 1-day for administrative updates
- **Community Protection**: All changes visible before execution
- **Emergency Controls**: Admin can reject problematic proposals

## Token Architecture

### Token Abstraction System
EVVM implements internal token abstractions instead of traditional ERC-20 contracts:

- **Internal Representations**: Tokens exist as abstractions within EVVM
- **Signature-Based Authorization**: All transfers authorized through EIP-191 signatures
- **Input Validation**: Signatures validated against exact function parameters

### Balance Management
- **Principal Balances**: Direct token holdings managed by core contract
- **Reward Balances**: Accumulated principal token rewards from staking and system participation
- **Cross-Chain Reserves**: Tokens locked for Fisher Bridge operations
- **Pending Withdrawals**: Balances reserved for cross-chain withdrawal processing

## Integration Capabilities

### Name Service Integration
- **Username Payments**: Convert usernames to wallet addresses automatically
- **Identity Resolution**: Support both direct addresses and Name Service identities
- **Validation Layer**: Verification of identity ownership and validity

## Core Responsibilities

### Payment Processing
- **Token Transfers**: Handles all token movements within the EVVM ecosystem
- **Batch Operations**: Efficient multi-payment processing with individual transaction tracking
- **Staker Rewards**: Automatic reward distribution to fishers and stakers

### Signature & Nonce Management
- **Signature Verification**: Validates all EIP-191 signatures for ecosystem operations
- **Nonce Coordination**: Manages synchronous and asynchronous nonces for all services
- **Service Authorization**: Provides secure transaction authorization for Name Service, Staking, P2PSwap, and Treasury

### Treasury Operations
- **Deposit Management**: Handles principal token deposits and reward balances
- **Withdrawal Processing**: Manages token withdrawals and cross-chain transfers
- **Balance Tracking**: Maintains accurate balance records for all users and services

## Execution Methods

Core.sol supports two execution approaches:

### Direct Execution
- **User-Initiated**: Users interact directly with Core.sol functions
- **Immediate Processing**: Transactions submitted directly to the blockchain
- **Full Control**: Complete autonomy over transaction timing and parameters

### Fisher Execution  
- **Fishing Spot Integration**: Users submit signed transactions through fishing spots
- **Fisher Processing**: Specialized fisher nodes capture and execute transactions on behalf of users
- **Gasless Experience**: Users don't pay gas fees; fishers handle execution and receive rewards
- **Optimized Routing**: Fishers manage transaction optimization and gas handling

The Core Contract serves as the foundational infrastructure layer, providing unified payment processing, signature verification, centralized nonce management, and treasury operations for the entire EVVM ecosystem.
