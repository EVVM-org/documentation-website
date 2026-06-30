---
title: "P2P Swap Contract Overview"
description: "Decentralized peer-to-peer token exchange with order book functionality and proportional fee model"
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
- **Order Fulfillment (`dispatchOrder`)**: Fill existing orders with proportional fee model
- **Market Discovery**: Automatic market creation for new token pairs via `bytes32` hash IDs

### Fee Structures
- **Proportional Fee**: Percentage-based fees (configurable rate, default 5%)
- **Three-Way Distribution**: Fees split between sellers (50%), MATE stakers (10%), service treasury (40%)
- **Time-Delayed Governance**: All fee parameter changes require 1-day timelock

### Integration
- **Core.sol**: Centralized signature verification and nonce management
- **P2PSwapHashUtils**: Hash generation for all operations
- **Token Transfers**: via `requestPay()` (lock) and `makeCaPay()` (release)
- **Staking Rewards**: 1-2x MATE rewards for staker executors
- **EIP-191 Signatures**: Authorization for all operations

## Architecture

### Centralized Verification Pattern

All P2PSwap user functions follow this pattern:

```solidity
// 1. Centralized signature verification
core.validateAndConsumeNonce(
    user,
    senderExecutor,  // Controls msg.sender
    P2PSwapHashUtils.hashDataFor[Operation](...),
    originExecutor,  // Controls tx.origin
    nonce,
    true,            // Always async execution
    signature
);

// 2. Operation-specific business logic
// ... market lookup, order validation ...

// 3. Token transfers via Core
requestPay(user, token, amount, priorityFee, originExecutor, noncePay, true, signaturePay);
makeCaPay(recipient, token, amount);

// 4. Staker rewards
if (core.isAddressStaker(msg.sender)) {
    _sendReward(msg.sender, multiplier);
}
```

### Hash Functions

P2PSwap uses `P2PSwapHashUtils` for operation-specific hash generation:

```solidity
// makeOrder: Locks offeredToken and creates order
hashDataForMakeOrder(offeredToken, requestedToken, offeredAmount, requestedAmount)

// cancelOrder: Refunds offeredToken and deletes order
hashDataForCancelOrder(offeredToken, requestedToken, orderId)

// dispatchOrder: Executes trade (partial or full fill)
hashDataForDispatchOrder(offeredToken, requestedToken, orderId, amountOut, amountInMax)
```

### Signature Format

Universal signature format for all P2PSwap operations:

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},true
```

Where:
- `evvmId`: Chain ID (from `block.chainid`)
- `senderExecutor`: Address that can execute the operation via `msg.sender`
- `hashPayload`: Result from `P2PSwapHashUtils.hashDataFor[Operation](...)`
- `originExecutor`: EOA address that will initiate the transaction (verified with `tx.origin`)
- `nonce`: User's nonce for P2PSwap service (from `core.getNonce(user, p2pSwapAddress)`)
- `true`: Always async execution (`isAsyncExec = true`)

## Dual-Executor Transaction Model

P2PSwap uses **two independent executor parameters** for flexible transaction control:

### senderExecutor (msg.sender control)
Controls which address can call the contract function:

```solidity
core.validateAndConsumeNonce(
    user,
    senderExecutor,  // Validates msg.sender
    hashPayload,
    originExecutor,
    nonce,
    true,
    signature
);
```

**Common Patterns**:
- `address(0)`: Anyone can execute (maximum flexibility)
- `specificAddress`: Only that address can call the function (restriction)
- `serviceAddress`: Service can execute on behalf of user

### originExecutor (tx.origin control)
Controls which EOA can initiate the entire transaction:

```solidity
// Validated inside Core.sol
if (originExecutor != address(0) && tx.origin != originExecutor) {
    revert Core__InvalidExecutor();
}
```

**Common Patterns**:
- `address(0)`: Any EOA can initiate (maximum flexibility)
- `userEOA`: Only that EOA can initiate the transaction (personal execution)
- `trustedEOA`: Only specific EOA can initiate (delegation)

### P2PSwap Functions & Executors

| Function | Typical senderExecutor | Typical originExecutor |
|----------|------------------------|------------------------|
| **makeOrder** | address(0) | address(0) |
| **cancelOrder** | address(0) | user or address(0) |
| **dispatchOrder** | address(0) | user or address(0) |

### Nonce Management

Centralized async nonces in Core.sol (unified tracking):
- Query nonce: `core.getNonce(user, address(p2pSwap))`
- Automatic consumption: Handled by `core.validateAndConsumeNonce()`
- Per-user, per-service nonce tracking

### Payment Processing

P2PSwap uses two Core payment patterns:

**requestPay()** - Locks tokens in Core
```solidity
requestPay(user, token, amount, priorityFee, originExecutor, noncePay, true, signaturePay);
```
Used for:
- Locking offeredToken when creating orders (makeOrder)
- Collecting requestedToken + fees when filling orders (dispatchOrder)
- Collecting priority fees from users

**makeCaPay()** - Releases tokens from Core
```solidity
makeCaPay(recipient, token, amount);
```
Used for:
- Refunding offeredToken when canceling (cancelOrder)
- Transferring offeredToken to buyer (dispatchOrder)
- Refunding overpayment (dispatchOrder)
- Paying priority fees to staker executors (makeOrder, cancelOrder)
- Withdrawing accumulated fees (acceptWithdrawal)

## Market Structure

### Market Creation

Markets are automatically created for new token pairs using a deterministic `bytes32` hash:

```solidity
bytes32 marketId = keccak256(abi.encodePacked(tokenA, tokenB));
```

**Key Properties:**
- Markets are identified by `bytes32` hash of the token pair
- Each market has independent order ID space (1, 2, 3...)
- Deleted orders leave gaps that get reused
- `maxSlot` tracks highest order ID ever used
- `ordersAvailable` counts active orders
- `medianPrice` stores the volume-weighted average price (VWAP)

### Order Storage

Orders stored per-market with minimal on-chain data:

```solidity
orders[marketId][orderId] = Order({
    seller: userAddress,
    offeredAmount: totalOfferedAmount,
    requestedAmount: totalRequestedAmount,
    amountAvailable: remainingOfferedAmount
});
```

**Order Lifecycle:**
1. **Created**: Seller locks offeredToken, order active
2. **Partially Filled**: Buyer pays requestedToken + fee, receives portion of offeredToken
3. **Fully Filled**: All offeredToken distributed, order slot freed
4. **Cancelled**: Seller reclaims remaining offeredToken, order deleted

## Economic Model

### Fee Distribution

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

### Staker Rewards

Executors who are registered stakers receive MATE token rewards:

| Operation | Reward Multiplier | Notes |
|-----------|-------------------|-------|
| **makeOrder** | 1x | Order creation |
| **cancelOrder** | 1x | Order cancellation |
| **dispatchOrder** | 2x | Order fulfillment |

Where `1x = core.getRewardAmount()` (MATE tokens)

**Priority Fee:** Additional fee paid by user to executor. The token varies by operation: offeredToken for makeOrder, MATE/principal token for cancelOrder, requestedToken for dispatchOrder.
- Optional but incentivizes faster execution
- Paid before operation execution
- Distributed to executor if they're a staker (makeOrder, cancelOrder)
- Distributed to executor regardless of staker status (dispatchOrder)

## Operation Summary

| Operation | Purpose | Hash Function |
|-----------|---------|---------------|
| **makeOrder** | Create order, lock offeredToken | hashDataForMakeOrder(offeredToken, requestedToken, offeredAmount, requestedAmount) |
| **cancelOrder** | Cancel order, refund offeredToken | hashDataForCancelOrder(offeredToken, requestedToken, orderId) |
| **dispatchOrder** | Fill order (partial or full) | hashDataForDispatchOrder(offeredToken, requestedToken, orderId, amountOut, amountInMax) |

## Admin Functions

P2PSwap includes time-locked governance for parameter updates:

- **Fee Configuration**: Update `percentageFee` (proportional fee rate)
- **Reward Percentages**: Adjust seller/service/staker fee splits
- **Admin Transfer**: Propose and accept new admin
- **Treasury Withdrawal**: Extract accumulated service fees

All admin changes require a 1-day timelock period before acceptance.

## Security Features

- **Nonce Protection**: Centralized Core.sol nonce prevents replay attacks
- **Signature Validation**: EIP-191 signatures for all operations
- **Ownership Verification**: Only order owner can cancel
- **Atomic Operations**: Order fill is atomic (payment -> transfer -> delete)
- **Token Locking**: User tokens locked in Core.sol during order lifetime
- **Overpayment Refund**: Excess payments automatically refunded
- **Time-Delayed Governance**: Admin changes require 1-day timelock

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Contract**: P2PSwap.sol
