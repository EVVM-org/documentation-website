---
title: "EVVM Core Contract Overview"
description: "Overview of the EVVM Core Contract's payment processing, token management, and integration capabilities"
sidebar_position: 1
---

# EVVM Core Contract Overview

The EVVM (*E*thereum *V*irtual *V*irtual *M*achine) Core Contract is the central payment processing hub for the EVVM ecosystem, handling token transfers, staker rewards, and system integrations.

## Core Features

### Payment System
- **`pay`**: Unified payment function with automatic staker detection and reward distribution
- **Batch Operations**: `payMultiple` and `dispersePay` for multi-payment processing
- **Contract Payments**: `caPay` and `disperseCaPay` for smart contract integrations
- **Nonce Management**: Synchronous (sequential) and asynchronous (parallel) transaction processing

### Token Management
- **Token Abstractions**: Internal token representation system using EIP-191 signatures
- **Balance Types**: Principal balances, reward balances, and cross-chain reserves
- **Transfer Authorization**: Signature-based validation for all operations

### System Integration
- **Name Service**: Username-based identity resolution
- **Staking System**: MATE token staking and reward coordination
- **Fisher Bridge**: Cross-chain asset transfers via Treasury system
- **Proxy Architecture**: Upgradeable contract with time-delayed governance

## Security Architecture

### Signature Verification
- **EIP-191 Standard**: All transactions require cryptographic signatures
- **Replay Protection**: Nonce-based system prevents duplicate transactions
- **Parameter Integrity**: Signatures cover all critical transaction parameters

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

## Execution Methods

The EVVM supports two execution approaches:

### Direct Execution
- **User-Initiated**: Users interact directly with the EVVM contract
- **Immediate Processing**: Transactions submitted directly to the blockchain
- **Full Control**: Complete autonomy over transaction timing and parameters

### Fisher Execution  
- **Fishing Spot Integration**: Users submit transactions through the fishing spot system
- **Fisher Processing**: Specialized fisher nodes capture and execute transactions
- **Optimized Routing**: Fishers handle transaction optimization and gas management

The EVVM Core Contract provides comprehensive payment processing, token management, and administrative functionality as the central infrastructure component of the EVVM ecosystem.
