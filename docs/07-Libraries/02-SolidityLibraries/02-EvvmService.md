---
title: "EvvmService"
description: "Complete base contract for building EVVM services with built-in payment processing, signature verification, nonce management, and service staking"
sidebar_position: 2
---

# EvvmService

The `EvvmService` abstract contract is the recommended foundation for building EVVM services. It provides a complete, production-ready implementation of common service patterns including signature verification, payment processing, nonce management, and service staking.

## Overview

**Contract Type**: Abstract base contract  
**Inheritance**: `AsyncNonce`, `StakingServiceUtils`, `EvvmPayments`  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/EvvmService.sol`

### Key Features

- **Built-in signature verification** with EVVM ID validation
- **Simplified payment processing** through EVVM
- **Automatic nonce management** (async pattern)
- **Service staking integration** in single function calls
- **Contract balance transfers** for rewards and withdrawals
- **EVVM/Staking address management** for upgradability

## Contract Structure

```solidity
abstract contract EvvmService is AsyncNonce, StakingServiceUtils, EvvmPayments {
    error InvalidServiceSignature();

    // NOTE: `evvm` and `staking` are provided by base contracts:
    // - `EvvmPayments` defines `IEvvm internal evvm;`
    // - `StakingServiceUtils` defines `IStaking internal staking;`

    constructor(address evvmAddress, address stakingAddress)
        StakingServiceUtils(stakingAddress)
        EvvmPayments(evvmAddress)
    {}

    // Signature verification
    // Payment processing
    // Service staking
    // Helper functions
}
```

## State Variables

The `EvvmService` relies on state variables declared in its base libraries rather than redeclaring them:

### From `EvvmPayments`
```solidity
IEvvm internal evvm;
```
An `IEvvm` handle for payment processing and balance queries.

### From `StakingServiceUtils`
```solidity
IStaking internal staking;
```
A `IStaking` handle for service staking operations.

## Functions

### Signature Verification

#### `validateServiceSignature`
```solidity
function validateServiceSignature(
    string memory functionName,
    string memory inputs,
    bytes memory signature,
    address expectedSigner
) internal view virtual
```

Validates that a signature was created by the expected signer for a specific function call.

**Parameters**:
- `functionName`: Name of the function being called (e.g., "orderCoffee")
- `inputs`: Comma-separated string of function parameters (e.g., "latte,2,1000000000000000")
- `signature`: EIP-191 signature bytes
- `expectedSigner`: Address that should have created the signature

**Message Format**: `"<evvmID>,<functionName>,<inputs>"`

**Reverts**: `InvalidServiceSignature()` if signature is invalid

**Example**:
```solidity
validateServiceSignature(
    "orderCoffee",
    string.concat(
        "latte,",
        AdvancedStrings.uintToString(2),
        ",",
        AdvancedStrings.uintToString(1 ether)
    ),
    userSignature,
    customerAddress
);
```

### Payment Processing

#### `requestPay`
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

Processes a payment through EVVM from a user to this service contract.

**Parameters**:
- `from`: Address sending the payment
- `token`: Token address (`address(0)` for ETH, `address(1)` for MATE)
- `amount`: Amount to transfer
- `priorityFee`: Fee paid to fisher executing the transaction
- `nonce`: EVVM payment nonce
- `priorityFlag`: `true` for async nonce, `false` for sync nonce
- `signature`: Payment authorization signature from `from` address

**Recipient**: Always `address(this)` (the service contract)  
**Executor**: Always `address(this)` (service executes on behalf of itself)

**Example**:
```solidity
requestPay(
    customerAddress,
    getEtherAddress(),
    1 ether,
    0.001 ether, // priority fee
    12345,
    true, // async nonce
    paymentSignature
);
```

#### `makeCaPay`
```solidity
function makeCaPay(
    address to,
    address token,
    uint256 amount
) internal virtual
```

Transfers tokens from the service contract's EVVM balance to another address.

**Parameters**:
- `to`: Recipient address
- `token`: Token address to transfer
- `amount`: Amount to transfer

**Use Cases**:
- Withdrawing service funds
- Distributing fisher rewards
- Transferring accumulated rewards

**Example**:
```solidity
// Withdraw ETH balance
uint256 balance = evvm.getBalance(address(this), getEtherAddress());
makeCaPay(owner, getEtherAddress(), balance);

// Reward fisher
makeCaPay(msg.sender, getPrincipalTokenAddress(), rewardAmount);
```

### Service Staking

#### `_makeStakeService`
```solidity
function _makeStakeService(uint256 amountToStake) internal
```

Stakes tokens to make this service contract a staker in one transaction.

**Parameters**:
- `amountToStake`: Number of stake units to purchase

**Process**:
1. Calls `staking.prepareServiceStaking(amountToStake)`
2. Transfers `priceOfStaking * amountToStake` MATE tokens to staking contract
3. Calls `staking.confirmServiceStaking()`

**Requirements**:
- Service must have sufficient MATE tokens in EVVM balance
- Service must not have pending staking operations

**Example**:
```solidity
function stake(uint256 amount) external onlyOwner {
    _makeStakeService(amount);
}
```

#### `_makeUnstakeService`
```solidity
function _makeUnstakeService(uint256 amountToUnstake) internal
```

Unstakes tokens from the service staking position.

**Parameters**:
- `amountToUnstake`: Number of stake units to release

**Requirements**:
- Service must have staked tokens
- Cannot unstake more than current stake

**Example**:
```solidity
function unstake(uint256 amount) external onlyOwner {
    _makeUnstakeService(amount);
}
```

### Address Management

#### `_changeEvvmAddress`
```solidity
function _changeEvvmAddress(address newEvvmAddress) internal
```

Updates the EVVM contract address (for upgrades).

**Parameters**:
- `newEvvmAddress`: New EVVM contract address

**Use Case**: When EVVM contract is upgraded via proxy

#### `_changeStakingAddress`
```solidity
function _changeStakingAddress(address newStakingAddress) internal
```

Updates the Staking contract address (for upgrades).

**Parameters**:
- `newStakingAddress`: New Staking contract address

**Use Case**: When Staking contract is upgraded

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

## Inherited Functionality

From `AsyncNonce`:

### `verifyAsyncNonce`
```solidity
function verifyAsyncNonce(address user, uint256 nonce) internal view virtual
```

Checks if an async nonce has been used.

**Reverts**: `AsyncNonceAlreadyUsed()` if nonce was already used

### `markAsyncNonceAsUsed`
```solidity
function markAsyncNonceAsUsed(address user, uint256 nonce) internal virtual
```

Marks an async nonce as consumed to prevent replay attacks.

### `getIfUsedAsyncNonce`
```solidity
function getIfUsedAsyncNonce(address user, uint256 nonce) public view virtual returns (bool)
```

Public function to check nonce availability.

**Returns**: `true` if nonce has been used, `false` if still available

## Complete Usage Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";

contract CoffeeShop is EvvmService {
    error Unauthorized();
    
    address public owner;
    
    constructor(
        address evvmAddress,
        address stakingAddress,
        address _owner
    ) EvvmService(evvmAddress, stakingAddress) {
        owner = _owner;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    /**
     * @notice Process coffee order with EVVM payment
     * @param customer Customer address
     * @param coffeeType Type of coffee (e.g., "latte", "espresso")
     * @param quantity Number of coffees
     * @param price Total price in wei
     * @param nonce Unique nonce for replay protection
     * @param signature Customer's signature
     * @param priorityFee Fee for fisher
     * @param evvmNonce EVVM payment nonce
     * @param useAsync Use async nonce for EVVM payment
     * @param paymentSig Payment authorization signature
     */
    function orderCoffee(
        address customer,
        string memory coffeeType,
        uint256 quantity,
        uint256 price,
        uint256 nonce,
        bytes memory signature,
        uint256 priorityFee,
        uint256 evvmNonce,
        bool useAsync,
        bytes memory paymentSig
    ) external {
        // 1. Validate customer signature
        validateServiceSignature(
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
        
        // 2. Check nonce hasn't been used
        verifyAsyncNonce(customer, nonce);
        
        // 3. Process payment
        requestPay(
            customer,
            getEtherAddress(),
            price,
            priorityFee,
            evvmNonce,
            useAsync,
            paymentSig
        );
        
        // 4. Reward fisher if service is staker
        if (evvm.isAddressStaker(address(this))) {
            makeCaPay(msg.sender, getEtherAddress(), priorityFee);
            makeCaPay(msg.sender, getPrincipalTokenAddress(), evvm.getRewardAmount() / 2);
        }
        
        // 5. Mark nonce as used
        markAsyncNonceAsUsed(customer, nonce);
        
        // 6. Prepare coffee (off-chain)
        // emit CoffeeOrdered(customer, coffeeType, quantity);
    }
    
    /**
     * @notice Stake service to earn rewards
     */
    function stake(uint256 amount) external onlyOwner {
        _makeStakeService(amount);
    }
    
    /**
     * @notice Unstake service tokens
     */
    function unstake(uint256 amount) external onlyOwner {
        _makeUnstakeService(amount);
    }
    
    /**
     * @notice Withdraw ETH earnings
     */
    function withdrawFunds(address to) external onlyOwner {
        uint256 balance = evvm.getBalance(address(this), getEtherAddress());
        makeCaPay(to, getEtherAddress(), balance);
    }
    
    /**
     * @notice Withdraw MATE rewards
     */
    function withdrawRewards(address to) external onlyOwner {
        uint256 balance = evvm.getBalance(address(this), getPrincipalTokenAddress());
        makeCaPay(to, getPrincipalTokenAddress(), balance);
    }
}
```

## Best Practices

### 1. Always Validate Signatures
```solidity
// Good
validateServiceSignature("action", params, signature, user);

// Bad - no validation
// Process without checking signature
```

### 2. Check Nonces Before Payment
```solidity
// Good - check nonce first
verifyAsyncNonce(user, nonce);
requestPay(...);
markAsyncNonceAsUsed(user, nonce);

// Bad - payment before nonce check (wastes gas on replay)
requestPay(...);
verifyAsyncNonce(user, nonce);
```

### 3. Reward Fishers Appropriately
```solidity
// Good - check if service is staker
if (evvm.isAddressStaker(address(this))) {
    makeCaPay(msg.sender, getEtherAddress(), priorityFee);
}

// Bad - always reward (fails if not staker)
makeCaPay(msg.sender, getEtherAddress(), priorityFee);
```

### 4. Protect Admin Functions
```solidity
// Good - require authorization
function stake(uint256 amount) external onlyOwner {
    _makeStakeService(amount);
}

// Bad - anyone can stake
function stake(uint256 amount) external {
    _makeStakeService(amount);
}
```

## Security Considerations

### Signature Replay Prevention
- Always use `verifyAsyncNonce()` before processing actions
- Mark nonces as used with `markAsyncNonceAsUsed()` after successful execution
- Never reuse nonces across different function calls

### Payment Authorization
- `requestPay()` requires valid payment signature from sender
- EVVM validates payment signatures internally
- Service cannot forge payments

### Access Control
- Protect staking functions (`_makeStakeService`, `_makeUnstakeService`)
- Protect withdrawal functions (`makeCaPay` for owner withdrawals)
- Protect address management functions (`_changeEvvmAddress`, `_changeStakingAddress`)

## Gas Optimization Tips

1. **Batch nonce checks**: Check all nonces before external calls
2. **Cache balances**: Store `evvm.getBalance()` results if used multiple times
3. **Minimize string concatenation**: Pre-compute parameter strings when possible
4. **Use events**: Emit events instead of storing unnecessary data

## Migration from Manual Implementation

### Before (Manual)
```solidity
contract OldService {
    IEvvm evvm;
    mapping(address => mapping(uint256 => bool)) nonces;
    
    function action(...) external {
        // Manual signature verification
        bytes32 hash = keccak256(...);
        address signer = ecrecover(hash, v, r, s);
        require(signer == expectedSigner, "Invalid");
        
        // Manual nonce check
        require(!nonces[user][nonce], "Used");
        
        // Manual payment
        evvm.pay(user, address(this), "", token, amount, ...);
        
        // Manual nonce marking
        nonces[user][nonce] = true;
    }
}
```

### After (EvvmService)
```solidity
contract NewService is EvvmService {
    function action(...) external {
        validateServiceSignature("action", params, sig, user);
        verifyAsyncNonce(user, nonce);
        requestPay(user, token, amount, fee, evmNonce, async, paymentSig);
        markAsyncNonceAsUsed(user, nonce);
    }
}
```

**Benefits**: Less code, fewer bugs, battle-tested patterns, automatic upgrades

---

## See Also

- **[AsyncNonce](./04-Utils/03-Service/01-AsyncNonceService.md)** - Inherited nonce management
- **[SignatureUtil](./04-Utils/02-SignatureUtil.md)** - Signature verification used internally
- **[How to Make an EVVM Service](../../06-HowToMakeAEVVMService.md)** - Complete service development guide
- **[Staking Integration](../../04-Contracts/03-Staking/01-Overview.md)** - Service staking details
