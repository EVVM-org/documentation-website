---
title: "EVVM TypeScript Library Introduction"
description: "Comprehensive overview of the @evvm/viem-signature-library for building EVVM applications with type-safe signatures and contract interactions."
sidebar_position: 1
---

# EVVM TypeScript Library Introduction

The `@evvm/viem-signature-library` is the official TypeScript library for building EVVM applications. It provides type-safe signature construction, contract interaction, and transaction management for all EVVM services.

## Core Features

- **Payment Operations**: Individual and multi-recipient transactions
- **Identity Management**: Username registration, offers, and metadata
- **Staking Functions**: Golden, public, and presale staking
- **Generic Builders**: Custom service signature construction
- **Full Type Safety**: Complete TypeScript integration with viem/wagmi

## Universal Signature Format

All EVVM operations follow the standardized message format:
```
evvmID,functionName,param1,param2,...,paramN
```

The library automatically constructs these messages and handles EIP-191 signing, eliminating manual formatting.

## Architecture Overview

The library consists of four main modules:

### Signature Builders
- `EVVMSignatureBuilder` - Payment operations
- `NameServiceSignatureBuilder` - Identity management  
- `StakingSignatureBuilder` - Staking operations
- `GenericSignatureBuilder` - Custom services

### Additional Modules
- **Types**: TypeScript definitions for all operations
- **Utils**: Message construction and hashing utilities  
- **ABI**: Contract interfaces for direct interaction

## Quick Start Examples

### Payment Transaction
```typescript
import { EVVMSignatureBuilder } from '@evvm/viem-signature-library';

const builder = new EVVMSignatureBuilder(walletClient, account);
const signature = await builder.signPay(
  evvmID, recipient, token, amount, fee, nonce, priority, executor
);
```

### Username Registration
```typescript
import { NameServiceSignatureBuilder } from '@evvm/viem-signature-library';

const nameBuilder = new NameServiceSignatureBuilder(walletClient, account);
const { paySignature, actionSignature } = await nameBuilder.signRegistrationUsername(
  evvmID, nameServiceAddress, username, clowNumber, nonce,
  reward, priorityFee, evvmNonce, priorityFlag
);
```

### Staking Operation
```typescript
import { StakingSignatureBuilder } from '@evvm/viem-signature-library';

const stakingBuilder = new StakingSignatureBuilder(walletClient, account);
const { paySignature, actionSignature } = await stakingBuilder.signPublicStaking(
  evvmID, stakingAddress, true, amount, nonce, price, fee, evvmNonce, priority
);
```

## Installation

```bash
npm install @evvm/viem-signature-library
```

## Key Benefits

- **Automatic Message Construction**: No manual formatting required
- **Dual Signature Support**: Handles complex service + payment patterns
- **Type Safety**: Full TypeScript integration prevents runtime errors
- **Modular Design**: Import only needed functionality
- **Battle Tested**: Production-ready with comprehensive validation

The library implements all EVVM patterns documented in the Signature Structures section, providing a seamless bridge between documentation and working code.