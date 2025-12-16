---
title: "Erc191TestBuilder"
description: "Testing utility library for building ERC-191 compliant message hashes for Foundry tests"
sidebar_position: 5
---

# Erc191TestBuilder

The `Erc191TestBuilder` library provides utility functions for building ERC-191 compliant message hashes in Foundry test scripts. It simplifies the process of creating signed messages for testing all EVVM system contracts.

## Overview

**Library Type**: Pure functions for testing  
**License**: EVVM-NONCOMMERCIAL-1.0  
**Import Path**: `@evvm/testnet-contracts/library/Erc191TestBuilder.sol`  
**Author**: jistro.eth

### Key Features

- **ERC-191 compliant** message hash generation
- **Pre-built functions** for all EVVM contract signatures
- **Foundry integration** compatible
- **Type-safe** parameter handling

### Use Cases

- **Unit testing** contract functions with signatures
- **Integration testing** multi-contract workflows
- **Signature verification** testing
- **Gas optimization** testing with realistic signatures

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
    string memory message = "123,action,param1,param2";
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

## EVVM Functions

### `buildMessageSignedForPay`
```solidity
function buildMessageSignedForPay(
    uint256 evvmID,
    address _receiverAddress,
    string memory _receiverIdentity,
    address _token,
    uint256 _amount,
    uint256 _priorityFee,
    uint256 _nonce,
    bool _priority_boolean,
    address _executor
) internal pure returns (bytes32 messageHash)
```

**Description**: Builds message hash for EVVM `pay()` function

**Message Format**: `"<evvmID>,pay,<receiver>,<token>,<amount>,<priorityFee>,<nonce>,<flag>,<executor>"`

**Example**:
```solidity
bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(
    123,                    // evvmID
    recipientAddress,       // receiver address
    "",                     // receiver identity (empty if address used)
    address(0),            // token (ETH)
    1 ether,               // amount
    0.001 ether,           // priority fee
    1,                     // nonce
    true,                  // async nonce
    fisherAddress          // executor
);
```

### `buildMessageSignedForDispersePay`
```solidity
function buildMessageSignedForDispersePay(
    uint256 evvmID,
    bytes32 hashList,
    address _token,
    uint256 _amount,
    uint256 _priorityFee,
    uint256 _nonce,
    bool _priority_boolean,
    address _executor
) public pure returns (bytes32 messageHash)
```

**Description**: Builds message hash for EVVM `dispersePay()` function

**Message Format**: `"<evvmID>,dispersePay,<hashList>,<token>,<amount>,<priorityFee>,<nonce>,<flag>,<executor>"`

## Name Service Functions

### `buildMessageSignedForPreRegistrationUsername`
```solidity
function buildMessageSignedForPreRegistrationUsername(
    uint256 evvmID,
    bytes32 _hashUsername,
    uint256 _nameServiceNonce
) internal pure returns (bytes32 messageHash)
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
import {Evvm} from "@evvm/testnet-contracts/contracts/evvm/Evvm.sol";

contract EvvmPaymentTest is Test {
    Evvm evvm;
    
    address alice;
    uint256 alicePrivateKey;
    address bob;
    
    function setUp() public {
        // Create test wallets
        alicePrivateKey = 0xA11CE;
        alice = vm.addr(alicePrivateKey);
        bob = makeAddr("bob");
        
        // Deploy EVVM
        evvm = new Evvm();
        
        // Setup balances
        evvm.addBalance(alice, address(0), 10 ether);
    }
    
    function testPayWithSignature() public {
        uint256 evvmID = evvm.getEvvmID();
        
        // Build message hash
        bytes32 messageHash = Erc191TestBuilder.buildMessageSignedForPay(
            evvmID,
            bob,              // receiver
            "",               // identity (empty)
            address(0),       // ETH
            1 ether,          // amount
            0.001 ether,      // priority fee
            0,                // nonce
            true,             // async
            address(this)     // executor (test contract)
        );
        
        // Sign message
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(alicePrivateKey, messageHash);
        bytes memory signature = Erc191TestBuilder.buildERC191Signature(v, r, s);
        
        // Execute payment
        evvm.pay(
            alice,
            bob,
            "",
            address(0),
            1 ether,
            0.001 ether,
            0,
            true,
            address(this),
            signature
        );
        
        // Verify
        assertEq(evvm.getBalance(bob, address(0)), 1 ether);
    }
}
```

## Best Practices

### 1. Use Foundry Cheatcodes
```solidity
// Good - create wallets with vm.createWallet()
(address user, uint256 pk) = makeAddrAndKey("user");
bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(...);
(uint8 v, bytes32 r, bytes32 s) = vm.sign(pk, hash);

// Bad - hardcoded private keys
uint256 pk = 0x123456; // Don't use in production!
```

### 2. Test Both Valid and Invalid Signatures
```solidity
function testInvalidSignature() public {
    bytes32 hash = Erc191TestBuilder.buildMessageSignedForPay(...);
    
    // Sign with wrong key
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(wrongPrivateKey, hash);
    bytes memory badSig = Erc191TestBuilder.buildERC191Signature(v, r, s);
    
    // Should revert
    vm.expectRevert();
    evvm.pay(..., badSig);
}
```

### 3. Cache Message Hashes for Multiple Tests
```solidity
bytes32 paymentHash;

function setUp() public {
    paymentHash = Erc191TestBuilder.buildMessageSignedForPay(...);
}

function testPayment() public {
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(userPk, paymentHash);
    // Test payment...
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
