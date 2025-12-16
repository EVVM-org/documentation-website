---
title: "makeOrder Function"
description: "Detailed documentation of the P2P Swap Contract's order creation function for establishing token exchange orders."
sidebar_position: 1
---

# makeOrder Function

**Function Type**: `external`  
**Function Signature**: `makeOrder(address,MetadataMakeOrder,bytes,uint256,uint256,bool,bytes)`

The `makeOrder` function creates a new token swap order in the P2P marketplace, allowing users to offer one token in exchange for another at a specified rate. This function handles market creation, order storage, and reward distribution for staker executors.

**Key features:**

- **Order Creation**: Establishes a new swap order offering tokenA for tokenB
- **Automatic Market Creation**: Creates new markets for previously unseen token pairs
- **Staker Rewards**: Executors who are stakers receive MATE token rewards and priority fees
- **Signature Verification**: Uses EIP-191 signatures for secure authorization
- **EVVM Integration**: Leverages EVVM payment system for token transfers

### Parameters

| Field               | Type                | Description                                                                          |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `user`              | `address`           | The address creating the order whose tokens will be locked and signature is verified |
| `metadata`          | `MetadataMakeOrder` | Struct containing order details (nonce, tokenA, tokenB, amountA, amountB)            |
| `signature`         | `bytes`             | EIP-191 signature from `user` authorizing the order creation                         |
| `_priorityFee_Evvm` | `uint256`           | Fee amount distributed to stakers as reward for processing the transaction.          |
| `_nonce_Evvm`       | `uint256`           | Nonce for EVVM payment transaction                                                   |
| `_priority_Evvm`    | `bool`              | Priority flag (sync/async) for the EVVM payment function call.                       |
| `_signature_Evvm`   | `bytes`             | EIP-191 signature for EVVM payment authorization                                     |

### MetadataMakeOrder Structure

| Field     | Type      | Description                                 |
| --------- | --------- | ------------------------------------------- |
| `nonce`   | `uint256` | Unique nonce for P2P Swap replay protection |
| `tokenA`  | `address` | Token being offered by the order creator    |
| `tokenB`  | `address` | Token being requested in exchange           |
| `amountA` | `uint256` | Amount of tokenA being offered              |
| `amountB` | `uint256` | Amount of tokenB being requested            |

### Return Values

| Field     | Type      | Description                                      |
| --------- | --------- | ------------------------------------------------ |
| `market`  | `uint256` | ID of the market where the order was placed      |
| `orderId` | `uint256` | Unique ID of the created order within the market |

### Execution Methods

#### Fisher Execution

1. User signs both P2P order details and EVVM payment authorization
2. Fisher captures the transaction and validates all signatures
3. Fisher submits the transaction and receives staker rewards if eligible
4. Order is created and tokens are locked in the contract

#### Direct Execution

1. User or authorized service calls the function directly
2. All signature validations are performed on-chain
3. Order creation and token locking happen immediately
4. Staker benefits are distributed if executor qualifies

### Workflow

1. **P2P Signature Verification**: Validates the `signature` against the `user` address and order metadata using `SignatureUtils.verifyMessageSignedForMakeOrder`. Reverts with `"Invalid signature"` on failure.

2. **Nonce Validation**: Checks if the P2P nonce has been used before by consulting `nonceP2PSwap[user][metadata.nonce]`. Reverts with `"Nonce already used"` if the nonce was previously used.

3. **Token Transfer**: Executes payment to lock the user's tokens using `makePay` with the provided EVVM parameters, transferring `metadata.amountA` of `metadata.tokenA` from `user` to the contract.

4. **Market Resolution**: Determines the appropriate market using `findMarket(metadata.tokenA, metadata.tokenB)`. If no market exists (returns 0), creates a new market using `createMarket`.

5. **Order ID Assignment**: Assigns an order ID within the market:
   - If market is at capacity (`maxSlot == ordersAvailable`), increments `maxSlot` and uses the new slot
   - Otherwise, finds the first available slot by iterating through existing orders
   - Updates `ordersAvailable` counter

6. **Order Storage**: Stores the order in `ordersInsideMarket[market][orderId]` with seller address, token amounts, and metadata.

7. **Staker Reward Distribution**: If the executor (`msg.sender`) is a registered staker:
   - **Priority Fee Transfer**: If `_priorityFee_Evvm > 0`, transfers the priority fee in `metadata.tokenA` to the executor
   - **MATE Token Rewards**: Grants MATE tokens to the executor:
     - 3x base reward amount if priority fee was provided
     - 2x base reward amount if no priority fee

8. **Nonce Update**: Marks the P2P nonce as used to prevent replay attacks.

### Example

**Scenario:** User wants to create an order offering 100 USDC for 0.05 ETH

**Parameters:**

- `user`: `0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c`
- `metadata.nonce`: `15`
- `metadata.tokenA`: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC)
- `metadata.tokenB`: `0x0000000000000000000000000000000000000000` (ETH)
- `metadata.amountA`: `100000000` (100 USDC, 6 decimals)
- `metadata.amountB`: `50000000000000000` (0.05 ETH in wei)
- `_priorityFee_Evvm`: `1000000000000000` (0.001 ETH priority fee)

**Process:**

1. User signs the order details with their private key
2. Fisher or user submits the transaction
3. Contract validates signature and transfers 100 USDC to contract
4. Order is assigned to USDC/ETH market (created if new)
5. Order stored with unique ID for future fulfillment
6. Staker executor receives priority fee + 3x MATE reward

**Market Creation:**
If this is the first USDC/ETH order:

- New market created with ID (e.g., market #5)
- Market metadata initialized for USDC/ETH pair
- Order becomes first order in the new market

**Order Assignment:**

- Order receives ID #1 in the market
- Market statistics updated (maxSlot: 1, ordersAvailable: 1)
- Order can now be discovered and fulfilled by other users

:::info
For signature structure details, see [Make Order Signature Structure](../../../05-SignatureStructures/05-P2PSwap/01-MakeOrderSignatureStructure.md)
:::

:::tip
**Want to cancel your order?**  
Use [cancelOrder](./02-cancelOrder.md) to cancel your order and reclaim your tokens.

**Looking for existing orders?**  
Check the [Getter Functions](../03-GetterFunctions.md) to browse available orders in different markets.
:::
