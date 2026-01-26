---
title: "AsyncNonce"
description: "Async nonce tracking and validation for replay attack prevention"
sidebar_position: 1
---

# AsyncNonce

The `AsyncNonce` abstract contract provides async nonce management for EVVM services. Unlike sequential (sync) nonces, async nonces allow users to submit transactions in any order using unique identifiers.

## Overview

**Contract Type**: Abstract contract  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/utils/nonces/AsyncNonce.sol`

### Key Features

- **Flexible nonce ordering** - transactions can be processed in any order
- **User-managed nonces** - users choose unique nonce values
- **Replay attack prevention** - once-used nonces cannot be reused
- **Per-user tracking** - each user has independent nonce space

## Async vs Sync Nonces

| Feature | Async Nonces | Sync Nonces |
|---------|--------------|-------------|
| **Order** | Any order | Sequential (1, 2, 3, ...) |
| **Nonce choice** | User picks any unused uint256 | System increments automatically |
| **Parallel transactions** | Yes | No |
| **Storage cost** | Higher (mapping per nonce) | Lower (single counter) |
| **Use case** | Multi-device, parallel ops | Simple sequential operations |

### When to Use Async Nonces

**Good for**:
- Multi-device access (mobile + desktop)
- Parallel transaction submission
- Timestamp-based nonces
- Random nonce generation
- High-throughput services

**Avoid when**:
- Simple sequential operations sufficient
- Want to minimize storage costs
- Single-device/single-thread usage

## Contract Structure

```solidity
abstract contract AsyncNonce {
    error AsyncNonceAlreadyUsed();

    mapping(address user => mapping(uint256 nonce => bool availability))
        private asyncNonce;

    // Internal functions for verification and marking
    // Public view function for checking availability
}
```

## State Variables

### `asyncNonce`
```solidity
mapping(address user => mapping(uint256 nonce => bool availability))
    private asyncNonce;
```

**Description**: Nested mapping tracking which nonces have been used by each user

**Structure**:
- **Outer mapping**: `user address` → inner mapping
- **Inner mapping**: `nonce value` → `true` if used, `false` if available

**Storage**: Each used nonce costs ~20,000 gas (SSTORE from zero to non-zero)

## Functions

### `markAsyncNonceAsUsed`
```solidity
function markAsyncNonceAsUsed(
    address user,
    uint256 nonce
) internal virtual
```

**Description**: Marks a nonce as consumed for a specific user

**Parameters**:
- `user`: Address whose nonce is being marked
- `nonce`: Nonce value to mark as used

**Visibility**: `internal` - call from inheriting contracts

**Gas Cost**: ~20,000 (first use of nonce), ~5,000 (if nonce already marked)

**Example**:
```solidity
function orderCoffee(
    address customer,
    uint256 nonce,
    bytes memory signature,
    ...
) external {
    // Verify signature and nonce
    verifyAsyncNonce(customer, nonce);
    
    // Process order...
    
    // Mark nonce as used
    markAsyncNonceAsUsed(customer, nonce);
}
```

### `verifyAsyncNonce`
```solidity
function verifyAsyncNonce(
    address user,
    uint256 nonce
) internal view virtual
```

**Description**: Checks if a nonce has already been used and reverts if so

**Parameters**:
- `user`: Address to check nonce for
- `nonce`: Nonce value to verify

**Visibility**: `internal view` - read-only check

**Reverts**: `AsyncNonceAlreadyUsed()` if nonce already consumed

**Gas Cost**: ~2,100 (cold read) or ~100 (warm read)

**Example**:
```solidity
function processAction(address user, uint256 nonce, ...) external {
    // Verify nonce hasn't been used (reverts if used)
    verifyAsyncNonce(user, nonce);
    
    // Safe to process...
}
```

### `getIfUsedAsyncNonce`
```solidity
function getIfUsedAsyncNonce(
    address user,
    uint256 nonce
) public view virtual returns (bool)
```

**Description**: Public function to check if a nonce has been used

**Parameters**:
- `user`: Address to check nonce for
- `nonce`: Nonce value to check

**Returns**: `true` if nonce has been used, `false` if still available

**Visibility**: `public view` - callable externally

**Use Cases**:
- Frontend checking nonce status
- Off-chain nonce validation
- Debugging and monitoring

**Example**:
```solidity
// Check from another contract
bool used = serviceContract.getIfUsedAsyncNonce(user, 12345);
if (used) {
    // Nonce already consumed
}

// Check from frontend (JavaScript)
const isUsed = await contract.getIfUsedAsyncNonce(userAddress, 12345);
```

## Error

### `AsyncNonceAlreadyUsed`
```solidity
error AsyncNonceAlreadyUsed();
```

**Thrown by**: `verifyAsyncNonce()`  
**Meaning**: The nonce has already been consumed for this user  
**Action**: Use a different nonce value

## Usage Patterns

### Pattern 1: Standard Implementation
```solidity
contract CoffeeShop is AsyncNonce {
    function orderCoffee(
        address customer,
        string memory coffeeType,
        uint256 price,
        uint256 nonce,
        bytes memory signature
    ) external {
        // 1. Verify signature (includes nonce in message)
        validateSignature(..., nonce, signature, customer);
        
        // 2. Check nonce (reverts if used)
        verifyAsyncNonce(customer, nonce);
        
        // 3. Process order
        processOrder(customer, coffeeType, price);
        
        // 4. Mark nonce as used
        markAsyncNonceAsUsed(customer, nonce);
    }
}
```

### Pattern 2: With EvvmService
```solidity
// EvvmService already inherits AsyncNonce
contract MyService is EvvmService {
    function action(
        address user,
        uint256 nonce,
        bytes memory signature
    ) external {
        // Use inherited async nonce functions
        validateServiceSignature(...);
        verifyAsyncNonce(user, nonce);
        
        // ... do work ...
        
        markAsyncNonceAsUsed(user, nonce);
    }
}
```

### Pattern 3: Conditional Nonce Check
```solidity
contract FlexibleService is AsyncNonce {
    function action(
        address user,
        uint256 nonce,
        bool requireNonce,
        bytes memory signature
    ) external {
        if (requireNonce) {
            verifyAsyncNonce(user, nonce);
        }
        
        // Process action...
        
        if (requireNonce) {
            markAsyncNonceAsUsed(user, nonce);
        }
    }
}
```

### Pattern 4: Batch Operations
```solidity
function batchActions(
    address user,
    uint256[] memory nonces,
    bytes[] memory signatures
) external {
    // Verify all nonces first (fail fast)
    for (uint256 i = 0; i < nonces.length; i++) {
        verifyAsyncNonce(users[i], nonces[i]);
    }
    
    // Process all actions
    for (uint256 i = 0; i < nonces.length; i++) {
        processAction(user, signatures[i]);
        markAsyncNonceAsUsed(user, nonces[i]);
    }
}
```

## Nonce Generation Strategies

### Strategy 1: Timestamp-Based
```solidity
// Frontend
const nonce = Date.now(); // Milliseconds since epoch
const nonce = Date.now() * 1000 + Math.floor(Math.random() * 1000); // Add randomness
```

**Pros**: 
- Natural uniqueness
- Meaningful for debugging
- Sortable

**Cons**: 
- Predictable
- Clock skew issues
- Collision risk in high-frequency scenarios

### Strategy 2: Random Number
```solidity
// Frontend
const nonce = ethers.BigNumber.from(ethers.utils.randomBytes(32));
```

**Pros**:
- Truly unique
- Unpredictable
- No collision concerns

**Cons**:
- No inherent meaning
- Harder to debug

### Strategy 3: Sequential with Offset
```solidity
// Frontend - track user's last nonce
let lastNonce = await getLastNonce(userAddress);
const nonce = lastNonce + 1;

// Or use a large offset per device
const DEVICE_OFFSET = 1000000;
const deviceNonce = DEVICE_OFFSET + deviceSequentialNumber;
```

**Pros**:
- Predictable for user
- Easy tracking
- Multi-device support with offsets

**Cons**:
- Requires client-side state
- Can collide across devices

### Strategy 4: Hybrid (Timestamp + Random)
```solidity
// Frontend
const timestamp = Date.now();
const random = Math.floor(Math.random() * 10000);
const nonce = timestamp * 10000 + random;
```

**Pros**:
- Unique and meaningful
- Low collision risk
- Debuggable

**Cons**:
- More complex

## Security Considerations

### 1. Always Verify Before Marking
```solidity
// Good - verify then mark
verifyAsyncNonce(user, nonce);
// ... do work ...
markAsyncNonceAsUsed(user, nonce);

// Bad - mark without verify (allows reuse!)
markAsyncNonceAsUsed(user, nonce);
// ... do work ... (can be called again with same nonce!)
```

### 2. Mark After Successful Execution
```solidity
// Good - mark after success
verifyAsyncNonce(user, nonce);
processPayment(...); // Might revert
markAsyncNonceAsUsed(user, nonce); // Only if payment succeeds

// Bad - mark before critical operations
verifyAsyncNonce(user, nonce);
markAsyncNonceAsUsed(user, nonce); // Marked early
processPayment(...); // If this reverts, nonce is wasted
```

### 3. Include Nonce in Signature
```solidity
// Good - nonce in signature message
string memory message = string.concat(
    "action,param1,",
    AdvancedStrings.uintToString(nonce) // Nonce signed
);
validateSignature(message, signature, user);
verifyAsyncNonce(user, nonce);

// Bad - nonce not in signature (can be changed by fisher!)
string memory message = "action,param1"; // No nonce
validateSignature(message, signature, user);
verifyAsyncNonce(user, nonce); // Fisher can change nonce
```

### 4. Check Nonce Early
```solidity
// Good - fail fast
verifyAsyncNonce(user, nonce); // Check first
// ... expensive operations ...

// Bad - check late (wastes gas on reused nonce)
// ... expensive operations ...
verifyAsyncNonce(user, nonce); // Check last
```

## Gas Optimization

### Tip 1: Batch Nonce Checks
```solidity
// Good - verify all nonces first
for (uint256 i = 0; i < nonces.length; i++) {
    verifyAsyncNonce(users[i], nonces[i]);
}
// Then process all
for (uint256 i = 0; i < nonces.length; i++) {
    processAction(users[i]);
        markAsyncNonceAsUsed(users[i], nonces[i]);
// Bad - interleaved (partial success wastes gas)
for (uint256 i = 0; i < nonces.length; i++) {
    verifyAsyncNonce(users[i], nonces[i]);
    processAction(users[i]);
    markAsyncNonceAsUsed(users[i], nonces[i]);
    // If action[2] fails, nonces [0,1] already marked
}
```

### Tip 2: Storage Packing
```solidity
// If you need additional per-nonce data, pack it
struct NonceData {
    bool used;
    uint248 timestamp; // Pack with bool (1 slot total)
}
mapping(address => mapping(uint256 => NonceData)) nonceData;
```

## Frontend Integration

### React Hook Example
```typescript
import { useState, useCallback } from 'react';
import { useContract } from 'wagmi';

function useAsyncNonce(userAddress: string, contractAddress: string) {
    const contract = useContract({
        address: contractAddress,
        abi: contractABI
    });
    
    // Generate new unique nonce
    const generateNonce = useCallback(() => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return timestamp * 10000 + random;
    }, []);
    
    // Check if nonce is available
    const isNonceAvailable = useCallback(async (nonce: number) => {
        const used = await contract.getIfUsedAsyncNonce(
            userAddress,
            nonce
        );
        return !used; // Invert because function returns true if used
    }, [contract, userAddress]);
    
    return { generateNonce, isNonceAvailable };
}

// Usage
const { generateNonce, isNonceAvailable } = useAsyncNonce(address, contractAddr);

const nonce = generateNonce();
const available = await isNonceAvailable(nonce);
if (available) {
    // Use nonce
}
```

## Common Patterns

### With Payment Processing
```solidity
function orderWithPayment(
    address customer,
    uint256 orderNonce,
    bytes memory orderSignature,
    uint256 paymentNonce,
    bytes memory paymentSignature
) external {
    // Verify order signature with async nonce
    verifyAsyncNonce(customer, orderNonce);
    validateOrderSignature(customer, orderNonce, orderSignature);
    
    // Process payment (has its own nonce system)
    evvm.pay(..., paymentNonce, true, ...); // EVVM async nonce
    
    // Mark order nonce as used
    markAsyncNonceAsUsed(customer, orderNonce);
}
```

### With Events
```solidity
event NonceUsed(address indexed user, uint256 indexed nonce, uint256 timestamp);

function processAction(address user, uint256 nonce, ...) external {
    verifyAsyncNonce(user, nonce);
    
    // ... process ...
    
    markAsyncNonceAsUsed(user, nonce);
    emit NonceUsed(user, nonce, block.timestamp);
}
```

---

## See Also

- **[SyncNonceService](./04-SyncNonceService.md)** - Sequential nonce alternative
- **[EvvmService](../../02-EvvmService.md)** - Inherits AsyncNonce
- **[Nonce Types (EVVM)](../../../../04-Contracts/01-EVVM/02-NonceTypes.md)** - EVVM's nonce system
