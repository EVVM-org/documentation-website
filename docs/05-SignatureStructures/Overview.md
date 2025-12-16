---
title: EVVM Signature Structures Overview
description: Guide on the universal signature format used across all EVVM services
sidebar_position: 0
---

# EVVM Signature Structures Overview

All EVVM operations require EIP-191 cryptographic signatures for security.

## Universal Message Format

```
<evvmId>,<functionName>,<param1>,<param2>,...,<paramN>
```

**Components:**
- `<evvmId>`: Network identifier (typically `1`)
- `<functionName>`: Operation name (`pay`, `registerUsername`, etc.)
- `<param1>, <param2>...`: Function parameters in order

## EIP-191 Signing

EVVM uses the EIP-191 standard (same as MetaMask):

1. Build message: `1,pay,0x742c...,0x0000...,50000000000000000,...`
2. EIP-191 wraps it: `"\x19Ethereum Signed Message:\n145"` + message
3. Wallet creates signature

## Parameter Formatting

- **Numbers**: `50000000000000000` (decimal)
- **Addresses**: `0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c` (lowercase hex)
- **Strings**: `alice` (as provided)
- **Booleans**: `true` or `false` (lowercase)
- **Bytes**: `0xa1b2c3d4...` (hex)

## Construction Process

1. Convert parameters to proper string format
2. Concatenate with commas in parameter order
3. Sign using wallet (EIP-191)

## Example: Payment Transaction

**Scenario:** Send 0.05 ETH to another user

**Function Parameters:**
1. Recipient: `0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c`
2. Token: `0x0000000000000000000000000000000000000000` (ETH)
3. Amount: `50000000000000000` (0.05 ETH in wei)
4. Priority Fee: `1000000000000000` (0.001 ETH)
5. Nonce: `42`
6. Priority Flag: `false` (sync execution)
7. Executor: `0x0000000000000000000000000000000000000000` (unrestricted)

**Constructed Message:**
```
1,pay,0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c,0x0000000000000000000000000000000000000000,50000000000000000,1000000000000000,42,false,0x0000000000000000000000000000000000000000
```

**Username Alternative:**
Replace address with username `alice`:
```
1,pay,alice,0x0000000000000000000000000000000000000000,50000000000000000,1000000000000000,42,false,0x0000000000000000000000000000000000000000
```

## EVVM Services Overview

### EVVM Core Functions
**Payments and transfers:**
- Single payments to addresses or usernames
- Batch payments to multiple recipients
- Withdrawal operations (coming soon)

### Name Service Functions  
**Username management:**
- Registration (pre-register → register process)
- Marketplace (make/withdraw/accept offers)
- Metadata management and renewal

### Staking Functions
**Token staking operations:**
- Public and presale staking/unstaking
- Reward claiming and management

### Treasury Functions
**Cross-chain operations:**
- Bridge transfers between blockchains
- Asset management across networks

## Important Rules

- **Parameter Order**: Must match exact function specification
- **Nonce Usage**: Each signature requires unique nonce per service
- **Format Precision**: No extra spaces, correct case sensitivity
- **Address Format**: Always lowercase with `0x` prefix

