---
title: "SyncNonceService"
description: "Sequential nonce management for ordered transaction processing"
sidebar_position: 4
---

# SyncNonceService

The `SyncNonceService` abstract contract provides sequential (synchronous) nonce management for EVVM services. Unlike async nonces, sync nonces must be used in strict sequential order (1, 2, 3, ...).

## Overview

**Contract Type**: Abstract contract  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/utils/service/SyncNonceService.sol`

### Key Features

- **Sequential ordering** - nonces must be used in order
- **Automatic tracking** - system manages counter per user
- **Lower storage cost** - single counter vs mapping of used nonces
- **Predictable** - always know next valid nonce

## Sync vs Async Nonces

| Feature | Sync Nonces | Async Nonces |
|---------|-------------|-------------|
| **Order** | Sequential (1, 2, 3, ...) | Any unused value |
| **Nonce choice** | System managed | User chooses |
| **Parallel transactions** | Must be sequential | Yes |
| **Storage** | Single counter (cheaper) | Mapping per nonce (expensive) |
| **Predictability** | Always predictable | User-dependent |
| **Frontend complexity** | Lower (query next nonce) | Higher (manage nonce generation) |

### When to Use Sync Nonces

**Good for**:
- Single-device sequential operations
- Simple workflows with natural ordering
- Minimizing storage costs
- Services where parallel execution isn't needed

**Avoid when**:
- Multi-device access required
- High-frequency parallel operations
- Users need out-of-order execution
- Complex async workflows

## Contract Structure

```solidity
abstract contract SyncNonceService {
    mapping(address user => uint256 nonce) private syncServiceNonce;

    function _incrementSyncServiceNonce(address user) internal virtual {
        syncServiceNonce[user]++;
    }

    function getNextSyncServiceNonce(address user) public view virtual returns (uint256) {
        return syncServiceNonce[user];
    }
}
```

## State Variables

### `syncServiceNonce`
```solidity
mapping(address user => uint256 nonce) private syncServiceNonce;
```

**Description**: Tracks the next expected nonce for each user

**Structure**: Maps user address to their current nonce counter

**Initial Value**: `0` for new users

**Increment**: Only via `_incrementSyncServiceNonce()`

## Functions

### `getNextSyncServiceNonce`
```solidity
function getNextSyncServiceNonce(
    address user
) public view virtual returns (uint256)
```

**Description**: Returns the next valid nonce that the user should use

**Parameters**:
- `user`: Address to check nonce for

**Returns**: Next expected nonce value (starts at 0)

**Visibility**: `public view` - callable externally for frontend integration

**Example**:
```solidity
// Get next nonce for user
uint256 nextNonce = getNextSyncServiceNonce(userAddress);
// nextNonce = 0 (first transaction)

// After first transaction processed
nextNonce = getNextSyncServiceNonce(userAddress);
// nextNonce = 1 (second transaction)
```

**Frontend Integration**:
```typescript
// Query next nonce
const nextNonce = await contract.getNextSyncServiceNonce(userAddress);

// Use in signature
const message = `${evvmId},action,params,${nextNonce}`;
const signature = await signer.signMessage(message);
```

### `_incrementSyncServiceNonce`
```solidity
function _incrementSyncServiceNonce(address user) internal virtual
```

**Description**: Increments the nonce counter for a user

**Parameters**:
- `user`: Address whose nonce to increment

**Visibility**: `internal` - call from inheriting contracts

**Effects**: Increases user's nonce by 1

**When to call**: After successfully processing a transaction

**Example**:
```solidity
function processAction(
    address user,
    uint256 nonce,
    bytes memory signature
) external {
    // 1. Verify nonce matches expected
    uint256 expected = getNextSyncServiceNonce(user);
    require(nonce == expected, "Invalid nonce");
    
    // 2. Verify signature
    validateSignature(user, nonce, signature);
    
    // 3. Process action
    doSomething(user);
    
    // 4. Increment nonce for next transaction
    _incrementSyncServiceNonce(user);
}
```

## Usage Patterns

### Pattern 1: Standard Implementation
```solidity
contract SequentialService is SyncNonceService {
    function executeOrder(
        address user,
        string memory orderDetails,
        uint256 nonce,
        bytes memory signature
    ) external {
        // 1. Check nonce is correct
        uint256 expectedNonce = getNextSyncServiceNonce(user);
        require(nonce == expectedNonce, "Nonce out of order");
        
        // 2. Verify signature
        require(verifySignature(user, orderDetails, nonce, signature), "Invalid signature");
        
        // 3. Execute order
        processOrder(user, orderDetails);
        
        // 4. Increment for next transaction
        _incrementSyncServiceNonce(user);
    }
}
```

### Pattern 2: With Custom Validation
```solidity
contract ValidatedService is SyncNonceService {
    error InvalidNonce(uint256 expected, uint256 provided);
    
    function validateNonce(address user, uint256 nonce) internal view {
        uint256 expected = getNextSyncServiceNonce(user);
        if (nonce != expected) {
            revert InvalidNonce(expected, nonce);
        }
    }
    
    function action(address user, uint256 nonce, ...) external {
        validateNonce(user, nonce);
        
        // Process...
        
        _incrementSyncServiceNonce(user);
    }
}
```

### Pattern 3: Batch Sequential Processing
```solidity
contract BatchSequentialService is SyncNonceService {
    function batchActions(
        address user,
        uint256 startNonce,
        bytes[] memory signatures
    ) external {
        uint256 expectedNonce = getNextSyncServiceNonce(user);
        require(startNonce == expectedNonce, "Invalid start nonce");
        
        for (uint256 i = 0; i < signatures.length; i++) {
            // Verify each signature with sequential nonce
            uint256 currentNonce = startNonce + i;
            require(verifySignature(user, currentNonce, signatures[i]), "Invalid signature");
            
            // Process action
            processAction(user, i);
            
            // Increment nonce
            _incrementSyncServiceNonce(user);
        }
    }
}
```

### Pattern 4: Hybrid Nonce System
```solidity
// Support both sync and async nonces
contract HybridService is SyncNonceService, AsyncNonce {
    function actionWithSyncNonce(
        address user,
        uint256 nonce,
        bytes memory signature
    ) external {
        uint256 expected = getNextSyncServiceNonce(user);
        require(nonce == expected, "Invalid sync nonce");
        
        // Process...
        
        _incrementSyncServiceNonce(user);
    }
    
    function actionWithAsyncNonce(
        address user,
        uint256 nonce,
        bytes memory signature
    ) external {
        verifyAsyncNonce(user, nonce);
        
        // Process...
        
        markAsyncNonceAsUsed(user, nonce);
    }
}
```

## Comparison with AsyncNonce

### Sync Nonce Example
```solidity
// User submits transactions in order
// Transaction 1: nonce = 0
// Transaction 2: nonce = 1
// Transaction 3: nonce = 2

// Cannot skip: Transaction with nonce=2 before nonce=1 fails
// Cannot parallel: Must wait for nonce=1 before nonce=2

// Example: User submits nonce=1, then nonce=2
// Both can succeed in sequence
```

### Async Nonce Example
```solidity
// User can submit in any order
// Transaction 1: nonce = 12345
// Transaction 2: nonce = 67890
// Transaction 3: nonce = 11111

// Can use any unused nonce
// Can process in parallel
```

### Storage Costs

#### Sync Nonce (Cheaper)
```solidity
// Single counter per user
mapping(address => uint256) syncNonce;
// Cost: ~20,000 gas first increment, ~5,000 gas subsequent
```

#### Async Nonce (More Expensive)
```solidity
// Mapping per used nonce
mapping(address => mapping(uint256 => bool)) asyncNonce;
// Cost: ~20,000 gas per new nonce forever
```

## Security Considerations

### 1. Validate Nonce Before Processing
```solidity
// Good - check nonce first
uint256 expected = getNextSyncServiceNonce(user);
require(nonce == expected, "Invalid nonce");
processAction(user);
_incrementSyncServiceNonce(user);

// Bad - process before validating
processAction(user); // Executed even if nonce wrong
require(nonce == expected, "Invalid nonce"); // Too late!
```

### 2. Increment After Success
```solidity
// Good - increment only on success
verifyNonce(user, nonce);
processPayment(user); // Might revert
_incrementSyncServiceNonce(user); // Only if payment succeeded

// Bad - increment before critical operations
verifyNonce(user, nonce);
_incrementSyncServiceNonce(user); // Incremented
processPayment(user); // If this fails, nonce is lost
```

### 3. Include Nonce in Signature
```solidity
// Good - nonce in signed message
string memory message = string.concat(
    "action,params,",
    AdvancedStrings.uintToString(nonce)
);
require(verifySignature(message, signature, user), "Invalid");
require(nonce == getNextSyncServiceNonce(user), "Invalid nonce");

// Bad - nonce not signed (fisher can change it)
string memory message = "action,params"; // No nonce
require(verifySignature(message, signature, user), "Invalid");
require(nonce == getNextSyncServiceNonce(user), "Invalid nonce");
// Fisher could provide different nonce
```

### 4. Protect Against Nonce Front-Running
```solidity
// Issue: Someone could submit transaction with user's next nonce
// before their intended transaction

// Mitigation: Include additional context in signature
string memory message = string.concat(
    AdvancedStrings.uintToString(evvmId),
    ",",
    "action,",
    specificParams, // Include specific action details
    ",",
    AdvancedStrings.uintToString(nonce)
);
```

## Gas Optimization

### Tip 1: Read Nonce Once
```solidity
// Good - cache expected nonce
uint256 expected = getNextSyncServiceNonce(user);
require(nonce == expected, "Invalid nonce");
// Use 'expected' variable if needed again

// Bad - read multiple times
require(nonce == getNextSyncServiceNonce(user), "Invalid");
uint256 expected = getNextSyncServiceNonce(user); // Read again
```

### Tip 2: Batch Increments
```solidity
// Good - process all, then increment once per item
for (uint256 i = 0; i < items.length; i++) {
    processItem(items[i]);
    _incrementSyncServiceNonce(user);
}

// Note: Each increment is separate, but logic is clear
```

### Tip 3: Use Sync for Sequential Operations
```solidity
// Good - sync nonces for naturally sequential operations
function depositDaily(address user, uint256 nonce, ...) external {
    // Daily deposits are naturally sequential
    require(nonce == getNextSyncServiceNonce(user), "Wrong day");
    // ...
}

// Bad - async nonces for sequential operations (wastes storage)
// Using AsyncNonce for daily sequential deposits
```

## Frontend Integration

### React Hook Example
```typescript
import { useContractRead } from 'wagmi';

function useSyncNonce(userAddress: string, contractAddress: string) {
    const { data: nextNonce, refetch } = useContractRead({
        address: contractAddress,
        abi: contractABI,
        functionName: 'getNextSyncServiceNonce',
        args: [userAddress],
        watch: true // Auto-refresh when nonce changes
    });
    
    return {
        nextNonce: nextNonce as number,
        refreshNonce: refetch
    };
}

// Usage in component
function ActionButton() {
    const { nextNonce } = useSyncNonce(userAddress, contractAddress);
    
    async function executeAction() {
        const message = `${evvmId},action,params,${nextNonce}`;
        const signature = await signMessage(message);
        
        await contract.executeAction(
            userAddress,
            "params",
            nextNonce,
            signature
        );
    }
    
    return (
        <button onClick={executeAction}>
            Execute Action (Nonce: {nextNonce})
        </button>
    );
}
```

### Nonce Synchronization
```typescript
// Ensure frontend stays synchronized with contract
let cachedNonce = 0;

async function getValidNonce(userAddress: string): Promise<number> {
    // Query contract for authoritative nonce
    const contractNonce = await contract.getNextSyncServiceNonce(userAddress);
    
    // Update cache
    cachedNonce = contractNonce;
    
    return contractNonce;
}

async function executeWithRetry(userAddress: string, params: any) {
    let nonce = cachedNonce;
    
    try {
        await executeAction(userAddress, params, nonce);
        cachedNonce++; // Increment cache on success
    } catch (error) {
        if (error.message.includes("Invalid nonce")) {
            // Resync and retry
            nonce = await getValidNonce(userAddress);
            await executeAction(userAddress, params, nonce);
            cachedNonce++;
        } else {
            throw error;
        }
    }
}
```

## Common Patterns

### With Events
```solidity
event ActionExecuted(
    address indexed user,
    uint256 indexed nonce,
    string action
);

function executeAction(
    address user,
    string memory action,
    uint256 nonce
) external {
    uint256 expected = getNextSyncServiceNonce(user);
    require(nonce == expected, "Invalid nonce");
    
    // Process...
    
    _incrementSyncServiceNonce(user);
    emit ActionExecuted(user, nonce, action);
}
```

### With Reset Capability
```solidity
address public admin;

// For emergency or testing
function resetNonce(address user) external {
    require(msg.sender == admin, "Not admin");
    delete syncServiceNonce[user]; // Resets to 0
}
```

### With Nonce Skipping (Rare)
```solidity
// Allow admin to skip stuck nonces
function skipNonce(address user) external {
    require(msg.sender == admin, "Not admin");
    _incrementSyncServiceNonce(user);
}
```

## Best Practices

### 1. Clear Error Messages
```solidity
error InvalidNonce(uint256 expected, uint256 provided);

function verifyNonce(address user, uint256 nonce) internal view {
    uint256 expected = getNextSyncServiceNonce(user);
    if (nonce != expected) {
        revert InvalidNonce(expected, nonce);
    }
}
```

### 2. Document Nonce Expectations
```solidity
/**
 * @notice Executes action with sequential nonce
 * @dev Nonce must equal getNextSyncServiceNonce(user)
 * @param user User executing action
 * @param nonce Sequential nonce (starts at 0, increments by 1)
 */
function executeAction(address user, uint256 nonce, ...) external {
    // ...
}
```

### 3. Provide Helper Views
```solidity
function getUserNonceInfo(address user) external view returns (
    uint256 nextNonce,
    uint256 totalTransactions
) {
    nextNonce = getNextSyncServiceNonce(user);
    totalTransactions = nextNonce; // Same as total successful transactions
}
```

### 4. Consider Batch Operations
```solidity
// Allow multiple sequential operations in one transaction
function batchExecute(
    address user,
    string[] memory actions,
    uint256 startNonce
) external {
    require(startNonce == getNextSyncServiceNonce(user), "Invalid start");
    
    for (uint256 i = 0; i < actions.length; i++) {
        processAction(user, actions[i]);
        _incrementSyncServiceNonce(user);
    }
}
```

---

## See Also

- **[AsyncNonce](./01-AsyncNonceService.md)** - Flexible async nonce alternative
- **[EVVM Nonce Types](../../../../04-Contracts/01-EVVM/02-NonceTypes.md)** - EVVM's nonce system
- **[EvvmService](../../02-EvvmService.md)** - Uses AsyncNonce by default
