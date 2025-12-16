---
sidebar_position: 1
---

# Treasury System Overview

The Treasury system enables secure asset movement between external blockchains and the EVVM ecosystem. It provides validated mechanisms for users to deposit assets into EVVM and withdraw them back to their preferred blockchain environments.

## Two Treasury Solutions

EVVM offers two treasury architectures for different deployment scenarios:

### Simple Treasury
Single-chain solution for when EVVM operates on the same blockchain as user assets.

**Best for:**
- Same-chain operations
- Lower complexity
- Cost efficiency
- Direct integration

### Crosschain Treasury
Multi-chain solution enabling asset transfers across different blockchains.

**Best for:**
- Cross-chain operations
- Multiple blockchain support
- Advanced features like fisher bridge
- Interoperability protocols (Hyperlane, LayerZero, Axelar)

## Core Functions

Both systems provide:
- **Asset Deposits**: Native coins and ERC20 tokens
- **Asset Withdrawals**: Secure balance verification
- **EVVM Integration**: Direct balance management
- **Security Protection**: Principal token withdrawal prevention

## Available Documentation

- **[Simple Treasury](./01-TreasurySimple/01-Overview.md)**: Single-chain treasury operations
- **[Crosschain Treasury](./02-TreasuryCrosschain/01-Overview.md)**: Multi-chain treasury system

## Choosing Your Treasury

| Need | Simple Treasury | Crosschain Treasury |
|------|----------------|-------------------|
| Same-chain only | ✅ | ❌ |
| Multi-chain support | ❌ | ✅ |
| Lower gas costs | ✅ | ⚖️ |
| Advanced features | ❌ | ✅ |