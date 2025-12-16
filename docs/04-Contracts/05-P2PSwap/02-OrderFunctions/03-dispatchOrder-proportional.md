---
title: "dispatchOrder_fillPropotionalFee Function"
description: "Detailed documentation of the P2P Swap Contract's proportional fee order fulfillment function."
sidebar_position: 3
---

# dispatchOrder_fillPropotionalFee Function

**Function Type**: `external`  
**Function Signature**: `dispatchOrder_fillPropotionalFee(address,MetadataDispatchOrder,uint256,uint256,bool,bytes)`

The `dispatchOrder_fillPropotionalFee` function fulfills existing swap orders using a proportional fee model where fees are calculated as a percentage of the order amount. This function handles token exchanges, fee distribution, and reward allocation.

**Key features:**
- **Order Fulfillment**: Executes existing swap orders from the marketplace
- **Proportional Fees**: Fees calculated as a configurable percentage of order amount
- **Three-Way Fee Split**: Fees distributed between seller, service, and MATE stakers
- **Token Exchange**: Automatic token swap between buyer and seller
- **Staker Rewards**: Enhanced rewards for staker executors

### Parameters

| Field | Type | Description |
|-------|------|-------------|
| `user` | `address` | The address fulfilling the order (buyer) whose signature is verified |
| `metadata` | `MetadataDispatchOrder` | Struct containing dispatch details and embedded signature |
| `_priorityFee_Evvm` | `uint256` | Priority fee for EVVM transaction processing |
| `_nonce_Evvm` | `uint256` | Nonce for EVVM payment transaction |
| `_priority_Evvm` | `bool` | Priority flag for EVVM payment (sync/async) |
| `_signature_Evvm` | `bytes` | EIP-191 signature for EVVM payment authorization |

### MetadataDispatchOrder Structure

| Field | Type | Description |
|-------|------|-------------|
| `nonce` | `uint256` | Unique nonce for P2P Swap replay protection |
| `tokenA` | `address` | Token offered in the original order |
| `tokenB` | `address` | Token requested in the original order |
| `orderId` | `uint256` | ID of the order to be fulfilled |
| `amountOfTokenBToFill` | `uint256` | Amount of tokenB the buyer is providing (must cover order + fees) |
| `signature` | `bytes` | EIP-191 signature from `user` authorizing the dispatch |

### Fee Calculation

The proportional fee is calculated as:
```
fee = (orderAmount * percentageFee) / 10_000
```

Where `percentageFee` is configurable (default: 500 = 5%).

### Fee Distribution

Fees are distributed according to the `rewardPercentage` structure:
- **Seller Portion**: Added to the seller's payment as bonus
- **Service Portion**: Accumulated in contract treasury
- **MATE Staker Portion**: Distributed to the executor (if staker)

### Execution Methods

#### Fisher Execution
1. User signs dispatch details and EVVM payment authorization
2. Fisher captures the transaction and validates all signatures
3. Fisher submits the transaction and receives enhanced rewards if staker
4. Order is fulfilled and tokens are exchanged

#### Direct Execution
1. User or authorized service calls the function directly
2. All signature validations are performed on-chain
3. Order fulfillment and token exchange happen immediately
4. Staker benefits are distributed if executor qualifies

### Workflow

1. **P2P Signature Verification**: Validates the embedded `metadata.signature` against the `user` address and dispatch parameters using `SignatureUtils.verifyMessageSignedForDispatchOrder`. Reverts with `"Invalid signature"` on failure.

2. **Market Resolution**: Finds the market for the token pair using `findMarket(metadata.tokenA, metadata.tokenB)`.

3. **Nonce Validation**: Checks if the P2P nonce has been used before by consulting `nonceP2PSwap[user][metadata.nonce]`. Reverts with `"Invalid nonce"` if the nonce was previously used.

4. **Order Validation**: Verifies that:
   - The market exists (market != 0)
   - The order exists and is active (seller != address(0))
   - Reverts if validation fails

5. **Fee Calculation**: Calculates the proportional fee using `calculateFillPropotionalFee(ordersInsideMarket[market][metadata.orderId].amountB)`.

6. **Amount Validation**: Ensures `metadata.amountOfTokenBToFill` is sufficient to cover the order amount plus fees. Reverts with `"Insuficient amountOfTokenToFill"` if insufficient.

7. **Token Payment**: Processes the buyer's payment using `makePay`, transferring `metadata.amountOfTokenBToFill` of `metadata.tokenB` from `user` to the contract.

8. **Excess Refund**: If the buyer provided more than required (order + fee), refunds the excess using `makeCaPay`.

9. **Fee Distribution Setup**: Creates distribution array with:
   - Seller payment: order amount + seller's fee portion
   - Executor payment: priority fee + staker's fee portion

10. **Service Fee Accumulation**: Adds the service portion of fees to `balancesOfContract[metadata.tokenB]`.

11. **Payment Distribution**: Executes the distribution using `makeDisperseCaPay` to pay both seller and executor.

12. **Token A Transfer**: Transfers the seller's tokenA to the buyer using `makeCaPay`.

13. **Staker Reward Distribution**: If the executor is a staker:
    - **Enhanced MATE Rewards**: Grants additional MATE tokens:
      - 5x base reward if excess was refunded
      - 4x base reward for standard fulfillment

14. **Order Cleanup**: Marks the order as completed by setting seller to `address(0)` and decrements market's `ordersAvailable`.

15. **Nonce Update**: Marks the P2P nonce as used to prevent replay attacks.

### Example

**Scenario:** User wants to fulfill an order offering 100 USDC for 0.05 ETH (5% fee)

**Existing Order:**
- Seller offers: 100 USDC
- Seller wants: 0.05 ETH
- Market: USDC/ETH, Order ID: 3

**Parameters:**
- `user`: `0x123...` (buyer)
- `metadata.amountOfTokenBToFill`: `52500000000000000` (0.0525 ETH = 0.05 + 0.0025 fee)
- `_priorityFee_Evvm`: `1000000000000000` (0.001 ETH)

**Fee Calculation:**
- Order amount: 0.05 ETH
- Proportional fee (5%): 0.0025 ETH
- Total required: 0.0525 ETH

**Fee Distribution (assuming 50%/40%/10% split):**
- Seller receives: 0.05 ETH + 0.00125 ETH (50% of fee) = 0.05125 ETH
- Service treasury: 0.001 ETH (40% of fee)
- Executor receives: 0.001 ETH (priority) + 0.00025 ETH (10% of fee) = 0.00125 ETH

**Final Exchange:**
- Buyer pays: 0.0525 ETH
- Buyer receives: 100 USDC
- Seller receives: 0.05125 ETH (order + bonus)
- Executor receives: 0.00125 ETH + 4x MATE rewards

:::info
For signature structure details, see [Dispatch Order Signature Structure](../../../05-SignatureStructures/05-P2PSwap/03-DispatchOrderSignatureStructure.md)
:::

:::tip
**Want fixed fee protection?**  
Use [dispatchOrder_fillFixedFee](./04-dispatchOrder-fixed.md) for capped fees on large orders.

**Looking for orders to fulfill?**  
Check the [Getter Functions](../03-GetterFunctions.md) to browse available orders in different markets.
:::
