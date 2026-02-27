---
title: "P2P Swap Contract Overview"
description: "Decentralized peer-to-peer token exchange with flexible order management and fee structures"
sidebar_position: 1
---

# P2P Swap Contract Overview

:::info[Signature Verification]
P2PSwap uses Core.sol's centralized signature verification via `validateAndConsumeNonce()` with hash-based operation validation through `P2PSwapHashUtils`.
:::

The P2P Swap Contract is a decentralized token exchange system enabling trustless peer-to-peer token swaps with an order book marketplace.

## Core Features

### Order Management
- **Order Creation (`makeOrder`)**: Create swap orders offering one token for another
- **Order Cancellation (`cancelOrder`)**: Cancel unfilled orders and reclaim tokens
- **Order Fulfillment**: Two dispatch methods with different fee structures
- **Market Discovery**: Automatic market creation for new token pairs

### Fee Structures
- **Proportional Fee**: Percentage-based fees (configurable rate, default 5%)
- **Fixed Fee**: Capped fees with maximum limits (default 0.001 ETH) and 10% tolerance
- **Three-Way Distribution**: Fees split between sellers (50%), MATE stakers (10%), service treasury (40%)

### Integration
- **Core.sol**: Centralized signature verification and nonce management
- **P2PSwapHashUtils**: Hash generation for all operations
- **Token Transfers**: via `requestPay()` (lock) and `makeCaPay()` (release)
- **Staking Rewards**: 2-5x MATE rewards for staker executors
- **EIP-191 Signatures**: Authorization for all operations

## Architecture

### Centralized Verification Pattern

All P2PSwap user functions follow this pattern:

```solidity
// 1. Centralized signature verification
core.validateAndConsumeNonce(
    user,
    P2PSwapHashUtils.hashDataFor[Operation](...),
    originExecutor,  // or address(0) for makeOrder
    nonce,
    true,            // Always async execution
    signature
);

// 2. Operation-specific business logic
// ... market lookup, order validation ...

// 3. Token transfers via Core
requestPay(user, token, amount, priorityFee, nonceEvvm, true, signatureEvvm);
makeCaPay(recipient, token, amount);

// 4. Staker rewards
if (core.isAddressStaker(msg.sender)) {
    makeCaPay(msg.sender, MATE_TOKEN_ADDRESS, priorityFee);
}
_rewardExecutor(msg.sender, 2-5x);
```

### Hash Functions

P2PSwap uses `P2PSwapHashUtils` for operation-specific hash generation:

```solidity
// makeOrder: Locks tokenA and creates order
hashDataForMakeOrder(tokenA, tokenB, amountA, amountB)

// cancelOrder: Refunds tokenA and deletes order
hashDataForCancelOrder(tokenA, tokenB, orderId)

// dispatchOrder: Executes trade (both fee models use same hash)
hashDataForDispatchOrder(tokenA, tokenB, orderId)
```

### Signature Format

Universal signature format for all P2PSwap operations:

```
{evvmId},{p2pSwapAddress},{hashPayload},{originExecutor},{nonce},true
```

Where:
- `evvmId`: Chain ID (from `block.chainid`)
- `p2pSwapAddress`: P2PSwap contract address
- `hashPayload`: Result from `P2PSwapHashUtils.hashDataFor[Operation](...)`
- `originExecutor`: EOA address that will execute the transaction (verified with `tx.origin` in Core.sol), or `address(0)` for makeOrder
- `nonce`: User's nonce for P2PSwap service (from `core.getNonce(user, p2pSwapAddress)`)
- `true`: Always async execution (`isAsyncExec = true`)

### Nonce Management

**Current**: Centralized in Core.sol
- Query nonce: `core.getNonce(user, address(p2pSwap))`
- Automatic consumption: Handled by `core.validateAndConsumeNonce()`
- Per-user, per-service nonce tracking

**Current**: Centralized async nonces in Core.sol (unified tracking)
- ❌ `nonceP2PSwap[user][nonce]` (removed)
- ❌ `verifyAsyncNonce()` (removed)
- ❌ `markAsyncNonceAsUsed()` (removed)

### Payment Processing

P2PSwap uses two Core payment patterns:

**requestPay()** - Locks tokens in Core
```solidity
requestPay(user, token, amount, priorityFee, nonce, true, signature);
```
Used for:
- Locking tokenA when creating orders (makeOrder)
- Collecting tokenB + fees when filling orders (dispatchOrder)
- Collecting priority fees from users

**makeCaPay()** - Releases tokens from Core
```solidity
makeCaPay(recipient, token, amount);
```
Used for:
- Refunding tokenA when canceling (cancelOrder)
- Paying seller their tokenB (dispatchOrder)
- Distributing fees to stakers and service
- Transferring tokenA to buyer (dispatchOrder)

## Market Structure

### Market Creation

Markets are automatically created for new token pairs:

```solidity
marketId[tokenA][tokenB] = nextMarketId;
marketMetadata[marketId] = MarketInformation({
    tokenA: tokenA,
    tokenB: tokenB,
    maxSlot: 0,
    ordersAvailable: 0
});
```

**Key Properties:**
- Markets are bidirectional: `market(A,B)` handles both A→B and B→A orders
- Each market has independent order ID space (1, 2, 3...)
- Deleted orders leave gaps that get reused
- `maxSlot` tracks highest order ID ever used
- `ordersAvailable` counts active orders

### Order Storage

Orders stored per-market:

```solidity
ordersInsideMarket[marketId][orderId] = Order({
    seller: userAddress,
    amountA: tokenA amount locked,
    amountB: tokenB amount required
});
```

**Order Lifecycle:**
1. **Created**: Seller locks tokenA, order active
2. **Filled**: Buyer pays tokenB + fee, receives tokenA, order deleted
3. **Cancelled**: Seller reclaims tokenA, order deleted

## Economic Model

### Fee Distribution (Proportional & Fixed)

When an order is filled, fees are distributed:

| Recipient | Share | Purpose |
|-----------|-------|---------|
| **Seller** | 50% of fee | Reward for providing liquidity |
| **Service Treasury** | 40% of fee | Protocol sustainability |
| **MATE Stakers** | 10% of fee | Staker rewards pool |

**Default Fee Rate**: 5% (500 / 10,000)

**Example** (100 USDC order with 5% fee):
- Fee: 5 USDC
- Seller receives: 100 USDC (order amount) + 2.5 USDC (50% of fee)
- Treasury accumulates: 2 USDC (40% of fee)
- Stakers share: 0.5 USDC (10% of fee)

### Fixed Fee Model

**Purpose**: Protects buyers from excessive fees on large orders

**Mechanism:**
```
proportionalFee = (amountB * percentageFee) / 10,000
fixedFee = min(proportionalFee, maxLimitFillFixedFee)

// 10% tolerance range
minRequired = amountB + (fixedFee * 90%)
maxRequired = amountB + fixedFee

// Buyer can pay anywhere in range
if (paid >= minRequired && paid <= maxRequired) {
    actualFee = paid - amountB
}
```

**Tolerance Benefit:**
- Allows UI flexibility for fee display
- Handles rounding differences
- User can choose exact payment amount

**Default Cap**: 0.001 ETH (~$2-3 at typical prices)

### Staker Rewards

Executors who are registered stakers receive MATE token rewards:

| Operation | Base Reward | With Priority | Notes |
|-----------|-------------|---------------|-------|
| **makeOrder** | 2x | 3x | Order creation |
| **cancelOrder** | 2x | 3x | Order cancellation |
| **dispatchOrder** | 4x | 5x | Order fulfillment (+ refund handling) |

Where `1x = core.getRewardAmount()` (MATE tokens)

**Priority Fee:** Additional MATE paid by user to executor
- Optional but incentivizes faster execution
- Paid before operation execution
- Distributed to executor if they're a staker

## Operation Summary

| Operation | Purpose | Hash Function | originExecutor |
|-----------|---------|---------------|----------------|
| **makeOrder** | Create order, lock tokenA | hashDataForMakeOrder(tokenA, tokenB, amountA, amountB) | ❌ address(0) |
| **cancelOrder** | Cancel order, refund tokenA | hashDataForCancelOrder(tokenA, tokenB, orderId) | ✅ Yes |
| **dispatchOrder_fillPropotionalFee** | Fill order with % fee | hashDataForDispatchOrder(tokenA, tokenB, orderId) | ✅ Yes |
| **dispatchOrder_fillFixedFee** | Fill order with capped fee | hashDataForDispatchOrder(tokenA, tokenB, orderId) | ✅ Yes |

## Admin Functions

P2PSwap includes time-locked governance for parameter updates:

- **Fee Configuration**: Update `percentageFee` (proportional model)
- **Cap Configuration**: Update `maxLimitFillFixedFee` (fixed model)
- **Reward Percentages**: Adjust seller/service/staker fee splits
- **Ownership Transfer**: Propose and accept new owner
- **Treasury Withdrawal**: Extract accumulated service fees

All admin changes require a time-lock period before acceptance.

## Security Features

- ✅ **Nonce Protection**: Centralized Core.sol nonce prevents replay attacks
- ✅ **Signature Validation**: EIP-191 signatures for all operations
- ✅ **Ownership Verification**: Only order owner can cancel
- ✅ **Atomic Operations**: Order fill is atomic (payment → transfer → delete)
- ✅ **Token Locking**: User tokens locked in Core.sol during order lifetime
- ✅ **Fee Validation**: Fixed fee model includes minimum payment checks
- ✅ **Overpayment Refund**: Excess payments automatically refunded

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Contract**: P2PSwap.sol  
**License**: EVVM-NONCOMMERCIAL-1.0