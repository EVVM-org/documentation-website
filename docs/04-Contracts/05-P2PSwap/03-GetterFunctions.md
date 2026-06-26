---
title: "Getter Functions"
description: "Query and information retrieval functions for P2P Swap contract state"
sidebar_position: 3
---

# Getter Functions

:::info[Implementation Note]
View functions remain fully backward compatible for querying market data, orders, and contract state. They do not use signature verification.
:::

The P2P Swap Contract provides a comprehensive set of getter functions for querying order information, market data, and administrative settings. These functions enable users and applications to interact effectively with the marketplace.

## Market Information Functions

### getMarketId

**Function Signature**: `getMarketId(address tokenA, address tokenB) -> bytes32`

Returns the deterministic market ID for a token pair.

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tokenA` | `address` | First token of the pair |
| `tokenB` | `address` | Second token of the pair |

**Return Value:**

| Type | Description |
|------|-------------|
| `bytes32` | Market ID as a keccak256 hash of the token pair |

**Usage Example:**
```solidity
bytes32 marketId = p2pSwap.getMarketId(usdcAddress, ethAddress);
```

---

### getMarketInformation

**Function Signature**: `getMarketInformation(bytes32 marketId) -> MarketInformation`

Retrieves metadata for a specific market.

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `marketId` | `bytes32` | The market ID to query |

**Return Value:**

| Type | Description |
|------|-------------|
| `MarketInformation` | Struct containing maxSlot, ordersAvailable, and medianPrice |

**Usage Example:**
```solidity
bytes32 marketId = p2pSwap.getMarketId(usdcAddress, ethAddress);
MarketInformation memory info = p2pSwap.getMarketInformation(marketId);
// info.maxSlot - highest order slot assigned
// info.ordersAvailable - number of active orders
// info.medianPrice - VWAP scaled by 1e18
```

---

### getOrder

**Function Signature**: `getOrder(bytes32 marketId, uint256 orderId) -> Order`

Retrieves the order data for a given market and slot.

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `marketId` | `bytes32` | Market ID containing the order |
| `orderId` | `uint256` | Order slot ID (1-indexed) |

**Return Value:**

| Type | Description |
|------|-------------|
| `Order` | Struct containing seller, offeredAmount, requestedAmount, and amountAvailable |

**Usage Example:**
```solidity
bytes32 marketId = p2pSwap.getMarketId(usdcAddress, ethAddress);
Order memory order = p2pSwap.getOrder(marketId, 1);
// order.seller - order creator address (address(0) if deleted)
// order.offeredAmount - total offeredToken amount
// order.requestedAmount - total requestedToken amount
// order.amountAvailable - remaining offeredToken available
```

---

### getVWAP

**Function Signature**: `getVWAP(bytes32 marketId) -> uint256`

Calculates the Volume Weighted Average Price (VWAP) of a market.

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `marketId` | `bytes32` | Market ID to calculate the VWAP for |

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | VWAP price scaled by 1e18 (requestedToken units per offeredToken unit). Returns 0 if no active orders. |

**Usage Example:**
```solidity
bytes32 marketId = p2pSwap.getMarketId(usdcAddress, ethAddress);
uint256 vwap = p2pSwap.getVWAP(marketId);
// vwap represents the volume-weighted average price of offeredToken in requestedToken
```

## Admin Query Functions

### getAdmin

**Function Signature**: `getAdmin() -> address`

Returns the current admin address.

**Return Value:**

| Type | Description |
|------|-------------|
| `address` | Current admin address |

---

### getAdminProposal

**Function Signature**: `getAdminProposal() -> address`

Returns the proposed admin address.

**Return Value:**

| Type | Description |
|------|-------------|
| `address` | Proposed admin address (address(0) if none pending) |

---

### getAdminTimeToAccept

**Function Signature**: `getAdminTimeToAccept() -> uint256`

Returns the timestamp when the admin proposal becomes acceptable.

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Unix timestamp when the proposal can be accepted |

## Fee Configuration Functions

### getPercentageFee

**Function Signature**: `getPercentageFee() -> uint256`

Returns the current proportional fee rate in basis points.

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Current fee rate in basis points (e.g., 500 = 5%) |

---

### getPercentageFeeProposal

**Function Signature**: `getPercentageFeeProposal() -> uint256`

Returns the proposed proportional fee rate in basis points.

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Proposed fee rate in basis points |

---

### getPercentageFeeTimeToAccept

**Function Signature**: `getPercentageFeeTimeToAccept() -> uint256`

Returns the timestamp when the percentage fee proposal becomes acceptable.

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Unix timestamp when the fee proposal can be accepted |

## Fee Distribution Functions

### getBasisPointsForReward

**Function Signature**: `getBasisPointsForReward() -> Percentage`

Returns the current fee distribution percentages.

**Return Value:**

| Type | Description |
|------|-------------|
| `Percentage` | Struct with seller, service, and mateStaker splits (basis points) |

**Usage Example:**
```solidity
Percentage memory reward = p2pSwap.getBasisPointsForReward();
// reward.seller - 5000 (50%)
// reward.service - 4000 (40%)
// reward.mateStaker - 1000 (10%)
```

---

### getBasisPointsForRewardProposal

**Function Signature**: `getBasisPointsForRewardProposal() -> Percentage`

Returns the proposed fee distribution percentages.

**Return Value:**

| Type | Description |
|------|-------------|
| `Percentage` | Proposed Percentage struct with seller, service, and mateStaker splits |

---

### getBasisPointsForRewardProposalTime

**Function Signature**: `getBasisPointsForRewardProposalTime() -> uint256`

Returns the timestamp when the reward basis points proposal becomes acceptable.

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Unix timestamp when the reward proposal can be accepted |

## Treasury Management Functions

### getWithdrawalProposal

**Function Signature**: `getWithdrawalProposal() -> WithdrawalProposal`

Returns the pending withdrawal proposal.

**Return Value:**

| Type | Description |
|------|-------------|
| `WithdrawalProposal` | Struct with tokenToWithdraw, amountToWithdraw, and proposalTime |

**Usage Example:**
```solidity
WithdrawalProposal memory proposal = p2pSwap.getWithdrawalProposal();
// proposal.tokenToWithdraw - address of token to withdraw
// proposal.amountToWithdraw - amount of tokens
// proposal.proposalTime - timestamp when proposal becomes acceptable
```

---

### getTotalFeesCollected

**Function Signature**: `getTotalFeesCollected(address token) -> uint256`

Returns the total fees collected for a specific token.

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | `address` | Address of the token to query |

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Total amount of fees collected in the specified token |

## Utility Functions

### applyBasisPoints

**Function Signature**: `applyBasisPoints(uint256 amount, uint256 basisPoints) -> uint256`

Applies a basis-point rate to an amount. Calculates: `amount * basisPoints / 10_000`.

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | `uint256` | Base amount to apply the rate to |
| `basisPoints` | `uint256` | Rate in basis points (10_000 = 100%) |

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Scaled result |

---

### getNetPaymentAmount

**Function Signature**: `getNetPaymentAmount(uint256 amountOut, uint256 offeredAmount, uint256 requestedAmount) -> uint256`

Calculates the base payment amount (excluding fee) for a partial fill. Uses the order's original price ratio: `netPayment = amountOut * requestedAmount / offeredAmount`.

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `amountOut` | `uint256` | Amount of offeredToken the buyer wants to receive |
| `offeredAmount` | `uint256` | Total offeredToken amount in the order (price denominator) |
| `requestedAmount` | `uint256` | Total requestedToken amount in the order (price numerator) |

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Net amount of requestedToken owed before fees |

---

### getFeePaymentAmount

**Function Signature**: `getFeePaymentAmount(uint256 netPaymentAmount) -> uint256`

Calculates the protocol fee applied on top of the net payment. `fee = netPaymentAmount * percentageFee / 10_000`. Default rate is 500 (5%).

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `netPaymentAmount` | `uint256` | Base payment amount before fees |

**Return Value:**

| Type | Description |
|------|-------------|
| `uint256` | Fee amount in requestedToken units |

## Data Structures

### MarketInformation
```solidity
struct MarketInformation {
    uint256 maxSlot;          // Highest slot number assigned
    uint256 ordersAvailable;  // Number of currently active orders
    uint256 medianPrice;      // VWAP scaled by 1e18
}
```

### Order
```solidity
struct Order {
    address seller;            // Order creator (address(0) if deleted)
    uint256 offeredAmount;     // Total offeredToken originally placed
    uint256 requestedAmount;   // Total requestedToken expected
    uint256 amountAvailable;   // Remaining offeredToken available
}
```

### Percentage
```solidity
struct Percentage {
    uint256 seller;       // Basis points allocated to seller
    uint256 service;      // Basis points allocated to service treasury
    uint256 mateStaker;   // Basis points allocated to MATE staker
}
```

### WithdrawalProposal
```solidity
struct WithdrawalProposal {
    address tokenToWithdraw;     // Address of the token to withdraw
    uint256 amountToWithdraw;    // Amount of tokens to withdraw
    uint256 proposalTime;        // Timestamp when proposal becomes acceptable
}
```

These getter functions provide complete visibility into the P2P Swap marketplace, enabling users, applications, and administrators to make informed decisions and monitor system state effectively.
