---
title: "EvvmService"
description: "Complete base contract for building EVVM services with built-in payment processing, service staking, and Core.sol integration"
sidebar_position: 2
---

# EvvmService

The `EvvmService` abstract contract is the recommended foundation for building EVVM services. It combines `CoreExecution` for Core.sol payment processing and `StakingServiceUtils` for simplified service staking into a single, production-ready base contract.

## Overview

**Contract Type**: Abstract base contract  
**Inheritance**: `CoreExecution`, `StakingServiceUtils`  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/EvvmService.sol`

### Key Features

- **Direct Core.sol integration** for payment processing (via CoreExecution)
- **Simplified service staking** in single function calls (via StakingServiceUtils)
- **EVVM ID access** for signature generation
- **Principal Token queries** for MATE operations
- **Minimal dependencies** - no nonce management or redundant abstractions

## Contract Structure

```solidity
abstract contract EvvmService is CoreExecution, StakingServiceUtils {
    error InvalidServiceSignature();

    // NOTE: `core` and `staking` are provided by base contracts:
    // - `CoreExecution` defines `Core public core;`
    // - `StakingServiceUtils` defines `IStaking internal staking;`

    constructor(address coreAddress, address stakingAddress)
        StakingServiceUtils(stakingAddress)
        CoreExecution(coreAddress)
    {}

    // Helper functions
    function getEvvmID() internal view returns (uint256);
    function getPrincipalTokenAddress() internal view returns (address);
}
```

## Inherited State Variables

The `EvvmService` relies on state variables declared in its base contracts:

### From `CoreExecution`
```solidity
Core public core;
```
A `Core` handle for payment processing, nonce validation, and balance operations.

### From `StakingServiceUtils`
```solidity
IStaking internal staking;
```
A `IStaking` handle for service staking operations.


## Functions

EvvmService provides two helper functions for accessing Core.sol metadata:

### `getEvvmID`
```solidity
function getEvvmID() internal view returns (uint256)
```

**Description**: Gets the unique EVVM instance identifier for signature validation

**Returns**: Unique blockchain instance identifier from Core.sol

**Usage**: Prevents cross-chain replay attacks by including this ID in signatures

**Example**:
```solidity
function generateMessage(string memory action) internal view returns (string memory) {
    return string.concat(
        Strings.toString(getEvvmID()), ",",
        Strings.toHexString(address(this)), ",",
        action
    );
}
```

### `getPrincipalTokenAddress`
```solidity
function getPrincipalTokenAddress() internal view returns (address)
```

**Description**: Gets the Principal Token (MATE) address

**Returns**: Address of the MATE token contract

**Usage**: Required for MATE payment operations and staking

**Example**:
```solidity
function stakeMate(uint256 amount) external {
    address mate = getPrincipalTokenAddress();
    // Use MATE address for operations
}
```

## Inherited Functions

### From CoreExecution

The following payment functions are available through `CoreExecution` inheritance:

#### `requestPay`
```solidity
function requestPay(
    address from,
    address token,
    uint256 amount,
    uint256 priorityFee,
    uint256 nonce,
    bool isAsyncExec,
    bytes memory signature
) internal
```

Requests payment from a user via Core.sol with signature validation.

**Documentation**: See [CoreExecution](./04-Utils/03-Service/01-CoreExecution.md)

**Example**:
```solidity
requestPay(
    customerAddress,
    address(0),             // ETH
    1 ether,
    0.001 ether,            // Priority fee
    nonce,
    true,                   // isAsyncExec
    paymentSignature
);
```

#### `makeCaPay`
```solidity
function makeCaPay(
    address to,
    address token,
    uint256 amount
) internal
```

Sends tokens from service's balance to recipient via contract authorization (no signature required).

**Documentation**: See [CoreExecution](./04-Utils/03-Service/01-CoreExecution.md)

**Example**:
```solidity
// Withdraw ETH balance
makeCaPay(owner, address(0), balance);

// Reward user
makeCaPay(msg.sender, getPrincipalTokenAddress(), rewardAmount);
```

#### `makeCaBatchPay`
```solidity
function makeCaBatchPay(
    address[] memory to,
    address token,
    uint256[] memory amounts
) internal
```

Sends tokens to multiple recipients via contract authorization (batch version).

**Documentation**: See [CoreExecution](./04-Utils/03-Service/01-CoreExecution.md)

### From StakingServiceUtils

The following staking functions are available through `StakingServiceUtils` inheritance:

#### `_makeStakeService`
```solidity
function _makeStakeService(uint256 amountToStake) internal
```

Stakes MATE tokens to make this service contract a staker in one transaction.

**Documentation**: See [StakingServiceUtils](./04-Utils/03-Service/02-StakingServiceUtils.md)

**Example**:
```solidity
function stake(uint256 amount) external onlyAdmin {
    _makeStakeService(amount);
}
```

#### `_makeUnstakeService`
```solidity
function _makeUnstakeService(uint256 amountToUnstake) internal
```

Unstakes MATE tokens from the service staking position.

**Documentation**: See [StakingServiceUtils](./04-Utils/03-Service/02-StakingServiceUtils.md)

**Example**:
```solidity
function unstake(uint256 amount) external onlyAdmin {
    _makeUnstakeService(amount);
}
```

### Helper Functions

#### `getPrincipalTokenAddress`
```solidity
function getPrincipalTokenAddress() internal pure virtual returns (address)
```

Returns the MATE token address used in EVVM.

**Returns**: `address(1)` (MATE token representation)

#### `getEtherAddress`
```solidity
function getEtherAddress() internal pure virtual returns (address)
```

Returns the ETH token address used in EVVM.

**Returns**: `address(0)` (ETH representation)

## Complete Usage Example

```solidity
// SPDX-License-Identifier: EVVM-NONCOMMERCIAL-1.0
pragma solidity ^0.8.0;

import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";
import {Admin} from "@evvm/testnet-contracts/library/utils/governance/Admin.sol";

contract CoffeeShop is EvvmService, Admin {
    // Events
    event CoffeeOrdered(address indexed customer, string coffeeType, uint256 quantity);
    
    uint256 public constant COFFEE_PRICE = 0.001 ether;
    
    constructor(
        address coreAddress,
        address stakingAddress,
        address initialAdmin
    ) 
        EvvmService(coreAddress, stakingAddress) 
        Admin(initialAdmin)
    {}
    
    /**
     * @notice Process coffee order with Core.sol payment
     * @param customer Customer address
     * @param coffeeType Type of coffee (e.g., "latte")
     * @param quantity Number of coffees
     * @param priorityFee Fee for fisher (in MATE)
     * @param originExecutor EOA that will execute (verified with tx.origin)
     * @param nonce Core.sol nonce for customer
     * @param signature Customer's payment authorization signature
     */
    function orderCoffee(
        address customer,
        string memory coffeeType,
        uint256 quantity,
        uint256 priorityFee,
        uint256 nonce,
        bytes memory signature
    ) external {
        uint256 totalPrice = COFFEE_PRICE * quantity;
        
        // Request payment via Core.sol (validates signature and consumes nonce)
        requestPay(
            customer,
            address(0),             // ETH payment
            totalPrice,
            priorityFee,
            nonce,
            true,                   // Always async
            signature
        );
        
        // Emit event for off-chain processing
        emit CoffeeOrdered(customer, coffeeType, quantity);
    }
    
    /**
     * @notice Refund a customer (admin only)
     * @param customer Customer to refund
     * @param amount Amount to refund
     */
    function refundCustomer(address customer, uint256 amount) external onlyAdmin {
        // Send refund from service balance (no signature needed)
        makeCaPay(customer, address(0), amount);
    }
    
    /**
     * @notice Stake service to earn rewards (admin only)
     * @param amount Number of stake units
     */
    function stake(uint256 amount) external onlyAdmin {
        _makeStakeService(amount);
    }
    
    /**
     * @notice Unstake service tokens (admin only)
     * @param amount Number of stake units
     */
    function unstake(uint256 amount) external onlyAdmin {
        _makeUnstakeService(amount);
    }
    
    /**
     * @notice Withdraw ETH earnings (admin only)
     * @param to Recipient address
     */
    function withdrawFunds(address to) external onlyAdmin {
        uint256 balance = core.getBalance(address(this), address(0));
        makeCaPay(to, address(0), balance);
    }
    
    /**
     * @notice Withdraw MATE rewards (admin only)
     * @param to Recipient address
     */
    function withdrawRewards(address to) external onlyAdmin {
        address mate = getPrincipalTokenAddress();
        uint256 balance = core.getBalance(address(this), mate);
        makeCaPay(to, mate, balance);
    }
    
    /**
     * @notice Update Core.sol address (admin only)
     * @param newCoreAddress New Core contract address
     */
    function updateCoreAddress(address newCoreAddress) external override onlyAdmin {
        core = Core(newCoreAddress);
    }
}
```

## Best Practices

### 1. Always Use Core.sol for Payment Validation
```solidity
// Good - Core.sol validates signature and nonce
```solidity
// Good - Core.sol validates signature and nonce
requestPay(user, token, amount, priorityFee, nonce, true, signature);

// Bad - Manual validation is redundant and error-prone
// Don't implement your own signature/nonce validation
```

// Bad - no validation
// Process without checking signature
```

### 2. Let Core.sol Handle Nonce Management
```solidity
// Good - Core.sol validates and consumes nonce
requestPay(user, token, amount, priorityFee, nonce, true, signature);

// Bad - Don't implement your own nonce tracking
// Core.sol manages nonces centrally
```

### 3. Use isAsyncExec Appropriately
```solidity
// Good - async for most operations
requestPay(user, token, amount, priorityFee, nonce, true, signature);

// Sync only when sequential order matters
requestPay(user, token, amount, priorityFee, nonce, false, signature);
```

### 4. Protect Admin Functions
```solidity
// Good - require authorization (using Admin pattern)
function stake(uint256 amount) external onlyAdmin {
    _makeStakeService(amount);
}

// Bad - anyone can stake
function stake(uint256 amount) external {
    _makeStakeService(amount);
}
```

### 5. Override updateCoreAddress with Access Control
```solidity
// Good - admin-protected override
function updateCoreAddress(address newCoreAddress) external override onlyAdmin {
    core = Core(newCoreAddress);
}

// Bad - exposed to anyone (security risk)
function updateCoreAddress(address newCoreAddress) external override {
    core = Core(newCoreAddress);
}
```

## Security Considerations

### Centralized Validation via Core.sol
- **Core.sol validates signatures**: Uses `validateAndConsumeNonce()` on every `requestPay()`
- **Automatic nonce management**: Core.sol marks nonces as consumed (no manual tracking needed)
- **Replay protection**: Nonces are one-time use, enforced by Core.sol
- **Origin executor verification**: Core.sol uses `tx.origin` to verify EOA caller

### Access Control
- **Staking functions**: Always protect `_makeStakeService()` and `_makeUnstakeService()`
- **Withdrawal functions**: Protect `makeCaPay()` calls for owner withdrawals
- **Address updates**: Override `updateCoreAddress()` with admin-only access

### Payment Authorization
- `requestPay()` requires valid user signature - Core.sol validates it
- Service cannot forge payments on behalf of users
- Users must explicitly sign payment authorization messages

## Gas Optimization Tips

1. **Batch operations**: Use `makeCaBatchPay()` for multiple recipients
2. **Cache balances**: Store `core.getBalance()` results if used multiple times
3. **Avoid redundant checks**: Core.sol already validates signatures/nonces
4. **Use events**: Emit events instead of storing unnecessary data on-chain

## Architecture Benefits

### Compared to Manual Implementation

**Before (Manual):**
```solidity
contract OldService {
    IEvvm evvm;
    mapping(address => mapping(uint256 => bool)) nonces;  // Manual nonce tracking
    
    function action(...) external {
        // 1. Manual signature verification
        bytes32 hash = keccak256(...);
        address signer = ecrecover(hash, v, r, s);
        require(signer == expectedSigner, "Invalid");
        
        // 2. Manual nonce check
        require(!nonces[user][nonce], "Used");
        
        // 3. Manual payment call
        evvm.pay(user, address(this), "", token, amount, ...);
        
        // 4. Manual nonce marking
        nonces[user][nonce] = true;
    }
}
```

**After (EvvmService):**
```solidity
contract NewService is EvvmService, Admin {
    function action(
        address user,
        address token,
        uint256 amount,
        uint256 priorityFee,
        uint256 nonce,
        bytes memory signature
    ) external {
        // Single call - Core.sol validates signature, verifies executor, consumes nonce
        requestPay(user, token, amount, priorityFee, nonce, true, signature);
    }
}
```

**Benefits**:
- **Less code**: No manual signature/nonce management
- **Fewer bugs**: Battle-tested Core.sol validation
- **Gas efficient**: No redundant nonce storage in service
- **Centralized security**: Core.sol enforces all rules
- **Automatic upgrades**: Core.sol improvements benefit all services
- **Consistent patterns**: All services use same validation logic

---

## See Also

- **[CoreExecution](./04-Utils/03-Service/01-CoreExecution.md)** - Base payment processing contract
- **[StakingServiceUtils](./04-Utils/03-Service/02-StakingServiceUtils.md)** - Service staking utilities
- **[Admin](./04-Utils/04-GovernanceUtils.md)** - Governance pattern for access control
- **[How to Make an EVVM Service](../../06-HowToMakeAEVVMService.md)** - Complete service development guide
- **[Core.sol Overview](../../04-Contracts/01-EVVM/01-Overview.md)** - Centralized validation details
