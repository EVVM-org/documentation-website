---
title: "dispatchOrder_fillFixedFee Function"
description: "Detailed documentation of the P2P Swap Contract's fixed fee order fulfillment function with fee caps."
sidebar_position: 4
---

# dispatchOrder_fillFixedFee Function

**Function Type**: `external`  
**Function Signature**: `dispatchOrder_fillFixedFee(address,MetadataDispatchOrder,uint256,uint256,bool,bytes,uint256)`

The `dispatchOrder_fillFixedFee` function fulfills existing swap orders using a fixed fee model with maximum fee caps to protect users from excessive charges on large orders. This hybrid approach uses proportional calculation up to a maximum limit provided in the function call.

**Key features:**

- **Capped Fee Structure**: Maximum fee limit protects users from excessive charges
- **Hybrid Fee Model**: Uses proportional calculation up to the maximum limit
- **User Protection**: Prevents fee exploitation on large orders
- **Flexible Payment**: Supports partial fee payment within acceptable ranges
- **Enhanced Rewards**: Higher rewards for complex fee calculations

### Parameters

| Field               | Type                    | Description                                                                                                       |
| ------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `user`              | `address`               | The address fulfilling the order (buyer) whose signature is verified                                              |
| `metadata`          | `MetadataDispatchOrder` | Struct containing dispatch details and embedded signature                                                         |
| `_priorityFee_Evvm` | `uint256`               | Priority fee for EVVM transaction processing                                                                      |
| `_nonce_Evvm`       | `uint256`               | Nonce for EVVM payment transaction                                                                                |
| `_priority_Evvm`    | `bool`                  | Priority flag for EVVM payment (sync/async)                                                                       |
| `_signature_Evvm`   | `bytes`                 | EIP-191 signature for EVVM payment authorization                                                                  |
| `_amountOut`        | `uint256`               | The maximum fee amount (fee cap) for the transaction. This value acts as the upper limit for the fee calculation. |

### Fee Calculation Logic

The fixed fee model uses a two-tier calculation where the fee is the lesser of a proportional fee and an externally provided cap:

1. **Standard Proportional Fee**: Calculated as `(orderAmount * percentageFee) / 10_000`.
2. **External Fee Cap**: Provided by the `_amountOut` parameter in the function call.
3. **Final Fee**: The final fee is `min(proportionalFee, _amountOut)`.

### Fee Flexibility

The function accepts payments within a range:

- **Minimum**: `orderAmount + fee - (fee * 10%)`
- **Maximum**: `orderAmount + fee`
- **Actual Fee Used**: Based on amount provided by user

### Execution Methods

#### Fisher Execution

1. User signs dispatch details and EVVM payment authorization
2. Fisher captures the transaction and validates all signatures
3. Fisher submits the transaction with appropriate fee calculation
4. Order is fulfilled with optimized fee structure

#### Direct Execution

1. User or authorized service calls the function directly
2. Fee calculations are performed on-chain
3. Order fulfillment uses the most favorable fee structure
4. Enhanced rewards for complex processing

### Workflow

1. **P2P Signature Verification**: Validates the embedded `metadata.signature` against the `user` address and dispatch parameters using `SignatureUtils.verifyMessageSignedForDispatchOrder`. Reverts with `"Invalid signature"` on failure.

2. **Market Resolution**: Finds the market for the token pair using `findMarket(metadata.tokenA, metadata.tokenB)`.

3. **Nonce Validation**: Checks if the P2P nonce has been used before. Reverts with `"Invalid nonce"` if the nonce was previously used.

4. **Order Validation**: Verifies that the market exists and the order is active. Reverts with `"Invalid order"` if validation fails.

5. **Fee Calculation**: Calculates both fee amounts using `calculateFillFixedFee`:
   - `fee`: The actual fee to be charged (capped amount)
   - `fee10`: 10% of the fee (for minimum payment calculation)

6. **Payment Validation**: Ensures `metadata.amountOfTokenBToFill` meets minimum requirement:
   - Minimum: `orderAmount + fee - fee10`
   - Reverts with `"Insufficient amountOfTokenBToFill"` if insufficient

7. **Token Payment**: Processes the buyer's payment using `makePay`.

8. **Final Fee Determination**: Calculates the actual fee based on payment amount:
   - If payment is between minimum and full fee: uses `paymentAmount - orderAmount`
   - If payment is full fee or more: uses the calculated `fee`

9. **Excess Refund**: If payment exceeds `orderAmount + fee`, refunds the excess.

10. **Fee Distribution Setup**: Creates distribution array with calculated amounts:
    - Seller payment: order amount + seller's portion of final fee
    - Executor payment: priority fee + staker's portion of final fee

11. **Service Fee Accumulation**: Adds service portion of final fee to contract treasury.

12. **Payment Distribution**: Executes distribution using `makeDisperseCaPay`.

13. **Token A Transfer**: Transfers seller's tokenA to the buyer.

14. **Enhanced Staker Rewards**: If executor is a staker:
    - **Premium MATE Rewards**: 5x base reward if excess was refunded, 4x otherwise

15. **Order Cleanup**: Marks order as completed and updates market statistics.

16. **Nonce Update**: Marks P2P nonce as used.

### Example

**Scenario:** Large order with fee cap protection

**Existing Order:**

- Seller offers: 10,000 USDC
- Seller wants: 5 ETH
- Proportional fee (5%): 0.25 ETH
- Fee cap (from `_amountOut`): 0.001 ETH
- **Actual fee**: 0.001 ETH (capped)

**Parameters:**

- `metadata.amountOfTokenBToFill`: `5000900000000000000` (5.0009 ETH)
- `_amountOut`: `1000000000000000` (0.001 ETH cap)

**Fee Calculation:**

- Standard fee would be: 0.25 ETH (5% of 5 ETH)
- Fee cap applies: 0.001 ETH
- 10% reduction: 0.0001 ETH
- Minimum payment: 5 ETH + 0.001 ETH - 0.0001 ETH = 5.0009 ETH

**Payment Flexibility:**

- User pays: 5.0009 ETH (minimum acceptable)
- Actual fee charged: 0.0009 ETH (payment - order amount)
- User saves: 0.2491 ETH compared to proportional fee

**Fee Distribution:**

- Seller receives: 5 ETH + seller's portion of 0.0009 ETH
- Service treasury: service portion of 0.0009 ETH
- Executor receives: priority fee + staker portion of 0.0009 ETH

**Benefits:**

- **User Protection**: Massive fee savings on large orders
- **Flexibility**: Can pay anywhere from minimum to full fee
- **Fair Distribution**: Fees still distributed proportionally
- **Enhanced Rewards**: Executor gets premium MATE rewards

:::info
For signature structure details, see [Dispatch Order Signature Structure](../../../05-SignatureStructures/05-P2PSwap/03-DispatchOrderSignatureStructure.md)
:::

:::tip
**Prefer predictable fees?**  
Use [dispatchOrder_fillPropotionalFee](./03-dispatchOrder-proportional.md) for percentage-based fees.

**Want to create your own order?**  
Use [makeOrder](./01-makeOrder.md) to create a new swap order with your preferred terms.
:::
