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

- **`ICore.sol`** - Core payment and transaction functions
- **`INameService.sol`** - Identity management and username operations
- **`IStaking.sol`** - Staking and reward distribution functions
- **`IEstimator.sol`** - Economic calculation and estimation functions
- **`ITreasury.sol`** - Treasury management operations
- **`ITreasuryHostChainStation.sol`** - Cross-chain treasury host functions
- **`ITreasuryExternalChainStation.sol`** - Cross-chain treasury external functions

### Contracts 
Full contract implementations organized by service:

#### **evvm/**

- `Core.sol` - Main EVVM Core contract implementation
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
import "@evvm/testnet-contracts/interfaces/ICore.sol";
import "@evvm/testnet-contracts/interfaces/INameService.sol";

contract MyService {
    ICore public immutable core;
    INameService public immutable nameService;

    constructor(address _core, address _nameService) {
        core = ICore(_core);
        nameService = INameService(_nameService);
    }

    function makePayment(address to, uint256 amount) external {
        // Use Core interface for payments
        core.pay(/* parameters */);
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

contract MyEVVMService is EvvmService {
    address public serviceOwner;

    error Unauthorized();

    constructor(
        address _coreAddress,
        address _stakingAddress,
        address _serviceOwner
    ) EvvmService(_coreAddress, _stakingAddress) {
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
     * @param senderExecutor Address of this contract (pass address(this))
     * @param originExecutor EOA allowed to initiate (address(0) for any)
     * @param nonce Service nonce for replay protection
     * @param isAsyncExec Async (true) or sync (false) nonce
     * @param signature Client's signature authorizing the service action
     * @param priorityFee_EVVM Fee for fisher executing payment
     * @param nonce_EVVM EVVM payment nonce
     * @param isAsyncExec_EVVM Async (true) or sync (false) nonce for payment
     * @param signature_EVVM Payment authorization signature
     */
    function executeService(
        address clientAddress,
        string memory serviceData,
        uint256 serviceAmount,
        address senderExecutor,
        address originExecutor,
        uint256 nonce,
        bool isAsyncExec,
        bytes memory signature,
        uint256 priorityFee_EVVM,
        uint256 nonce_EVVM,
        bool isAsyncExec_EVVM,
        bytes memory signature_EVVM
    ) external {
        // 1. Verify client signature and consume nonce (prevents replay attacks)
        core.validateAndConsumeNonce(
            clientAddress,
            senderExecutor,
            keccak256(abi.encode("executeService", serviceData, serviceAmount)),
            originExecutor,
            nonce,
            isAsyncExec,
            signature
        );

        // 2. Process payment from client to this service
        requestPay(
            clientAddress,
            core.getChainHostCoinAddress(),
            serviceAmount,
            priorityFee_EVVM,
            originExecutor,
            nonce_EVVM,
            isAsyncExec_EVVM,
            signature_EVVM
        );

        // 3. Execute service logic
        _performServiceLogic(clientAddress, serviceData);

        // 4. Reward fisher if service is staker
        if (core.isAddressStaker(address(this))) {
            makeCaPay(msg.sender, core.getChainHostCoinAddress(), priorityFee_EVVM);
            makeCaPay(msg.sender, getPrincipalTokenAddress(), core.getRewardAmount() / 2);
        }
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
        uint256 ethBalance = core.getBalance(address(this), core.getChainHostCoinAddress());
        makeCaPay(to, core.getChainHostCoinAddress(), ethBalance);
    }

    function withdrawRewards(address to) external onlyOwner {
        uint256 mateBalance = core.getBalance(address(this), getPrincipalTokenAddress());
        makeCaPay(to, getPrincipalTokenAddress(), mateBalance);
    }
}
```

### Manual Implementation Pattern (Without EvvmService)

For developers who need more control or want to use individual utilities:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {ICore} from "@evvm/testnet-contracts/interfaces/ICore.sol";
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";
import {ICore} from "@evvm/testnet-contracts/interfaces/ICore.sol";

contract ManualEVVMService {
    ICore public immutable core;
    address public serviceOwner;

    error Unauthorized();

    constructor(address _coreAddress, address _owner) {
        core = ICore(_coreAddress);
        serviceOwner = _owner;
    }

    function executeService(
        address clientAddress,
        string memory serviceData,
        uint256 serviceAmount,
        address senderExecutor,
        address originExecutor,
        uint256 nonce,
        bool isAsyncExec,
        bytes memory signature,
        uint256 priorityFee_EVVM,
        uint256 nonce_EVVM,
        bool isAsyncExec_EVVM,
        bytes memory signature_EVVM
    ) external {
        // 1. Verify client signature and consume nonce (prevents replay attacks)
        core.validateAndConsumeNonce(
            clientAddress,
            senderExecutor,
            keccak256(abi.encode("executeService", serviceData, serviceAmount)),
            originExecutor,
            nonce,
            isAsyncExec,
            signature
        );

        // 2. Process payment from client to this service
        core.pay(
            clientAddress,          // from
            address(this),          // to_address
            "",                     // to_identity (empty = use address)
            core.getChainHostCoinAddress(), // token (native coin)
            serviceAmount,          // amount
            priorityFee_EVVM,       // priorityFee
            address(this),          // senderExecutor
            originExecutor,         // originExecutor
            nonce_EVVM,             // nonce
            isAsyncExec_EVVM,       // isAsyncExec
            signature_EVVM          // signature
        );

        // 3. Execute service logic
        _performServiceLogic(clientAddress, serviceData);

        // 4. Reward fisher if service is staker
        if (core.isAddressStaker(address(this))) {
            core.caPay(msg.sender, core.getChainHostCoinAddress(), priorityFee_EVVM);
            core.caPay(msg.sender, address(1), core.getRewardAmount() / 2);
        }
    }

    function _performServiceLogic(
        address client,
        string memory data
    ) internal {
        // Implement your service logic here
    }

    function withdrawFunds() external {
        if (msg.sender != serviceOwner) revert Unauthorized();
        uint256 ethBalance = core.getBalance(address(this), core.getChainHostCoinAddress());
        core.caPay(serviceOwner, core.getChainHostCoinAddress(), ethBalance);
    }
}
```

### Key Implementation Patterns

1. **Interface Integration**: Use `ICore` interface for all EVVM Core operations
2. **Dual Signature Pattern**: Service authorization + payment signatures
3. **Centralized Nonce Management**: Use `core.validateAndConsumeNonce()` — no custom nonce tracking needed
4. **Fisher Incentives**: Reward fishers who execute transactions
5. **Modular Design**: Separate service logic from EVVM integration

:::tip[Prefer EvvmService]
The `EvvmService` base contract is recommended over manual integration — it provides `requestPay`, `makeCaPay`, `_makeStakeService`, and other helpers, reducing boilerplate significantly. See [EvvmService documentation](../02-SolidityLibraries/02-EvvmService.md).
:::

### Universal Signature Format

All EVVM service signatures follow the centralized format established by Core.sol:

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

Where `hashPayload = keccak256(abi.encode("functionName", param1, param2, ..., paramN))`

This template can be adapted for any service type by:

- Changing function names and parameters in the `hashPayload`
- Implementing custom service logic in `_performServiceLogic`
- Adding service-specific state variables and functions

This package provides everything needed to integrate with the EVVM ecosystem documented throughout this site, offering both flexibility for advanced use cases and simplicity for standard service development.
