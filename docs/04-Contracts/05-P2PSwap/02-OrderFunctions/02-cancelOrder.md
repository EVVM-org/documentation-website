---
title: "cancelOrder Function"
description: "Cancel P2P swap orders and reclaim locked tokens"
sidebar_position: 2
---

# cancelOrder

:::info[Signature Verification]
cancelOrder uses Core.sol's centralized signature verification via `validateAndConsumeNonce()` with `P2PSwapHashUtils.hashDataForCancelOrder()`. Includes `originExecutor` parameter.
:::

**Function Signature**:
```solidity
function cancelOrder(
    address user,
    MetadataCancelOrder memory metadata,
    uint256 priorityFeeEvvm,
    uint256 nonceEvvm,
    bytes memory signatureEvvm
) external
```

Cancels an existing order and refunds locked tokenA to the order creator. Only the original order owner can cancel.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Order owner requesting cancellation |
| `metadata` | `MetadataCancelOrder` | Cancellation details including originExecutor, nonce, and signature |
| `priorityFeeEvvm` | `uint256` | Optional MATE priority fee for faster execution |
| `nonceEvvm` | `uint256` | Nonce for Core payment transaction (for priority fee) |
| `signatureEvvm` | `bytes` | Signature for Core payment authorization (if priority fee > 0) |

### MetadataCancelOrder Structure

```solidity
struct MetadataCancelOrder {
    address tokenA;           // Token originally offered
    address tokenB;           // Token originally requested
    uint256 orderId;          // Order ID to cancel
    address originExecutor;   // EOA that will execute (verified with tx.origin)
    uint256 nonce;            // Core nonce for P2PSwap service
    bytes signature;          // User's authorization signature
}
```

## Signature Requirements

:::note[Operation Hash]
```solidity
bytes32 hashPayload = P2PSwapHashUtils.hashDataForCancelOrder(
    metadata.tokenA,
    metadata.tokenB,
    metadata.orderId
);
```
:::

**Signature Format**:
```
{evvmId},{p2pSwapAddress},{hashPayload},{originExecutor},{nonce},true
```

**Payment Signature** (if priorityFeeEvvm > 0): Separate MATE payment signature required.

## Execution Flow

### 1. Centralized Verification
```solidity
core.validateAndConsumeNonce(
    user,
    P2PSwapHashUtils.hashDataForCancelOrder(
        metadata.tokenA,
        metadata.tokenB,
        metadata.orderId
    ),
    metadata.originExecutor,
    metadata.nonce,
    true,                      // Always async execution
    metadata.signature
);
```

**Validates**:
- Signature authenticity via EIP-191
- Nonce hasn't been consumed
- Hash matches cancellation parameters
- Executor is the specified EOA (via `tx.origin`)

**On Failure**:
- `Core__InvalidSignature()` - Invalid or mismatched signature
- `Core__NonceAlreadyUsed()` - Nonce already consumed
- `Core__InvalidExecutor()` - Executing EOA doesn't match originExecutor

### 2. Market & Order Lookup
```solidity
uint256 market = findMarket(metadata.tokenA, metadata.tokenB);

_validateOrderOwnership(market, metadata.orderId, user);
```

**Validation**:
- Market exists (market != 0)
- Order exists (seller != address(0))
- User owns the order (seller == user)

**On Failure**:
- `"Invalid order"` - Order doesn't exist or user not owner

### 3. Priority Fee Collection (Optional)
```solidity
if (priorityFeeEvvm > 0) {
    requestPay(
        user,
        MATE_TOKEN_ADDRESS,
        0,                     // No principal payment
        priorityFeeEvvm,
        nonceEvvm,
        true,                  // Always async
        signatureEvvm
    );
}
```

**Action**: If priority fee specified, collects MATE from user for executor reward.

### 4. Refund TokenA
```solidity
makeCaPay(
    user,
    metadata.tokenA,
    ordersInsideMarket[market][metadata.orderId].amountA
);
```

**Action**: Returns original locked tokenA amount from Core.sol to user.

### 5. Clear Order
```solidity
_clearOrderAndUpdateMarket(market, metadata.orderId);
```

**State Changes**:
- `ordersInsideMarket[market][orderId].seller = address(0)` - Marks order as deleted
- `marketMetadata[market].ordersAvailable--` - Decrements active order count
- Order slot becomes available for reuse

### 6. Staker Rewards
```solidity
if (core.isAddressStaker(msg.sender) && priorityFeeEvvm > 0) {
    makeCaPay(msg.sender, MATE_TOKEN_ADDRESS, priorityFeeEvvm);
}

_rewardExecutor(msg.sender, priorityFeeEvvm > 0 ? 3 : 2);
```

**Rewards**:
- **Priority Fee**: MATE tokens (if > 0)
- **Base Reward**: 2x MATE (no priority) or 3x MATE (with priority)
- **Requirement**: msg.sender must be registered staker

## Complete Usage Example

```solidity
// Scenario: Cancel order #5 in USDC/ETH market
address user = 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0;
address usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address eth = 0x0000000000000000000000000000000000000000;
address executor = 0x123...;  // Authorized executor

// 1. Get current nonce
uint256 nonce = core.getNonce(user, address(p2pSwap));

// 2. Generate hash for signature
bytes32 hashPayload = P2PSwapHashUtils.hashDataForCancelOrder(
    usdc,
    eth,
    5  // orderId
);

// 3. Create signature message
string memory message = string.concat(
    Strings.toString(block.chainid), ",",
    Strings.toHexString(address(p2pSwap)), ",",
    Strings.toHexString(uint256(hashPayload)), ",",
    Strings.toHexString(executor), ",",
    Strings.toString(nonce), ",true"
);

// 4. User signs with EIP-191
bytes memory signature = signMessage(message, userPrivateKey);

// 5. Create metadata struct
MetadataCancelOrder memory metadata = MetadataCancelOrder({
    tokenA: usdc,
    tokenB: eth,
    orderId: 5,
    originExecutor: executor,
    nonce: nonce,
    signature: signature
});

// 6. Generate payment signature for priority fee (optional)
uint256 priorityFee = 2 ether;  // 2 MATE
uint256 nonceEvvm = core.getNonce(user, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    user,
    MATE_TOKEN_ADDRESS,
    0,                  // No principal
    priorityFee,
    nonceEvvm,
    true
);

// 7. Execute cancelOrder
p2pSwap.cancelOrder(
    user,
    metadata,
    priorityFee,
    nonceEvvm,
    signatureEvvm
);

// Result:
// - Original locked USDC refunded to user
// - Order #5 marked as deleted
// - Market ordersAvailable decremented
// - Staker executor receives 2 MATE (priority) + 3x MATE (reward)
```

## Gas Costs

Estimated gas consumption:

| Scenario | Gas Cost | Notes |
|----------|----------|-------|
| **No Priority Fee** | ~140,000 gas | Basic cancellation + refund |
| **With Priority Fee** | ~180,000 gas | Includes MATE payment processing |
| **First Market Cancellation** | ~150,000 gas | Additional storage updates |

**Variable Factors**:
- Token type (ERC20 vs ETH)
- Priority fee (adds payment processing)
- Market state (first vs subsequent cancellations)

## Economic Model

### User Costs
- **Cancellation Fee**: None (only gas)
- **Priority Fee**: Optional MATE payment for faster execution
- **Refund**: Full tokenA amount returned

### User Benefits
- ✅ 100% refund of locked tokens
- ✅ No cancellation penalty
- ✅ Immediate token availability

### Staker Revenue
| Component | Amount | Condition |
|-----------|--------|-----------|
| **Priority Fee** | User-defined MATE | If priorityFeeEvvm > 0 |
| **Base Reward** | 2x MATE | No priority fee |
| **Enhanced Reward** | 3x MATE | With priority fee |

**Profitability**: cancelOrder is moderately profitable for stakers with priority fees.

## Error Handling

### Core.sol Errors
- `Core__InvalidSignature()` - Signature validation failed
- `Core__NonceAlreadyUsed()` - Nonce already consumed
- `Core__InvalidExecutor()` - Unauthorized executor attempting execution

### P2PSwap Errors
- `"Invalid order"` - Order doesn't exist, wrong user, or already cancelled
- Market not found (internal validation)

## State Changes

**Order Cancelled**:
- `ordersInsideMarket[market][orderId].seller = address(0)` - Order deleted
- `marketMetadata[market].ordersAvailable--` - Active count decreased

**Token Refunded**:
- User's tokenA balance in Core.sol increased by original amountA

**Slot Available**:
- Order ID becomes available for reuse in future makeOrder calls

## Use Cases

### User Initiated
- **Price Change**: Original exchange rate no longer favorable
- **Need Liquidity**: Urgent need for locked tokens
- **Market Shift**: Better opportunities elsewhere

### Strategic Cancellation
- **Before Expiry**: Cancel before market conditions worsen
- **Partial Fill**: Cancel if only partial fills acceptable
- **Update Terms**: Cancel and create new order with different parameters

## Related Functions

- [makeOrder](./01-makeOrder.md) - Create new order after cancellation
- [dispatchOrder (Proportional)](./03-dispatchOrder-proportional.md) - Alternative: let order be filled
- [dispatchOrder (Fixed)](./04-dispatchOrder-fixed.md) - Alternative: let order be filled
- [Getter Functions](../03-GetterFunctions.md) - Query order details before cancelling

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Gas Estimate**: 140k-180k gas  
**Staker Reward**: 2-3x MATE  
**Refund**: 100% tokenA
