---
title: "cancelOrder Function"
description: "Cancel P2P swap orders and reclaim locked tokens"
sidebar_position: 2
---

# cancelOrder

:::info[Signature Verification]
cancelOrder uses Core.sol's centralized signature verification via `validateAndConsumeNonce()` with `P2PSwapHashUtils.hashDataForCancelOrder()`. Includes dual-executor parameters.
:::

**Function Signature**:
```solidity
function cancelOrder(
    address user,
    address offeredToken,
    address requestedToken,
    uint256 orderId,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bytes calldata signature,
    uint256 priorityFeePay,
    uint256 noncePay,
    bytes calldata signaturePay
) external
```

Cancels an existing order and refunds the remaining `amountAvailable` of `offeredToken` to the order creator. Only the original order owner can cancel.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Order owner requesting cancellation |
| `offeredToken` | `address` | Token that was offered in the order |
| `requestedToken` | `address` | Token that was requested in the order |
| `orderId` | `uint256` | Order slot ID to cancel |
| `senderExecutor` | `address` | Restricts which address can execute this operation via msg.sender (address(0) = anyone can execute) |
| `originExecutor` | `address` | EOA that will initiate the transaction, verified via tx.origin (address(0) = anyone can initiate) |
| `nonce` | `uint256` | User's nonce for P2PSwap service operations |
| `signature` | `bytes` | User's authorization signature |
| `priorityFeePay` | `uint256` | Optional priority fee in MATE/principal token paid to the executor (0 if none) |
| `noncePay` | `uint256` | Nonce for Core payment transaction (for priority fee) |
| `signaturePay` | `bytes` | Signature for Core payment authorization (if priority fee > 0) |

## Signature Requirements

:::note[Operation Hash]
```solidity
bytes32 hashPayload = P2PSwapHashUtils.hashDataForCancelOrder(
    offeredToken,
    requestedToken,
    orderId
);
```
:::

**Signature Format**:
```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},true
```

Where:
- `evvmId`: Chain ID from `block.chainid`
- `senderExecutor`: Address that can execute via msg.sender
- `hashPayload`: Result from `P2PSwapHashUtils.hashDataForCancelOrder(...)`
- `originExecutor`: EOA that will initiate the transaction
- `nonce`: User's nonce for P2PSwap service
- `true`: Always async execution

**Payment Signature** (if priorityFeePay > 0): Separate MATE/principal token payment signature required.

## Execution Flow

### 1. Market & Order Lookup
```solidity
bytes32 marketId = getMarketId(offeredToken, requestedToken);
Structs.Order memory order = orders[marketId][orderId];

if (order.seller == address(0)) revert Error.OrderIsUnavailable();
if (order.seller != user) revert Error.NotTheSeller();
```

**Validates**:
- Order exists (seller != address(0))
- User owns the order (seller == user)

### 2. Centralized Verification
```solidity
core.validateAndConsumeNonce(
    user,
    senderExecutor,
    Hash.hashDataForCancelOrder(offeredToken, requestedToken, orderId),
    originExecutor,
    nonce,
    true,                      // Always async execution
    signature
);
```

**Validates**:
- Signature authenticity via EIP-191
- Nonce hasn't been consumed
- Hash matches cancellation parameters
- Executor restrictions (if specified)

### 3. Priority Fee Collection (Optional)
```solidity
if (priorityFeePay > 0)
    requestPay(
        user,
        core.getPrincipalTokenAddress(),
        0,                     // No principal payment
        priorityFeePay,
        originExecutor,
        noncePay,
        true,                  // Always async
        signaturePay
    );
```

**Action**: If priority fee specified, collects MATE/principal token from user for executor reward.

### 4. Refund OfferedToken
```solidity
makeCaPay(user, offeredToken, order.amountAvailable);
```

**Action**: Returns remaining `amountAvailable` of offeredToken from Core.sol to user.

### 5. Clear Order
```solidity
orders[marketId][orderId].seller = address(0);
orders[marketId][orderId].offeredAmount = 0;
orders[marketId][orderId].requestedAmount = 0;
orders[marketId][orderId].amountAvailable = 0;
marketInformation[marketId].ordersAvailable--;
```

**State Changes**:
- Order fields zeroed out (marks order as deleted)
- `marketInformation[marketId].ordersAvailable--` - Decremented
- Order slot becomes available for reuse

### 6. Update Market VWAP
```solidity
marketInformation[marketId].medianPrice = getVWAP(marketId);
```

### 7. Staker Rewards
```solidity
bool isStaker = core.isAddressStaker(msg.sender);

if (priorityFeePay > 0) {
    if (isStaker) {
        makeCaPay(msg.sender, core.getPrincipalTokenAddress(), priorityFeePay);
        collectFees(core.getPrincipalTokenAddress(), core.getRewardAmount());
    } else collectFees(core.getPrincipalTokenAddress(), priorityFeePay);
}

if (isStaker) _sendReward(msg.sender, 1);
```

**Rewards**:
- **Priority Fee**: MATE/principal token paid to staker executor (if > 0 and is staker)
- **Base Reward**: 1x MATE (core.getRewardAmount())
- **Requirement**: msg.sender must be registered staker

## Error Handling

### P2PSwap Errors
- `OrderIsUnavailable()` - Order doesn't exist (seller == address(0))
- `NotTheSeller()` - User is not the order owner

### Core.sol Errors
- `Core__InvalidSignature()` - Signature validation failed
- `Core__NonceAlreadyUsed()` - Nonce already consumed
- `Core__InvalidExecutor()` - Executor restrictions not met

## State Changes

**Order Cancelled**:
- `orders[marketId][orderId]` - All fields zeroed
- `marketInformation[marketId].ordersAvailable--` - Active count decreased
- `marketInformation[marketId].medianPrice` - VWAP recalculated

**Token Refunded**:
- User receives `amountAvailable` of offeredToken via `makeCaPay()`

**Slot Available**:
- Order ID becomes available for reuse in future makeOrder calls

## Use Cases

### User Initiated
- **Price Change**: Original exchange rate no longer favorable
- **Need Liquidity**: Urgent need for locked tokens
- **Market Shift**: Better opportunities elsewhere

### Strategic Cancellation
- **Update Terms**: Cancel and create new order with different parameters
- **Partial Fill Cleanup**: Cancel remaining portion if partial fills occurred

## Related Functions

- [makeOrder](./01-makeOrder.md) - Create new order after cancellation
- [dispatchOrder](./03-dispatchOrder.md) - Alternative: let order be filled
- [Getter Functions](../03-GetterFunctions.md) - Query order details before cancelling

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Staker Reward**: 1x MATE  
**Refund**: 100% of remaining amountAvailable
