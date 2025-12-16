---
title: "SignatureRecover Library"
description: "EIP-191 signature recovery and validation primitives for EVVM message verification"
sidebar_position: 2
---

# SignatureRecover Library

The `SignatureRecover` library provides low-level EIP-191 signature recovery and validation. It handles the cryptographic operations needed to verify that a message was signed by a specific address.

## Overview

**Library Type**: Pure functions  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/primitives/SignatureRecover.sol`  
**Standard**: EIP-191 (Ethereum Signed Message)

### Key Features

- **EIP-191 compliant** signature recovery
- **Address extraction** from signatures
- **Signature validation** (length and v value checks)
- **Gas-optimized** assembly operations

## Functions

### `recoverSigner`
```solidity
function recoverSigner(
    string memory message,
    bytes memory signature
) internal pure returns (address)
```

**Description**: Recovers the signer address from a message and its signature

**Parameters**:
- `message`: The original message that was signed
- `signature`: 65-byte ECDSA signature (r, s, v components)

**Returns**: Address that created the signature

**EIP-191 Format**: 
```
"\x19Ethereum Signed Message:\n" + len(message) + message
```

**Example**:
```solidity
string memory message = "123,orderCoffee,latte,1,1000000000000000";
bytes memory signature = hex"..."; // User's signature

address signer = SignatureRecover.recoverSigner(message, signature);
// signer = address who signed the message
```

**Detailed Process**:
1. Constructs EIP-191 prefix with message length
2. Hashes the prefixed message with keccak256
3. Splits signature into r, s, v components
4. Calls `ecrecover` to extract signer address

### `splitSignature`
```solidity
function splitSignature(
    bytes memory signature
) internal pure returns (bytes32 r, bytes32 s, uint8 v)
```

**Description**: Splits a 65-byte signature into its cryptographic components

**Parameters**:
- `signature`: 65-byte signature (r: 32 bytes, s: 32 bytes, v: 1 byte)

**Returns**:
- `r`: First 32 bytes (signature component)
- `s`: Next 32 bytes (signature component)
- `v`: Last byte (recovery id, normalized to 27 or 28)

**Validation**:
- Requires signature length exactly 65 bytes
- Normalizes v to 27 or 28 (adds 27 if v < 27)
- Validates v is either 27 or 28

**Example**:
```solidity
bytes memory sig = userSignature; // 65 bytes

(bytes32 r, bytes32 s, uint8 v) = SignatureRecover.splitSignature(sig);
// r = first 32 bytes
// s = next 32 bytes
// v = 27 or 28
```

**Reverts**:
- `"Invalid signature length"` if signature is not exactly 65 bytes
- `"Invalid signature value"` if v is not 27 or 28 after normalization

## EIP-191 Standard

### Message Format
```solidity
keccak256(
    abi.encodePacked(
        "\x19Ethereum Signed Message:\n",
        length_as_string,
        message
    )
)
```

**Components**:
1. **Prefix**: `"\x19Ethereum Signed Message:\n"`
2. **Length**: String representation of message byte length
3. **Message**: The actual message content

**Example Message Construction**:
```solidity
// Message: "123,orderCoffee,latte,1,1000000000000000"
// Length: 40 characters
// Full format: "\x19Ethereum Signed Message:\n40123,orderCoffee,latte,1,1000000000000000"
```

### Why EIP-191?

1. **Prevents signature reuse** across different contexts
2. **User-friendly** wallet integration (MetaMask, etc.)
3. **Clear signing intent** for users
4. **Industry standard** for Ethereum signatures

## Signature Components

### ECDSA Signature Structure
```
[r (32 bytes)][s (32 bytes)][v (1 byte)] = 65 bytes total
```

- **r**: X-coordinate of random point on elliptic curve
- **s**: Signature proof
- **v**: Recovery id (which of 4 possible points was used)

### Recovery ID (v)
- **Original range**: 0-3
- **Ethereum standard**: 27-28 (adds 27 to original)
- **Purpose**: Determines which public key to recover

## Common Use Cases

### Use Case 1: Direct Signature Verification
```solidity
contract MessageValidator {
    function verifyMessage(
        string memory message,
        bytes memory signature,
        address expectedSigner
    ) public pure returns (bool) {
        address recovered = SignatureRecover.recoverSigner(message, signature);
        return recovered == expectedSigner;
    }
}

// Usage
bool isValid = verifyMessage(
    "Hello, World!",
    userSignature,
    userAddress
);
```

### Use Case 2: Multi-Signature Validation
```solidity
function verifyMultiSig(
    string memory message,
    bytes[] memory signatures,
    address[] memory signers
) public pure returns (bool) {
    require(signatures.length == signers.length, "Length mismatch");
    
    for (uint256 i = 0; i < signatures.length; i++) {
        address recovered = SignatureRecover.recoverSigner(
            message,
            signatures[i]
        );
        if (recovered != signers[i]) {
            return false;
        }
    }
    return true;
}
```

### Use Case 3: Signature Component Analysis
```solidity
function analyzeSignature(bytes memory sig) public pure returns (
    bytes32 r,
    bytes32 s,
    uint8 v,
    bool isValid
) {
    if (sig.length != 65) {
        return (0, 0, 0, false);
    }
    
    (r, s, v) = SignatureRecover.splitSignature(sig);
    isValid = (v == 27 || v == 28);
}
```

### Use Case 4: Building Higher-Level Verification
```solidity
library CustomSignatureUtil {
    function verifyActionSignature(
        uint256 evvmId,
        string memory action,
        string memory params,
        bytes memory signature,
        address signer
    ) internal pure returns (bool) {
        // Construct EVVM-style message
        string memory message = string.concat(
            AdvancedStrings.uintToString(evvmId),
            ",",
            action,
            ",",
            params
        );
        
        // Use SignatureRecover
        address recovered = SignatureRecover.recoverSigner(message, signature);
        return recovered == signer;
    }
}
```

## Frontend Integration

### JavaScript/TypeScript Example
```typescript
import { ethers } from 'ethers';

// Sign message (frontend)
async function signMessage(signer: ethers.Signer, message: string): Promise<string> {
    // Wallet automatically adds EIP-191 prefix
    const signature = await signer.signMessage(message);
    return signature;
}

// Example usage
const message = "123,orderCoffee,latte,1,1000000000000000";
const signature = await signMessage(wallet, message);

// Smart contract can now verify with SignatureRecover.recoverSigner()
```

### ethers.js Verification (Off-Chain)
```typescript
import { ethers } from 'ethers';

function verifySignature(
    message: string,
    signature: string,
    expectedAddress: string
): boolean {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
}
```

## Security Considerations

### 1. Signature Malleability
**Issue**: ECDSA signatures can be malleated (different valid signatures for same message)

**Impact**: Not relevant for EVVM (we verify signer, not signature uniqueness)

**Note**: If you need signature uniqueness, use nonces (handled by `AsyncNonceService`)

### 2. Message Prefix
**Important**: Always use EIP-191 prefix (automatic with this library)

```solidity
// Good - uses EIP-191
address signer = SignatureRecover.recoverSigner(message, signature);

// Bad - direct ecrecover without prefix
bytes32 hash = keccak256(abi.encodePacked(message));
address signer = ecrecover(hash, v, r, s); // Vulnerable!
```

### 3. Signature Validation
**Always validate**:
- Signature length (65 bytes)
- v value (27 or 28)
- Recovered address is not zero

```solidity
// Good - validation included
address signer = SignatureRecover.recoverSigner(message, signature);
require(signer != address(0), "Invalid signature");
require(signer == expectedSigner, "Wrong signer");

// Bad - no zero address check
address signer = SignatureRecover.recoverSigner(message, signature);
require(signer == expectedSigner); // signer could be address(0)
```

### 4. Replay Protection
**SignatureRecover alone does NOT prevent replays**

```solidity
// Good - add nonce
string memory message = string.concat(
    "action,param1,param2,",
    AdvancedStrings.uintToString(nonce)
);
address signer = SignatureRecover.recoverSigner(message, signature);

// Bad - no nonce, signature can be reused
string memory message = "action,param1,param2";
address signer = SignatureRecover.recoverSigner(message, signature);
```

## Error Messages

### "Invalid signature length"
**Cause**: Signature is not exactly 65 bytes  
**Solution**: Ensure signature from wallet is complete ECDSA signature

### "Invalid signature value"
**Cause**: v component is not 27 or 28 after normalization  
**Solution**: Check signature generation process

## Gas Costs

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| `recoverSigner` | ~3,000-5,000 | Includes keccak256 + ecrecover |
| `splitSignature` | ~200-300 | Mostly assembly operations |
| `ecrecover` (precompile) | ~3,000 | Ethereum precompiled contract |

## Integration with EVVM Libraries

This library is used by:

### SignatureUtil
```solidity
library SignatureUtil {
    function verifySignature(...) internal pure returns (bool) {
        return SignatureRecover.recoverSigner(
            constructedMessage,
            signature
        ) == expectedSigner;
    }
}
```

### EvvmService
```solidity
abstract contract EvvmService {
    function validateServiceSignature(...) internal view {
        if (!SignatureUtil.verifySignature(...)) {
            revert InvalidServiceSignature();
        }
    }
}
```

## Best Practices

### 1. Always Use EIP-191
```solidity
// Good - EIP-191 via SignatureRecover
address signer = SignatureRecover.recoverSigner(message, signature);

// Bad - raw keccak256 (vulnerable)
bytes32 hash = keccak256(bytes(message));
address signer = ecrecover(hash, v, r, s);
```

### 2. Validate Zero Address
```solidity
// Good
address recovered = SignatureRecover.recoverSigner(msg, sig);
require(recovered != address(0) && recovered == expected, "Invalid");

// Bad - missing zero check
address recovered = SignatureRecover.recoverSigner(msg, sig);
require(recovered == expected); // Could match if both are zero
```

### 3. Use Higher-Level Libraries When Possible
```solidity
// Better - use SignatureUtil
bool valid = SignatureUtil.verifySignature(evvmId, "action", params, sig, user);

// Works but more code - direct SignatureRecover
string memory message = string.concat(
    AdvancedStrings.uintToString(evvmId),
    ",action,",
    params
);
address signer = SignatureRecover.recoverSigner(message, sig);
bool valid = (signer == user);
```

### 4. Cache Recovered Addresses
```solidity
// Good - recover once
address signer = SignatureRecover.recoverSigner(message, signature);
require(signer == expectedSigner, "Invalid signer");
require(signer != owner, "Owner cannot call");

// Bad - recover multiple times
require(
    SignatureRecover.recoverSigner(message, signature) == expectedSigner,
    "Invalid signer"
);
require(
    SignatureRecover.recoverSigner(message, signature) != owner,
    "Owner cannot call"
); // Wastes ~3000 gas
```

---

## See Also

- **[SignatureUtil](../04-Utils/02-SignatureUtil.md)** - Higher-level signature verification
- **[EvvmService](../02-EvvmService.md)** - Service contract using signature verification
- **[AdvancedStrings](../04-Utils/01-AdvancedStrings.md)** - Message construction utilities
- [EIP-191 Specification](https://eips.ethereum.org/EIPS/eip-191)
- [ECDSA Signature Standard](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm)
