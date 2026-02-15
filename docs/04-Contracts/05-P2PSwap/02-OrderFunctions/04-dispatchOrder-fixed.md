---
title: "dispatchOrder_fillFixedFee"
description: "Fill P2P swap orders with capped fees and 10% tolerance"
sidebar_position: 4
---

# dispatchOrder_fillFixedFee

:::info[Signature Verification]
dispatchOrder_fillFixedFee uses Core.sol's centralized verification via `validateAndConsumeNonce()` with `P2PSwapHashUtils.hashDataForDispatchOrder()`. Includes `originExecutor` parameter (EOA executor verified with tx.origin).
:::

**Function Signature**:
```solidity
function dispatchOrder_fillFixedFee(
    address user,
    MetadataDispatchOrder memory metadata,
    uint256 priorityFeeEvvm,
    uint256 nonceEvvm,
    bytes memory signatureEvvm,
    uint256 maxFillFixedFee
) external
```

Fills an existing order using a fixed/capped fee model with 10% tolerance. Fee = `min(proportionalFee, maxFillFixedFee)`, allowing buyers to pay anywhere in the range `[amountB + 90% fee, amountB + 100% fee]`.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Buyer address filling the order |
| `metadata` | `MetadataDispatchOrder` | Dispatch details including originExecutor, nonce, and signature |
| `priorityFeeEvvm` | `uint256` | Optional MATE priority fee for faster execution |
| `nonceEvvm` | `uint256` | Nonce for Core payment transaction (collects tokenB + fee) |
| `signatureEvvm` | `bytes` | Signature for Core payment authorization |
| `maxFillFixedFee` | `uint256` | Fee cap for this execution (default: 0.001 ETH) |

### MetadataDispatchOrder Structure

```solidity
struct MetadataDispatchOrder {
    address tokenA;                // Token buyer will receive
    address tokenB;                // Token buyer will pay
    uint256 orderId;               // Order ID to fill
    uint256 amountOfTokenBToFill;  // Amount to pay (flexible within tolerance)
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

### Calculation with Cap
```solidity
proportionalFee = (orderAmountB × percentageFee) / 10,000
fee = min(proportionalFee, maxFillFixedFee)

// Default cap: 0.001 ETH
// Example: 100 ETH order × 5% = 5 ETH, capped at 0.001 ETH
```

### 10% Tolerance Range
```solidity
fee10 = (fee × 1000) / 10,000  // 10% of fee
minRequired = amountB + fee - fee10
maxRequired = amountB + fee

// Buyer can pay anywhere in: [minRequired, maxRequired]
```

**Purpose**: 
- Protects buyers from excessive fees on large orders
- Allows UI flexibility (can display range)
- Avoids exact rounding issues

### Fee Calculation Based on Payment
```solidity
if (amountPaid >= minRequired && amountPaid < maxRequired) {
    finalFee = amountPaid - amountB  // Use actual amount paid
} else {
    finalFee = fee  // Full fee if paying maximum
}
```

### Distribution (Default: seller 50%, service 40%, staker 10%)

Same as proportional model but with capped fee:

| Recipient | Share | Purpose |
|-----------|-------|---------|
| **Seller** | 50% | amountB + (finalFee × 50%) |
| **Service Treasury** | 40% | finalFee × 40% (accumulated) |
| **MATE Stakers** | 10% | finalFee × 10% (distributed) |

**Example** (10 ETH order, 5% = 0.5 ETH but capped at 0.001 ETH):
- Buyer pays: 10.001 ETH or within [10.0009, 10.001]
- Fee used: 0.001 ETH
- Seller gets: 10 ETH (order) + 0.0005 ETH (50% of fee) = 10.0005 ETH
- Treasury: 0.0004 ETH (40% of fee)
- Stakers: 0.0001 ETH (10% of fee)

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

**Validation**: Market and order exist, order is active

### 3. Fee Calculation with Cap & Tolerance
```solidity
(uint256 fee, uint256 fee10) = calculateFillFixedFee(
    order.amountB,
    maxFillFixedFee
);

// Internal calculation:
// proportionalFee = (amountB * percentageFee) / 10_000
// if (proportionalFee > maxFillFixedFee) {
//     fee = maxFillFixedFee
//     fee10 = (fee * 1000) / 10_000
// } else {
//     fee = proportionalFee
//     fee10 = 0  // No tolerance if under cap
// }

uint256 minRequired = order.amountB + fee - fee10;
uint256 fullRequired = order.amountB + fee;

if (metadata.amountOfTokenBToFill < minRequired) {
    revert("Insuficient amountOfTokenBToFill");
}
```

**Tolerance Benefit**: Buyer can pay 90%-100% of fee, not forced to exact amount

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

### 5. Calculate Final Fee
```solidity
uint256 finalFee = _calculateFinalFee(
    metadata.amountOfTokenBToFill,
    order.amountB,
    fee,
    fee10
);

// Internal logic:
// if (amountPaid >= minRequired && amountPaid < fullRequired) {
//     finalFee = amountPaid - order.amountB
// } else {
//     finalFee = fee
// }
```

### 6. Overpayment Refund
```solidity
bool didRefund = _handleOverpaymentRefund(
    user,
    metadata.tokenB,
    metadata.amountOfTokenBToFill,
    fullRequired
);
```

**If overpaid beyond maxRequired**: Refunds excess via makeCaPay()

### 7. Fee Distribution
```solidity
_distributePayments(
    metadata.tokenB,
    order.amountB,
    finalFee,  // Uses calculated final fee
    order.seller,
    msg.sender,
    priorityFeeEvvm
);
```

**Distribution based on finalFee** (not original fee):
- Seller: amountB + (finalFee × 50%)
- Executor: priorityFee + (finalFee × 10%)
- Service: finalFee × 40%

### 8. Transfer TokenA to Buyer
```solidity
makeCaPay(user, metadata.tokenA, order.amountA);
```

**Action**: Releases tokenA to buyer

### 9. Staker Rewards
```solidity
_rewardExecutor(msg.sender, didRefund ? 5 : 4);
```

**Rewards** (MATE tokens):
- **4x**: Standard fill
- **5x**: Fill + handled refund

### 10. Clear Order
```solidity
_clearOrderAndUpdateMarket(market, metadata.orderId);
```

## Complete Usage Example

```solidity
// Scenario: Buy 1000 USDC for 20 ETH (large order)
// Proportional fee: 20 ETH × 5% = 1 ETH
// Capped fee: min(1 ETH, 0.001 ETH) = 0.001 ETH
// 10% tolerance: 0.0001 ETH
// Range: [20.0009 ETH, 20.001 ETH]

address buyer = 0x123...;
address usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address eth = 0x0000000000000000000000000000000000000000;
address executor = 0x456...;
uint256 orderId = 7;

// 1. Get nonce
uint256 nonce = core.getNonce(buyer, address(p2pSwap));

// 2. Generate hash (same as proportional!)
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
// User can choose to pay anywhere in [20.0009, 20.001]
MetadataDispatchOrder memory metadata = MetadataDispatchOrder({
    tokenA: usdc,
    tokenB: eth,
    orderId: orderId,
    amountOfTokenBToFill: 20.00095 ether,  // Within tolerance
    originExecutor: executor,
    nonce: nonce,
    signature: signature
});

// 5. Generate payment signature
uint256 nonceEvvm = core.getNonce(buyer, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    buyer,
    eth,
    20.00095 ether,
    0.5 ether,         // 0.5 MATE priority fee
    nonceEvvm,
    true
);

// 6. Execute dispatch with fee cap
p2pSwap.dispatchOrder_fillFixedFee(
    buyer,
    metadata,
    0.5 ether,         // Priority fee
    nonceEvvm,
    signatureEvvm,
    0.001 ether        // maxFillFixedFee cap
);

// Result:
// - Buyer pays: 20.00095 ETH
// - Buyer receives: 1000 USDC
// - finalFee calculated: 0.00095 ETH (actual paid - 20 ETH)
// - Seller receives: 20 ETH + 0.000475 ETH (50% of 0.00095) = 20.000475 ETH
// - Treasury: 0.00038 ETH (40% of 0.00095)
// - Stakers: 0.000095 ETH (10% of 0.00095)
// - Executor: 0.5 MATE (priority) + 4x MATE (reward)
```

## Gas Costs

| Scenario | Gas Cost | Notes |
|----------|----------|-------|
| **Standard Fill** | ~290,000 gas | Within tolerance |
| **With Refund** | ~330,000 gas | Overpayment beyond max |
| **Min Payment** | ~280,000 gas | 90% fee (minRequired) |
| **Max Payment** | ~300,000 gas | 100% fee (fullRequired) |

## Economic Model

### Buyer Benefits
- **Fee Protection**: Large orders capped at maxFillFixedFee
- **Flexibility**: Can pay 90%-100% of fee
- **Predictability**: Known maximum fee upfront

**Examples**:

| Order Size | 5% Fee | Capped At | Buyer Saves |
|------------|--------|-----------|-------------|
| 1 ETH | 0.05 ETH | 0.05 ETH | 0 (under cap) |
| 5 ETH | 0.25 ETH | 0.25 ETH | 0 (under cap) |
| 10 ETH | 0.5 ETH | 0.001 ETH | **0.499 ETH** |
| 100 ETH | 5 ETH | 0.001 ETH | **4.999 ETH** |

### Seller Impact
- Receives 50% of **actualFee**, not proportional fee
- Large orders = lower fee bonus
- Incentivizes smaller orders or higher base prices

### Staker Revenue
| Component | Amount | Condition |
|-----------|--------|-----------|
| **Priority Fee** | User-defined MATE | If > 0 |
| **Fee Share** | finalFee × 10% | Distributed to executor |
| **Base Reward** | 4-5x MATE | Standard execution |

**Profitability**: Better for small-medium orders. Large orders capped.

## Comparison: Proportional vs Fixed

| Aspect | Proportional | Fixed (Capped) |
|--------|--------------|----------------|
| **Fee Formula** | amountB × 5% | min(amountB × 5%, 0.001 ETH) |
| **Tolerance** | None | ±10% of fee |
| **Buyer Flexibility** | Must pay exact | Range accepted |
| **Large Orders** | Expensive | Protected by cap |
| **Seller Revenue** | Higher on large | Lower on large |
| **Best For** | Small-medium orders | Large orders |

## Error Handling

### Core.sol Errors
- `Core__InvalidSignature()` - Signature failed
- `Core__NonceAlreadyUsed()` - Nonce consumed
- `Core__InvalidExecutor()` - Executing EOA doesn't match originExecutor
- `Core__InsufficientBalance()` - Buyer lacks tokenB

### P2PSwap Errors
- `"Insuficient amountOfTokenBToFill"` - Payment < minRequired
- Internal validation failures for market/order

## Use Cases

### When to Use Fixed Fee
- **Large Orders**: 10+ ETH where 5% would be excessive
- **Predictable Costs**: Need to know max fee upfront
- **Price Sensitivity**: Buyers want fee protection
- **UI Ranges**: Display min-max payment options

### When to Use Proportional
- **Small Orders**: < 0.02 ETH where cap doesn't apply
- **Simplicity**: Exact fee calculation
- **Seller Incentive**: Higher fee bonus
- **Standard Trading**: Most common use case

## Related Functions

- [makeOrder](./01-makeOrder.md) - Create orders to be filled
- [cancelOrder](./02-cancelOrder.md) - Cancel before filling
- [dispatchOrder (Proportional)](./03-dispatchOrder-proportional.md) - Alternative without cap
- [Getter Functions](../03-GetterFunctions.md) - Query orders and calculate fees

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Gas Estimate**: 280k-330k gas  
**Staker Reward**: 4-5x MATE + capped fee share + priority  
**Fee Cap**: 0.001 ETH (default) with 10% tolerance
