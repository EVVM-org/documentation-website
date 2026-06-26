---
description: "EIP-191 signature structure for authorizing order fulfillment operations in the P2P swap system"
sidebar_position: 3
---

# Dispatch Order Signature Structure

:::info[Centralized Verification]
P2PSwap signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `P2PSwapHashUtils.hashDataForDispatchOrder()` for hash generation.
:::

To authorize order fulfillment operations, users must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **senderExecutor**: Address that can call the function via msg.sender (`0x0...0` for anyone)
3. **hashPayload**: Hash of dispatch order parameters (bytes32, from P2PSwapHashUtils)
4. **originExecutor**: EOA that can initiate the transaction via tx.origin (`0x0...0` for anyone)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Always `true` for P2PSwap (async execution)

## Hash Payload Generation

The `hashPayload` is generated using **P2PSwapHashUtils.hashDataForDispatchOrder()**:

```solidity
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/utils/signature/P2PSwapHashUtils.sol";

bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
    offeredToken,     // Token offered by seller (what buyer receives)
    requestedToken,   // Token requested by seller (what buyer pays)
    orderId,          // ID of order to fulfill
    amountOut,        // Amount of offeredToken the buyer wants to receive
    amountInMax       // Maximum amount of requestedToken the buyer is willing to pay
);

// Internal implementation
// keccak256(abi.encode("dispatchOrder", offeredToken, requestedToken, orderId, amountOut, amountInMax))
```

## Centralized Verification

Core.sol verifies the signature using `validateAndConsumeNonce()`:

```solidity
// Called internally by P2PSwap.sol.dispatchOrder()
Core(coreAddress).validateAndConsumeNonce(
    user,             // Buyer's address (order fulfiller)
    senderExecutor,   // Who can call via msg.sender
    hashPayload,      // From P2PSwapHashUtils
    originExecutor,   // Who can initiate via tx.origin
    nonce,            // User's nonce
    true,             // Always async for P2PSwap
    signature         // EIP-191 signature
);
```

## Message Construction

The signature message is constructed using **AdvancedStrings.buildSignaturePayload()**:

```solidity
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/utils/signature/P2PSwapHashUtils.sol";

// Step 1: Generate hash payload
bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
    offeredToken,
    requestedToken,
    orderId,
    amountOut,
    amountInMax
);

// Step 2: Build signature message
string memory message = AdvancedStrings.buildSignaturePayload(
    1,                                           // evvmId
    address(0),                                  // senderExecutor (anyone can call)
    hashPayload,                                 // Hash from step 1
    address(0),                                  // originExecutor (anyone can initiate)
    nonce,                                       // User's current nonce
    true                                         // isAsyncExec (always true for P2PSwap)
);

// Result: "1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,[nonce],true"
```

## Example

**Scenario:** User wants to fulfill order #3 in the USDC/ETH market (buying 500 USDC for 0.025 ETH)

**Step 1: Generate Hash Payload**
```solidity
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/utils/signature/P2PSwapHashUtils.sol";

address offeredToken = 0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000;  // USDC (offered by seller)
address requestedToken = address(0);  // ETH (requested by seller)
uint256 orderId = 3;
uint256 amountOut = 500000000;  // 500 USDC (what buyer wants to receive)
uint256 amountInMax = 26250000000000000;  // Max 0.02625 ETH (including 5% fee)

bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
    offeredToken,
    requestedToken,
    orderId,
    amountOut,
    amountInMax
);
// Result: 0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b
```

**Step 2: Construct Signature Message**
```
1,0x0000000000000000000000000000000000000000,0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b,0x0000000000000000000000000000000000000000,33,true
```

Components:
- `evvmId`: `1`
- `senderExecutor`: `0x0000...` (anyone can call)
- `hashPayload`: `0x9a8b...` (from Step 1)
- `originExecutor`: `0x0000...` (anyone can initiate)
- `nonce`: `33`
- `isAsyncExec`: `true`

**Step 3: Sign with Wallet**
```javascript
const message = "1,0x0000000000000000000000000000000000000000,0x9a8b...a8b,0x0000000000000000000000000000000000000000,33,true";
const signature = await signer.signMessage(message);
```

## Function Call

The complete `dispatchOrder()` function call:

```solidity
P2PSwap(p2pSwapAddress).dispatchOrder(
    user,              // Buyer's address
    offeredToken,      // Token offered by seller (buyer receives)
    requestedToken,    // Token requested by seller (buyer pays)
    orderId,           // Order ID to dispatch
    amountOut,         // Amount of offeredToken buyer wants to receive
    amountInMax,       // Max amount of requestedToken buyer will pay (including fee)
    senderExecutor,    // Address(0) for anyone
    originExecutor,    // Address(0) for anyone
    nonce,             // User's nonce from Core.sol
    signature,         // EIP-191 signature of the message
    priorityFeePay,    // Optional priority fee in requestedToken
    noncePay,          // Nonce for pay operation
    signaturePay       // Signature for pay operation
);
```

## Security Considerations

The signature authorizes the dispatch attempt. The contract performs additional validation:

1. **Signature Verification**: Confirms the user signed the dispatch request
2. **Order Existence**: Verifies the order exists and is active (seller != address(0))
3. **Amount Validation**: Confirms `amountOut <= amountAvailable` in the order
4. **Payment Sufficiency**: Validates that `amountInMax >= netPayment + fee`
5. **Nonce Validation**: Ensures the nonce hasn't been used before

:::tip Technical Details

- **Dual Signatures**: dispatchOrder requires TWO signatures:
  1. One for the dispatchOrder operation (validates buyer intent)
  2. One for the pay operation (locks requestedToken + fees in Core.sol)
- **Hash Includes Amounts**: Unlike makeOrder and cancelOrder, the dispatch hash includes `amountOut` and `amountInMax` for buyer protection
- **Operation Name**: "dispatchOrder" is included in hash via P2PSwapHashUtils
- **Async Execution**: Always uses async nonces (`isAsyncExec: true`)
- **Partial Fills**: The hash binds the buyer to specific fill amounts, preventing front-running
- **Transaction Flow**:
  - Buyer provides requestedToken (+ fees)
  - Buyer receives offeredToken from order
  - Seller receives requestedToken payment (+ fee bonus)
  - Staker executors receive MATE rewards (2x)

:::

### Token Direction Understanding

The signature includes tokens from the **seller's perspective**:
- **offeredToken**: What the seller is offering (buyer will receive)
- **requestedToken**: What the seller wants (buyer must provide)
- **amountOut**: Amount of offeredToken the buyer wants to receive
- **amountInMax**: Maximum amount of requestedToken the buyer is willing to pay

### Hash Parameter Inclusion

The `dispatchOrder` hash includes `amountOut` and `amountInMax` to protect the buyer:
- Prevents executor from filling a different amount than intended
- Binds the signature to specific fill parameters
- Ensures the buyer's expected payment range is respected
