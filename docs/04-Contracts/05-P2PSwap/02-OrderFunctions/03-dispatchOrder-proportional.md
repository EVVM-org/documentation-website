---
title: "dispatchOrder_fillPropotionalFee"
description: "Fill P2P swap orders with percentage-based fees (5% default)"
sidebar_position: 3
---

# dispatchOrder_fillPropotionalFee

:::info[Signature Verification]
dispatchOrder_fillPropotionalFee uses Core.sol's centralized verification via `validateAndConsumeNonce()` with `P2PSwapHashUtils.hashDataForDispatchOrder()`. Includes `originExecutor` parameter.
:::

**Function Signature**:
```solidity
function dispatchOrder_fillPropotionalFee(
    address user,
    MetadataDispatchOrder memory metadata,
    uint256 priorityFeeEvvm,
    uint256 nonceEvvm,
    bytes memory signatureEvvm
) external
```

Fills an existing order using a proportional fee model where fee = `(amountB × percentageFee) / 10,000`. Transfers tokenA to buyer, pays seller with tokenB + fee share, distributes remaining fees.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Buyer address filling the order |
| `metadata` | `MetadataDispatchOrder` | Dispatch details including originExecutor, nonce, and signature |
| `priorityFeeEvvm` | `uint256` | Optional MATE priority fee for faster execution |
| `nonceEvvm` | `uint256` | Nonce for Core payment transaction (collects tokenB + fee) |
| `signatureEvvm` | `bytes` | Signature for Core payment authorization |

### MetadataDispatchOrder Structure

```solidity
struct MetadataDispatchOrder {
    address tokenA;                // Token buyer will receive
    address tokenB;                // Token buyer will pay
    uint256 orderId;               // Order ID to fill
    uint256 amountOfTokenBToFill;  // Amount to pay (must be >= amountB + fee)
    address originExecutor;        // EOA that will execute (verified with tx.origin)
    uint256 nonce;                 // Core nonce for P2PSwap service
    bytes signature;               // User's authorization signature
}
```

## Signature Requirements

:::note[Operation Hash]
```solidity
bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
    metadata.tokenA,
    metadata.tokenB,
    metadata.orderId
);
```

**Note**: Both proportional and fixed fee variants use the **same hash function**.
:::

**Signature Format**:
```
{evvmId},{p2pSwapAddress},{hashPayload},{originExecutor},{nonce},true
```

**Payment Signature**: Separate signature required for paying tokenB + fee via Core.pay().

## Fee Model

### Calculation
```solidity
fee = (orderAmountB × percentageFee) / 10,000

// Default: percentageFee = 500 (5%)
// Example: 100 USDC order → 5 USDC fee
```

### Distribution (Default: seller 50%, service 40%, staker 10%)

| Recipient | Share | Purpose |
|-----------|-------|---------|
| **Seller** | 50% | amountB + (fee × 50%) |
| **Service Treasury** | 40% | fee × 40% (accumulated) |
| **MATE Stakers** | 10% | fee × 10% (distributed) |

**Total to Buyer**: Must pay `amountB + fee`  
**Seller Receives**: `amountB + (fee × 50%)`  
**Example** (100 USDC order, 5 USDC fee):
- Buyer pays: 105 USDC
- Seller gets: 100 USDC (order) + 2.5 USDC (50% of fee) = 102.5 USDC
- Treasury: 2 USDC (40% of fee)
- Stakers: 0.5 USDC (10% of fee)

## Execution Flow

### 1. Centralized Verification
```solidity
core.validateAndConsumeNonce(
    user,
    P2PSwapHashUtils.hashDataForDispatchOrder(
        metadata.tokenA,
        metadata.tokenB,
        metadata.orderId
    ),
    metadata.originExecutor,
    metadata.nonce,
    true,                          // Always async execution
    metadata.signature
);
```

**Validates**:
- Signature authenticity via EIP-191
- Nonce hasn't been consumed
- Executor is the specified EOA (via `tx.origin`)

**On Failure**:
- `Core__InvalidSignature()` - Invalid signature
- `Core__NonceAlreadyUsed()` - Nonce consumed
- `Core__InvalidExecutor()` - Executing EOA doesn't match originExecutor

### 2. Market & Order Lookup
```solidity
uint256 market = findMarket(metadata.tokenA, metadata.tokenB);

Order storage order = _validateMarketAndOrder(market, metadata.orderId);
```

**Validation**:
- Market exists
- Order exists (seller != address(0))
- Order is active

**On Failure**: Internal revert if invalid

### 3. Fee Calculation & Validation
```solidity
uint256 fee = calculateFillPropotionalFee(order.amountB);
// fee = (order.amountB * percentageFee) / 10_000

uint256 requiredAmount = order.amountB + fee;

if (metadata.amountOfTokenBToFill < requiredAmount) {
    revert("Insuficient amountOfTokenToFill");
}
```

**Required**: Buyer must provide at least `amountB + fee`

### 4. Collect Payment
```solidity
requestPay(
    user,
    metadata.tokenB,
    metadata.amountOfTokenBToFill,
    priorityFeeEvvm,
    nonceEvvm,
    true,                          // Always async
    signatureEvvm
);
```

**Action**: Transfers `amountOfTokenBToFill` from buyer to Core.sol

### 5. Overpayment Refund
```solidity
bool didRefund = _handleOverpaymentRefund(
    user,
    metadata.tokenB,
    metadata.amountOfTokenBToFill,
    requiredAmount
);
```

**If overpaid**: Refunds `amountOfTokenBToFill - requiredAmount` via makeCaPay()  
**Benefit**: Allows UI flexibility, user won't lose excess

### 6. Fee Distribution
```solidity
_distributePayments(
    metadata.tokenB,
    order.amountB,
    fee,
    order.seller,
    msg.sender,
    priorityFeeEvvm
);
```

**Internal Distribution**:
```solidity
// Calculate portions
uint256 sellerFee = (fee × rewardPercentage.seller) / 10000;
uint256 serviceFee = (fee × rewardPercentage.service) / 10000;
uint256 stakerFee = (fee × rewardPercentage.mateStaker) / 10000;

// Seller payment
makeDisperseCaPay([{
    recipient: seller,
    token: tokenB,
    amount: amountB + sellerFee
}, {
    recipient: executor,
    token: MATE,
    amount: priorityFee + stakerFee
}]);

// Service treasury (accumulated)
balancesOfContract[tokenB] += serviceFee;
```

### 7. Transfer TokenA to Buyer
```solidity
makeCaPay(user, metadata.tokenA, order.amountA);
```

**Action**: Releases original locked tokenA from seller to buyer

### 8. Staker Rewards
```solidity
_rewardExecutor(msg.sender, didRefund ? 5 : 4);
```

**Rewards** (MATE tokens):
- **4x**: Standard fill
- **5x**: Fill + handled refund correctly

### 9. Clear Order
```solidity
_clearOrderAndUpdateMarket(market, metadata.orderId);
```

**State Changes**:
- Order deleted (seller = address(0))
- Market ordersAvailable decremented

## Complete Usage Example

```solidity
// Scenario: Buy 1000 USDC for 0.5 ETH (with 5% fee)
address buyer = 0x123...;
address usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address eth = 0x0000000000000000000000000000000000000000;
address executor = 0x456...;
uint256 orderId = 7;

// Order details: seller offers 1000 USDC, wants 0.5 ETH
// Fee: 0.5 ETH × 5% = 0.025 ETH
// Required: 0.5 + 0.025 = 0.525 ETH

// 1. Get nonce
uint256 nonce = core.getNonce(buyer, address(p2pSwap));

// 2. Generate hash
bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
    usdc,
    eth,
    orderId
);

// 3. Create signature
string memory message = string.concat(
    Strings.toString(block.chainid), ",",
    Strings.toHexString(address(p2pSwap)), ",",
    Strings.toHexString(uint256(hashPayload)), ",",
    Strings.toHexString(executor), ",",
    Strings.toString(nonce), ",true"
);
bytes memory signature = signMessage(message, buyerPrivateKey);

// 4. Create metadata
MetadataDispatchOrder memory metadata = MetadataDispatchOrder({
    tokenA: usdc,
    tokenB: eth,
    orderId: orderId,
    amountOfTokenBToFill: 0.525 ether,  // 0.5 + 0.025 fee
    originExecutor: executor,
    nonce: nonce,
    signature: signature
});

// 5. Generate payment signature
uint256 nonceEvvm = core.getNonce(buyer, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    buyer,
    eth,
    0.525 ether,
    0.5 ether,         // 0.5 MATE priority fee
    nonceEvvm,
    true
);

// 6. Execute dispatch
p2pSwap.dispatchOrder_fillPropotionalFee(
    buyer,
    metadata,
    0.5 ether,         // Priority fee
    nonceEvvm,
    signatureEvvm
);

// Result:
// - Buyer pays: 0.525 ETH
// - Buyer receives: 1000 USDC
// - Seller receives: 0.5 ETH (order) + 0.0125 ETH (50% fee) = 0.5125 ETH
// - Treasury accumulates: 0.01 ETH (40% fee)
// - Stakers share: 0.0025 ETH (10% fee)
// - Executor receives: 0.5 MATE (priority) + 4-5x MATE (reward)
```

## Gas Costs

| Scenario | Gas Cost | Notes |
|----------|----------|-------|
| **Standard Fill** | ~280,000 gas | No overpayment |
| **With Refund** | ~320,000 gas | Overpayment handled |
| **With Priority** | ~300,000 gas | Includes MATE distribution |

## Economic Model

### Buyer Costs
- **Order Amount**: amountB (what seller requested)
- **Protocol Fee**: amountB × 5% (default)
- **Total**: amountB × 1.05

### Seller Revenue
- **Base**: amountB (100% of requested amount)
- **Fee Bonus**: fee × 50% (liquidity provider reward)
- **Total**: amountB × 1.025

### Staker Revenue
| Component | Amount | Condition |
|-----------|--------|-----------|
| **Priority Fee** | User-defined MATE | If > 0 |
| **Fee Share** | fee × 10% | Distributed to executor |
| **Base Reward** | 4-5x MATE | Standard execution |

**Example Profitability** (100 USDC order, 5% fee):
- Executor receives: ~0.5 USDC (10% of 5 USDC) + priority + 4x MATE
- **Very profitable for large orders**

## Error Handling

### Core.sol Errors
- `Core__InvalidSignature()` - Signature failed
- `Core__NonceAlreadyUsed()` - Nonce consumed
- `Core__InvalidExecutor()` - Wrong executor
- `Core__InsufficientBalance()` - Buyer lacks tokenB

### P2PSwap Errors
- `"Insuficient amountOfTokenToFill"` - Payment < required amount
- Internal validation failures for market/order

## Related Functions

- [makeOrder](./01-makeOrder.md) - Create orders to be filled
- [cancelOrder](./02-cancelOrder.md) - Cancel before filling
- [dispatchOrder (Fixed)](./04-dispatchOrder-fixed.md) - Alternative with capped fees
- [Getter Functions](../03-GetterFunctions.md) - Query available orders

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Gas Estimate**: 280k-320k gas  
**Staker Reward**: 4-5x MATE + fee share + priority  
**Fee**: 5% proportional (default)
