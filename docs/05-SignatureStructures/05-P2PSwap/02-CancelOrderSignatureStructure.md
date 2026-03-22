---
description: "EIP-191 signature structure for authorizing order cancellation operations in the P2P swap system"
sidebar_position: 2
---

# Cancel Order Signature Structure

:::info[Centralized Verification]
P2PSwap signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `P2PSwapHashUtils.hashDataForCancelOrder()` for hash generation.
:::

To authorize order cancellation operations, users must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **senderExecutor**: Address that can call the function via msg.sender (`0x0...0` for anyone)
3. **hashPayload**: Hash of cancel order parameters (bytes32, from P2PSwapHashUtils)
4. **originExecutor**: EOA that can initiate the transaction via tx.origin (`0x0...0` for anyone)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Always `true` for P2PSwap (async execution)

## Hash Payload Generation

The `hashPayload` is generated using **P2PSwapHashUtils.hashDataForCancelOrder()**:

```solidity
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/signature/P2PSwapHashUtils.sol";

bytes32 hashPayload = P2PSwapHashUtils.hashDataForCancelOrder(
    tokenA,     // Token A in market pair (from original order)
    tokenB,     // Token B in market pair (from original order)
    orderId     // ID of order to cancel
);

// Internal implementation
// keccak256(abi.encode("cancelOrder", tokenA, tokenB, orderId))
```

## Centralized Verification

Core.sol verifies the signature using `validateAndConsumeNonce()`:

```solidity
// Called internally by P2PSwap.sol.cancelOrder()
Core(coreAddress).validateAndConsumeNonce(
    user,             // Signer's address (order owner)
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
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/signature/P2PSwapHashUtils.sol";

// Step 1: Generate hash payload
bytes32 hashPayload = P2PSwapHashUtils.hashDataForCancelOrder(
    tokenA,
    tokenB,
    orderId
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

**Scenario:** User wants to cancel their order #3 in the USDC/ETH market

**Step 1: Generate Hash Payload**
```solidity
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/signature/P2PSwapHashUtils.sol";

address tokenA = 0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000;  // USDC
address tokenB = address(0);  // ETH
uint256 orderId = 3;

bytes32 hashPayload = P2PSwapHashUtils.hashDataForCancelOrder(
    tokenA,
    tokenB,
    orderId
);
// Result: 0x7f8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8
```

**Step 2: Construct Signature Message**
```
1,0x0000000000000000000000000000000000000000,0x7f8e9d0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8,0x0000000000000000000000000000000000000000,25,true
```

Components:
- `evvmId`: `1`
- `senderExecutor`: `0x0000...` (anyone can call)
- `hashPayload`: `0x7f8e...` (from Step 1)
- `originExecutor`: `0x0000...` (anyone can initiate)
- `nonce`: `25`
- `isAsyncExec`: `true`

**Step 3: Sign with Wallet**
```javascript
const message = "1,0x0000000000000000000000000000000000000000,0x7f8e...7d8,0x0000000000000000000000000000000000000000,25,true";
const signature = await signer.signMessage(message);
```

## Function Call

The complete `cancelOrder()` function call:

```solidity
P2PSwap(p2pSwapAddress).cancelOrder(
    user,              // Order owner's address
    tokenA,            // Token A in market pair
    tokenB,            // Token B in market pair
    orderId,           // Order ID to cancel
    senderExecutor,    // Address(0) for anyone
    originExecutor,    // Address(0) for anyone
    nonce,             // User's nonce from Core.sol
    signature,         // EIP-191 signature of the message
    priorityFeePay,    // Optional priority fee
    noncePay,          // Nonce for pay operation (if needed)
    signaturePay       // Signature for pay operation (if needed)
);
```

## Security Considerations

The signature alone does not prove order ownership. The contract performs additional validation:

1. **Signature Verification**: Confirms the user signed the cancellation request
2. **Order Existence**: Verifies the order exists in the specified market
3. **Ownership Check**: Confirms the signer is the original order creator
4. **Nonce Validation**: Ensures the nonce hasn't been used before

:::tip Technical Details

- **Hash Independence**: The hash payload does NOT include executors (only tokenA, tokenB, orderId)
- **Operation Name**: "cancelOrder" is included in hash via P2PSwapHashUtils
- **Async Execution**: Always uses async nonces (`isAsyncExec: true`)
- **Order Ownership**: Only the original order creator can cancel their order
- **Market Identification**: Token pair (tokenA, tokenB) identifies the correct market
- **Refund**: Cancelled orders release locked tokens back to the order creator

::: 
  - `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Order Identification**: Requires both token pair and order ID to uniquely identify the order
- **Nonce Independence**: P2P Swap nonces are separate from EVVM payment nonces

:::