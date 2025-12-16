---
title: "P2P Swap Contract Overview"
description: "Decentralized peer-to-peer token exchange with flexible order management and fee structures"
sidebar_position: 1
---

# P2P Swap Contract Overview

The P2P Swap Contract is a decentralized token exchange system enabling trustless peer-to-peer token swaps with an order book marketplace.

## Core Features

### Order Management
- **Order Creation (`makeOrder`)**: Create swap orders offering one token for another
- **Order Cancellation (`cancelOrder`)**: Cancel unfilled orders and reclaim tokens
- **Order Fulfillment**: Two dispatch methods with different fee structures
- **Market Discovery**: Automatic market creation for new token pairs

### Fee Structures
- **Proportional Fee**: Percentage-based fees (configurable rate)
- **Fixed Fee**: Capped fees with maximum limits for user protection
- **Three-Way Distribution**: Fees split between sellers, service treasury, and MATE stakers

### Integration
- **EVVM Payment System**: Secure token transfers via EVVM core contract
- **Staking Rewards**: Enhanced rewards for staker executors
- **EIP-191 Signatures**: Authorization for all operations
- **Service Staking**: Contract participates in staking ecosystem