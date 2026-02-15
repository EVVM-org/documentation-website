---
title: "CAUtils Library"
description: "Contract Address verification utilities for distinguishing smart contracts from EOAs"
sidebar_position: 6
---

# CAUtils Library

The `CAUtils` library provides utilities for detecting whether an address is a smart contract (CA - Contract Address) or an Externally Owned Account (EOA). This is essential for Core.sol functions that should only be callable by contracts.

## Overview

**Package**: `@evvm/testnet-contracts`  
**Import Path**: `@evvm/testnet-contracts/library/utils/CAUtils.sol`  
**Solidity Version**: `^0.8.0`

**Purpose**: Distinguish between smart contracts and EOAs using the `extcodesize` opcode.

## Functions

### verifyIfCA

**Function Type**: `internal view`  
**Function Signature**: `verifyIfCA(address)`

Checks if an address is a smart contract by examining its code size using the `extcodesize` opcode.

#### Parameters

| Parameter | Type      | Description            |
| --------- | --------- | ---------------------- |
| `from`    | `address` | Address to check       |

#### Return Value

| Type   | Description                                             |
| ------ | ------------------------------------------------------- |
| `bool` | `true` if contract (codesize > 0), `false` if EOA       |

#### Implementation

```solidity
function verifyIfCA(address from) internal view returns (bool) {
    uint256 size;
    
    assembly {
        /// @dev check the size of the opcode of the address
        size := extcodesize(from)
    }
    
    return (size != 0);
}
```

#### How It Works

The function uses the `extcodesize` EVM opcode which:
- Returns `> 0` for addresses containing contract bytecode
- Returns `0` for EOA addresses (no code)
- Returns `0` during contract construction (before code is stored)
- Returns `0` for addresses that had contracts which self-destructed

## Usage in Core.sol

Core.sol uses `CAUtils` to restrict certain functions to contract-only execution:

### caPay Function

```solidity
function caPay(address to, address token, uint256 amount) external {
    address from = msg.sender;
    
    if (!CAUtils.verifyIfCA(from)) revert Error.NotAnCA();
    
    _updateBalance(from, to, token, amount);
    
    if (isAddressStaker(msg.sender)) _giveReward(msg.sender, 1);
}
```

**Purpose**: Only smart contracts can call `caPay`, preventing EOAs from bypassing signature requirements.

### validateAndConsumeNonce Function

```solidity
function validateAndConsumeNonce(
    address user,
    bytes32 hashPayload,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec,
    bytes memory signature
) external {
    address servicePointer = msg.sender;
    
    if (!CAUtils.verifyIfCA(servicePointer))
        revert Error.MsgSenderIsNotAContract();
    
    // ... signature verification and nonce consumption
}
```

**Purpose**: Only EVVM service contracts can validate and consume nonces for users.

## Security Considerations

### Edge Cases

#### 1. Contract Construction Phase

```solidity
contract Example {
    constructor() {
        // During construction, CAUtils.verifyIfCA(address(this)) returns FALSE
        // The contract code hasn't been stored yet
    }
}
```

**Impact**: Constructors cannot reliably use `CAUtils` for self-checks.

#### 2. Self-Destruct

```solidity
contract Destructible {
    function destroy() external {
        selfdestruct(payable(msg.sender));
    }
}

// After selfdestruct, CAUtils.verifyIfCA(address) returns FALSE
```

**Impact**: Self-destructed contract addresses appear as EOAs.

#### 3. Create2 Pre-Deployment

```solidity
// Address can be computed before deployment
address futureContract = computeCreate2Address(...);

// CAUtils.verifyIfCA(futureContract) returns FALSE until deployed
```

**Impact**: Pre-computed addresses cannot be verified until deployment.

### Not a Complete Security Solution

:::warning[Security Limitations]
`CAUtils.verifyIfCA()` should **not** be the sole security mechanism:

1. **Construction Bypass**: Contracts under construction appear as EOAs
2. **Proxy Confusion**: Proxies may not have code themselves
3. **Delegatecall Issues**: Calls through proxies have different `msg.sender`

For critical security, combine with:
- Whitelist/blacklist systems
- Role-based access control
- Signature verification
- Multi-factor authorization
:::

## Best Practices

### ✅ Good Use Cases

**Access Control for System Functions:**
```solidity
function systemOperation() external {
    require(CAUtils.verifyIfCA(msg.sender), "Contracts only");
    // ... system logic
}
```

**Preventing EOA Bypass:**
```solidity
function privilegedFunction() external {
    if (!CAUtils.verifyIfCA(msg.sender)) revert NotAContract();
    // Ensures EOAs can't call directly
}
```

### ❌ Avoid These Patterns

**Don't Use as Sole Security:**
```solidity
// ❌ BAD: Too permissive
function dangerousFunction() external {
    if (CAUtils.verifyIfCA(msg.sender)) {
        // ANY contract can call this!
    }
}
```

**Don't Use for Reentrancy Protection:**
```solidity
// ❌ BAD: Doesn't prevent reentrancy
function withdrawAll() external {
    require(!CAUtils.verifyIfCA(msg.sender), "EOAs only");
    // An EOA can still trigger reentrancy via malicious contract
}
```

## Usage Examples

### Basic Contract Detection

```solidity
import {CAUtils} from "@evvm/testnet-contracts/library/utils/CAUtils.sol";

contract MyContract {
    function requireContract() external view {
        require(CAUtils.verifyIfCA(msg.sender), "Must be contract");
    }
    
    function requireEOA() external view {
        require(!CAUtils.verifyIfCA(msg.sender), "Must be EOA");
    }
}
```

### Combined with Access Control

```solidity
import {CAUtils} from "@evvm/testnet-contracts/library/utils/CAUtils.sol";

contract SecureSystem {
    mapping(address => bool) public authorizedContracts;
    
    modifier onlyAuthorizedContract() {
        require(CAUtils.verifyIfCA(msg.sender), "Not a contract");
        require(authorizedContracts[msg.sender], "Not authorized");
        _;
    }
    
    function systemFunction() external onlyAuthorizedContract {
        // Secured by both CA check AND whitelist
    }
}
```

### Check External Address

```solidity
function validateRecipient(address recipient) internal view returns (bool) {
    if (CAUtils.verifyIfCA(recipient)) {
        // It's a contract - might need special handling
        return isApprovedContract(recipient);
    } else {
        // It's an EOA - standard handling
        return true;
    }
}
```

## Gas Costs

The `extcodesize` opcode has the following gas costs:

- **Warm address** (already accessed): ~100 gas
- **Cold address** (first access): ~2600 gas

**Optimization Tip**: If checking the same address multiple times, cache the result:

```solidity
bool isSenderContract = CAUtils.verifyIfCA(msg.sender);

// Use cached value multiple times
if (isSenderContract) { /* ... */ }
if (isSenderContract) { /* ... */ }
```

## Related Documentation

- [Core.sol caPay Function](../../../04-Contracts/01-EVVM/04-PaymentFunctions/04-caPay.md) - Contract payment function
- [Core.sol validateAndConsumeNonce](../../../04-Contracts/01-EVVM/03-SignatureAndNonceManagement.md) - Nonce validation function
- [disperseCaPay Function](../../../04-Contracts/01-EVVM/04-PaymentFunctions/05-disperseCaPay.md) - Multi-recipient contract payment

## Alternative Approaches

For more robust contract detection, consider:

**1. Interface Detection (ERC-165):**
```solidity
interface IMyContract {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
```

**2. Whitelisting:**
```solidity
mapping(address => bool) public approvedContracts;
```

**3. Role-Based Access Control:**
```solidity
bytes32 public constant CONTRACT_ROLE = keccak256("CONTRACT_ROLE");
hasRole(CONTRACT_ROLE, msg.sender);
```

## Summary

`CAUtils` provides simple contract detection but should be part of a defense-in-depth strategy. For EVVM, it effectively restricts service functions to contract execution while preventing EOAs from bypassing signature requirements.
