---
title: "cancelOrder Function"
description: "Detailed documentation of the P2P Swap Contract's order cancellation function for removing orders and reclaiming tokens."
sidebar_position: 2
---

# cancelOrder Function

**Function Type**: `external`  
**Function Signature**: `cancelOrder(address,MetadataCancelOrder,uint256,uint256,bool,bytes)`

The `cancelOrder` function allows order creators to cancel their existing orders and reclaim their locked tokens. This function validates ownership, returns tokens to the original creator, and provides rewards to staker executors.

**Key features:**

- **Order Cancellation**: Removes existing orders from the marketplace
- **Token Recovery**: Returns locked tokens to the original order creator
- **Ownership Validation**: Ensures only order creators can cancel their orders
- **Staker Rewards**: Executors who are stakers receive MATE token rewards
- **Market Cleanup**: Updates market statistics after order removal

### Parameters

| Field               | Type                  | Description                                                                |
| ------------------- | --------------------- | -------------------------------------------------------------------------- |
| `user`              | `address`             | The address that created the original order and is requesting cancellation |
| `metadata`          | `MetadataCancelOrder` | Struct containing cancellation details and embedded signature              |
| `_priorityFee_Evvm` | `uint256`             | Priority fee for EVVM transaction processing (optional)                    |
| `_nonce_Evvm`       | `uint256`             | Nonce for EVVM payment transaction                                         |
| `_priority_Evvm`    | `bool`                | Priority flag for EVVM payment (sync/async)                                |
| `_signature_Evvm`   | `bytes`               | EIP-191 signature for EVVM payment authorization                           |

:::info 
`_priorityFee_Evvm` is paid using principal tokens
:::

### MetadataCancelOrder Structure

| Field       | Type      | Description                                                |
| ----------- | --------- | ---------------------------------------------------------- |
| `nonce`     | `uint256` | Unique nonce for P2P Swap replay protection                |
| `tokenA`    | `address` | Token that was offered in the original order               |
| `tokenB`    | `address` | Token that was requested in the original order             |
| `orderId`   | `uint256` | ID of the order to be cancelled                            |
| `signature` | `bytes`   | EIP-191 signature from `user` authorizing the cancellation |

### Execution Methods

#### Fisher Execution

1. User signs cancellation details and optional EVVM payment authorization
2. Fisher captures the transaction and validates all signatures
3. Fisher submits the transaction and receives staker rewards if eligible
4. Order is cancelled and tokens are returned to the user

#### Direct Execution

1. User or authorized service calls the function directly
2. All signature validations are performed on-chain
3. Order cancellation and token return happen immediately
4. Staker benefits are distributed if executor qualifies

### Workflow

1. **P2P Signature Verification**: Validates the embedded `metadata.signature` against the `user` address and cancellation parameters using `SignatureUtils.verifyMessageSignedForCancelOrder`. Reverts with `"Invalid signature"` on failure.

2. **Market Resolution**: Finds the market for the token pair using `findMarket(metadata.tokenA, metadata.tokenB)`.

3. **Nonce Validation**: Checks if the P2P nonce has been used before by consulting `nonceP2PSwap[user][metadata.nonce]`. Reverts with `"Invalid nonce"` if the nonce was previously used.

4. **Order Ownership Verification**: Validates that:
   - The market exists (market != 0)
   - The order exists and belongs to the requesting user
   - Reverts with `"Invalid order"` if validation fails

5. **Priority Fee Processing**: If `_priorityFee_Evvm > 0`, processes the priority fee payment using `makePay` with MATE tokens.

6. **Token Return**: Returns the locked tokens to the order creator using `makeCaPay`, transferring `ordersInsideMarket[market][metadata.orderId].amountA` of `metadata.tokenA` back to `user`.

7. **Order Removal**: Marks the order as cancelled by setting the seller address to `address(0)`.

8. **Staker Reward Distribution**: If the executor (`msg.sender`) is a registered staker:
   - **MATE Token Rewards**: Grants MATE tokens to the executor:
     - 3x base reward amount + priority fee if priority fee was provided
     - 2x base reward amount if no priority fee

9. **Market Update**: Decrements the `ordersAvailable` counter for the market.

10. **Nonce Update**: Marks the P2P nonce as used to prevent replay attacks.

### Example

**Scenario:** User wants to cancel their order offering 100 USDC for 0.05 ETH

**Parameters:**

- `user`: `0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c`
- `metadata.nonce`: `25`
- `metadata.tokenA`: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC)
- `metadata.tokenB`: `0x0000000000000000000000000000000000000000` (ETH)
- `metadata.orderId`: `3`
- `_priorityFee_Evvm`: `0` (no priority fee)

**Process:**

1. User signs the cancellation details with their private key
2. Fisher or user submits the transaction
3. Contract validates signature and order ownership
4. 100 USDC is returned to the user's balance
5. Order #3 is marked as cancelled in the USDC/ETH market
6. Staker executor receives 2x MATE reward (no priority fee)

**Market Impact:**

- Market's `ordersAvailable` count decreases by 1
- Order slot becomes available for reuse
- Market statistics reflect the cancellation

**Token Recovery:**

- Original 100 USDC locked in the order is returned to user
- User can immediately use these tokens for other purposes
- No fees charged for order cancellation

:::info
For signature structure details, see [Cancel Order Signature Structure](../../../05-SignatureStructures/05-P2PSwap/02-CancelOrderSignatureStructure.md)
:::

:::tip
**Want to create a new order?**  
Use [makeOrder](./01-makeOrder.md) to create a new swap order with different parameters.

**Looking to fulfill someone else's order?**  
Check [dispatchOrder](./03-dispatchOrder-proportional.md) to execute existing orders in the marketplace.
:::

