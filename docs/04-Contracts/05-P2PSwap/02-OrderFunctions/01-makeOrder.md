---
title: "makeOrder Function"
description: "Create P2P swap orders offering one token in exchange for another"
sidebar_position: 1
---

# makeOrder

:::info[Signature Verification]
makeOrder uses Core.sol's centralized signature verification via `validateAndConsumeNonce()` with `P2PSwapHashUtils.hashDataForMakeOrder()`. Note: makeOrder uses `address(0)` as originExecutor.
:::

**Function Signature**:
```solidity
function makeOrder(
    address user,
    MetadataMakeOrder memory metadata,
    bytes memory signature,
    uint256 priorityFeeEvvm,
    uint256 nonceEvvm,
    bytes memory signatureEvvm
) external returns (uint256 market, uint256 orderId)
```

Creates a new token swap order in the P2P marketplace, locking tokenA in Core.sol and opening an order slot for future fulfillment.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | Order creator whose tokens will be locked |
| `metadata` | `MetadataMakeOrder` | Order details (nonce, tokenA, tokenB, amountA, amountB) |
| `signature` | `bytes` | EIP-191 signature from `user` for operation authorization |
| `priorityFeeEvvm` | `uint256` | Optional MATE priority fee for faster execution |
| `nonceEvvm` | `uint256` | Nonce for Core payment transaction (locks tokenA) |
| `signatureEvvm` | `bytes` | Signature for Core payment authorization |

### MetadataMakeOrder Structure

```solidity
struct MetadataMakeOrder {
    uint256 nonce;    // Core nonce for P2PSwap service
    address tokenA;   // Token being offered
    address tokenB;   // Token being requested
    uint256 amountA;  // Amount of tokenA to lock
    uint256 amountB;  // Amount of tokenB required to fill
}
```

## Return Values

| Value | Type | Description |
|-------|------|-------------|
| `market` | `uint256` | ID of the market (auto-created if new pair) |
| `orderId` | `uint256` | Unique ID of the order within the market |

## Signature Requirements

:::note[Operation Hash]
```solidity
bytes32 hashPayload = P2PSwapHashUtils.hashDataForMakeOrder(
    metadata.tokenA,
    metadata.tokenB,
    metadata.amountA,
    metadata.amountB
);
```
:::

**Signature Format**:
```
{evvmId},{p2pSwapAddress},{hashPayload},{address(0)},{nonce},true
```

**Important**: makeOrder uses `address(0)` as originExecutor because it doesn't restrict who can execute (anyone can submit the transaction). Other P2PSwap operations specify the EOA executor.

**Payment Signature**: Separate signature required for locking tokenA via Core.pay().

## Execution Flow

### 1. Centralized Verification
```solidity
core.validateAndConsumeNonce(
    user,
    P2PSwapHashUtils.hashDataForMakeOrder(
        metadata.tokenA,
        metadata.tokenB,
        metadata.amountA,
        metadata.amountB
    ),
    address(0),        // makeOrder doesn't use originExecutor
    metadata.nonce,
    true,              // Always async execution
    signature
);
```

**Validates**:
- Signature authenticity via EIP-191
- Nonce hasn't been consumed
- Hash matches order parameters
- User authorization
- originExecutor = address(0) (no restriction on who executes)

**On Failure**:
- `Core__InvalidSignature()` - Invalid or mismatched signature
- `Core__NonceAlreadyUsed()` - Nonce already consumed

### 2. Lock TokenA
```solidity
requestPay(
    user,
    metadata.tokenA,
    metadata.amountA,
    priorityFeeEvvm,
    nonceEvvm,
    true,              // Always async
    signatureEvvm
);
```

**Action**: Transfers `amountA` of `tokenA` from user to Core.sol, locking it for order lifetime.

### 3. Market Resolution
```solidity
market = findMarket(metadata.tokenA, metadata.tokenB);
if (market == 0) {
    market = createMarket(metadata.tokenA, metadata.tokenB);
}
```

**Automatic Creation**: If no market exists for this token pair, creates new market with unique ID.

**Market Storage**:
```solidity
marketId[tokenA][tokenB] = nextMarketId;
marketMetadata[nextMarketId] = MarketInformation({
    tokenA: tokenA,
    tokenB: tokenB,
    maxSlot: 0,
    ordersAvailable: 0
});
```

### 4. Order ID Assignment
```solidity
if (marketMetadata[market].maxSlot == marketMetadata[market].ordersAvailable) {
    // All slots filled, create new slot
    marketMetadata[market].maxSlot++;
    marketMetadata[market].ordersAvailable++;
    orderId = marketMetadata[market].maxSlot;
} else {
    // Find first available slot (from cancelled orders)
    for (uint256 i = 1; i <= marketMetadata[market].maxSlot + 1; i++) {
        if (ordersInsideMarket[market][i].seller == address(0)) {
            orderId = i;
            break;
        }
    }
    marketMetadata[market].ordersAvailable++;
}
```

**Slot Reuse**: Cancelled orders leave gaps that get reused for efficiency.

### 5. Order Storage
```solidity
ordersInsideMarket[market][orderId] = Order({
    seller: user,
    amountA: metadata.amountA,
    amountB: metadata.amountB
});
```

### 6. Staker Rewards
```solidity
if (core.isAddressStaker(msg.sender)) {
    if (priorityFeeEvvm > 0) {
        makeCaPay(msg.sender, metadata.tokenA, priorityFeeEvvm);
    }
}

_rewardExecutor(msg.sender, priorityFeeEvvm > 0 ? 3 : 2);
```

**Rewards**:
- **Priority Fee**: MATE tokens paid upfront (if > 0)
- **Base Reward**: 2x MATE (no priority) or 3x MATE (with priority)
- **Requirement**: msg.sender must be registered staker

## Complete Usage Example

```solidity
// Scenario: Create order offering 1000 USDC for 0.5 ETH
address user = 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0;
address usdc = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
address eth = 0x0000000000000000000000000000000000000000;

// 1. Get current nonce
uint256 nonce = core.getNonce(user, address(p2pSwap));

// 2. Create order metadata
MetadataMakeOrder memory metadata = MetadataMakeOrder({
    nonce: nonce,
    tokenA: usdc,
    tokenB: eth,
    amountA: 1000 * 10**6,      // 1000 USDC (6 decimals)
    amountB: 0.5 ether          // 0.5 ETH
});

// 3. Generate hash for signature
bytes32 hashPayload = P2PSwapHashUtils.hashDataForMakeOrder(
    metadata.tokenA,
    metadata.tokenB,
    metadata.amountA,
    metadata.amountB
);

// 4. Create signature message
string memory message = string.concat(
    Strings.toString(block.chainid), ",",
    Strings.toHexString(address(p2pSwap)), ",",
    Strings.toHexString(uint256(hashPayload)), ",",
    Strings.toHexString(address(0)), ",",        // makeOrder uses address(0)
    Strings.toString(nonce), ",true"
);

// 5. User signs with EIP-191
bytes memory signature = signMessage(message, userPrivateKey);

// 6. Generate payment signature for locking USDC
uint256 nonceEvvm = core.getNonce(user, address(core));
bytes memory signatureEvvm = generatePaymentSignature(
    user,
    usdc,
    metadata.amountA,
    0,                  // No priority fee in payment
    nonceEvvm,
    true
);

// 7. Execute makeOrder
(uint256 marketId, uint256 orderId) = p2pSwap.makeOrder(
    user,
    metadata,
    signature,
    1 ether,            // 1 MATE priority fee
    nonceEvvm,
    signatureEvvm
);

// Result:
// - 1000 USDC locked in Core.sol
// - Order created in USDC/ETH market
// - Staker executor receives 1 MATE (priority) + 3x MATE (reward)
// - Order ID returned for future reference
```

## Gas Costs

Estimated gas consumption:

| Scenario | Gas Cost | Notes |
|----------|----------|-------|
| **Existing Market** | ~180,000 gas | Reusing slot |
| **Existing Market (new slot)** | ~200,000 gas | Incrementing maxSlot |
| **New Market** | ~250,000 gas | Market creation overhead |
| **New Pair + New Slot** | ~270,000 gas | Full initialization |

**Variable Factors**:
- Token type (ERC20 vs ETH)
- Market state (existing vs new)
- Slot reuse (gap vs new)

## Economic Model

### User Costs
- **Order Creation**: Free (only gas)
- **Token Lock**: No fee (tokens locked, not spent)
- **Priority Fee**: Optional MATE payment for faster execution

### Staker Revenue
| Component | Amount | Condition |
|-----------|--------|-----------|
| **Priority Fee** | User-defined | If priorityFeeEvvm > 0 |
| **Base Reward** | 2x MATE | No priority fee |
| **Enhanced Reward** | 3x MATE | With priority fee |

**Profitability**: makeOrder is moderately profitable due to base MATE rewards.

## Error Handling

### Core.sol Errors
- `Core__InvalidSignature()` - Signature validation failed
- `Core__NonceAlreadyUsed()` - Nonce already consumed
- `Core__InvalidExecutor()` - (Not applicable, uses address(0))
- `Core__InsufficientBalance()` - User lacks tokenA balance

### P2PSwap Errors
- `"Insuficient balance"` - User cannot lock required tokenA amount

## State Changes

**Order Created**:
- `ordersInsideMarket[market][orderId]` - New Order stored
- `marketMetadata[market].ordersAvailable++` - Incremented
- `marketMetadata[market].maxSlot++` - If creating new slot

**Market Created** (if new pair):
- `marketCount++` - Global market counter
- `marketId[tokenA][tokenB]` - New market ID assigned
- `marketMetadata[marketId]` - Market info initialized

**Token Locked**:
- User's tokenA balance in Core.sol reduced by amountA

## Related Functions

- [cancelOrder](./02-cancelOrder.md) - Cancel order and reclaim tokenA
- [dispatchOrder (Proportional)](./03-dispatchOrder-proportional.md) - Fill order with % fee
- [dispatchOrder (Fixed)](./04-dispatchOrder-fixed.md) - Fill order with capped fee
- [Getter Functions](../03-GetterFunctions.md) - Query markets and orders

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Gas Estimate**: 180k-270k gas  
**Staker Reward**: 2-3x MATE
