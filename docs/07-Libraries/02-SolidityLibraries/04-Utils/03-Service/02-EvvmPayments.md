---
title: "EvvmPayments"
description: "Abstract contract for simplified EVVM payment processing in services"
sidebar_position: 2
---

# EvvmPayments

The `EvvmPayments` abstract contract provides simplified helpers for processing payments through EVVM. It wraps common payment operations with service-friendly defaults.

## Overview

**Contract Type**: Abstract contract  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/utils/service/EvvmPayments.sol`

### Key Features

- **Simplified payment calls** with service defaults
- **Contract balance transfers** (caPay wrapper)
- **EVVM address management** for upgrades
- **Lightweight** - minimal storage overhead

## Contract Structure

```solidity
abstract contract EvvmPayments {
    IEvvm internal evvm;

    constructor(address evvmAddress) {
        evvm = IEvvm(evvmAddress);
    }
    
    // Payment functions
    // Address management
}
```

## State Variables

### `evvm`
```solidity
IEvvm internal evvm;
```

**Description**: Internal interface to the EVVM Core Contract

**Visibility**: `internal` - accessible only within contract and inheriting contracts

**Initialized**: In constructor with EVVM contract address

## Functions

### `requestPay`
```solidity
function requestPay(
    address from,
    address token,
    uint256 amount,
    uint256 priorityFee,
    uint256 nonce,
    bool priorityFlag,
    bytes memory signature
) internal virtual
```

**Description**: Processes a payment through EVVM with service-specific defaults

**Parameters**:
- `from`: Address sending the payment
- `token`: Token address (`address(0)` for ETH, `address(1)` for MATE)
- `amount`: Amount to transfer
- `priorityFee`: Fee for fisher executing transaction
- `nonce`: EVVM nonce for payment
- `priorityFlag`: `true` for async nonce, `false` for sync nonce
- `signature`: Payment authorization signature from `from` address

**Default Values (Set Automatically)**:
- `to`: `address(this)` - recipient is this service contract
- `to_identity`: `""` - empty identity string
- `executor`: `address(this)` - service contract executes payment

**Example**:
```solidity
contract MyService is EvvmPayments {
    function orderProduct(
        address customer,
        uint256 price,
        uint256 priorityFee,
        uint256 paymentNonce,
        bool useAsync,
        bytes memory paymentSignature
    ) external {
        // Process payment with simplified call
        requestPay(
            customer,           // from
            address(0),        // ETH
            price,             // amount
            priorityFee,       // priority fee
            paymentNonce,      // EVVM nonce
            useAsync,          // async or sync
            paymentSignature   // payment signature
        );
        
        // Payment complete - service received funds
    }
}
```

### `makeCaPay`
```solidity
function makeCaPay(
    address to,
    address token,
    uint256 amount
) internal virtual
```

**Description**: Transfers tokens from service contract's EVVM balance to another address

**Parameters**:
- `to`: Recipient address
- `token`: Token address to transfer
- `amount`: Amount to transfer

**Requirements**:
- Service contract must have sufficient balance in EVVM
- Token must be valid EVVM token

**Example**:
```solidity
// Withdraw ETH earnings to owner
uint256 ethBalance = evvm.getBalance(address(this), address(0));
makeCaPay(owner, address(0), ethBalance);

// Reward fisher with MATE tokens
makeCaPay(msg.sender, address(1), rewardAmount);

// Transfer tokens to user
makeCaPay(userAddress, tokenAddress, amount);
```

### `_changeEvvmAddress`
```solidity
function _changeEvvmAddress(address newEvvmAddress) internal
```

**Description**: Updates the EVVM contract address (for proxy upgrades)

**Parameters**:
- `newEvvmAddress`: New EVVM contract address

**Use Case**: When EVVM contract is upgraded and service needs to point to new implementation

**Security**: Should be protected with access control

**Example**:
```solidity
contract MyService is MakeServicePaymentOnEvvm {
    address public owner;
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    function updateEvvmAddress(address newAddress) external onlyOwner {
        _changeEvvmAddress(newAddress);
    }
}
```

## Usage Patterns

### Pattern 1: Basic Payment Service
```solidity
contract PaymentService is EvvmPayments {
    constructor(address evvmAddress) EvvmPayments(evvmAddress) {}
    
    function buyItem(
        address buyer,
        uint256 itemPrice,
        uint256 priorityFee,
        uint256 paymentNonce,
        bytes memory paymentSig
    ) external {
        // Simplified payment call
        requestPay(
            buyer,
            address(0),      // ETH
            itemPrice,
            priorityFee,
            paymentNonce,
            true,            // async nonce
            paymentSig
        );
        
        // Item purchased, payment received
    }
}
```

### Pattern 2: With Withdrawals
```solidity
contract ServiceWithWithdrawals is EvvmPayments {
    address public owner;
    
    constructor(address evvmAddress, address _owner) 
        EvvmPayments(evvmAddress) 
    {
        owner = _owner;
    }
    
    function withdrawEarnings() external {
        require(msg.sender == owner, "Not owner");
        
        uint256 balance = evvm.getBalance(address(this), address(0));
        makeCaPay(owner, address(0), balance);
    }
}
```

### Pattern 3: Multi-Token Support
```solidity
contract MultiTokenService is EvvmPayments {
    function processPayment(
        address payer,
        address token,
        uint256 amount,
        uint256 priorityFee,
        uint256 nonce,
        bytes memory signature
    ) external {
        // Validate token
        require(
            token == address(0) || token == address(1),
            "Unsupported token"
        );
        
        // Process payment
        requestPay(payer, token, amount, priorityFee, nonce, true, signature);
    }
}
```

### Pattern 4: Fisher Rewards
```solidity
contract ServiceWithRewards is EvvmPayments {
    function action(
        address user,
        uint256 fee,
        uint256 nonce,
        bytes memory signature
    ) external {
        // Process payment
        requestPay(user, address(0), fee, 0, nonce, true, signature);
        
        // Reward fisher if service has funds
        uint256 reward = calculateReward();
        if (reward > 0) {
            makeCaPay(msg.sender, address(1), reward); // MATE tokens
        }
    }
}
```

## Comparison with Direct EVVM Calls

### Using EvvmPayments
```solidity
// Simplified - fewer parameters
requestPay(
    from,
    token,
    amount,
    priorityFee,
    nonce,
    priorityFlag,
    signature
);
```

### Direct EVVM Call
```solidity
// More verbose - must specify all parameters
evvm.pay(
    from,
    address(this),     // Must specify recipient
    "",                // Must specify identity (usually empty)
    token,
    amount,
    priorityFee,
    nonce,
    priorityFlag,
    address(this),     // Must specify executor
    signature
);
```

**Benefits of EvvmPayments**:
- Fewer parameters to manage
- Service-specific defaults (recipient = this, executor = this)
- Cleaner, more readable code
- Less error-prone

## Integration with EvvmService

`EvvmService` provides similar functionality but with additional features:

### MakeServicePaymentOnEvvm
```solidity
abstract contract MakeServicePaymentOnEvvm {
    // Basic payment helpers
    function makePay(...) internal { }
    function makeCaPay(...) internal { }
}
```

### EvvmService (Includes More)
```solidity
abstract contract EvvmService is AsyncNonce {
    // Payment helpers + additional features
    function requestPay(...) internal { }  // Similar to makePay
    function makeCaPay(...) internal { }
    
    // Additional features
    function validateServiceSignature(...) internal { }
    function _makeStakeService(...) internal { }
    function _makeUnstakeService(...) internal { }
    // + Nonce management via AsyncNonce
}
```

**When to use each**:
- **MakeServicePaymentOnEvvm**: Lightweight, payment-only services
- **EvvmService**: Full-featured services with signatures, nonces, staking

## Security Considerations

### 1. Protect Address Updates
```solidity
// Good - access control
address public owner;

function updateEvvmAddress(address newAddr) external {
    require(msg.sender == owner, "Not owner");
    _changeEvvmAddress(newAddr);
}

// Bad - no protection
function updateEvvmAddress(address newAddr) external {
    _changeEvvmAddress(newAddr); // Anyone can change!
}
```

### 2. Validate Payment Parameters
```solidity
// Good - validate before payment
require(amount > 0, "Invalid amount");
require(token == address(0) || token == address(1), "Invalid token");
makePay(from, token, amount, ...);

// Bad - no validation
makePay(from, token, amount, ...); // Could be invalid
```

### 3. Check Balances Before Withdrawals
```solidity
// Good - check balance exists
uint256 balance = evvm.getBalance(address(this), token);
require(balance > 0, "No balance");
makeCaPay(to, token, balance);

// Bad - blind transfer (fails if no balance)
makeCaPay(to, token, amount); // Might revert
```

### 4. Handle Payment Failures
```solidity
// Good - try-catch for payment
try this.makePay(from, token, amount, ...) {
    // Success
} catch {
    // Handle failure
    revert("Payment failed");
}

// Note: makePay is internal, so you'd need to wrap it
function _tryPay(...) internal returns (bool) {
    try evvm.pay(...) {
        return true;
    } catch {
        return false;
    }
}
```

## Gas Considerations

| Operation | Gas Cost | Notes |
|-----------|----------|-------|
| `makePay` | ~80,000-120,000 | Depends on EVVM state changes |
| `makeCaPay` | ~40,000-60,000 | Token transfer in EVVM |
| `_changeEvvmAddress` | ~5,000 | Simple storage update |

**Optimization Tips**:
- Batch multiple `makeCaPay` calls when possible
- Cache `evvm.getBalance()` results if used multiple times
- Validate inputs before expensive `makePay` calls

## Best Practices

### 1. Document Payment Flow
```solidity
/**
 * @notice Processes order with payment through EVVM
 * @dev Payment flow:
 *      1. Validate order parameters
 *      2. Process payment via makePay (customer -> service)
 *      3. Reward fisher if applicable
 *      4. Mark order as complete
 */
function processOrder(...) external { }
```

### 2. Use Constants for Token Addresses
```solidity
address constant ETH_ADDRESS = address(0);
address constant MATE_ADDRESS = address(1);

function payWithETH(...) external {
    makePay(from, ETH_ADDRESS, amount, ...);
}
```

### 3. Create Wrapper Functions
```solidity
function receiveETHPayment(
    address from,
    uint256 amount,
    uint256 nonce,
    bytes memory signature
) internal {
    makePay(from, address(0), amount, 0, nonce, true, signature);
}

function receiveMATEPayment(
    address from,
    uint256 amount,
    uint256 nonce,
    bytes memory signature
) internal {
    makePay(from, address(1), amount, 0, nonce, true, signature);
}
```

### 4. Emit Events for Tracking
```solidity
event PaymentReceived(address indexed from, address token, uint256 amount);
event FundsWithdrawn(address indexed to, address token, uint256 amount);

function processPayment(...) external {
    makePay(from, token, amount, ...);
    emit PaymentReceived(from, token, amount);
}

function withdraw(address to, address token) external {
    uint256 amount = evvm.getBalance(address(this), token);
    makeCaPay(to, token, amount);
    emit FundsWithdrawn(to, token, amount);
}
```

---

## See Also

- **[EvvmService](../../02-EvvmService.md)** - Full-featured service base contract
- **[EVVM Pay Function](../../../../04-Contracts/01-EVVM/04-PaymentFunctions/01-pay.md)** - Underlying payment function
- **[EVVM caPay Function](../../../../04-Contracts/01-EVVM/04-PaymentFunctions/04-caPay.md)** - Contract balance transfers
