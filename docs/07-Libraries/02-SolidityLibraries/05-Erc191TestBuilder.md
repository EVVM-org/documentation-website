---
title: "Erc191TestBuilder"
description: "Testing utility library for building ERC-191 compliant message hashes for Foundry tests with EVVM's centralized signature architecture"
sidebar_position: 5
---

# Erc191TestBuilder

The `Erc191TestBuilder` library provides utility functions for building ERC-191 compliant message hashes in Foundry test scripts. It simplifies the process of creating signed messages for testing all EVVM system contracts using the **centralized signature architecture**.

## Overview

**Library Type**: Pure functions for testing  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/Erc191TestBuilder.sol`  
**Author**: jistro.eth

### Key Features

- **ERC-191 compliant** message hash generation
- **Centralized signature format** (6-parameter payload)
- **Pre-built functions** for all EVVM contract signatures
- **Foundry integration** compatible
- **Type-safe** parameter handling

### Use Cases

- **Unit testing** contract functions with signatures
- **Integration testing** multi-contract workflows
- **Signature verification** testing
- **Gas optimization** testing with realistic signatures

## Signature Architecture

All functions in this library use the **centralized EVVM signature format**:

**Payload Format**: `{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}`

**Construction Flow**:
1. Generate function-specific hash using HashUtils (e.g., `CoreHashUtils.hashDataForPay()`)
2. Build signature payload with `AdvancedStrings.buildSignaturePayload()`
3. Apply ERC-191 formatting with `buildHashForSign()`
4. Sign with `vm.sign()` in Foundry tests

## Core Functions

### `buildHashForSign`
```solidity
function buildHashForSign(
    string memory messageToSign
) internal pure returns (bytes32)
```

**Description**: Creates an ERC-191 compliant message hash from a string

**Parameters**:
- `messageToSign`: The message string to hash

**Returns**: `bytes32` hash ready for signing with Foundry's `vm.sign()`

**Format**: `keccak256("\x19Ethereum Signed Message:\n" + length + message)`

**Example**:
```solidity
import {Erc191TestBuilder} from "@evvm/testnet-contracts/library/Erc191TestBuilder.sol";

function testMessageHash() public {
    string memory message = "1,0xService...,0xHash...,0xUser...,42,true";
    bytes32 hash = Erc191TestBuilder.buildHashForSign(message);
    
    // Use with Foundry
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
    bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
}
```

### `buildERC191Signature`
```solidity
function buildERC191Signature(
    uint8 v,
    bytes32 r,
    bytes32 s
) internal pure returns (bytes memory)
```

**Description**: Combines signature components into a 65-byte signature

**Parameters**:
- `v`: Recovery id (27 or 28)
- `r`: First 32 bytes of signature
- `s`: Last 32 bytes of signature

**Returns**: 65-byte signature in format `abi.encodePacked(r, s, v)`

**Example**:
```solidity
(uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, messageHash);
bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
```

## EVVM Core Functions

### `buildMessageSignedForPay`
```solidity
function buildMessageSignedForPay(
    uint256 evvmID,
    address to_address,
    string memory to_identity,
    address token,
    uint256 amount,
    uint256 priorityFee,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds message hash for EVVM `Core.pay()` function using centralized signature format

**Parameters**:
- `evvmID`: Chain-specific EVVM instance identifier
- `to_address`: Direct recipient address (use `address(0)` if using identity)
- `to_identity`: Username for NameService resolution (use `""` if using address)
- `token`: Token address (`address(0)` for native ETH)
- `amount`: Token amount in wei
- `priorityFee`: Executor fee in wei
- `senderExecutor`: Service contract address (Core.sol for direct payments)
- `originExecutor`: Original executor address (user or relayer)
- `nonce`: Sequential (sync) or user-chosen (async) nonce
- `isAsyncExec`: Nonce type (`true` = async, `false` = sync)

**Returns**: ERC-191 formatted message hash ready for `vm.sign()`

**Example**:
```solidity
import {Erc191TestBuilder} from "@evvm/testnet-contracts/library/Erc191TestBuilder.sol";

function testCorePay() public {
    // Build message hash
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(
        evvmID,
        recipientAddress,       // to_address
        "",                     // to_identity (empty if using address)
        address(0),            // token (ETH)
        1 ether,               // amount
        0.001 ether,           // priority fee
        coreAddress,           // senderExecutor (Core.sol)
        userAddress,           // originExecutor
        1,                     // nonce
        true                   // isAsyncExec
    );
    
    // Sign message
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
    bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
    // Call Core.pay
    vm.prank(executorAddress);
    core.pay(
        userAddress,
        recipientAddress,
        "",
        address(0),
        1 ether,
        0.001 ether,
        coreAddress,
        userAddress,
        1,
        true,
        signature
    );
}
```

### `buildMessageSignedForDispersePay`
```solidity
function buildMessageSignedForDispersePay(
    uint256 evvmID,
    CoreStructs.DispersePayMetadata[] memory toData,
    address token,
    uint256 amount,
    uint256 priorityFee,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec
) public pure returns (bytes32 messageHash)
```

**Description**: Builds message hash for EVVM `Core.dispersePay()` function (batch payments)

**Parameters**:
- `evvmID`: Chain-specific EVVM instance identifier
- `toData`: Array of `DispersePayMetadata` (amount, address, identity)
- `token`: Token address
- `amount`: Total amount (must match sum of toData amounts)
- `priorityFee`: Executor fee
- `senderExecutor`: Service contract address
- `originExecutor`: Original executor address
- `nonce`: Sequential or async nonce
- `isAsyncExec`: Nonce type

**Example**:
```solidity
// Prepare recipient data
CoreStructs.DispersePayMetadata[] memory toData = 
    new CoreStructs.DispersePayMetadata[](2);

toData[0] = CoreStructs.DispersePayMetadata({
    amount: 0.5 ether,
    to_address: address(0x123),
    to_identity: ""
});

toData[1] = CoreStructs.DispersePayMetadata({
    amount: 0.5 ether,
    to_address: address(0),
    to_identity: "bob"
});

// Build hash
bytes32 hash = Erc191TestBuilder.buildMessageSignedForDispersePay(
    evvmID,
    toData,
    address(0),
    1 ether,
    0.01 ether,
    coreAddress,
    userAddress,
    1,
    true
);
```

## Name Service Functions

### `buildMessageSignedForPreRegistrationUsername`
```solidity
function buildMessageSignedForPreRegistrationUsername(
    uint256 evvmID,
    bytes32 hashPreRegisteredUsername,
    address senderExecutor,
    address originExecutor,
    uint256 nonce
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for username pre-registration (commit phase)

**Parameters**:
- `evvmID`: Chain ID
- `hashPreRegisteredUsername`: `keccak256(abi.encodePacked(username, salt))`
- `senderExecutor`: NameService contract address
- `originExecutor`: User address
- `nonce`: Always async (`isAsyncExec = true`)

### `buildMessageSignedForRegistrationUsername`
```solidity
function buildMessageSignedForRegistrationUsername(
    uint256 evvmID,
    string memory username,
    uint256 lockNumber,
    address senderExecutor,
    address originExecutor,
    uint256 nonce
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for username registration (reveal phase)

**Parameters**:
- `evvmID`: Chain ID
- `username`: Plaintext username
- `lockNumber`: Minimum lock duration in blocks
- `senderExecutor`: NameService contract address
- `originExecutor`: User address
- `nonce`: Always async

### Username Marketplace Functions

**Available functions**:
- `buildMessageSignedForMakeOffer(evvmID, username, amount, expirationDate, senderExecutor, originExecutor, nonce)`
- `buildMessageSignedForWithdrawOffer(evvmID, username, offerId, senderExecutor, originExecutor, nonce)`
- `buildMessageSignedForAcceptOffer(evvmID, username, offerId, senderExecutor, originExecutor, nonce)`
- `buildMessageSignedForRenewUsername(evvmID, username, senderExecutor, originExecutor, nonce)`

### Custom Metadata Functions

**Available functions**:
- `buildMessageSignedForAddCustomMetadata(evvmID, username, value, senderExecutor, originExecutor, nonce)`
- `buildMessageSignedForRemoveCustomMetadata(evvmID, username, key, senderExecutor, originExecutor, nonce)`
- `buildMessageSignedForFlushCustomMetadata(evvmID, username, senderExecutor, originExecutor, nonce)`
- `buildMessageSignedForFlushUsername(evvmID, username, senderExecutor, originExecutor, nonce)`

## Staking Functions

### `buildMessageSignedForPresaleStaking`
```solidity
function buildMessageSignedForPresaleStaking(
    uint256 evvmID,
    bool isStaking,
    uint256 amountOfStaking,
    address senderExecutor,
    address originExecutor,
    uint256 nonce
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for presale staking operations

**Parameters**:
- `evvmID`: Chain ID
- `isStaking`: `true` to stake, `false` to unstake
- `amountOfStaking`: Amount of MATE tokens
- `senderExecutor`: Staking contract address
- `originExecutor`: User address
- `nonce`: Always async

### `buildMessageSignedForPublicStaking`
```solidity
function buildMessageSignedForPublicStaking(
    uint256 evvmID,
    bool isStaking,
    uint256 amountOfStaking,
    address senderExecutor,
    address originExecutor,
    uint256 nonce
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for public staking operations

**Parameters**: Same as `buildMessageSignedForPresaleStaking`

**Example**:
```solidity
// Staking test
bytes32 stakeHash = Erc191TestBuilder.buildMessageSignedForPublicStaking(
    evvmID,
    true,                   // isStaking
    100 ether,              // amount
    stakingAddress,         // senderExecutor
    userAddress,            // originExecutor
    1                       // nonce
);

(uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, stakeHash);
bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
```

## P2PSwap Functions

### `buildMessageSignedForMakeOrder`
```solidity
function buildMessageSignedForMakeOrder(
    uint256 evvmID,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    address tokenA,
    address tokenB,
    uint256 amountA,
    uint256 amountB
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for creating a P2P swap order

**Parameters**:
- `evvmID`: Chain ID
- `senderExecutor`: P2PSwap contract address
- `originExecutor`: User address
- `nonce`: Always async
- `tokenA`: Token offering
- `tokenB`: Token requesting
- `amountA`: Amount offering
- `amountB`: Amount requesting

### `buildMessageSignedForCancelOrder`
```solidity
function buildMessageSignedForCancelOrder(
    uint256 evvmID,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    address tokenA,
    address tokenB,
    uint256 orderId
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for canceling a P2P swap order

### `buildMessageSignedForDispatchOrder`
```solidity
function buildMessageSignedForDispatchOrder(
    uint256 evvmID,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    address tokenA,
    address tokenB,
    uint256 orderId
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for executing a P2P swap order

## Testing Utilities

### `buildMessageSignedForStateTest`
```solidity
function buildMessageSignedForStateTest(
    uint256 evvmID,
    string memory testA,
    uint256 testB,
    address testC,
    bool testD,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec
) internal pure returns (bytes32 messageHash)
```

**Description**: Generic test function for signature validation testing

**Use Case**: Testing Core.validateAndConsumeNonce with custom parameters
```

**Message Format**: `"<evvmID>,preRegistrationUsername,<hashUsername>,<nonce>"`

### `buildMessageSignedForRegistrationUsername`
```solidity
function buildMessageSignedForRegistrationUsername(
    uint256 evvmID,
    string memory _username,
    uint256 _clowNumber,
    uint256 _nameServiceNonce
) internal pure returns (bytes32 messageHash)
```

**Message Format**: `"<evvmID>,registrationUsername,<username>,<clowNumber>,<nonce>"`

### Username Marketplace Functions

**Available functions**:
- `buildMessageSignedForMakeOffer` - Create username offer
- `buildMessageSignedForWithdrawOffer` - Cancel offer
- `buildMessageSignedForAcceptOffer` - Accept offer
- `buildMessageSignedForRenewUsername` - Renew username

### Custom Metadata Functions

**Available functions**:
- `buildMessageSignedForAddCustomMetadata` - Add metadata
- `buildMessageSignedForRemoveCustomMetadata` - Remove metadata entry
- `buildMessageSignedForFlushCustomMetadata` - Clear all metadata
- `buildMessageSignedForFlushUsername` - Delete username

## Staking Functions

### `buildMessageSignedForPublicStaking`
```solidity
function buildMessageSignedForPublicStaking(
    uint256 evvmID,
    bool _isStaking,
    uint256 _amountOfStaking,
    uint256 _nonce
) internal pure returns (bytes32 messageHash)
```

**Message Format**: `"<evvmID>,publicStaking,<isStaking>,<amount>,<nonce>"`

**Example**:
```solidity
// Staking
bytes32 stakeHash = Erc191TestBuilder.buildMessageSignedForPublicStaking(
    123,
    true,      // is staking
    100 ether, // amount
    1          // nonce
);

// Unstaking
bytes32 unstakeHash = Erc191TestBuilder.buildMessageSignedForPublicStaking(
    123,
    false,     // is unstaking
    50 ether,  // amount
    2          // nonce
);
```

### `buildMessageSignedForPresaleStaking`
```solidity
function buildMessageSignedForPresaleStaking(
    uint256 evvmID,
    bool _isStaking,
    uint256 _amountOfStaking,
    uint256 _nonce
) internal pure returns (bytes32 messageHash)
```

**Message Format**: `"<evvmID>,presaleStaking,<isStaking>,<amount>,<nonce>"`

### `buildMessageSignedForPublicServiceStake`
```solidity
function buildMessageSignedForPublicServiceStake(
    uint256 evvmID,
    address _serviceAddress,
    bool _isStaking,
    uint256 _amountOfStaking,
    uint256 _nonce
) internal pure returns (bytes32 messageHash)
```

**Message Format**: `"<evvmID>,publicServiceStaking,<serviceAddress>,<isStaking>,<amount>,<nonce>"`

## P2P Swap Functions

### `buildMessageSignedForMakeOrder`
```solidity
function buildMessageSignedForMakeOrder(
    uint256 evvmID,
    uint256 _nonce,
    address _tokenA,
    address _tokenB,
    uint256 _amountA,
    uint256 _amountB
) internal pure returns (bytes32 messageHash)
```

**Message Format**: `"<evvmID>,makeOrder,<nonce>,<tokenA>,<tokenB>,<amountA>,<amountB>"`

### Order Management Functions

**Available functions**:
- `buildMessageSignedForCancelOrder` - Cancel an order
- `buildMessageSignedForDispatchOrder` - Execute an order

## Complete Testing Example

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import {Erc191TestBuilder} from "@evvm/testnet-contracts/library/Erc191TestBuilder.sol";
import {ICore} from "@evvm/testnet-contracts/interfaces/ICore.sol";
import {CoreStructs} from "@evvm/testnet-contracts/library/structs/CoreStructs.sol";

contract CorePaymentTest is Test {
    ICore core;
    
    address alice;
    uint256 alicePrivateKey;
    address bob;
    uint256 evvmID;
    
    function setUp() public {
        // Create test wallets
        alicePrivateKey = 0xA11CE;
        alice = vm.addr(alicePrivateKey);
        bob = makeAddr("bob");
        
        // Deploy Core (assuming deployment script)
        core = ICore(deployedCoreAddress);
        evvmID = core.getEvvmID();
        
        // Setup balances
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        core.addBalance{value: 10 ether}(address(0), 10 ether);
    }
    
    function testPayWithSignature() public {
        // Build message hash using centralized format
        bytes32 messageHash = Erc191TestBuilder.buildMessageSignedForPay(
            evvmID,
            bob,                // receiver address
            "",                 // identity (empty if using address)
            address(0),         // ETH
            1 ether,            // amount
            0.001 ether,        // priority fee
            address(core),      // senderExecutor (Core.sol)
            alice,              // originExecutor (user)
            1,                  // nonce
            true                // isAsyncExec
        );
        
        // Sign message with alice's key
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, messageHash);
        bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
        
        // Execute payment as executor
        vm.prank(executor);
        core.pay(
            alice,
            bob,
            "",
            address(0),
            1 ether,
            0.001 ether,
            address(core),
            alice,
            1,
            true,
            signature
        );
        
        // Verify balances
        assertEq(core.getBalance(bob, address(0)), 1 ether);
    }
    
    function testDispersePay() public {
        // Prepare recipient data
        CoreStructs.DispersePayMetadata[] memory toData = 
            new CoreStructs.DispersePayMetadata[](2);
        
        toData[0] = CoreStructs.DispersePayMetadata({
            amount: 0.5 ether,
            to_address: bob,
            to_identity: ""
        });
        
        toData[1] = CoreStructs.DispersePayMetadata({
            amount: 0.5 ether,
            to_address: makeAddr("charlie"),
            to_identity: ""
        });
        
        // Build hash
        bytes32 hash = Erc191TestBuilder.buildMessageSignedForDispersePay(
            evvmID,
            toData,
            address(0),
            1 ether,
            0.01 ether,
            address(core),
            alice,
            2,
            true
        );
        
        // Sign and execute
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, hash);
        bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);
        
        vm.prank(executor);
        core.dispersePay(
            alice,
            toData,
            address(0),
            1 ether,
            0.01 ether,
            address(core),
            alice,
            2,
            true,
            sig
        );
    }
}
```

## Best Practices

### 1. Use Foundry Cheatcodes for Wallet Creation
```solidity
// Good - use makeAddrAndKey for test wallets
(address user, uint256 pk) = makeAddrAndKey("user");
bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(...);
(uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, hash);

// Also good - use vm.addr with explicit private key
uint256 privateKey = 0xA11CE;
address user = vm.addr(privateKey);

// Bad - hardcoded addresses without private keys
address user = 0x123...; // Can't sign!
```

### 2. Test Both Valid and Invalid Signatures
```solidity
function testInvalidSignature() public {
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(
        evvmID,
        bob,
        "",
        address(0),
        1 ether,
        0.001 ether,
        address(core),
        alice,
        1,
        true
    );
    
    // Sign with WRONG key
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, hash);
    bytes memory badSig = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
    // Should revert with InvalidSignature
    vm.expectRevert();
    core.pay(alice, bob, "", address(0), 1 ether, 0.001 ether, 
             address(core), alice, 1, true, badSig);
}
```

### 3. Test Nonce Consumption
```solidity
function testNonceReplay() public {
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(...);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, hash);
    bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
    // First execution succeeds
    vm.prank(executor);
    core.pay(alice, bob, "", address(0), 1 ether, 0.001 ether,
             address(core), alice, 1, true, sig);
    
    // Replay attack should fail
    vm.expectRevert(); // Nonce already consumed
    vm.prank(executor);
    core.pay(alice, bob, "", address(0), 1 ether, 0.001 ether,
             address(core), alice, 1, true, sig);
}
```

### 4. Cache Message Hashes for Multiple Tests
```solidity
bytes32 paymentHash;
bytes memory validSignature;

function setUp() public {
    // Setup...
    
    paymentHash = Erc191TestBuilder.buildMessageSignedForPay(
        evvmID, bob, "", address(0), 1 ether, 0.001 ether,
        address(core), alice, 1, true
    );
    
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, paymentHash);
    validSignature = Erc191TestBuilder.buildERC191Signature(v, r, s);
}

function testPayment() public {
    vm.prank(executor);
    core.pay(alice, bob, "", address(0), 1 ether, 0.001 ether,
             address(core), alice, 1, true, validSignature);
}

function testPaymentEvent() public {
    vm.expectEmit(true, true, false, true);
    emit Pay(alice, bob, address(0), 1 ether);
    
    vm.prank(executor);
    core.pay(alice, bob, "", address(0), 1 ether, 0.001 ether,
             address(core), alice, 1, true, validSignature);
}
```

### 5. Test Service Integrations
```solidity
import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";

contract MyService is EvvmService {
    constructor(address coreAddress, address stakingAddress)
        EvvmService(coreAddress, stakingAddress) {}
    
    function processPayment(
        address user,
        uint256 amount,
        uint256 nonce,
        bytes memory signature
    ) external {
        bytes32 hashPayload = keccak256(abi.encode("processPayment", amount));
        
        core.validateAndConsumeNonce(
            user,
            hashPayload,
            user,
            nonce,
            true,
            signature
        );
        
        // Service logic...
    }
}

contract MyServiceTest is Test {
    MyService service;
    
    function testServicePayment() public {
        // Build hash using StateTest function for custom service
        bytes32 hash = Erc191TestBuilder.buildMessageSignedForStateTest(
            evvmID,
            "processPayment",
            1 ether,
            address(0),
            false,
            address(service),
            alice,
            1,
            true
        );
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, hash);
        bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);
        
        service.processPayment(alice, 1 ether, 1, sig);
    }
}
```

### 6. Test Parameter Encoding
```solidity
function testHashPayloadMatching() public {
    // Manually construct hash
    bytes32 manualHash = keccak256(abi.encode(
        "pay",
        bob,
        "",
        address(0),
        1 ether,
        0.001 ether
    ));
    
    // Use CoreHashUtils
    bytes32 utilHash = CoreHashUtils.hashDataForPay(
        bob,
        "",
        address(0),
        1 ether,
        0.001 ether
    );
    
    // Should match
    assertEq(manualHash, utilHash);
    
    // Build full message with Erc191TestBuilder
    bytes32 messageHash = Erc191TestBuilder.buildMessageSignedForPay(
        evvmID,
        bob,
        "",
        address(0),
        1 ether,
        0.001 ether,
        address(core),
        alice,
        1,
        true
    );
    
    // Manually verify it uses utilHash
    string memory payload = AdvancedStrings.buildSignaturePayload(
        evvmID,
        address(core),
        utilHash,
        alice,
        1,
        true
    );
    bytes32 expectedHash = Erc191TestBuilder.buildHashForSign(payload);
    assertEq(messageHash, expectedHash);
}
```

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
import { ethers } from 'ethers';

// Build EVVM centralized message
async function buildEvvmPaymentSignature(
    signer: ethers.Signer,
    evvmId: number,
    coreAddress: string,
    recipientAddress: string,
    token: string,
    amount: bigint,
    priorityFee: bigint,
    userAddress: string,
    nonce: number
): Promise<string> {
    // Step 1: Generate function-specific hash (matches CoreHashUtils.hashDataForPay)
    const hashPayload = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['string', 'address', 'string', 'address', 'uint256', 'uint256'],
            ['pay', recipientAddress, '', token, amount, priorityFee]
        )
    );
    
    // Step 2: Build signature payload (6 parameters)
    const payload = [
        evvmId.toString(),
        coreAddress.toLowerCase(),
        hashPayload.toLowerCase(),
        userAddress.toLowerCase(),
        nonce.toString(),
        'true' // isAsyncExec
    ].join(',');
    
    // Step 3: Sign with EIP-191
    return await signer.signMessage(payload);
}

// Usage
const signature = await buildEvvmPaymentSignature(
    wallet,
    1,                                  // evvmID
    '0xCore...',                        // Core contract
    '0xBob...',                         // recipient
    '0x0000000000000000000000000000000000000000', // ETH
    ethers.parseEther('1'),             // amount
    ethers.parseEther('0.001'),         // fee
    '0xAlice...',                       // user
    42                                  // nonce
);
```

### React Hook Example

```typescript
import { useSignMessage } from 'wagmi';
import { keccak256, encodePacked, AbiCoder } from 'ethers';

function useEvvmPaymentSignature() {
    const { signMessageAsync } = useSignMessage();
    
    async function signPayment(
        evvmId: number,
        coreAddress: string,
        recipient: string,
        token: string,
        amount: bigint,
        priorityFee: bigint,
        user: string,
        nonce: number
    ): Promise<string> {
        // Generate hash
        const hashPayload = keccak256(
            AbiCoder.defaultAbiCoder().encode(
                ['string', 'address', 'string', 'address', 'uint256', 'uint256'],
                ['pay', recipient, '', token, amount, priorityFee]
            )
        );
        
        // Build payload
        const payload = `${evvmId},${coreAddress.toLowerCase()},${hashPayload.toLowerCase()},${user.toLowerCase()},${nonce},true`;
        
        // Sign
        return await signMessageAsync({ message: payload });
    }
    
    return { signPayment };
}
```

## Common Patterns

### Pattern 1: Simple Payment Test
```solidity
function testSimplePayment() public {
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(
        evvmID, bob, "", address(0), 1 ether, 0.001 ether,
        address(core), alice, 1, true
    );
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, hash);
    bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
    vm.prank(executor);
    core.pay(alice, bob, "", address(0), 1 ether, 0.001 ether,
             address(core), alice, 1, true, sig);
}
```

### Pattern 2: Username Registration
```solidity
function testUsernameRegistration() public {
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForRegistrationUsername(
        evvmID,
        "alice",
        100,                // lockNumber
        nameServiceAddress,
        alice,
        1
    );
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, hash);
    bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
    vm.prank(executor);
    nameService.registrationUsername(alice, "alice", 100, nameServiceAddress, alice, 1, sig);
}
```

### Pattern 3: Staking Operation
```solidity
function testStaking() public {
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForPublicStaking(
        evvmID,
        true,               // isStaking
        100 ether,
        stakingAddress,
        alice,
        1
    );
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, hash);
    bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
    vm.prank(executor);
    staking.publicStaking(alice, true, 100 ether, stakingAddress, alice, 1, sig);
}
```

## Troubleshooting

### Signature Verification Fails

**Problem**: Test reverts with "Invalid signature" error

**Common Causes**:
1. Wrong `senderExecutor` - should be service contract address
2. Wrong `originExecutor` - should match signature signer
3. Wrong `evvmID` - must match deployed contract
4. Wrong `nonce` - ensure it hasn't been consumed
5. Wrong `isAsyncExec` - must match nonce type

**Solution**:
```solidity
// Debug signature payload
string memory payload = AdvancedStrings.buildSignaturePayload(
    evvmID,
    address(core),          // senderExecutor - verify this matches
    hashPayload,
    alice,                  // originExecutor - should match signer
    1,                      // nonce
    true                    // isAsyncExec
);

console.log("Payload:", payload);
console.log("Expected signer:", alice);

address recovered = SignatureRecover.recoverSigner(payload, signature);
console.log("Recovered signer:", recovered);
```

### Hash Mismatch

**Problem**: Generated hash doesn't match expected value

**Solution**: Verify parameter encoding matches contract
```solidity
// Check hash construction
bytes32 expected = keccak256(abi.encode(
    "pay",
    bob,
    "",             // Empty string, not bytes("")
    address(0),
    1 ether,
    0.001 ether
));

bytes32 actual = CoreHashUtils.hashDataForPay(
    bob, "", address(0), 1 ether, 0.001 ether
);

assertEq(expected, actual);
```

---

**Related Documentation**:
- [Signature Structures Overview](/docs/SignatureStructures/Overview)
- [Core.sol Documentation](/docs/Contracts/EVVM/Core)
- [AdvancedStrings Library](./04-Utils/01-AdvancedStrings.md)
- [SignatureRecover Library](./03-Primitives/02-SignatureRecover.md)
}

function testReplayProtection() public {
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPk, paymentHash);
    // Test replay...
}
```

### 4. Test Edge Cases
```solidity
function testZeroAddress() public {
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(
        evvmID,
        address(0),  // Zero address
        "alice",     // Use identity instead
        address(0),
        1 ether,
        0,
        0,
        true,
        executor
    );
    // Test handling...
}
```

## Integration with Foundry

### Basic Workflow
```solidity
// 1. Create wallet
(address user, uint256 pk) = makeAddrAndKey("user");

// 2. Build message hash
bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(...);

// 3. Sign with Foundry
(uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, hash);

// 4. Build signature
bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);

// 5. Use in contract call
contract.functionWithSignature(..., sig);
```

### Testing Multiple Signers
```solidity
function testMultiSig() public {
    address[] memory signers = new address[](3);
    uint256[] memory keys = new uint256[](3);
    
    for (uint i = 0; i < 3; i++) {
        (signers[i], keys[i]) = makeAddrAndKey(
            string.concat("signer", vm.toString(i))
        );
    }
    
    bytes32 hash = Erc191TestBuilder.buildHashForSign("action");
    
    for (uint i = 0; i < 3; i++) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(keys[i], hash);
        // Verify each signature...
    }
}
```

## Common Patterns

### Pattern 1: Testing Nonce Validation
```solidity
function testNonceReplay() public {
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(
        evvmID, bob, "", address(0), 1 ether, 0, 5, true, executor
    );
    
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePk, hash);
    bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
    // First call succeeds
    evvm.pay(alice, bob, "", address(0), 1 ether, 0, 5, true, executor, sig);
    
    // Second call with same nonce should fail
    vm.expectRevert();
    evvm.pay(alice, bob, "", address(0), 1 ether, 0, 5, true, executor, sig);
}
```

### Pattern 2: Testing Username Functions
```solidity
function testUsernameRegistration() public {
    // Pre-registration
    bytes32 preHash = Erc191TestBuilder.buildMessageSignedForPreRegistrationUsername(
        evvmID,
        keccak256(bytes("alice")),
        0
    );
    (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(userPk, preHash);
    bytes memory preSig = Erc191TestBuilder.buildERC191Signature(v1, r1, s1);
    
    nameService.preRegistrationUsername(keccak256(bytes("alice")), 0, preSig);
    
    // Registration
    bytes32 regHash = Erc191TestBuilder.buildMessageSignedForRegistrationUsername(
        evvmID,
        "alice",
        12345,
        1
    );
    (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(userPk, regHash);
    bytes memory regSig = Erc191TestBuilder.buildERC191Signature(v2, r2, s2);
    
    nameService.registrationUsername("alice", 12345, 1, regSig);
}
```

### Pattern 3: Testing Staking Operations
```solidity
function testStakeUnstakeCycle() public {
    // Stake
    bytes32 stakeHash = Erc191TestBuilder.buildMessageSignedForPublicStaking(
        evvmID, true, 100 ether, 0
    );
    (uint8 v1, bytes32 r1, bytes32 s1) = vm.sign(userPk, stakeHash);
    bytes memory stakeSig = Erc191TestBuilder.buildERC191Signature(v1, r1, s1);
    
    staking.publicStaking(true, 100 ether, 0, stakeSig);
    assertEq(staking.getUserAmountStaked(user), 100 ether);
    
    // Unstake
    vm.warp(block.timestamp + 30 days);
    bytes32 unstakeHash = Erc191TestBuilder.buildMessageSignedForPublicStaking(
        evvmID, false, 50 ether, 1
    );
    (uint8 v2, bytes32 r2, bytes32 s2) = vm.sign(userPk, unstakeHash);
    bytes memory unstakeSig = Erc191TestBuilder.buildERC191Signature(v2, r2, s2);
    
    staking.publicStaking(false, 50 ether, 1, unstakeSig);
    assertEq(staking.getUserAmountStaked(user), 50 ether);
}
```

## Gas Optimization in Tests

```solidity
// Cache frequently used hashes
bytes32[] hashes;

function setUp() public {
    // Pre-compute hashes
    for (uint i = 0; i < 100; i++) {
        hashes.push(
            Erc191TestBuilder.buildMessageSignedForPay(
                evvmID, recipients[i], "", address(0), 1 ether, 0, i, true, executor
            )
        );
    }
}

function testBatchPayments() public {
    for (uint i = 0; i < 100; i++) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(senderPk, hashes[i]);
        bytes memory sig = Erc191TestBuilder.buildERC191Signature(v, r, s);
        // Execute payment...
    }
}
```

## Troubleshooting

### Common Issues

**Issue**: Signature verification fails
```solidity
// Check message format matches contract expectations
string memory expected = "123,pay,0x...,0x...,1000000000000000000,0,0,true,0x...";
bytes32 hash = Erc191TestBuilder.buildHashForSign(expected);
```

**Issue**: Nonce mismatch
```solidity
// Ensure nonce in message matches function parameter
uint256 nonce = 5;
bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(
    evvmID, bob, "", address(0), 1 ether, 0, nonce, true, executor
);
evvm.pay(alice, bob, "", address(0), 1 ether, 0, nonce, true, executor, sig);
//                                                      ^^^^^ Must match
```

**Issue**: Wrong signer
```solidity
// Verify you're signing with the correct private key
address expectedSigner = alice;
uint256 correctKey = alicePrivateKey; // Not bobPrivateKey!
(uint8 v, bytes32 r, bytes32 s) = vm.sign(correctKey, hash);
```

---

## See Also

- **[SignatureRecover](./03-Primitives/02-SignatureRecover.md)** - EIP-191 signature recovery
- **[SignatureUtil](./04-Utils/02-SignatureUtil.md)** - Runtime signature verification
- **[AdvancedStrings](./04-Utils/01-AdvancedStrings.md)** - String utilities used internally
- [Foundry Book - Cheatcodes](https://book.getfoundry.sh/cheatcodes/) - Foundry testing utilities
