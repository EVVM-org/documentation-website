---
title: "AdvancedStrings Library"
description: "Type conversion utilities for uint256, address, bytes, and bytes32 to string conversions"
sidebar_position: 1
---

# AdvancedStrings Library

The `AdvancedStrings` library provides efficient type conversion utilities, primarily for converting Solidity types to their string representations. This is essential for constructing human-readable messages for signature verification.

## Overview

**Library Type**: Pure functions  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/utils/AdvancedStrings.sol`

### Key Features

- **uint256 to string** conversion
- **Address to checksummed string**
- **Bytes to hex string** conversion
- **String equality** comparison
- **Gas-optimized** implementations

## Functions

### `uintToString`
```solidity
function uintToString(uint256 value) internal pure returns (string memory)
```

**Description**: Converts a uint256 to its decimal string representation

**Parameters**:
- `value`: The uint256 number to convert

**Returns**: String representation (e.g., `"12345"`)

**Example**:
```solidity
string memory str = AdvancedStrings.uintToString(12345);
// str = "12345"

string memory zero = AdvancedStrings.uintToString(0);
// zero = "0"

string memory large = AdvancedStrings.uintToString(type(uint256).max);
// large = "115792089237316195423570985008687907853269984665640564039457584007913129639935"
```

**Implementation Details**:
- Uses `Math.log10` to calculate string length
- Builds string from right to left
- Gas-optimized with assembly memory operations

**Use Cases**:
- Constructing signature messages
- Building event data
- Creating human-readable identifiers

### `addressToString`
```solidity
function addressToString(address _address) internal pure returns (string memory)
```

**Description**: Converts an address to its hex string representation with `0x` prefix

**Parameters**:
- `_address`: The address to convert

**Returns**: Hex string in format `"0x..."` (42 characters)

**Example**:
```solidity
address user = 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2;
string memory str = AdvancedStrings.addressToString(user);
// str = "0x742d35cc6634c0532925a3b844bc9e7595f0beb2"

address zero = address(0);
string memory zeroStr = AdvancedStrings.addressToString(zero);
// zeroStr = "0x0000000000000000000000000000000000000000"
```

**Format**:
- Always 42 characters (2 for "0x" + 40 for address)
- Lowercase hex representation
- Zero-padded to full length

**Use Cases**:
- Converting addresses for signature messages
- Logging and debugging
- Creating readable address representations

### `equal`
```solidity
function equal(string memory a, string memory b) internal pure returns (bool)
```

**Description**: Compares two strings for equality

**Parameters**:
- `a`: First string
- `b`: Second string

**Returns**: `true` if strings are identical, `false` otherwise

**Example**:
```solidity
bool same = AdvancedStrings.equal("hello", "hello");
// same = true

bool different = AdvancedStrings.equal("hello", "world");
// different = false

bool empty = AdvancedStrings.equal("", "");
// empty = true
```

**Implementation**:
1. Compares lengths first (gas optimization)
2. If lengths match, compares keccak256 hashes

**Use Cases**:
- String validation
- Command/action matching
- Input verification

### `bytesToString`
```solidity
function bytesToString(bytes memory data) internal pure returns (string memory)
```

**Description**: Converts bytes to hex string representation with `0x` prefix

**Parameters**:
- `data`: Bytes array to convert

**Returns**: Hex string in format `"0x..."` (2 + data.length * 2 characters)

**Example**:
```solidity
bytes memory data = hex"deadbeef";
string memory str = AdvancedStrings.bytesToString(data);
// str = "0xdeadbeef"

bytes memory empty = "";
string memory emptyStr = AdvancedStrings.bytesToString(empty);
// emptyStr = "0x"
```

**Format**:
- Starts with "0x"
- Each byte becomes 2 hex characters
- Lowercase hex representation

**Use Cases**:
- Converting signature bytes to readable format
- Logging transaction data
- Debugging byte arrays

### `bytes32ToString`
```solidity
function bytes32ToString(bytes32 data) internal pure returns (string memory)
```

**Description**: Converts bytes32 to hex string representation with `0x` prefix

**Parameters**:
- `data`: bytes32 value to convert

**Returns**: Hex string in format `"0x..."` (66 characters: 2 + 32 * 2)

**Example**:
```solidity
bytes32 hash = keccak256("hello");
string memory str = AdvancedStrings.bytes32ToString(hash);
// str = "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
```

**Format**:
- Always 66 characters (2 for "0x" + 64 for bytes32)
- Lowercase hex representation
- Zero-padded

**Use Cases**:
- Converting hash values to strings
- Logging bytes32 data
- Creating readable hash representations

---

### `buildSignaturePayload`
```solidity
function buildSignaturePayload(
    uint256 evvmId,
    address senderExecutor,
    bytes32 hashPayload,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec
) internal pure returns (string memory payload)
```

**Description**: Builds the complete EIP-191 signature payload for EVVM Core.sol validation. This is the **primary function** for constructing signature messages in the centralized EVVM architecture.

**Parameters**:
- `evvmId`: Chain-specific EVVM instance identifier
- `senderExecutor`: Service contract requesting validation (usually `address(this)`)
- `hashPayload`: Function-specific parameter hash from HashUtils libraries
- `originExecutor`: Original executor address (user or relayer)
- `nonce`: Sequential (sync) or user-chosen (async) nonce
- `isAsyncExec`: Nonce type (`true` = async, `false` = sync)

**Returns**: Comma-separated signature payload string formatted as:
```
"{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}"
```

**Example Output**:
```
"1,0xabcd1234...,0x1c8aff95...,0x5678efgh...,42,true"
```

**Example Usage with Core.sol Pay**:
```solidity
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";
import {CoreHashUtils} from "@evvm/testnet-contracts/library/utils/signature/CoreHashUtils.sol";

// Step 1: Generate function-specific hash
bytes32 hashPayload = CoreHashUtils.hashDataForPay(
    recipientAddress,
    "alice",                    // username
    tokenAddress,
    1000000000000000000,        // 1 token
    100000000000000000          // 0.1 token fee
);

// Step 2: Build signature payload
string memory payload = AdvancedStrings.buildSignaturePayload(
    evvmMetadata.EvvmID,        // Chain ID
    address(this),              // Service contract (senderExecutor)
    hashPayload,                // Function-specific hash
    msg.sender,                 // originExecutor
    nonce,                      // User's nonce
    true                        // isAsyncExec
);

// Step 3: Verify signature with payload
address signer = SignatureRecover.recoverSigner(payload, signature);
require(signer == expectedUser, "Invalid signature");
```

**Integration with Core.validateAndConsumeNonce**:
```solidity
// Core.sol internally uses buildSignaturePayload for validation
core.validateAndConsumeNonce(
    user,
    hashPayload,
    originExecutor,
    nonce,
    isAsyncExec,
    signature
);

// Which internally reconstructs the same payload:
// AdvancedStrings.buildSignaturePayload(
//     evvmMetadata.EvvmID,
//     msg.sender,              // Service calling validateAndConsumeNonce
//     hashPayload,
//     originExecutor,
//     nonce,
//     isAsyncExec
// )
```

**Format Details**:
- Uses lowercase hex for addresses (`0xabcd...` not `0xABCD...`)
- Uses lowercase hex for bytes32 hashes (66 characters: `0x` + 64 hex)
- Uses decimal for uint256 values
- Uses lowercase `"true"` or `"false"` for booleans
- All components comma-separated, no spaces

**Related Functions**:
- `CoreHashUtils.hashDataForPay()` - Generates hashPayload for Core.pay
- `NameServiceHashUtils.*` - Generates hashPayload for NameService operations
- `StakingHashUtils.*` - Generates hashPayload for Staking operations
- `P2PSwapHashUtils.*` - Generates hashPayload for P2PSwap operations
- `Core.validateAndConsumeNonce()` - Validates signatures using this payload format

---

## Common Use Cases

### Use Case 1: Constructing Signature Messages
```solidity
function buildSignatureMessage(
    uint256 evvmId,
    string memory action,
    uint256 param1,
    uint256 param2,
    uint256 nonce
) internal pure returns (string memory) {
    return string.concat(
        AdvancedStrings.uintToString(evvmId),
        ",",
        action,
        ",",
        AdvancedStrings.uintToString(param1),
        ",",
        AdvancedStrings.uintToString(param2),
        ",",
        AdvancedStrings.uintToString(nonce)
    );
}

// Example: "123,orderCoffee,2,1000000000000000000,456789"
string memory message = buildSignatureMessage(123, "orderCoffee", 2, 1 ether, 456789);
```

### Use Case 2: Address-Based Messages
```solidity
function createTransferMessage(
    address from,
    address to,
    uint256 amount
) internal pure returns (string memory) {
    return string.concat(
        "Transfer from ",
        AdvancedStrings.addressToString(from),
        " to ",
        AdvancedStrings.addressToString(to),
        " amount: ",
        AdvancedStrings.uintToString(amount)
    );
}

// Example: "Transfer from 0x742d...beb2 to 0x123a...def4 amount: 1000000000000000000"
```

### Use Case 3: String Comparison for Commands
```solidity
function executeCommand(string memory command, bytes memory data) external {
    if (AdvancedStrings.equal(command, "deposit")) {
        handleDeposit(data);
    } else if (AdvancedStrings.equal(command, "withdraw")) {
        handleWithdraw(data);
    } else if (AdvancedStrings.equal(command, "transfer")) {
        handleTransfer(data);
    } else {
        revert("Unknown command");
    }
}
```

### Use Case 4: Debugging and Logging
```solidity
event DebugInfo(string message);

function debugTransaction(
    address user,
    bytes32 txHash,
    uint256 amount,
    bytes memory signature
) internal {
    emit DebugInfo(
        string.concat(
            "User: ",
            AdvancedStrings.addressToString(user),
            " TxHash: ",
            AdvancedStrings.bytes32ToString(txHash),
            " Amount: ",
            AdvancedStrings.uintToString(amount),
            " Sig: ",
            AdvancedStrings.bytesToString(signature)
        )
    );
}
```

## Integration with EVVM

### Primary Use: Core.sol Centralized Signatures
The `buildSignaturePayload` function is the **standard method** for constructing signatures in EVVM services:

```solidity
// How EVVM services validate signatures via Core.sol
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";
import {CoreHashUtils} from "@evvm/testnet-contracts/library/utils/signature/CoreHashUtils.sol";
import {SignatureRecover} from "@evvm/testnet-contracts/library/primitives/SignatureRecover.sol";

function processPayment(
    address user,
    address recipient,
    address token,
    uint256 amount,
    uint256 priorityFee,
    uint256 nonce,
    bytes memory signature
) internal {
    // Generate function-specific hash
    bytes32 hashPayload = CoreHashUtils.hashDataForPay(
        recipient,
        "",
        token,
        amount,
        priorityFee
    );
    
    // Build signature payload (centralized format)
    string memory payload = AdvancedStrings.buildSignaturePayload(
        getEvvmID(),
        address(this),
        hashPayload,
        user,
        nonce,
        true
    );
    
    // Verify signature
    require(
        SignatureRecover.recoverSigner(payload, signature) == user,
        "Invalid signature"
    );
    
    // Or use Core.validateAndConsumeNonce directly (recommended):
    core.validateAndConsumeNonce(
        user,
        hashPayload,
        user,
        nonce,
        true,
        signature
    );
}
```

### Legacy Use: SignatureUtil (External Chain Only)
For External Chain treasury operations, the older `SignatureUtil` pattern is still used:

```solidity
// ONLY for TreasuryExternalChainStation - not standard services
library SignatureUtil {
    function verifySignature(
        uint256 evvmID,
        string memory functionName,
        string memory inputs,
        bytes memory signature,
        address expectedSigner
    ) internal pure returns (bool) {
        return SignatureRecover.recoverSigner(
            string.concat(
                AdvancedStrings.uintToString(evvmID), // Uses AdvancedStrings
                ",",
                functionName,
                ",",
                inputs
            ),
            signature
        ) == expectedSigner;
    }
}
```

### Used with EvvmService
```solidity
// AdvancedStrings is used internally by SignatureUtil when building the message string.
// In modern EVVM services, prefer core.validateAndConsumeNonce() which handles
// signature verification and nonce consumption atomically using the centralized format:
// {evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
//
// SignatureUtil.verifySignature() remains useful for custom service-level signatures
// that follow the simpler "{evvmID},{functionName},{inputs}" format.
```

## Gas Optimization Tips

### 1. Cache String Conversions
```solidity
// Good - convert once
string memory amountStr = AdvancedStrings.uintToString(amount);
string memory message1 = string.concat("Message1: ", amountStr);
string memory message2 = string.concat("Message2: ", amountStr);

// Bad - convert multiple times
string memory message1 = string.concat("Message1: ", AdvancedStrings.uintToString(amount));
string memory message2 = string.concat("Message2: ", AdvancedStrings.uintToString(amount));
```

### 2. Use Constants for Fixed Strings
```solidity
// Good - use string literals for fixed values
string memory token0 = token == address(0) ? "ETH" : "TOKEN";

// Bad - unnecessary conversion
string memory token0 = AdvancedStrings.addressToString(address(0)); // "0x0000..."
```

### 3. Minimize String Concatenations
```solidity
// Good - single concat
string memory message = string.concat(
    AdvancedStrings.uintToString(a),
    ",",
    AdvancedStrings.uintToString(b),
    ",",
    AdvancedStrings.uintToString(c)
);

// Bad - multiple operations
string memory message = AdvancedStrings.uintToString(a);
message = string.concat(message, ",");
message = string.concat(message, AdvancedStrings.uintToString(b));
// ... more concats
```

## Gas Costs

| Function | Typical Gas Cost | Notes |
|----------|-----------------|-------|
| `uintToString` | ~500-2,000 | Depends on number size |
| `addressToString` | ~1,000 | Fixed cost |
| `equal` | ~200-500 | Depends on length |
| `bytesToString` | ~500-5,000 | Depends on data length |
| `bytes32ToString` | ~1,500 | Fixed cost |

## Best Practices

### 1. Use Type-Appropriate Functions
```solidity
// Good - use addressToString for addresses
string memory addrStr = AdvancedStrings.addressToString(userAddress);

// Bad - converting address to uint (loses information)
string memory wrongStr = AdvancedStrings.uintToString(uint256(uint160(userAddress)));
```

### 2. Pre-Compute Static Strings
```solidity
// Good - compute once in constructor or constant
string public constant ACTION_NAME = "orderCoffee";

function buildMessage(uint256 nonce) internal pure returns (string memory) {
    return string.concat(
        ACTION_NAME, // Use pre-defined
        ",",
        AdvancedStrings.uintToString(nonce)
    );
}

// Bad - re-create string each time
function buildMessage(uint256 nonce) internal pure returns (string memory) {
    return string.concat(
        "orderCoffee", // Creates new string each call
        ",",
        AdvancedStrings.uintToString(nonce)
    );
}
```

### 3. Validate Before Converting
```solidity
// Good - validate first
require(amount > 0, "Invalid amount");
string memory amountStr = AdvancedStrings.uintToString(amount);

// Bad - convert then validate (wastes gas on failure)
string memory amountStr = AdvancedStrings.uintToString(amount);
require(amount > 0, "Invalid amount");
```

## Common Patterns

### Pattern 1: EVVM Signature Message Format
```solidity
string memory message = string.concat(
    AdvancedStrings.uintToString(evvmID),
    ",",
    functionName,
    ",",
    params // Pre-formatted parameter string
);
```

### Pattern 2: Transaction Receipt String
```solidity
string memory receipt = string.concat(
    "From: ", AdvancedStrings.addressToString(from),
    " To: ", AdvancedStrings.addressToString(to),
    " Amount: ", AdvancedStrings.uintToString(amount),
    " TxHash: ", AdvancedStrings.bytes32ToString(txHash)
);
```

### Pattern 3: Parameter String Builder
```solidity
function buildParams(
    string memory param1,
    uint256 param2,
    address param3
) internal pure returns (string memory) {
    return string.concat(
        param1,
        ",",
        AdvancedStrings.uintToString(param2),
        ",",
        AdvancedStrings.addressToString(param3)
    );
}
```

---

## See Also

- **[SignatureUtil](./02-SignatureUtil.md)** - Uses AdvancedStrings for message construction
- **[EvvmService](../02-EvvmService.md)** - Relies on signature message formatting
- **[Math Library](../03-Primitives/01-Math.md)** - Used internally for log10 calculation
