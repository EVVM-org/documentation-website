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
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec,
    bytes memory signature
) internal
```

Requests payment from a user via Core.sol with signature validation.

**Parameters**:
- `from` - User address making the payment (signer)
- `token` - Token address (or `address(0)` for native token)
- `amount` - Payment amount
- `priorityFee` - Executor fee (paid to transaction sender)
- `originExecutor` - Original executor address (user or relayer who initiated the transaction)
- `nonce` - User's nonce for Core.sol (sequential sync or user-chosen async)
- `isAsyncExec` - Whether to use async (`true`) or sync (`false`) nonce system
- `signature` - User's EIP-191 signature authorizing the payment

**Implementation**: Calls `core.pay(from, address(this), "", token, amount, priorityFee, address(this), originExecutor, nonce, isAsyncExec, signature)`

**Signature Format**: User must sign centralized payload:
```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```
Where `hashPayload = CoreHashUtils.hashDataForPay(address(this), "", token, amount, priorityFee)`

**Usage**: Call this from your service function when a user needs to pay.

**Example**:
```solidity
// User wants to pay service
requestPay(
    userAddress,        // from
    address(0),         // token (ETH)
    1 ether,            // amount
    0.001 ether,        // priorityFee
    msg.sender,         // originExecutor (relayer or user)
    nonce,              // User's nonce
    true,               // isAsyncExec
    signature           // User's signature
);
```

### requestDispersePay

```solidity
function requestDispersePay(
    CoreStructs.DispersePayMetadata[] memory toData,
    address token,
    uint256 amount,
    uint256 priorityFee,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec,
    bytes memory signature
) internal
```

Requests batch payment from a user via Core.sol (multi-recipient distribution).

**Parameters**:
- `toData` - Array of `DispersePayMetadata` structs (amount, to_address, to_identity)
- `token` - Token address
- `amount` - Total amount (must equal sum of toData amounts)
- `priorityFee` - Executor fee
- `originExecutor` - Original executor address
- `nonce` - User's nonce
- `isAsyncExec` - Nonce type
- `signature` - User's EIP-191 signature

**Implementation**: Calls `core.dispersePay(address(this), toData, token, amount, priorityFee, address(this), originExecutor, nonce, isAsyncExec, signature)`

**Usage**: When service needs to distribute user's funds to multiple recipients in one transaction.

**Example**:
```solidity
CoreStructs.DispersePayMetadata[] memory recipients = 
    new CoreStructs.DispersePayMetadata[](2);

recipients[0] = CoreStructs.DispersePayMetadata({
    amount: 0.5 ether,
    to_address: address(0x123),
    to_identity: ""
});

recipients[1] = CoreStructs.DispersePayMetadata({
    amount: 0.5 ether,
    to_address: address(0),
    to_identity: "bob"
});

requestDispersePay(
    recipients,
    address(0),         // ETH
    1 ether,            // total (must match sum)
    0.01 ether,
    msg.sender,
    nonce,
    true,
    signature
);
```

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

**Implementation**: Calls `core.caPay(to, token, amount)`

**Requirements**:
- Service must have sufficient balance in Core.sol
- Called contract must be detected as contract (not EOA)

**Usage**: Use this when your service needs to pay users from its own balance (e.g., rewards, refunds).

**Example**:
```solidity
// Refund customer from service balance
makeCaPay(
    customerAddress,
    address(0),         // ETH
    1 ether             // refund amount
);
```

### makeDisperseCaPay

```solidity
function makeDisperseCaPay(
    CoreStructs.DisperseCaPayMetadata[] memory toData,
    address token,
    uint256 amount
) internal
```

Sends tokens to multiple recipients via contract authorization (batch version).

**Parameters**:
- `toData` - Array of `DisperseCaPayMetadata` structs (to_address, amount)
- `token` - Token address
- `amount` - Total amount (must equal sum of toData amounts)

**Implementation**: Calls `core.disperseCaPay(toData, token, amount)`

**Usage**: Efficient way to distribute payments to multiple users in a single transaction.

**Example**:
```solidity
CoreStructs.DisperseCaPayMetadata[] memory payouts = 
    new CoreStructs.DisperseCaPayMetadata[](3);

payouts[0] = CoreStructs.DisperseCaPayMetadata({
    to_address: winner1,
    amount: 1 ether
});

payouts[1] = CoreStructs.DisperseCaPayMetadata({
    to_address: winner2,
    amount: 0.5 ether
});

payouts[2] = CoreStructs.DisperseCaPayMetadata({
    to_address: winner3,
    amount: 0.5 ether
});

makeDisperseCaPay(
    payouts,
    address(0),         // ETH
    2 ether             // total (must match sum)
);
```

### getNextCurrentSyncNonce

```solidity
function getNextCurrentSyncNonce(
    address user
) external view returns (uint256)
```

Gets the next sequential sync nonce for a user.

**Parameters**:
- `user` - User address to query

**Returns**: Next sync nonce value (auto-increments after each use)

**Usage**: Query this to get the nonce for sync signature generation.

### getIfUsedAsyncNonce

```solidity
function getIfUsedAsyncNonce(
    address user,
    uint256 nonce
) external view returns (bool)
```

Checks if an async nonce has been consumed.

**Parameters**:
- `user` - User address
- `nonce` - Async nonce to check

**Returns**: `true` if consumed, `false` if available/reserved

**Usage**: Query before using an async nonce in signatures.

## Usage Example

```solidity
import {CoreExecution} from "@evvm/testnet-contracts/library/utils/service/CoreExecution.sol";
import {Admin} from "@evvm/testnet-contracts/library/utils/governance/Admin.sol";
import {CoreStructs} from "@evvm/testnet-contracts/library/structs/CoreStructs.sol";

contract CoffeeShop is CoreExecution, Admin {
    uint256 public constant COFFEE_PRICE = 0.001 ether;
    
    constructor(address coreAddress, address initialAdmin) 
        CoreExecution(coreAddress)
        Admin(initialAdmin) 
    {}
    
    function buyCoffee(
        address buyer,
        uint256 priorityFee,
        address originExecutor,
        uint256 nonce,
        bool isAsyncExec,
        bytes memory signature
    ) external {
        // Request payment from buyer
        requestPay(
            buyer,
            address(0),         // ETH payment
            COFFEE_PRICE,
            priorityFee,
            originExecutor,     // Original executor (relayer or user)
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
        // Prepare batch payment data
        CoreStructs.DisperseCaPayMetadata[] memory payouts = 
            new CoreStructs.DisperseCaPayMetadata[](winners.length);
        
        uint256 total = 0;
        for (uint256 i = 0; i < winners.length; i++) {
            payouts[i] = CoreStructs.DisperseCaPayMetadata({
                to_address: winners[i],
                amount: amounts[i]
            });
            total += amounts[i];
        }
        
        // Batch payment to multiple users
        makeDisperseCaPay(payouts, address(0), total);
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

1. User generates async nonce or queries sync nonce from Core.sol
2. User signs payment authorization using centralized signature format:
   - Payload: `{evvmId},{serviceAddress},{hashPayload},{originExecutor},{nonce},{isAsyncExec}`
   - Where `hashPayload = CoreHashUtils.hashDataForPay(serviceAddress, "", token, amount, priorityFee)`
3. Service calls `requestPay()` with signature and originExecutor
4. Core.sol:
   - Validates signature matches user and reconstructs payload
   - Validates and consumes nonce via `validateAndConsumeNonce()`
   - Transfers tokens from user to service
5. Service processes the transaction

### User-to-Multiple Recipients (requestDispersePay)

1. User signs batch payment with multiple recipients
2. Service calls `requestDispersePay()` with toData array
3. Core.sol validates signature and distributes funds to all recipients
4. Single nonce consumed for entire batch

### Service-to-User Payment (makeCaPay)

1. Service calls `makeCaPay()` (no signature needed)
2. Core.sol verifies caller is a contract (not EOA)
3. Core.sol transfers from service balance to user
4. Uses contract address authorization (`msg.sender`)

### Service-to-Multiple Recipients (makeDisperseCaPay)

1. Service calls `makeDisperseCaPay()` with batch data
2. Core.sol distributes funds to all recipients in one transaction
3. More gas-efficient than multiple `makeCaPay()` calls

## Security Considerations

1. **Origin Executor Parameter**: Always set `originExecutor` to the actual EOA or address that initiated the transaction:
   ```solidity
   // Good - use msg.sender as originExecutor for relayed transactions
   requestPay(user, token, amount, fee, msg.sender, nonce, true, sig);
   
   // Also valid - user directly calling
   requestPay(user, token, amount, fee, user, nonce, true, sig);
   ```

2. **Nonce Management**: 
   - **Sync nonces**: Auto-increment, query with `getNextCurrentSyncNonce(user)`
   - **Async nonces**: User-chosen, check availability with `getIfUsedAsyncNonce(user, nonce)`
   - Never reuse nonces - causes signature failure

3. **Signature Validation**: 
   - Core.sol validates signatures using centralized format
   - Signature must be from `from` parameter
   - Don't bypass or skip signature validation

4. **Balance Checks**: 
   - User must have sufficient balance in Core.sol for `requestPay()`
   - Service must have sufficient balance for `makeCaPay()`
   - Check balances before attempting payments

5. **Contract Authorization**: 
   - `makeCaPay()` only works from contract addresses
   - Core.sol uses `CAUtils.verifyIfCA()` to verify caller
   - EOAs cannot use contract-authorized payments

6. **Batch Payment Validation**:
   - Total amount must EXACTLY match sum of individual amounts
   - Mismatch causes transaction revert
   - Validate before calling `requestDispersePay()` or `makeDisperseCaPay()`

## Related Components

- **[Core.sol](../../../../04-Contracts/01-EVVM/01-Overview.md)** - Main payment contract
- **[EvvmService](../../02-EvvmService.md)** - Includes CoreExecution functionality
- **[SignatureUtil](../02-SignatureUtil.md)** - For manual signature verification
- **[CoreHashUtils](../05-CoreHashUtils.md)** - For generating payment hashes

---

**Recommendation**: Use `CoreExecution` when building services that need Core.sol payment integration without the full `EvvmService` stack.
