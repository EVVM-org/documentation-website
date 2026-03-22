---
title: "Single Payment Signature Structure"
description: "EIP-191 signature format for single payment operations verified by Core.sol"
sidebar_position: 1
---

# Single Payment Signature Structure

:::info[Centralized Verification]
Payment signatures are **verified by Core.sol** using `validateAndConsumeNonce()`.
:::

To authorize payment operations, the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification is centralized in Core.sol, which validates the signature, checks nonce validity, and handles executor authorization in a single atomic operation.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **senderExecutor**: Address that can call the function via msg.sender (address, `0x0...0` for anyone)
3. **hashPayload**: Hash of payment parameters (bytes32, from CoreHashUtils)
4. **originExecutor**: EOA that can initiate the transaction via tx.origin (address, `0x0...0` for anyone)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Execution mode - `true` for async, `false` for sync (boolean)

**Dual-Executor Model:**
- `senderExecutor`: Controls which address can execute via `msg.sender` (contract or EOA)
- `originExecutor`: Controls which EOA can initiate via `tx.origin`
- Both can be `address(0)` for maximum flexibility (anyone can execute/initiate)
- Hash payload does NOT include executors (only operation parameters)

## Hash Payload Generation

The `hashPayload` is generated using **CoreHashUtils.hashDataForPay()**:

```solidity
import {CoreHashUtils} from "@evvm/testnet-contracts/library/signature/CoreHashUtils.sol";

bytes32 hashPayload = CoreHashUtils.hashDataForPay(
    receiver,      // address or username (bytes32 hash)
    token,         // ERC20 token address (0x0...0 for ETH)
    amount,        // Amount in wei
    priorityFee    // Fee amount in wei
);
```

### Hash Generation Process

CoreHashUtils creates a deterministic hash:

```solidity
// Actual CoreHashUtils implementation
function hashDataForPay(
    address to_address,
    string memory to_identity,
    address token,
    uint256 amount,
    uint256 priorityFee
) public pure returns (bytes32) {
    return keccak256(
        abi.encode(
            "pay",
            to_address,
            to_identity,
            token,
            amount,
            priorityFee
        )
    );
}
```

**Key Points:**
- Function name "pay" is included in the hash
- Both `to_address` and `to_identity` are included (not bytes32)
- Hash is deterministic: same parameters → same hash
- **Executors are NOT part of the hash** - they're only in the signature payload

## Centralized Verification

Core.sol verifies the signature using `validateAndConsumeNonce()`:

```solidity
// Called by services (internal to Core.sol payment functions)
Core(coreAddress).validateAndConsumeNonce(
    user,             // Signer's address
    senderExecutor,   // Who can call via msg.sender
    hashPayload,      // From CoreHashUtils
    originExecutor,   // Who can initiate via tx.origin
    nonce,            // User's nonce
    isAsyncExec,      // Execution mode
    signature         // EIP-191 signature
);
```

**What validateAndConsumeNonce() Does:**
1. Constructs full signature message with all 6 components
2. Applies EIP-191 wrapping and hashing
3. Recovers signer from signature using ecrecover
4. Validates signer matches `user` parameter
5. Checks nonce status (must be available for sync, reserved for async)
6. Validates senderExecutor authorization (if not `0x0...0`, checks msg.sender)
7. Validates originExecutor authorization (if not `0x0...0`, checks tx.origin)
8. Marks nonce as consumed
9. Optionally delegates to UserValidator contract

## Message Construction

The signature message is constructed internally by Core.sol:

```solidity
// Internal Core.sol message construction using AdvancedStrings.buildSignaturePayload
string memory message = AdvancedStrings.buildSignaturePayload(
    evvmId,            // Network ID
    senderExecutor,    // msg.sender control
    hashPayload,       // Operation hash
    originExecutor,    // tx.origin control
    nonce,             // User's nonce
    isAsyncExec        // Execution mode
);

// buildSignaturePayload returns:
// "{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}"
```

### EIP-191 Message Hashing

The message is then hashed according to EIP-191:

```solidity
bytes32 messageHash = keccak256(
    abi.encodePacked(
        "\x19Ethereum Signed Message:\n",
        AdvancedStrings.uintToString(bytes(message).length),
        message
    )
);
```

This creates the final hash that the user signs with their private key.

## Complete Example: Send 0.05 ETH

**Scenario:** User wants to send 0.05 ETH to `0x742d...82d8c` with synchronous execution

### Step 1: Generate Hash Payload

```solidity
import {CoreHashUtils} from "@evvm/testnet-contracts/library/signature/CoreHashUtils.sol";

address receiver = 0x742d7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c;
string memory identity = "";  // Empty for address-only payment
address token = address(0);  // ETH
uint256 amount = 50000000000000000;  // 0.05 ETH
uint256 priorityFee = 1000000000000000;  // 0.001 ETH

bytes32 hashPayload = CoreHashUtils.hashDataForPay(
    receiver,
    identity,
    token,
    amount,
    priorityFee
);

// Result: 0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
```

### Step 2: Construct Signature Message

**Parameters:**
- `evvmId`: `1`
- `senderExecutor`: `0x0000000000000000000000000000000000000000` (anyone can call)
- `hashPayload`: `0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1`
- `originExecutor`: `0x0000000000000000000000000000000000000000` (anyone can initiate)
- `nonce`: `42`
- `isAsyncExec`: `false`

**Final Message:**
```
1,0x0000000000000000000000000000000000000000,0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1,0x0000000000000000000000000000000000000000,42,false
```

### Step 3: EIP-191 Formatted Hash

```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n138",
    "1,0x0000000000000000000000000000000000000000,0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1,0x0000000000000000000000000000000000000000,42,false"
))
```

### Step 4: User Signs Message

The user signs the message using MetaMask or another EIP-191 compatible wallet:

```javascript
// Frontend example (ethers.js)
const message = "1,0x0000000000000000000000000000000000000000,0xa7f3...a0b1,0x0000000000000000000000000000000000000000,42,false";
const signature = await signer.signMessage(message);
```

### Step 5: Submit Transaction

```solidity
// Call Core.sol payment function
Core(coreAddress).pay(
    receiver,
    receiverIdentity,  // Empty bytes32 when using address
    token,
    amount,
    priorityFee,
    executor,
    nonce,
    isAsyncExec,
    signature
);
```

Core.sol internally calls `validateAndConsumeNonce()` to verify the signature before processing payment.

## Example with Username

**Scenario:** Send 0.05 ETH to username `alice` with async execution

### Step 1: Convert Username to Bytes32

```solidity
bytes32 usernameHash = keccak256(abi.encodePacked("alice"));
// Result: 0x2b3e82d9a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1
```

### Step 2: Generate Hash Payload

```solidity
bytes32 hashPayload = CoreHashUtils.hashDataForPay(
    usernameHash,  // Username as bytes32
    address(0),    // ETH
    50000000000000000,   // 0.05 ETH
    2000000000000000     // 0.002 ETH fee
);
```

### Step 3: Construct Signature Message

**Parameters:**
- `evvmId`: `1`
- `serviceAddress`: `0xCoreContractAddress`
- `hashPayload`: `0xb4c2d8e9f1a6c5d8...` (from Step 2)
- `executor`: `0x0000000000000000000000000000000000000000`
- `nonce`: `15`
- `isAsyncExec`: `true` (async)

**Final Message:**
```
1,0xCoreContractAddress,0xb4c2d8e9f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3,0x0000000000000000000000000000000000000000,15,true
```

### Step 4: Sign and Submit

```solidity
Core(coreAddress).pay(
    address(0),         // No direct address
    usernameHash,       // Username identifier
    address(0),         // ETH
    50000000000000000,
    2000000000000000,
    address(0),         // Unrestricted
    15,
    true,               // Async
    signature
);
```

## Parameter Formatting

Use `AdvancedStrings` library for proper conversions:

```solidity
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";

// Convert types to strings
AdvancedStrings.uintToString(42);                    // "42"
AdvancedStrings.addressToString(0x742d...);          // "0x742d7b6b..."
AdvancedStrings.bytes32ToString(0xa7f3...);          // "0xa7f3c2d8..."
```

## Signature Requirements

- **Length**: Exactly 65 bytes
- **Structure**: `[r (32 bytes)][s (32 bytes)][v (1 byte)]`
- **V Value**: 27 or 28 (automatically adjusted by wallets)
- **Standard**: EIP-191 compliant

## Best Practices

### Security
- **Never reuse nonces**: Each signature must have a unique nonce
- **Validate parameters**: Check receiver, amount, token before signing
- **Use async cautiously**: Async execution requires nonce reservation

### Development
- **Use CoreHashUtils**: Don't manually construct `hashPayload`
- **Test signature generation**: Verify message format matches expected structure
- **Track nonces**: Query Core.sol for next available nonce
- **Handle executor properly**: Use `0x0...0` for public, specific address for restricted

### Gas Optimization
- **Prefer sync execution**: Async costs more gas due to nonce reservation
- **Batch payments**: Use `batchPay()` for multiple recipients
- **Cache hash payload**: Reuse for multiple signatures with same parameters

## Related Operations

- **[Batch Payment Signatures](./02-DispersePaySignatureStructure.md)** - Multiple recipients
- **[Withdrawal Signatures](./03-WithdrawalPaymentSignatureStructure.md)** - Withdraw from Core balance
- **[Core.sol Payment Functions](../../04-Contracts/01-EVVM/04-PaymentFunctions/01-pay.md)** - Function reference

---

:::tip Key Takeaway
Signatures use **hash-based payload encoding** and centralized verification in Core.sol for improved security and gas efficiency.
:::
