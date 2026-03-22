---
title: "Crosschain Treasury Overview"
description: "Overview of the Crosschain Treasury architecture enabling secure asset transfers between EVVM and external blockchains"
sidebar_position: 1
---

# Crosschain Treasury Overview

The Crosschain Treasury enables secure asset transfers between EVVM and external blockchains using interoperability protocols.

## Architecture

Two coordinated stations communicate through cross-chain protocols:

### Host Chain Station
- Operates on EVVM's blockchain
- Handles withdrawals from EVVM to external chains
- Receives Fisher bridge deposits from external chains
- Integrates with EVVM core contract

### External Chain Station
- Deployed on external blockchains
- Handles deposits from users to EVVM
- Receives Fisher bridge withdrawals from EVVM
- Manages real asset custody (ERC20 and native coins)

## Supported Protocols

| Protocol | ID | Description |
|----------|----|----|
| **Hyperlane** | `0x01` | Modular interoperability framework |
| **LayerZero** | `0x02` | Omnichain protocol |
| **Axelar** | `0x03` | Decentralized cross-chain network |

## Fisher Bridge System

Gasless cross-chain transactions:
- **Gasless Operations**: No native tokens needed for gas on destination chains
- **EIP-191 Signatures**: User authorization via signed messages
- **Priority Fees**: Economic incentives for Fisher executors
- **Nonce-Based Security**: Replay attack prevention

### Fisher Bridge Signature Model

Fisher Bridge on Host Chain Station uses Core.sol's **dual-executor transaction model** with a specialized configuration:

#### Host Chain Station (fisherBridgeSend)
Uses `Core.validateAndConsumeNonce()` with **hardcoded executors**:

```solidity
core.validateAndConsumeNonce(
    from,
    fisherExecutor.current,  // senderExecutor (hardcoded)
    hashPayload,
    fisherExecutor.current,  // originExecutor (hardcoded)
    nonce,
    true,                    // async nonce
    signature
);
```

**Why Hardcoded?**
- Only the Fisher executor can call `fisherBridgeSend()` (enforced by `onlyFisherExecutor` modifier)
- Both `msg.sender` and `tx.origin` must be the Fisher executor
- User signature explicitly authorizes the specific Fisher executor address
- Provides accountability: operations are traceable to the authorized Fisher executor

**Signature Format**:
```
{evvmId},{fisherExecutor},{hashPayload},{fisherExecutor},{nonce},true
```

Where both executor positions use the same `fisherExecutor.current` address.

#### External Chain Station (fisherBridgeSendERC20/Coin)
Uses **independent asyncNonce system** (NOT Core.sol):

```solidity
// External chain doesn't have Core.sol
asyncNonce[from][nonce] mapping

// Validates with SignatureRecover
SignatureRecover.recoverSigner(
    buildSignaturePayload(
        evvmID,
        fisherExecutor.current,  // Part of signature
        hashPayload,
        fisherExecutor.current,  // Part of signature
        nonce,
        true
    ),
    signature
) == from
```

**Key Differences**:
- No Core.sol on external chains
- Uses local `asyncNonce` mapping for replay protection
- Signature format similar but validated differently
- Fisher executor address still part of signed payload

### Signature Comparison

| Aspect | Host Chain (fisherBridgeSend) | External Chain (fisherBridgeSendERC20) |
|--------|-------------------------------|---------------------------------------|
| **Validation** | Core.validateAndConsumeNonce | SignatureRecover.recoverSigner |
| **Nonce System** | Core.sol centralized | Local asyncNonce mapping |
| **Executors** | Hardcoded fisherExecutor.current | Encoded in signature payload |
| **Access Control** | onlyFisherExecutor modifier | onlyFisherExecutor modifier |
| **Signature Format** | {evvmId},{executor},{hash},{executor},{nonce},true | {evvmId},{executor},{hash},{executor},{nonce},true |

## When to Use

**Ideal for:**
- EVVM on different blockchain than user assets
- Multi-chain support
- Gasless transaction requirements

## Available Documentation

### Host Chain Station
- **[withdraw](./02-HostChainStation/01-withdraw.md)**: Withdraw to external chains
- **[fisherBridgeReceive](./02-HostChainStation/02-fisherBridgeReceive.md)**: Receive gasless deposits
- **[fisherBridgeSend](./02-HostChainStation/03-fisherBridgeSend.md)**: Process gasless withdrawals
- **[Admin Functions](./02-HostChainStation/05-AdminFunctions.md)**: System management

### External Chain Station
- **[depositERC20](./03-ExternalChainStation/01-depositERC20.md)**: Deposit tokens to EVVM
- **[depositCoin](./03-ExternalChainStation/02-depositCoin.md)**: Deposit native coins to EVVM
- **[fisherBridgeReceive](./03-ExternalChainStation/03-fisherBridgeReceive.md)**: Receive gasless withdrawals
- **[fisherBridgeSendERC20](./03-ExternalChainStation/04-fisherBridgeSendERC20.md)**: Process gasless ERC20 transfers
- **[fisherBridgeSendCoin](./03-ExternalChainStation/05-fisherBridgeSendCoin.md)**: Process gasless coin transfers
- **[Admin Functions](./03-ExternalChainStation/06-AdminFunctions.md)**: System configuration

:::warning[Security Considerations]
- **Principal Token Protection**: Principal token (MATE) withdrawals blocked via `PrincipalTokenIsNotWithdrawable()` error
- **Cross-Chain Authorization**: All messages require sender and chain ID validation
- **Fisher Bridge Signatures**: EIP-191 compliant signatures with structured message format
- **Nonce-Based Protection**: Sequential nonce tracking prevents replay attacks
- **Time-Delayed Governance**: 1-day delays for admin and Fisher executor changes
- **Access Control**: `onlyAdmin` and `onlyFisherExecutor` modifiers restrict critical functions
- **Protocol Validation**: Chain-specific authorization for Hyperlane, LayerZero, and Axelar
- **Balance Verification**: Insufficient balance checks with `InsufficientBalance()` error protection
:::

## Gas Management

Each protocol requires different gas payment mechanisms:
- **Hyperlane**: Native tokens paid to mailbox contract
- **LayerZero**: Estimated fees through LayerZero endpoint
- **Axelar**: Gas service payments for cross-chain execution

Users must provide sufficient native tokens to cover cross-chain transaction costs when initiating transfers.