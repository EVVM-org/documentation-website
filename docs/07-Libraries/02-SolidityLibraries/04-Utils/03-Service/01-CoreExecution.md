---
title: "CoreExecution"
description: "Abstract contract providing Core.sol payment processing interface"
sidebar_position: 1
---

# CoreExecution

`CoreExecution` is an abstract contract that provides a convenient interface for services to process payments through Core.sol. It handles both user-initiated payments (via signatures) and contract-authorized payments.

## Overview

**Contract Type**: Abstract Contract
**License**: EVVM-NONCOMMERCIAL-1.0
**Import Path**: `@evvm/testnet-contracts/library/utils/service/CoreExecution.sol`

### Key Features

- Direct integration with Core.sol for payment processing
- Support for both signed and contract-authorized payments
- Batch payment capabilities
- Governance-controlled Core.sol address updates

## State Variables

```solidity
Core public core;
```

Reference to the EVVM Core.sol contract for balance operations.

## Functions

### requestPay

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

**Parameters**:
- `from` - User address making the payment
- `token` - Token address (or `address(0)` for native token)
- `amount` - Payment amount
- `priorityFee` - Optional MATE priority fee
- `nonce` - User's nonce for Core.sol
- `isAsyncExec` - Whether to use async (`true`) or sync (`false`) nonce system
- `signature` - User's EIP-191 signature authorizing the payment

**Implementation**: Calls `core.pay(from, address(this), "", token, amount, priorityFee, address(this), nonce, isAsyncExec, signature)`

**Executor**: Always `address(this)` (the service contract itself)

**Usage**: Call this from your service function when a user needs to pay.

### makeCaPay

```solidity
function makeCaPay(
    address to,
    address token,
    uint256 amount
) internal
```

Sends tokens from service's balance to recipient via contract authorization (no signature required).

**Parameters**:
- `to` - Recipient address
- `token` - Token address (or `address(0)` for native token)
- `amount` - Amount to send

**Usage**: Use this when your service needs to pay users from its own balance (e.g., rewards, refunds).

### makeCaBatchPay

```solidity
function makeCaBatchPay(
    address[] memory to,
    address token,
    uint256[] memory amounts
) internal
```

Sends tokens to multiple recipients via contract authorization (batch version).

**Parameters**:
- `to` - Array of recipient addresses
- `token` - Token address (or `address(0)` for native token)
- `amounts` - Array of amounts corresponding to each recipient

**Usage**: Efficient way to distribute payments to multiple users in a single transaction.

### updateCoreAddress (Admin only)

```solidity
function updateCoreAddress(address newCoreAddress) external virtual
```

Updates the Core.sol contract address. **Must be overridden** with proper access control (e.g., `onlyAdmin` modifier).

**Parameters**:
- `newCoreAddress` - New Core.sol contract address

**Security**: Always restrict this function to admin-only access in your implementation.

## Usage Example

```solidity
import {CoreExecution} from "@evvm/testnet-contracts/library/utils/service/CoreExecution.sol";
import {Admin} from "@evvm/testnet-contracts/library/utils/governance/Admin.sol";

contract CoffeeShop is CoreExecution, Admin {
    uint256 public constant COFFEE_PRICE = 0.001 ether;
    
    constructor(address coreAddress, address initialAdmin) 
        CoreExecution(coreAddress)
        Admin(initialAdmin) 
    {}
    
    function buyCoffee(
        address buyer,
        uint256 priorityFee,
        uint256 nonce,
        bool isAsyncExec,
        bytes memory signature
    ) external {
        // Request payment from buyer
        requestPay(
            buyer,
            address(0), // ETH payment
            COFFEE_PRICE,
            priorityFee,
            nonce,
            isAsyncExec,
            signature
        );
        
        // Process coffee order...
    }
    
    function refundCustomer(address customer, uint256 amount) external onlyAdmin {
        // Send refund from service balance
        makeCaPay(customer, address(0), amount);
    }
    
    function distributeRewards(
        address[] memory winners,
        uint256[] memory amounts
    ) external onlyAdmin {
        // Batch payment to multiple users
        makeCaBatchPay(winners, address(0), amounts);
    }
    
    // Override with admin protection
    function updateCoreAddress(address newCoreAddress) external override onlyAdmin {
        core = Core(newCoreAddress);
    }
}
```

## Integration with EvvmService

`EvvmService` internally inherits from `CoreExecution`, providing these payment functions automatically:

```solidity
import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";

contract MyService is EvvmService {
    // Inherits requestPay, makeCaPay, makeCaBatchPay automatically
}
```

## Payment Flow

### User-to-Service Payment (requestPay)

1. User signs payment authorization with Core.sol nonce
2. Service calls `requestPay()` with signature
3. Core.sol validates signature and nonce
4. Core.sol transfers tokens from user to service
5. Nonce is marked as consumed

### Service-to-User Payment (makeCaPay)

1. Service calls `makeCaPay()` (no signature needed)
2. Core.sol transfers from service balance to user
3. Uses contract address authorization (msg.sender)

## Security Considerations

1. **Nonce Management**: Always use correct nonce from `core.getNonce(user, serviceAddress)`
2. **Signature Validation**: Core.sol validates signatures - don't bypass this
3. **Origin Executor**: Set `originExecutor` to actual EOA calling the transaction
4. **Balance Checks**: Ensure service has sufficient balance before `makeCaPay()`
5. **Admin Protection**: Always override `updateCoreAddress()` with access control

## Related Components

- **[Core.sol](../../../../04-Contracts/01-EVVM/01-Overview.md)** - Main payment contract
- **[EvvmService](../../02-EvvmService.md)** - Includes CoreExecution functionality
- **[SignatureUtil](../02-SignatureUtil.md)** - For manual signature verification
- **[CoreHashUtils](../05-CoreHashUtils.md)** - For generating payment hashes

---

**Recommendation**: Use `CoreExecution` when building services that need Core.sol payment integration without the full `EvvmService` stack.
