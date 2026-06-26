---
title: "dispatchOrder Function"
description: "Fill P2P swap orders with proportional fee model (partial or full fill)"
sidebar_position: 3
---

# dispatchOrder

:::info[Signature Verification]
dispatchOrder uses Core.sol's centralized verification via `validateAndConsumeNonce()` with `P2PSwapHashUtils.hashDataForDispatchOrder()`. Includes dual-executor parameters.
:::

**Function Signature**:
```solidity
function dispatchOrder(
    address user,
    address offeredToken,
    address requestedToken,
    uint256 orderId,
    uint256 amountOut,
    uint256 amountInMax,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bytes calldata signature,
    uint256 priorityFeePay,
    uint256 noncePay,
    bytes calldata signaturePay
) external
```

Fills an existing order partially or fully. Buyer receives `amountOut` of `offeredToken`. Payment is proportional to the order price. The fee is split according to `basisPointsForReward.current` (default: seller 50%, service 40%, executor 10%).

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Buyer address filling the order |
| `offeredToken` | `address` | Token the seller is offering (what the buyer receives) |
| `requestedToken` | `address` | Token the seller wants in return (what the buyer pays) |
| `orderId` | `uint256` | Order slot ID to fill |
| `amountOut` | `uint256` | Amount of offeredToken the buyer wants to receive |
| `amountInMax` | `uint256` | Maximum amount of requestedToken the buyer is willing to pay, including fee |
| `senderExecutor` | `address` | Restricts which address can execute this operation via msg.sender (address(0) = anyone can execute) |
| `originExecutor` | `address` | EOA that will initiate the transaction, verified via tx.origin (address(0) = anyone can initiate) |
| `nonce` | `uint256` | User's nonce for P2PSwap service operations |
| `signature` | `bytes` | User's authorization signature |
| `priorityFeePay` | `uint256` | Priority fee in requestedToken paid to the executor |
| `noncePay` | `uint256` | Nonce for Core payment transaction (collects requestedToken + fee) |
| `signaturePay` | `bytes` | Signature for Core payment authorization |

## Signature Requirements

:::note[Operation Hash]
```solidity
bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
    offeredToken,
    requestedToken,
    orderId,
    amountOut,
    amountInMax
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
- `hashPayload`: Result from `P2PSwapHashUtils.hashDataForDispatchOrder(...)`
- `originExecutor`: EOA that will initiate the transaction
- `nonce`: User's nonce for P2PSwap service
- `true`: Always async execution

**Payment Signature**: Separate signature required for paying requestedToken + fee via `requestPay()`.

## Fee Model

### Calculation
```solidity
netPaymentAmount = (amountOut * requestedAmount) / offeredAmount
fee = (netPaymentAmount * percentageFee) / 10_000

// Default: percentageFee = 500 (5%)
// Example: order offers 1000 USDC for 0.5 ETH, buyer wants 500 USDC
// netPaymentAmount = (500 * 0.5) / 1000 = 0.25 ETH
// fee = 0.25 * 500 / 10000 = 0.0125 ETH
// totalPayment = 0.25 + 0.0125 = 0.2625 ETH
```

### Distribution (Default: seller 50%, service 40%, staker 10%)

| Recipient | Share | Purpose |
|-----------|-------|---------|
| **Seller** | 50% | netPaymentAmount + (fee x 50%) |
| **Service Treasury** | 40% | fee x 40% (accumulated) |
| **MATE Stakers** | 10% | fee x 10% (distributed) |

**Example** (order: 1000 USDC for 0.5 ETH, buyer wants 500 USDC):
- Net payment: 0.25 ETH
- Fee: 0.0125 ETH (5%)
- Seller gets: 0.25 + 0.00625 = 0.25625 ETH
- Treasury: 0.005 ETH (40% of fee)
- Executor: 0.00125 ETH (10% of fee) + priority fee

## Execution Flow

### 1. Input Validation
```solidity
if (amountOut == 0) revert Error.ZeroAmount();
if (amountInMax == 0) revert Error.ZeroAmount();
if (order.seller == address(0)) revert Error.OrderIsUnavailable();
if (order.amountAvailable < amountOut) revert Error.InsufficientAmountToFill();
```

### 2. Centralized Verification
```solidity
core.validateAndConsumeNonce(
    user,
    senderExecutor,
    Hash.hashDataForDispatchOrder(
        offeredToken,
        requestedToken,
        orderId,
        amountOut,
        amountInMax
    ),
    originExecutor,
    nonce,
    true,                          // Always async execution
    signature
);
```

**Validates**:
- Signature authenticity via EIP-191
- Nonce hasn't been consumed
- Executor restrictions (if specified)

### 3. Fee Calculation & Validation
```solidity
uint256 netPaymentAmount = getNetPaymentAmount(
    amountOut,
    order.offeredAmount,
    order.requestedAmount
);

if (netPaymentAmount == 0) revert Error.InsufficientPayment();

uint256 fee = getFeePaymentAmount(netPaymentAmount);
uint256 totalPayment = netPaymentAmount + fee;

if (totalPayment > amountInMax) revert Error.InsufficientPayment();
```

**Required**: Buyer must provide at least `netPaymentAmount + fee` (within `amountInMax`).

### 4. Collect Payment
```solidity
requestPay(
    user,
    requestedToken,
    amountInMax,
    priorityFeePay,
    originExecutor,
    noncePay,
    true,                          // Always async
    signaturePay
);
```

**Action**: Transfers `amountInMax` of requestedToken from buyer to Core.sol.

### 5. Update Order
```solidity
orders[market][orderId].amountAvailable -= amountOut;
marketInformation[market].medianPrice = getVWAP(market);
```

### 6. Fee Distribution
```solidity
uint256 sellerAmount = netPaymentAmount +
    applyBasisPoints(fee, basisPointsForReward.current.seller);
uint256 executorAmount = priorityFeePay +
    applyBasisPoints(fee, basisPointsForReward.current.mateStaker);

collectFees(
    requestedToken,
    applyBasisPoints(fee, basisPointsForReward.current.service)
);

CoreStructs.DisperseCaPayMetadata[] memory toData = new CoreStructs.DisperseCaPayMetadata[](2);
toData[0] = CoreStructs.DisperseCaPayMetadata(sellerAmount, order.seller);
toData[1] = CoreStructs.DisperseCaPayMetadata(executorAmount, msg.sender);
makeDisperseCaPay(toData, requestedToken, sellerAmount + executorAmount);
```

**Distribution**:
- Seller: netPaymentAmount + (fee x 50%)
- Executor: priorityFeePay + (fee x 10%)
- Service: fee x 40% (accumulated via `collectFees()`)

### 7. Overpayment Refund
```solidity
if (amountInMax > totalPayment)
    makeCaPay(user, requestedToken, amountInMax - totalPayment);
```

**If overpaid**: Refunds `amountInMax - totalPayment` via `makeCaPay()`

### 8. Transfer OfferedToken to Buyer
```solidity
makeCaPay(user, offeredToken, amountOut);
```

**Action**: Releases `amountOut` of offeredToken from Core.sol to buyer.

### 9. Clear Order (if fully filled)
```solidity
if (orders[market][orderId].amountAvailable == 0) {
    orders[market][orderId].seller = address(0);
    orders[market][orderId].offeredAmount = 0;
    orders[market][orderId].requestedAmount = 0;
    marketInformation[market].ordersAvailable--;
}
```

**State Changes** (if fully filled):
- Order deleted (seller = address(0))
- Market ordersAvailable decremented

### 10. Staker Rewards
```solidity
if (core.isAddressStaker(msg.sender)) _sendReward(msg.sender, 2);
```

**Rewards** (MATE tokens):
- **2x**: Standard fill (core.getRewardAmount() x 2)
- **Requirement**: msg.sender must be registered staker

## Error Handling

### P2PSwap Errors
- `ZeroAmount()` - amountOut or amountInMax is zero
- `OrderIsUnavailable()` - Order doesn't exist (seller == address(0))
- `InsufficientAmountToFill()` - amountOut > amountAvailable in the order
- `InsufficientPayment()` - netPayment is zero or totalPayment > amountInMax

### Core.sol Errors
- `Core__InvalidSignature()` - Signature failed
- `Core__NonceAlreadyUsed()` - Nonce consumed
- `Core__InvalidExecutor()` - Executor restrictions not met

## Economic Model

### Buyer Costs
- **Net Payment**: Proportional to order price (amountOut * requestedAmount / offeredAmount)
- **Protocol Fee**: netPayment x 5% (default)
- **Total**: netPayment x 1.05

### Seller Revenue
- **Base**: netPayment (proportional to fill amount)
- **Fee Bonus**: fee x 50% (liquidity provider reward)

### Staker Revenue
| Component | Amount | Condition |
|-----------|--------|-----------|
| **Priority Fee** | User-defined requestedToken | If > 0 |
| **Fee Share** | fee x 10% | Distributed to executor |
| **Base Reward** | 2x MATE | Standard execution |

## Use Cases

### Partial Fill
Buyer receives only a portion of the order's offeredToken. The order remains active with reduced `amountAvailable`.

### Full Fill
Buyer receives all remaining offeredToken. The order slot is freed and becomes available for reuse.

## Related Functions

- [makeOrder](./01-makeOrder.md) - Create orders to be filled
- [cancelOrder](./02-cancelOrder.md) - Cancel before filling
- [Getter Functions](../03-GetterFunctions.md) - Query available orders

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Staker Reward**: 2x MATE + fee share + priority  
**Fee**: 5% proportional (default)
