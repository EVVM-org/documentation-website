---
title: "@evvm/testnet-contracts"
description: "Smart contract interfaces and implementations for EVVM ecosystem integration."
sidebar_position: 2
---

# Testnet Contracts

The `@evvm/testnet-contracts` package provides Solidity interfaces and implementations for all EVVM smart contracts documented in this site. This package enables developers to integrate EVVM functionality directly into their smart contracts.

## Package Structure

### Interfaces  

Ready-to-use interfaces for all EVVM contracts:

- **`IEvvm.sol`** - Core payment and transaction functions
- **`INameService.sol`** - Identity management and username operations
- **`IStaking.sol`** - Staking and reward distribution functions
- **`IEstimator.sol`** - Economic calculation and estimation functions
- **`ITreasury.sol`** - Treasury management operations
- **`ITreasuryHostChainStation.sol`** - Cross-chain treasury host functions
- **`ITreasuryExternalChainStation.sol`** - Cross-chain treasury external functions

### Contracts 
Full contract implementations organized by service:

#### **evvm/**

- `Evvm.sol` - Main EVVM contract implementation
- `EvvmLegacy.sol` - Legacy version compatibility
- `lib/` - Supporting libraries

#### **nameService/**

- `NameService.sol` - Identity service implementation
- `lib/` - Username and metadata utilities

#### **staking/**

- `Staking.sol` - Staking contract implementation
- `Estimator.sol` - Economic estimation contract
- `lib/` - Staking calculation libraries

#### **treasury/**

- `Treasury.sol` - Single-chain treasury implementation
- `lib/` - Treasury management utilities

#### **treasuryTwoChains/**

- `TreasuryHostChainStation.sol` - Host chain treasury operations
- `TreasuryExternalChainStation.sol` - External chain treasury operations
- `lib/` - Cross-chain communication utilities

### Library 

Utility libraries for contract development:

- **`EvvmService.sol`** - Base contract for EVVM service development with built-in helpers
- **`SignatureRecover.sol`** - EIP-191 signature verification utilities
- **`SignatureUtil.sol`** - High-level signature verification for EVVM messages
- **`AdvancedStrings.sol`** - String manipulation and type conversion utilities
- **`Erc191TestBuilder.sol`** - Testing utilities for signature construction in Foundry
- **`AsyncNonceService.sol`** - Async nonce management for services
- **`SyncNonceService.sol`** - Sequential nonce management for services
- **`MakeServicePaymentOnEvvm.sol`** - Payment processing helpers
- **`StakingServiceUtils.sol`** - Service staking integration utilities
- **`Math.sol`** - Mathematical operations with overflow protection (OpenZeppelin)

## Usage for Service Developers

### Recommended Approach: Use Interfaces

For developers creating EVVM services, we strongly recommend using the interfaces rather than full contract implementations:

```solidity
import "@evvm/testnet-contracts/interfaces/IEvvm.sol";
import "@evvm/testnet-contracts/interfaces/INameService.sol";

contract MyService {
    IEvvm public immutable evvm;
    INameService public immutable nameService;

    constructor(address _evvm, address _nameService) {
        evvm = IEvvm(_evvm);
        nameService = INameService(_nameService);
    }

    function makePayment(address to, uint256 amount) external {
        // Use EVVM interface for payments
        evvm.pay(/* parameters */);
    }
}
```

### Benefits of Using Interfaces

- **Lighter Dependencies**: Only import what you need
- **Future Compatibility**: Interfaces remain stable across contract upgrades
- **Gas Efficiency**: No unnecessary code deployment
- **Clean Integration**: Focus on functionality, not implementation details

## Installation

```bash
npm install @evvm/testnet-contracts
```

## Generic Service Implementation Pattern

Here's a complete template demonstrating best practices for EVVM service integration using `EvvmService`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";

contract MyEVVMService is EvvmService {
    // State variables
    address public serviceOwner;

    error Unauthorized();

    constructor(
        address _evvmAddress,
        address _stakingAddress,
        address _serviceOwner
    ) EvvmService(_evvmAddress, _stakingAddress) {
        serviceOwner = _serviceOwner;
    }

    modifier onlyOwner() {
        if (msg.sender != serviceOwner) revert Unauthorized();
        _;
    }

    /**
     * @notice Execute service with EVVM payment
     * @param clientAddress Address of the client
     * @param serviceData Service-specific data
     * @param serviceAmount Amount to charge for the service
     * @param nonce Service nonce for replay protection
     * @param signature Client's signature authorizing the service
     * @param priorityFee_EVVM Fee for fisher executing payment
     * @param nonce_EVVM EVVM payment nonce
     * @param priorityFlag_EVVM Async (true) or sync (false) nonce
     * @param signature_EVVM Payment authorization signature
     */
    function executeService(
        address clientAddress,
        string memory serviceData,
        uint256 serviceAmount,
        uint256 nonce,
        bytes memory signature,
        uint256 priorityFee_EVVM,
        uint256 nonce_EVVM,
        bool priorityFlag_EVVM,
        bytes memory signature_EVVM
    ) external {
        // 1. Verify client signature for service authorization
        validateServiceSignature(
            "executeService",
            string.concat(
                serviceData,
                ",",
                AdvancedStrings.uintToString(serviceAmount),
                ",",
                AdvancedStrings.uintToString(nonce)
            ),
            signature,
            clientAddress
        );

        // 2. Check nonce hasn't been used (replay protection)
        verifyAsyncServiceNonce(clientAddress, nonce);

        // 3. Process payment from client to this service
        requestPay(
            clientAddress,
            getEtherAddress(),      // ETH token
            serviceAmount,
            priorityFee_EVVM,
            nonce_EVVM,
            priorityFlag_EVVM,
            signature_EVVM
        );

        // 4. Execute service logic
        _performServiceLogic(clientAddress, serviceData);

        // 5. Reward fisher if service is staker
        if (evvm.isAddressStaker(address(this))) {
            makeCaPay(msg.sender, getEtherAddress(), priorityFee_EVVM);
            makeCaPay(msg.sender, getPrincipalTokenAddress(), evvm.getRewardAmount() / 2);
        }

        // 6. Mark nonce as used
        markAsyncServiceNonceAsUsed(clientAddress, nonce);
    }

    function _performServiceLogic(
        address client,
        string memory data
    ) internal {
        // Implement your service logic here
        // Example: Store data, perform computation, emit events, etc.
    }

    // Owner functions

    function stakeService(uint256 amount) external onlyOwner {
        _makeStakeService(amount);
    }

    function unstakeService(uint256 amount) external onlyOwner {
        _makeUnstakeService(amount);
    }

    function withdrawFunds(address to) external onlyOwner {
        uint256 ethBalance = evvm.getBalance(address(this), getEtherAddress());
        makeCaPay(to, getEtherAddress(), ethBalance);
    }

    function withdrawRewards(address to) external onlyOwner {
        uint256 mateBalance = evvm.getBalance(address(this), getPrincipalTokenAddress());
        makeCaPay(to, getPrincipalTokenAddress(), mateBalance);
    }
}
```

### Manual Implementation Pattern (Without EvvmService)

For developers who need more control or want to use individual utilities:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {IEvvm} from "@evvm/testnet-contracts/interfaces/IEvvm.sol";
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";
import {AsyncNonceService} from "@evvm/testnet-contracts/library/utils/service/AsyncNonceService.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";

contract ManualEVVMService is AsyncNonceService {
    IEvvm public immutable evvm;
    address public serviceOwner;

    constructor(address _evvm, address _owner) {
        evvm = IEvvm(_evvm);
        serviceOwner = _owner;
    }

    function executeService(
        address clientAddress,
        string memory serviceData,
        uint256 serviceAmount,
        uint256 nonce,
        bytes memory signature,
        uint256 priorityFee_EVVM,
        uint256 nonce_EVVM,
        bool priorityFlag_EVVM,
        bytes memory signature_EVVM
    ) external {
        // 1. Verify client signature for service authorization
        require(
            SignatureUtil.verifySignature(
                address(evvm),
                "executeService",
                string.concat(
                    serviceData, ",",
                    AdvancedStrings.uintToString(serviceAmount), ",",
                    AdvancedStrings.uintToString(nonce)
                ),
                signature,
                clientAddress
            ),
            "Invalid signature"
        );

        // 2. Check nonce hasn't been used (replay protection)
        require(verifyAsyncServiceNonce(clientAddress, nonce), "Nonce already used");

        // 3. Process payment from client to this service
        evvm.pay(
            clientAddress,      // from
            address(this),      // to_address
            "",                 // to_identity
            address(0),         // ETH token
            serviceAmount,      // amount
            priorityFee_EVVM,   // priorityFee
            nonce_EVVM,         // nonce
            priorityFlag_EVVM,  // priority
            address(this),      // executor
            signature_EVVM      // signature
        );

        // 4. Execute service logic
        _performServiceLogic(clientAddress, serviceData, serviceAmount);

        // 5. Reward fisher if service is staker
        if (evvm.isAddressStaker(address(this))) {
            evvm.caPay(msg.sender, address(0), priorityFee_EVVM);
            evvm.caPay(msg.sender, address(1), evvm.getRewardAmount() / 2);
        }

        // 6. Mark nonce as used
        markAsyncServiceNonceAsUsed(clientAddress, nonce);
    }

    function _performServiceLogic(
        address client,
        string memory data,
        uint256 amount
    ) internal {
        // Implement your service logic here
    }

    function stakeService(uint256 amount) external {
        require(msg.sender == serviceOwner, "Unauthorized");
        // Approve and stake MATE tokens
        // Implementation depends on your staking contract integration
    }

    function withdrawFunds() external {
        require(msg.sender == serviceOwner, "Unauthorized");
        uint256 ethBalance = evvm.getBalance(address(this), address(0));
        evvm.caPay(serviceOwner, address(0), ethBalance);
    }
}
```

### Key Implementation Patterns

1. **Interface Integration**: Use `IEvvm` interface for all EVVM operations
2. **Dual Signature Pattern**: Service authorization + payment signatures
3. **Nonce Management**: Use `AsyncNonceService` for replay protection
4. **Signature Verification**: Use `SignatureUtil.verifySignature()` for validating client signatures
5. **Fisher Incentives**: Reward fishers who execute transactions
6. **Modular Design**: Separate service logic from EVVM integration

### Universal Message Format

Service signatures follow the standard EVVM pattern:

```
"<evvmID>,<functionName>,<param1>,<param2>,...,<paramN>"
```

Example for a generic service:

```
"1,executeService,serviceData,1000000000000000000,100"
```

This template can be adapted for any service type by:

- Changing function names and parameters
- Implementing custom service logic in `_performServiceLogic`
- Adding service-specific state variables and functions

This package provides everything needed to integrate with the EVVM ecosystem documented throughout this site, offering both flexibility for advanced use cases and simplicity for standard service development.
