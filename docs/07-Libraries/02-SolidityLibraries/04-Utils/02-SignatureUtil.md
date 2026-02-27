---
title: "SignatureUtil Library"
description: "High-level signature verification for EVVM-formatted messages"
sidebar_position: 2
---

# SignatureUtil Library

The `SignatureUtil` library provides high-level signature verification specifically designed for EVVM message formats. It combines `SignatureRecover` and `AdvancedStrings` to offer a simple, one-function verification solution.

## Overview

**Library Type**: Pure functions  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/utils/SignatureUtil.sol`

### Key Features

- **One-function verification** for EVVM messages
- **Automatic message formatting** with EVVM ID
- **Built-in EIP-191 compliance** via SignatureRecover
- **Type-safe** parameter handling

## Function

### `verifySignature`
```solidity
function verifySignature(
    uint256 evvmID,
    string memory functionName,
    string memory inputs,
    bytes memory signature,
    address expectedSigner
) internal pure returns (bool)
```

**Description**: Verifies that a signature matches the EVVM message format and was signed by the expected address

**Parameters**:
- `evvmID`: The EVVM blockchain ID (from `IEvvm.getEvvmID()`)
- `functionName`: Name of the function being called (e.g., "orderCoffee")
- `inputs`: Comma-separated parameter string (e.g., "latte,2,1000000000000000,12345")
- `signature`: 65-byte ECDSA signature
- `expectedSigner`: Address that should have signed the message

**Returns**: `true` if signature is valid and from expected signer, `false` otherwise

**Message Format**: `"<evvmID>,<functionName>,<inputs>"`

**Example**:
```solidity
// Verify a coffee order signature
bool isValid = SignatureUtil.verifySignature(
    123,                    // evvmID
    "orderCoffee",         // function name
    "latte,2,1000000000000000,12345",  // inputs (coffee type, quantity, price, nonce)
    userSignature,         // signature bytes
    customerAddress        // expected signer
);

if (isValid) {
    // Process order
} else {
    revert("Invalid signature");
}
```

## Message Construction

### Standard EVVM Format
```
"<evvmID>,<functionName>,<inputs>"
```

**Components**:
1. **evvmID**: Unique identifier for the EVVM blockchain instance
2. **functionName**: Action being performed
3. **inputs**: Function-specific parameters (comma-separated)

### Examples

#### Example 1: Coffee Order
```solidity
// Message: "123,orderCoffee,latte,2,1000000000000000,12345"
bool valid = SignatureUtil.verifySignature(
    123,                                    // evvmID
    "orderCoffee",                         // function
    "latte,2,1000000000000000,12345",     // coffee type, quantity, price, nonce
    signature,
    customer
);
```

#### Example 2: Token Transfer
```solidity
// Message: "123,transfer,0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2,500,67890"
bool valid = SignatureUtil.verifySignature(
    123,                                                      // evvmID
    "transfer",                                              // function
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2,500,67890", // to, amount, nonce
    signature,
    sender
);
```

#### Example 3: Username Registration
```solidity
// Message: "123,registerUsername,alice,100"
bool valid = SignatureUtil.verifySignature(
    123,                        // evvmID
    "registerUsername",        // function
    "alice,100",               // username, nonce
    signature,
    userAddress
);
```

## Implementation Details

### Internal Process
```solidity
function verifySignature(...) internal pure returns (bool) {
    // 1. Convert evvmID to string
    string memory evvmIdStr = AdvancedStrings.uintToString(evvmID);
    
    // 2. Construct full message
    string memory fullMessage = string.concat(
        evvmIdStr,
        ",",
        functionName,
        ",",
        inputs
    );
    
    // 3. Recover signer from signature
    address recovered = SignatureRecover.recoverSigner(
        fullMessage,
        signature
    );
    
    // 4. Compare with expected signer
    return recovered == expectedSigner;
}
```

### Dependencies
- **AdvancedStrings**: For evvmID uint to string conversion
- **SignatureRecover**: For EIP-191 signature recovery

## Common Use Cases

### Use Case 1: Service Action Verification
```solidity
contract CoffeeShop {
    IEvvm evvm;
    
    function orderCoffee(
        address customer,
        string memory coffeeType,
        uint256 quantity,
        uint256 price,
        uint256 nonce,
        bytes memory signature
    ) external {
        // Verify customer signed this order
        bool validSignature = SignatureUtil.verifySignature(
            evvm.getEvvmID(),
            "orderCoffee",
            string.concat(
                coffeeType,
                ",",
                AdvancedStrings.uintToString(quantity),
                ",",
                AdvancedStrings.uintToString(price),
                ",",
                AdvancedStrings.uintToString(nonce)
            ),
            signature,
            customer
        );
        
        require(validSignature, "Invalid customer signature");
        
        // Process order...
    }
}
```

### Use Case 2: Multi-Sig Verification
```solidity
function verifyMultipleSignatures(
    uint256 evvmID,
    string memory action,
    string memory params,
    bytes[] memory signatures,
    address[] memory signers
) internal pure returns (bool) {
    require(signatures.length == signers.length, "Length mismatch");
    
    for (uint256 i = 0; i < signatures.length; i++) {
        if (!SignatureUtil.verifySignature(
            evvmID,
            action,
            params,
            signatures[i],
            signers[i]
        )) {
            return false;
        }
    }
    return true;
}
```

### Use Case 3: Conditional Verification
```solidity
function processAction(
    address actor,
    string memory action,
    string memory params,
    bytes memory signature
) external {
    uint256 evvmID = evvm.getEvvmID();
    
    // Verify signature if not from trusted executor
    if (msg.sender != trustedExecutor) {
        require(
            SignatureUtil.verifySignature(
                evvmID,
                action,
                params,
                signature,
                actor
            ),
            "Invalid signature"
        );
    }
    
    // Execute action...
}
```

### Use Case 4: Batch Verification Optimization
```solidity
function verifyBatch(
    uint256 evvmID,
    string memory functionName,
    string[] memory inputsList,
    bytes[] memory signatures,
    address[] memory signers
) internal pure returns (bool[] memory) {
    bool[] memory results = new bool[](signatures.length);
    
    for (uint256 i = 0; i < signatures.length; i++) {
        results[i] = SignatureUtil.verifySignature(
            evvmID,
            functionName,
            inputsList[i],
            signatures[i],
            signers[i]
        );
    }
    
    return results;
}
```

## Frontend Integration

### JavaScript/TypeScript Example
```typescript
import { ethers } from 'ethers';

// Build EVVM message
function buildEvvmMessage(
    evvmId: number,
    functionName: string,
    inputs: string
): string {
    return `${evvmId},${functionName},${inputs}`;
}

// Sign message
async function signEvvmMessage(
    signer: ethers.Signer,
    evvmId: number,
    functionName: string,
    inputs: string
): Promise<string> {
    const message = buildEvvmMessage(evvmId, functionName, inputs);
    return await signer.signMessage(message);
}

// Example usage
const signature = await signEvvmMessage(
    wallet,
    123,                                   // evvmID
    "orderCoffee",                        // function
    "latte,2,1000000000000000,12345"     // inputs
);

// Now call smart contract with signature
await contract.orderCoffee(
    customerAddress,
    "latte",
    2,
    "1000000000000000",
    12345,
    signature
);
```

### React Hook Example
```typescript
import { useSignMessage } from 'wagmi';

function useEvvmSignature() {
    const { signMessageAsync } = useSignMessage();
    
    async function signEvvmAction(
        evvmId: number,
        functionName: string,
        params: Record<string, any>
    ): Promise<string> {
        // Convert params to comma-separated string
        const inputs = Object.values(params).join(',');
        
        // Build message
        const message = `${evvmId},${functionName},${inputs}`;
        
        // Sign
        return await signMessageAsync({ message });
    }
    
    return { signEvvmAction };
}

// Usage in component
const { signEvvmAction } = useEvvmSignature();

const signature = await signEvvmAction(
    123,
    "orderCoffee",
    {
        coffeeType: "latte",
        quantity: 2,
        price: "1000000000000000",
        nonce: 12345
    }
);
```

## Security Considerations

### 1. Always Include EVVM ID
**Why**: Prevents signature reuse across different EVVM deployments

```solidity
// Good - includes evvmID
bool valid = SignatureUtil.verifySignature(
    evvm.getEvvmID(), // Unique per deployment
    "action",
    params,
    sig,
    user
);

// Bad - missing evvmID (signatures work across deployments!)
// Don't construct messages without evvmID
```

### 2. Include Nonce in Inputs
**Why**: Prevents replay attacks

```solidity
// Good - nonce in inputs
string memory inputs = string.concat(
    "latte,2,",
    AdvancedStrings.uintToString(price),
    ",",
    AdvancedStrings.uintToString(nonce) // Include nonce
);

// Bad - no nonce (signature can be replayed!)
string memory inputs = string.concat("latte,2,", AdvancedStrings.uintToString(price));
```

### 3. Validate Function Name
**Why**: Prevents signature reuse across different functions

```solidity
// Good - specific function name
bool valid = SignatureUtil.verifySignature(
    evvmID,
    "orderCoffee", // Specific action
    inputs,
    sig,
    user
);

// Bad - generic function name (allows cross-function reuse)
bool valid = SignatureUtil.verifySignature(
    evvmID,
    "action", // Too generic
    inputs,
    sig,
    user
);
```

### 4. Check Return Value
**Why**: Signature might be invalid

```solidity
// Good - check result
bool valid = SignatureUtil.verifySignature(...);
require(valid, "Invalid signature");

// Bad - ignore result (allows invalid signatures!)
SignatureUtil.verifySignature(...); // Return value ignored
// Continue execution...
```

## Gas Optimization

### Strategy 1: Cache evvmID
```solidity
// Good - read once
uint256 evvmID = evvm.getEvvmID();

bool valid1 = SignatureUtil.verifySignature(evvmID, "action1", params1, sig1, user1);
bool valid2 = SignatureUtil.verifySignature(evvmID, "action2", params2, sig2, user2);

// Bad - read multiple times
bool valid1 = SignatureUtil.verifySignature(evvm.getEvvmID(), "action1", params1, sig1, user1);
bool valid2 = SignatureUtil.verifySignature(evvm.getEvvmID(), "action2", params2, sig2, user2);
```

### Strategy 2: Pre-Build Input Strings
```solidity
// Good - build once
string memory inputs = buildInputString(params);
bool valid = SignatureUtil.verifySignature(evvmID, "action", inputs, sig, user);

// Bad - inline building (if used multiple times)
bool valid = SignatureUtil.verifySignature(
    evvmID,
    "action",
    string.concat(...), // Expensive
    sig,
    user
);
```

### Strategy 3: Early Validation
```solidity
// Good - verify signature first (fails fast)
require(SignatureUtil.verifySignature(...), "Invalid signature");
// Expensive operations here...

// Bad - expensive operations before verification
// Expensive operations here...
require(SignatureUtil.verifySignature(...), "Invalid signature");
```

## Gas Costs

| Operation | Approximate Gas | Notes |
|-----------|----------------|-------|
| `verifySignature` | ~5,000-7,000 | Includes string concat + ecrecover |
| evvmID conversion | ~500-1,000 | Depends on number size |
| Message concat | ~500-2,000 | Depends on input length |
| Signature recovery | ~3,000 | EIP-191 + ecrecover |

## Best Practices

### 1. Use Consistent Input Formatting
```solidity
// Good - consistent comma-separated format
string memory inputs = string.concat(
    param1String,
    ",",
    AdvancedStrings.uintToString(param2),
    ",",
    AdvancedStrings.uintToString(param3)
);

// Bad - inconsistent formatting
string memory inputs = string.concat(param1String, "-", param2String, "_", param3String);
```

### 2. Document Message Format
```solidity
/**
 * @notice Orders coffee with customer signature
 * @dev Message format: "<evvmID>,orderCoffee,<coffeeType>,<quantity>,<price>,<nonce>"
 * @param signature Customer's EIP-191 signature of the message
 */
function orderCoffee(..., bytes memory signature) external {
    // ...
}
```

### 3. Create Helper Functions
```solidity
function buildOrderInputs(
    string memory coffeeType,
    uint256 quantity,
    uint256 price,
    uint256 nonce
) internal pure returns (string memory) {
    return string.concat(
        coffeeType,
        ",",
        AdvancedStrings.uintToString(quantity),
        ",",
        AdvancedStrings.uintToString(price),
        ",",
        AdvancedStrings.uintToString(nonce)
    );
}

function verifyOrderSignature(
    address customer,
    string memory inputs,
    bytes memory signature
) internal view returns (bool) {
    return SignatureUtil.verifySignature(
        evvm.getEvvmID(),
        "orderCoffee",
        inputs,
        signature,
        customer
    );
}
```

---

## See Also

- **[SignatureRecover](../03-Primitives/02-SignatureRecover.md)** - Underlying signature recovery
- **[AdvancedStrings](./01-AdvancedStrings.md)** - String conversion utilities
- **[EvvmService](../02-EvvmService.md)** - Uses SignatureUtil for service verification
- **[Core.sol Nonce Management](../../../04-Contracts/01-EVVM/03-SignatureAndNonceManagement.md)** - Centralized nonce tracking
