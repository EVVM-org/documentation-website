---
description: "EIP-191 signature structure for authorizing order creation operations in the P2P swap system"
sidebar_position: 1
---

# Make Order Signature Structure

:::info[Centralized Verification]
P2PSwap signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `P2PSwapHashUtils.hashDataForMakeOrder()` for hash generation.
:::

To authorize order creation operations, users must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **senderExecutor**: Address that can call the function via msg.sender (`0x0...0` for anyone)
3. **hashPayload**: Hash of make order parameters (bytes32, from P2PSwapHashUtils)
4. **originExecutor**: EOA that can initiate the transaction via tx.origin (`0x0...0` for anyone)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Always `true` for P2PSwap (async execution)

## Hash Payload Generation

The `hashPayload` is generated using **P2PSwapHashUtils.hashDataForMakeOrder()**:

```solidity
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/utils/signature/P2PSwapHashUtils.sol";

bytes32 hashPayload = P2PSwapHashUtils.hashDataForMakeOrder(
    offeredToken,     // Token offered by seller
    requestedToken,   // Token requested by seller
    offeredAmount,    // Amount of offeredToken offered
    requestedAmount   // Amount of requestedToken requested
);

// Internal implementation
// keccak256(abi.encode("makeOrder", offeredToken, requestedToken, offeredAmount, requestedAmount))
```

## Centralized Verification

Core.sol verifies the signature using `validateAndConsumeNonce()`:

```solidity
// Called internally by P2PSwap.sol.makeOrder()
Core(coreAddress).validateAndConsumeNonce(
    user,             // Signer's address
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
bytes32 hashPayload = P2PSwapHashUtils.hashDataForMakeOrder(
    offeredToken,
    requestedToken,
    offeredAmount,
    requestedAmount
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

**Scenario:** User wants to create an order offering 100 USDC for 0.05 ETH

**Step 1: Generate Hash Payload**
```solidity
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/utils/signature/P2PSwapHashUtils.sol";

address offeredToken = 0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000;  // USDC
address requestedToken = address(0);  // ETH
uint256 offeredAmount = 100000000;  // 100 USDC with 6 decimals
uint256 requestedAmount = 50000000000000000;  // 0.05 ETH in wei

bytes32 hashPayload = P2PSwapHashUtils.hashDataForMakeOrder(
    offeredToken,
    requestedToken,
    offeredAmount,
    requestedAmount
);
// Result: 0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d
```

**Step 2: Construct Signature Message**
```
1,0x0000000000000000000000000000000000000000,0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d,0x0000000000000000000000000000000000000000,15,true
```

Components:
- `evvmId`: `1`
- `senderExecutor`: `0x0000...` (anyone can call)
- `hashPayload`: `0x3c4d...` (from Step 1)
- `originExecutor`: `0x0000...` (anyone can initiate)
- `nonce`: `15`
- `isAsyncExec`: `true` (always async for P2PSwap)

**Step 3: Sign with Wallet**
```javascript
const message = "1,0x0000000000000000000000000000000000000000,0x3c4d...c4d,0x0000000000000000000000000000000000000000,15,true";
const signature = await signer.signMessage(message);
```

## Function Call

The complete `makeOrder()` function call:

```solidity
P2PSwap(p2pSwapAddress).makeOrder(
    user,              // Order creator's address
    offeredToken,      // Token being offered
    requestedToken,    // Token being requested
    offeredAmount,     // Amount of offeredToken
    requestedAmount,   // Amount of requestedToken expected
    senderExecutor,    // Address(0) for anyone
    originExecutor,    // Address(0) for anyone
    nonce,             // User's nonce from Core.sol
    signature,         // EIP-191 signature of the message
    priorityFeePay,    // Optional priority fee in offeredToken
    noncePay,          // Separate nonce for pay operation
    signaturePay       // Signature for pay operation
);
```

:::tip Technical Details

- **Dual Signatures**: makeOrder requires TWO signatures:
  1. One for the makeOrder operation (validates order parameters)
  2. One for the pay operation (locks offeredToken in Core.sol)
- **Hash Independence**: The hash payload does NOT include executors (only offeredToken, requestedToken, offeredAmount, requestedAmount)
- **Operation Name**: "makeOrder" is included in hash via P2PSwapHashUtils
- **Async Execution**: Always uses async nonces (`isAsyncExec: true`)
- **Market Creation**: P2PSwap automatically creates markets for new token pairs (via bytes32 hash)
- **Executor Flexibility**: Both executors at address(0) allows anyone to execute the order creation

:::
