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
    address tokenA,
    address tokenB,
    uint256 orderId,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bytes memory signature,
    uint256 priorityFeePay,
    uint256 noncePay,
    bytes memory signaturePay
) external
```

Cancels an existing order and refunds locked tokenA to the order creator. Only the original order owner can cancel.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Order owner requesting cancellation |
| `tokenA` | `address` | Token originally offered |
| `tokenB` | `address` | Token originally requested |
| `orderId` | `uint256` | Order ID to cancel |
| `senderExecutor` | `address` | Restricts which address can execute this operation via msg.sender (address(0) = anyone can execute) |
| `originExecutor` | `address` | EOA that will initiate the transaction, verified via tx.origin (address(0) = anyone can initiate) |
| `nonce` | `uint256` | User's nonce for P2PSwap service operations |
| `signature` | `bytes` | User's authorization signature |
| `priorityFeePay` | `uint256` | Optional MATE priority fee for faster execution |
| `noncePay` | `uint256` | Nonce for Core payment transaction (for priority fee) |
| `signaturePay` | `bytes` | Signature for Core payment authorization (if priority fee > 0) |

## Signature Requirements

:::note[Operation Hash]
```solidity
bytes32 hashPayload = P2PSwapHashUtils.hashDataForCancelOrder(
    tokenA,
    tokenB,
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

**Payment Signature** (if priorityFeePay > 0): Separate MATE payment signature required.

## Execution Flow

### 1. Centralized Verification
```solidity
core.validateAndConsumeNonce(
    user,
    senderExecutor,
    P2PSwapHashUtils.hashDataForCancelOrder(
        tokenA,
        tokenB,
        orderId
    ),
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

**On Failure**:
- `Core__InvalidSignature()` - Invalid or mismatched signature
- `Core__NonceAlreadyUsed()` - Nonce already consumed
- `Core__InvalidExecutor()` - Executor restrictions not met

### 2. Market & Order Lookup
```solidity
uint256 market = findMarket(tokenA, tokenB);

_validateOrderOwnership(market, orderId, user);
```

**Validation**:
- Market exists (market != 0)
- Order exists (seller != address(0))
- User owns the order (seller == user)

**On Failure**:
- `"Invalid order"` - Order doesn't exist or user not owner

### 3. Priority Fee Collection (Optional)
```solidity
if (priorityFeePay > 0) {
    requestPay(
        user,
        MATE_TOKEN_ADDRESS,
        0,                     // No principal payment
        priorityFeePay,
        originExecutor,
        noncePay,
        true,                  // Always async
        signaturePay
    );
}
```

**Action**: If priority fee specified, collects MATE from user for executor reward.

:::note[Service Payment Accountability]
P2PSwap sets `senderExecutor = address(this)` when calling `requestPay()`, ensuring the payment is attributed to the P2PSwap service.
:::

### 4. Refund TokenA
```solidity
makeCaPay(
    user,
    tokenA,
    ordersInsideMarket[market][orderId].amountA
);
```

**Action**: Returns original locked tokenA amount from Core.sol to user.

### 5. Clear Order
```solidity
_clearOrderAndUpdateMarket(market, orderId);
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
