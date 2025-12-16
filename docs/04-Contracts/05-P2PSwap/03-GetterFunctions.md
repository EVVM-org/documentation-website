---
title: "Getter Functions"
description: "Comprehensive documentation of P2P Swap Contract's query and information retrieval functions."
sidebar_position: 3
---

# Getter Functions

The P2P Swap Contract provides a comprehensive set of getter functions for querying order information, market data, user balances, and administrative settings. These functions enable users and applications to interact effectively with the marketplace.

## Order Query Functions

### getAllMarketOrders

**Function Signature**: `getAllMarketOrders(uint256 market) → OrderForGetter[]`

Returns all orders in a specific market, including both active and cancelled orders.

**Parameters:**
- `market` (uint256): The market ID to query

**Returns:**
- Array of `OrderForGetter` structs containing market ID, order ID, seller, and amounts

**Usage Example:**
```solidity
// Get all orders in USDC/ETH market (market ID 1)
OrderForGetter[] memory orders = p2pSwap.getAllMarketOrders(1);
```

### getOrder

**Function Signature**: `getOrder(uint256 market, uint256 orderId) → Order`

Retrieves a specific order by market and order ID.

**Parameters:**
- `market` (uint256): The market ID
- `orderId` (uint256): The order ID within the market

**Returns:**
- `Order` struct containing seller address and token amounts

### getMyOrdersInSpecificMarket

**Function Signature**: `getMyOrdersInSpecificMarket(address user, uint256 market) → OrderForGetter[]`

Returns all orders created by a specific user in a given market.

**Parameters:**
- `user` (address): The user's address
- `market` (uint256): The market ID to query

**Returns:**
- Array of user's orders in the specified market

## Market Information Functions

### findMarket

**Function Signature**: `findMarket(address tokenA, address tokenB) → uint256`

Finds the market ID for a specific token pair.

**Parameters:**
- `tokenA` (address): First token in the pair
- `tokenB` (address): Second token in the pair

**Returns:**
- Market ID (0 if market doesn't exist)

### getMarketMetadata

**Function Signature**: `getMarketMetadata(uint256 market) → MarketInformation`

Retrieves complete metadata for a specific market.

**Parameters:**
- `market` (uint256): The market ID

**Returns:**
- `MarketInformation` struct containing token addresses, max slots, and available orders

### getAllMarketsMetadata

**Function Signature**: `getAllMarketsMetadata() → MarketInformation[]`

Returns metadata for all existing markets.

**Returns:**
- Array of `MarketInformation` structs for all markets

## User State Functions

### checkIfANonceP2PSwapIsUsed

**Function Signature**: `checkIfANonceP2PSwapIsUsed(address user, uint256 nonce) → bool`

Checks if a specific nonce has been used by a user.

**Parameters:**
- `user` (address): The user's address
- `nonce` (uint256): The nonce to check

**Returns:**
- `true` if nonce has been used, `false` otherwise

## Contract Balance Functions

### getBalanceOfContract

**Function Signature**: `getBalanceOfContract(address token) → uint256`

Returns the contract's balance for a specific token.

**Parameters:**
- `token` (address): The token address to query

**Returns:**
- Token balance held by the contract

## Administrative Query Functions

### Owner Management

#### getOwner
**Function Signature**: `getOwner() → address`
Returns the current contract owner address.

#### getOwnerProposal
**Function Signature**: `getOwnerProposal() → address`
Returns the proposed new owner address.

#### getOwnerTimeToAccept
**Function Signature**: `getOwnerTimeToAccept() → uint256`
Returns the timestamp when the owner proposal expires.

### Fee Configuration

#### getPercentageFee
**Function Signature**: `getPercentageFee() → uint256`
Returns the current percentage fee (in basis points, e.g., 500 = 5%).

#### getProposalPercentageFee
**Function Signature**: `getProposalPercentageFee() → uint256`
Returns the proposed percentage fee.

#### getRewardPercentage
**Function Signature**: `getRewardPercentage() → Percentage`
Returns the current fee distribution percentages.

#### getRewardPercentageProposal
**Function Signature**: `getRewardPercentageProposal() → Percentage`
Returns the proposed fee distribution percentages.

### Fixed Fee Limits

#### getMaxLimitFillFixedFee
**Function Signature**: `getMaxLimitFillFixedFee() → uint256`
Returns the current maximum fixed fee limit.

#### getMaxLimitFillFixedFeeProposal
**Function Signature**: `getMaxLimitFillFixedFeeProposal() → uint256`
Returns the proposed maximum fixed fee limit.

### Treasury Management

#### getProposedWithdrawal
**Function Signature**: `getProposedWithdrawal() → (address, uint256, address, uint256)`
Returns details of any pending withdrawal proposal.

**Returns:**
- `tokenToWithdraw` (address): Token to be withdrawn
- `amountToWithdraw` (uint256): Amount to be withdrawn
- `recipientToWithdraw` (address): Recipient of the withdrawal
- `timeToWithdrawal` (uint256): Expiration timestamp of the proposal

## Data Structures

### OrderForGetter
```solidity
struct OrderForGetter {
    uint256 marketId;
    uint256 orderId;
    address seller;
    uint256 amountA;
    uint256 amountB;
}
```

### Order
```solidity
struct Order {
    address seller;
    uint256 amountA;
    uint256 amountB;
}
```

### MarketInformation
```solidity
struct MarketInformation {
    address tokenA;
    address tokenB;
    uint256 maxSlot;
    uint256 ordersAvailable;
}
```

### Percentage
```solidity
struct Percentage {
    uint256 seller;
    uint256 service;
    uint256 mateStaker;
}
```

## Usage Examples

### Finding and Browsing Orders

```solidity
// Find USDC/ETH market
uint256 marketId = p2pSwap.findMarket(usdcAddress, ethAddress);

if (marketId != 0) {
    // Get all orders in this market
    OrderForGetter[] memory orders = p2pSwap.getAllMarketOrders(marketId);
    
    // Check market statistics
    MarketInformation memory marketInfo = p2pSwap.getMarketMetadata(marketId);
    
    // Get specific order details
    Order memory specificOrder = p2pSwap.getOrder(marketId, 1);
}
```

### Checking User Activity

```solidity
// Check if user has orders in a market
OrderForGetter[] memory userOrders = p2pSwap.getMyOrdersInSpecificMarket(
    userAddress, 
    marketId
);

// Verify nonce hasn't been used
bool nonceUsed = p2pSwap.checkIfANonceP2PSwapIsUsed(userAddress, 42);
```

### Monitoring Contract State

```solidity
// Check contract's token balances
uint256 ethBalance = p2pSwap.getBalanceOfContract(ethAddress);
uint256 usdcBalance = p2pSwap.getBalanceOfContract(usdcAddress);

// Get current fee configuration
uint256 currentFee = p2pSwap.getPercentageFee();
Percentage memory feeDistribution = p2pSwap.getRewardPercentage();
```

These getter functions provide complete visibility into the P2P Swap marketplace, enabling users, applications, and administrators to make informed decisions and monitor system state effectively.