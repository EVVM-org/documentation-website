---
title: "makeOrder Function"
description: "Create P2P swap orders offering one token in exchange for another"
sidebar_position: 1
---

# makeOrder

:::info[Signature Verification]
makeOrder uses Core.sol's centralized signature verification via `validateAndConsumeNonce()` with `P2PSwapHashUtils.hashDataForMakeOrder()`. Includes dual-executor parameters.
:::

**Function Signature**:
```solidity
function makeOrder(
    address user,
    address offeredToken,
    address requestedToken,
    uint256 offeredAmount,
    uint256 requestedAmount,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bytes calldata signature,
    uint256 priorityFeePay,
    uint256 noncePay,
    bytes calldata signaturePay
) external
```

Creates a new token swap order in the P2P marketplace, locking `offeredAmount` of `offeredToken` from `user` into Core.sol and opening an order slot for future fulfillment.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Order creator whose tokens will be locked |
| `offeredToken` | `address` | Token the seller is offering |
| `requestedToken` | `address` | Token the seller wants in return |
| `offeredAmount` | `uint256` | Total amount of offeredToken being offered |
| `requestedAmount` | `uint256` | Total amount of requestedToken expected for the full offer |
| `senderExecutor` | `address` | Restricts which address can execute this operation via msg.sender (address(0) = anyone can execute) |
| `originExecutor` | `address` | EOA that will initiate the transaction, verified via tx.origin (address(0) = anyone can initiate) |
| `nonce` | `uint256` | User's nonce for P2PSwap service operations |
| `signature` | `bytes` | EIP-191 signature from `user` for operation authorization |
| `priorityFeePay` | `uint256` | Optional priority fee in offeredToken paid to the executor (0 if none) |
| `noncePay` | `uint256` | Nonce for Core payment transaction (locks offeredToken) |
| `signaturePay` | `bytes` | Signature for Core payment authorization |

## Signature Requirements

:::note[Operation Hash]
```solidity
bytes32 hashPayload = P2PSwapHashUtils.hashDataForMakeOrder(
    offeredToken,
    requestedToken,
    offeredAmount,
    requestedAmount
);
```
:::

**Signature Format**:
```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},true
```

Where:
- `evvmId`: Chain ID from `block.chainid`
- `senderExecutor`: Address that can execute via msg.sender (often address(0) for flexibility)
- `hashPayload`: Result from `P2PSwapHashUtils.hashDataForMakeOrder(...)`
- `originExecutor`: EOA that will initiate the transaction (often address(0) for flexibility)
- `nonce`: User's nonce for P2PSwap service
- `true`: Always async execution

**Payment Signature**: Separate signature required for locking offeredToken via `requestPay()`.

## Execution Flow

### 1. Input Validation
```solidity
if (offeredAmount == 0) revert Error.ZeroAmount();
if (requestedAmount == 0) revert Error.ZeroAmount();
if (offeredToken == requestedToken) revert Error.SameTokenPair();
```

### 2. Centralized Verification
```solidity
core.validateAndConsumeNonce(
    user,
    senderExecutor,
    Hash.hashDataForMakeOrder(
        offeredToken,
        requestedToken,
        offeredAmount,
        requestedAmount
    ),
    originExecutor,
    nonce,
    true,              // Always async execution
    signature
);
```

**Validates**:
- Signature authenticity via EIP-191
- Nonce hasn't been consumed
- Hash matches order parameters
- User authorization
- Executor restrictions (if specified)

### 3. Lock OfferedToken
```solidity
requestPay(
    user,
    offeredToken,
    offeredAmount,
    priorityFeePay,
    originExecutor,
    noncePay,
    true,              // Always async
    signaturePay
);
```

**Action**: Transfers `offeredAmount` of `offeredToken` from user to Core.sol, locking it for order lifetime.

### 4. Market Resolution
```solidity
bytes32 marketId = getMarketId(offeredToken, requestedToken);
```

**Market ID**: Deterministic `bytes32` hash of the token pair via `keccak256(abi.encodePacked(offeredToken, requestedToken))`. Markets are implicitly created when the first order is placed.

### 5. Order ID Assignment
```solidity
if (marketInformation[marketId].maxSlot == marketInformation[marketId].ordersAvailable) {
    // All slots filled, create new slot
    marketInformation[marketId].maxSlot++;
    orderId = marketInformation[marketId].maxSlot;
} else {
    // Find first available slot (from cancelled/filled orders)
    for (uint256 i = 1; i <= marketInformation[marketId].maxSlot; i++) {
        if (orders[marketId][i].seller == address(0)) {
            orderId = i;
            break;
        }
    }
}
marketInformation[marketId].ordersAvailable++;
```

**Slot Reuse**: Cancelled/filled orders leave gaps that get reused for efficiency.

### 6. Order Storage
```solidity
orders[marketId][orderId] = Structs.Order({
    seller: user,
    offeredAmount: offeredAmount,
    requestedAmount: requestedAmount,
    amountAvailable: offeredAmount
});
```

### 7. Update Market VWAP
```solidity
marketInformation[marketId].medianPrice = getVWAP(marketId);
```

### 8. Staker Rewards
```solidity
bool isStaker = core.isAddressStaker(msg.sender);

if (priorityFeePay > 0) {
    if (isStaker) {
        makeCaPay(msg.sender, offeredToken, priorityFeePay);
        collectFees(core.getPrincipalTokenAddress(), core.getRewardAmount());
    } else collectFees(offeredToken, priorityFeePay);
}

if (isStaker) _sendReward(msg.sender, 1);
```

**Rewards**:
- **Priority Fee**: offeredToken paid to staker executor (if > 0 and is staker)
- **Base Reward**: 1x MATE (core.getRewardAmount())
- **Requirement**: msg.sender must be registered staker

## Error Handling

### Input Validation Errors (P2PSwapError)
- `ZeroAmount()` - offeredAmount or requestedAmount is zero
- `SameTokenPair()` - offeredToken equals requestedToken

### Core.sol Errors
- `Core__InvalidSignature()` - Signature validation failed
- `Core__NonceAlreadyUsed()` - Nonce already consumed
- `Core__InvalidExecutor()` - Executor restrictions not met

## State Changes

**Order Created**:
- `orders[marketId][orderId]` - New Order stored
- `marketInformation[marketId].ordersAvailable++` - Incremented
- `marketInformation[marketId].maxSlot++` - If creating new slot
- `marketInformation[marketId].medianPrice` - VWAP recalculated

**Token Locked**:
- User's offeredToken balance in Core.sol reduced by offeredAmount

## Related Functions

- [cancelOrder](./02-cancelOrder.md) - Cancel order and reclaim offeredToken
- [dispatchOrder](./03-dispatchOrder.md) - Fill order with proportional fee
- [Getter Functions](../03-GetterFunctions.md) - Query markets and orders

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Staker Reward**: 1x MATE
