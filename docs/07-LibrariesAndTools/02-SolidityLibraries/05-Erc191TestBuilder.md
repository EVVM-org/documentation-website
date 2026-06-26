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
    
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
    bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
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
    address offeredToken,
    address requestedToken,
    uint256 offeredAmount,
    uint256 requestedAmount,
    address senderExecutor,
    address originExecutor,
    uint256 nonce
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for creating a P2P swap order

**Parameters**:
- `evvmID`: Chain ID
- `offeredToken`: Token offered by seller
- `requestedToken`: Token requested by seller
- `offeredAmount`: Amount of offeredToken
- `requestedAmount`: Amount of requestedToken
- `senderExecutor`: P2PSwap contract address
- `originExecutor`: User address
- `nonce`: Always async

**Example**:
```solidity
bytes32 hash = Erc191TestBuilder.buildMessageSignedForMakeOrder(
    evvmID,
    usdcAddress,            // offeredToken
    ethAddress,             // requestedToken
    1000 * 10**6,           // offeredAmount (1000 USDC)
    0.5 ether,              // requestedAmount (0.5 ETH)
    p2pSwapAddress,         // senderExecutor
    userAddress,            // originExecutor
    1                       // nonce
);

(uint8 v, bytes32 r, bytes32 s) = vm.sign(userPrivateKey, hash);
bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
```

### `buildMessageSignedForCancelOrder`
```solidity
function buildMessageSignedForCancelOrder(
    uint256 evvmID,
    address offeredToken,
    address requestedToken,
    uint256 orderId,
    address senderExecutor,
    address originExecutor,
    uint256 nonce
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for canceling a P2P swap order

**Parameters**:
- `evvmID`: Chain ID
- `offeredToken`: Token that was offered in the order
- `requestedToken`: Token that was requested in the order
- `orderId`: Order slot ID to cancel
- `senderExecutor`: P2PSwap contract address
- `originExecutor`: User address (order owner)
- `nonce`: Always async

### `buildMessageSignedForDispatchOrder`
```solidity
function buildMessageSignedForDispatchOrder(
    uint256 evvmID,
    address offeredToken,
    address requestedToken,
    uint256 orderId,
    uint256 amountOut,
    uint256 amountInMax,
    address senderExecutor,
    address originExecutor,
    uint256 nonce
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds hash for filling a P2P swap order (partial or full)

**Parameters**:
- `evvmID`: Chain ID
- `offeredToken`: Token offered by seller (buyer receives)
- `requestedToken`: Token requested by seller (buyer pays)
- `orderId`: Order slot ID to fill
- `amountOut`: Amount of offeredToken the buyer wants to receive
- `amountInMax`: Maximum amount of requestedToken the buyer is willing to pay
- `senderExecutor`: P2PSwap contract address
- `originExecutor`: User address (buyer)
- `nonce`: Always async

**Example**:
```solidity
bytes32 hash = Erc191TestBuilder.buildMessageSignedForDispatchOrder(
    evvmID,
    usdcAddress,            // offeredToken
    ethAddress,             // requestedToken
    3,                      // orderId
    500 * 10**6,            // amountOut (500 USDC)
    0.2625 ether,           // amountInMax (0.25 + 5% fee)
    p2pSwapAddress,         // senderExecutor
    buyerAddress,           // originExecutor
    1                       // nonce
);

(uint8 v, bytes32 r, bytes32 s) = vm.sign(buyerPrivateKey, hash);
bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
```

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
        alicePrivateKey = 0xA11CE;
        alice = vm.addr(alicePrivateKey);
        bob = makeAddr("bob");
        
        core = ICore(deployedCoreAddress);
        evvmID = core.getEvvmID();
        
        vm.deal(alice, 10 ether);
        vm.prank(alice);
        core.addBalance{value: 10 ether}(address(0), 10 ether);
    }
    
    function testPayWithSignature() public {
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
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, messageHash);
        bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
        
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
        
        assertEq(core.getBalance(bob, address(0)), 1 ether);
    }
    
    function testDispersePay() public {
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
        evvmID, bob, "", address(0), 1 ether, 0.001 ether,
        address(core), alice, 1, true
    );
    
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, hash);
    bytes memory badSig = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
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
    
    vm.prank(executor);
    core.pay(alice, bob, "", address(0), 1 ether, 0.001 ether,
             address(core), alice, 1, true, sig);
    
    vm.expectRevert();
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
    bytes32 manualHash = keccak256(abi.encode(
        "pay",
        bob,
        "",
        address(0),
        1 ether,
        0.001 ether
    ));
    
    bytes32 utilHash = CoreHashUtils.hashDataForPay(
        bob, "", address(0), 1 ether, 0.001 ether
    );
    
    assertEq(manualHash, utilHash);
    
    bytes32 messageHash = Erc191TestBuilder.buildMessageSignedForPay(
        evvmID, bob, "", address(0), 1 ether, 0.001 ether,
        address(core), alice, 1, true
    );
    
    string memory payload = AdvancedStrings.buildSignaturePayload(
        evvmID, address(core), utilHash, alice, 1, true
    );
    bytes32 expectedHash = Erc191TestBuilder.buildHashForSign(payload);
    assertEq(messageHash, expectedHash);
}
```

## Frontend Integration

### JavaScript/TypeScript Example

```typescript
import { ethers } from 'ethers';

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
    const hashPayload = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['string', 'address', 'string', 'address', 'uint256', 'uint256'],
            ['pay', recipientAddress, '', token, amount, priorityFee]
        )
    );
    
    const payload = [
        evvmId.toString(),
        coreAddress.toLowerCase(),
        hashPayload.toLowerCase(),
        userAddress.toLowerCase(),
        nonce.toString(),
        'true'
    ].join(',');
    
    return await signer.signMessage(payload);
}
```

### React Hook Example

```typescript
import { useSignMessage } from 'wagmi';
import { keccak256, AbiCoder } from 'ethers';

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
        const hashPayload = keccak256(
            AbiCoder.defaultAbiCoder().encode(
                ['string', 'address', 'string', 'address', 'uint256', 'uint256'],
                ['pay', recipient, '', token, amount, priorityFee]
            )
        );
        
        const payload = `${evvmId},${coreAddress.toLowerCase()},${hashPayload.toLowerCase()},${user.toLowerCase()},${nonce},true`;
        
        return await signMessageAsync({ message: payload });
    }
    
    return { signPayment };
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
- [Core.sol Documentation](/docs/Contracts/EVVM/Overview)
- [AdvancedStrings Library](./04-Utils/01-AdvancedStrings.md)
- [SignatureRecover Library](./03-Primitives/02-SignatureRecover.md)
