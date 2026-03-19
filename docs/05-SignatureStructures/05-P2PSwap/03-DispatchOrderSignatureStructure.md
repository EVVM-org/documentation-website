---
description: "EIP-191 signature structure for authorizing order fulfillment operations in the P2P swap system"
sidebar_position: 3
---

# Dispatch Order Signature Structure

:::info[Centralized Verification]
P2PSwap signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `P2PSwapHashUtils.hashDataForDispatchOrder()` for hash generation. This signature is used for both `dispatchOrder_fillPropotionalFee` and `dispatchOrder_fillFixedFee`.
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
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/signature/P2PSwapHashUtils.sol";

bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
    tokenA,     // Token A in market pair (token offered by seller)
    tokenB,     // Token B in market pair (token requested by seller)
    orderId     // ID of order to fulfill
);

// Internal implementation
// keccak256(abi.encode("dispatchOrder", tokenA, tokenB, orderId))
```

## Centralized Verification

Core.sol verifies the signature using `validateAndConsumeNonce()`:

```solidity
// Called internally by P2PSwap.sol.dispatchOrder_fillPropotionalFee() or dispatchOrder_fillFixedFee()
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
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/signature/P2PSwapHashUtils.sol";

// Step 1: Generate hash payload
bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
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

**Scenario:** User wants to fulfill order #3 in the USDC/ETH market (buying 100 USDC for 0.05 ETH)

**Step 1: Generate Hash Payload**
```solidity
import {P2PSwapHashUtils} from "@evvm/testnet-contracts/library/signature/P2PSwapHashUtils.sol";

address tokenA = 0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000;  // USDC (offered by seller)
address tokenB = address(0);  // ETH (requested by seller)
uint256 orderId = 3;

bytes32 hashPayload = P2PSwapHashUtils.hashDataForDispatchOrder(
    tokenA,
    tokenB,
    orderId
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

## Function Calls

### dispatchOrder_fillPropotionalFee

Uses percentage-based fee calculation:

```solidity
P2PSwap(p2pSwapAddress).dispatchOrder_fillPropotionalFee(
    user,              // Buyer's address
    tokenA,            // Token A in market pair
    tokenB,            // Token B in market pair
    orderId,           // Order ID to dispatch
    amountOfTokenBToFill,  // Amount of tokenB to provide
    senderExecutor,    // Address(0) for anyone
    originExecutor,    // Address(0) for anyone
    nonce,             // User's nonce from Core.sol
    signature,         // EIP-191 signature of the message
    priorityFeePay,    // Optional priority fee
    noncePay,          // Nonce for pay operation
    signaturePay       // Signature for pay operation
);
```

### dispatchOrder_fillFixedFee

Uses capped fee calculation with maximum limits:

```solidity
P2PSwap(p2pSwapAddress).dispatchOrder_fillFixedFee(
    user,              // Buyer's address
    tokenA,            // Token A in market pair
    tokenB,            // Token B in market pair
    orderId,           // Order ID to dispatch
    amountOfTokenBToFill,  // Amount of tokenB to provide
    senderExecutor,    // Address(0) for anyone
    originExecutor,    // Address(0) for anyone
    nonce,             // User's nonce from Core.sol
    signature,         // EIP-191 signature of the message
    priorityFeePay,    // Optional priority fee
    noncePay,          // Nonce for pay operation
    signaturePay       // Signature for pay operation
);
```

## Security Considerations

The signature authorizes the dispatch attempt. The contract performs additional validation:

1. **Signature Verification**: Confirms the user signed the dispatch request
2. **Order Existence**: Verifies the order exists and is active
3. **Market Validation**: Confirms the token pair matches an existing market
4. **Nonce Validation**: Ensures the nonce hasn't been used before
5. **Payment Sufficiency**: Validates the user provided enough tokens to cover order + fees

:::tip Technical Details

- **Dual Signatures**: dispatchOrder requires TWO signatures:
  1. One for the dispatchOrder operation (validates buyer intent)
  2. One for the pay operation (locks tokenB + fees in Core.sol)
- **Hash Independence**: The hash payload does NOT include executors (only tokenA, tokenB, orderId)
- **Operation Name**: "dispatchOrder" is included in hash via P2PSwapHashUtils
- **Async Execution**: Always uses async nonces (`isAsyncExec: true`)
- **Same Signature for Both Fee Models**: Both proportional and fixed fee functions use identical signature format
- **Transaction Flow**:
  - Buyer provides tokenB (+ fees)
  - Buyer receives tokenA from order
  - Seller receives tokenB payment (+ bonus)
  - Validators receive staking rewards

:::

### Token Direction Understanding

The signature includes tokenA and tokenB from the **seller's perspective**:
- **tokenA**: What the seller is offering (buyer will receive)
- **tokenB**: What the seller wants (buyer must provide)
- **Order ID**: Identifies the specific order within the market

### Fee Model Independence

The same signature works for both fee models:
- **Proportional Fee**: Percentage-based calculation
- **Fixed Fee**: Capped fee with maximum limits
- **Fee Choice**: Determined by which function is called, not the signature

:::tip Technical Details

- **Message Format**: The final message follows the pattern `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Hash Function**: `keccak256` is used for the final message hash before signing
- **Signature Recovery**: Uses `ecrecover` to verify the signature against the expected signer
- **String Conversion**: 
  - `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Universal Signature**: Same signature structure works for both proportional and fixed fee dispatch functions
- **Order Identification**: Token pair and order ID uniquely identify the target order
- **Buyer Authorization**: Signature proves the buyer authorizes the specific order fulfillment

:::