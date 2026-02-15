---
title: "Simple Treasury Overview"
sidebar_position: 1
---

# Simple Treasury Overview

:::info[Direct Execution Model]
Treasury operations use **direct transaction execution** via `msg.sender`. These functions do NOT use signature verification or nonce management - users interact directly with the contract using standard blockchain transactions.
:::

The Simple Treasury provides a streamlined, single-chain solution for asset management within EVVM. It operates on the same blockchain as the EVVM core contract, offering direct and efficient asset deposit and withdrawal operations.

## When to Use Simple Treasury

**Ideal for:**
- EVVM running on the same blockchain as user assets
- Direct integration scenarios
- Lower gas costs and complexity
- Single-chain environments

**Not suitable for:**
- Multi-chain operations
- Cross-chain bridge requirements
- Gasless transaction needs

## Key Features

- **Direct Execution**: Users interact directly with the Treasury contract
- **Same-Chain Operations**: All transactions on the same blockchain as EVVM
- **Native & ERC20 Support**: Both native coins and standard tokens
- **EVVM Integration**: Seamless balance synchronization
- **Security Protection**: Principal token withdrawal prevention

## Available Functions

- **[deposit](./02-deposit.md)**: Deposit native coins or ERC20 tokens into EVVM
- **[withdraw](./03-withdraw.md)**: Withdraw assets from EVVM back to user wallet
- **`getCoreAddress()`**: Returns the configured EVVM Core contract address (view function)

## Security Considerations

- The Treasury acts as an accounting gateway: it transfers custody of tokens to the contract (for ERC20) or receives native coins and then calls `core.addAmountToUser(...)` to credit balances. For withdrawals, it calls `core.removeAmountFromUser(...)` before performing external transfers.
- Principal token withdrawals are expressly blocked by design: attempting to withdraw the Principal Token will revert (`PrincipalTokenIsNotWithdrawable()`).
- **No Signature Verification**: Treasury operations execute directly from `msg.sender` without off-chain signatures or nonce management.
- Consider using safe ERC20 transfer helpers and adding tests for token transfer failures and malicious token behaviour.

## Architecture

```
User Wallet → Simple Treasury → EVVM Core
     ↑              ↓
     └──────────────┘
   (Same Blockchain)
```

The Simple Treasury acts as a direct bridge between user wallets and EVVM balances on the same blockchain.