---
title: "Library Overview"
description: "Complete reference for EVVM utility libraries and service helper contracts"
sidebar_position: 1
---

# EVVM Library Overview

The EVVM library ecosystem provides reusable components and utility contracts designed to simplify EVVM service development. These libraries handle common operations like signature verification, nonce management, string conversions, and service staking.

:::note[Import Path]
All libraries are imported from `@evvm/testnet-contracts/library/` followed by the specific library path.
:::

## Library Architecture

### Core Service Contract

- **EvvmService**: Base contract providing complete EVVM service functionality with built-in helpers for payments, signatures, and staking

### Primitive Libraries

- **Math**: Standard mathematical operations with overflow protection (OpenZeppelin-based)
- **SignatureRecover**: EIP-191 signature recovery and verification primitives
- **IERC20**: Standard ERC20 token interface

### Utility Libraries

#### String & Type Conversion
- **AdvancedStrings**: Type conversion utilities (uint/address/bytes to string)

#### Signature Verification
- **SignatureUtil**: High-level signature verification for EVVM messages

#### Hash Generation
- **CoreHashUtils**: Hash generation for Core.sol payment operations
- **NameServiceHashUtils**: Hash generation for NameService operations
- **StakingHashUtils**: Hash generation for Staking operations
- **P2PSwapHashUtils**: Hash generation for P2PSwap operations
- **TreasuryCrossChainHashUtils**: Hash generation for cross-chain Treasury operations

#### Contract Utilities
- **CAUtils**: Contract address verification utilities (distinguishes CAs from EOAs)

#### Governance
- **Admin**: Time-delayed admin governance with propose/accept pattern
- **ProposalStructs**: Data structures for governance proposals

:::info[HashUtils Libraries]
The HashUtils libraries generate deterministic `hashPayload` values for the centralized signature verification architecture. Each service has its own HashUtils library.
:::

### Service Utilities

- **CoreExecution**: Abstract contract providing Core.sol payment processing interface
- **StakingServiceUtils**: Service staking integration utilities

### Error Libraries

- **CoreError**: Error definitions for Core.sol operations
- **CrossChainTreasuryError**: Errors for cross-chain treasury operations
- **NameServiceError**: Errors for NameService operations
- **StakingError**: Errors for Staking operations
- **TreasuryError**: Errors for Treasury operations

### Struct Libraries

Data structure definitions for EVVM services:
- **CoreStructs**: Core.sol data structures
- **ExternalChainStationStructs**: External chain treasury structures
- **HostChainStationStructs**: Host chain treasury structures
- **NameServiceStructs**: NameService data structures
- **P2PSwapStructs**: P2PSwap data structures
- **StakingStructs**: Staking data structures

## Quick Start

### Using EvvmService (Recommended)

The `EvvmService` abstract contract is the recommended way to build EVVM services. It combines all essential utilities:

```solidity
import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";

contract MyService is EvvmService {
    constructor(
        address coreAddress,
        address stakingAddress
    ) EvvmService(coreAddress, stakingAddress) {}

    function myFunction(
        address user,
        string memory data,
        bytes memory signature
    ) external {
        // Validate signature
        validateServiceSignature("myFunction", data, signature, user);

        // Your service logic here
    }
}
```

### Using Individual Utilities

For more granular control, use individual libraries:

```solidity
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";
import {CoreExecution} from "@evvm/testnet-contracts/library/utils/service/CoreExecution.sol";

contract MyCustomService is CoreExecution {
    
    constructor(address coreAddress) CoreExecution(coreAddress) {}
    
    function verifyUser(address user, bytes memory sig) internal view {
        bool valid = SignatureUtil.verifySignature(
            evvmId,
            "myFunction",
            AdvancedStrings.uintToString(someValue),
            sig,
            user
        );
        require(valid, "Invalid signature");
    }
}
```

## Library Categories

### 1. Service Development (EvvmService)

Complete all-in-one solution for building EVVM services with:

- Signature validation
- Payment processing via Core.sol
- Service staking integration
- EVVM/Staking contract references

**Best for**: New services, quick prototyping, standard use cases

### 2. Primitive Operations

Low-level utilities for fundamental operations:

- Signature recovery (EIP-191)
- Mathematical operations
- Type conversions

**Best for**: Building custom validation logic, advanced cryptographic operations

### 3. Service Utilities

Modular helpers for specific service functionalities:

- Core.sol payment processing (CoreExecution)
- Staking integration (StakingServiceUtils)
- Admin governance (Admin)

**Best for**: Custom service architectures, mixing and matching functionality

### 4. Hash Utilities

Service-specific hash generation for signature payloads:

- CoreHashUtils, NameServiceHashUtils, StakingHashUtils, P2PSwapHashUtils, TreasuryCrossChainHashUtils

**Best for**: Creating deterministic hash payloads for EVVM's centralized signature system
    constructor(address coreAddress, address stakingAddress) 
        EvvmService(coreAddress, stakingAddress) {}
}
```

### Pattern 2: Modular Composition
```solidity
import {CoreExecution} from "@evvm/testnet-contracts/library/utils/service/CoreExecution.sol";
import {StakingServiceUtils} from "@evvm/testnet-contracts/library/utils/service/StakingServiceUtils.sol";

contract Service is CoreExecution, StakingServiceUtils {
    // Mix utilities as needed - granular control
    constructor(address coreAddress, address stakingAddress) 
        CoreExecution(coreAddress)
        StakingServiceUtils(stakingAddress) {}
}
```

### Pattern 3: Library-Only Usage
```solidity
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";
import {CoreHashUtils} from "@evvm/testnet-contracts/library/utils/signature/CoreHashUtils.sol";

contract Service {
    // Pure library usage - maximum flexibility
    function verify(bytes memory data, bytes memory sig, address user) internal pure {
        bytes32 hash = CoreHashUtils.hashDataForPay(...);
        // Use libraries as needed
    }
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";

contract Service {
    using SignatureUtil for bytes;
    using AdvancedStrings for uint256;
    constructor(address coreAddress, address stakingAddress)
        EvvmService(coreAddress, stakingAddress) {}
        
    function orderCoffee(
        string memory order,
        bytes memory signature
    ) external {
        validateServiceSignature("orderCoffee", order, signature, msg.sender);
        // Process order...
    }
}
```

### Read-Only Service
Use `SignatureUtil` for signature verification only:

```solidity
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";

contract Validator {
    uint256 evvmId;
    
    function isValidSignature(
        bytes memory sig,
        address user,
        string memory action
    ) public view returns (bool) {
        return SignatureUtil.verifySignature(evvmId, action, "", sig, user);
    }
}
```

### Payment Processing Service
Use `CoreExecution` for Core.sol integration:

```solidity
import {CoreExecution} from "@evvm/testnet-contracts/library/utils/service/CoreExecution.sol";

contract PaymentService is CoreExecution {
    constructor(address coreAddress) CoreExecution(coreAddress) {}
    
    function processPayment(address from, address token, uint256 amount) external {
        // Request payment via Core.sol
        requestPay(
            from,
            token,
            amount,
            0, // priority fee
            msg.sender,
            0, // nonce
            false, // async
            "" // signature
        stnet-contracts/library/utils/service/SyncNonceService.sol";

contract HybridService is AsyncNonce, SyncNonceService {
    function actionWithSyncNonce(...) external {
        uint256 expectedNonce = getNextSyncServiceNonce(user);
        require(nonce == expectedNonce, "Invalid nonce");
        _incrementSyncServiceNonce(user);
    }

    function actionWithAsyncNonce(...) external {
        verifyAsyncNonce(user, nonce);
        markAsyncNonceAsUsed(user, nonce);
    }
}
```

## Installation3-StakingServiceUtils.md)** - Modular service components for Core.sol and Staking integration

**Essential Libraries**: 
- [CoreHashUtils](./04-Utils/05-CoreHashUtils.md) - Hash generation for Core.sol signatures
- [CAUtils](./04-Utils/07-CAUtils.md) - Contract address detection
- [SignatureUtil](./04-Utils/02-SignatureUtil.md) - High-level signature verification
# Clone repository
git clone --recursive https://github.com/EVVM-org/Testnet-Contracts.git

# Install via Forge
forge install EVVM-org/Testnet-Contracts
```

**Foundry Configuration** (`foundry.toml`):

```toml
remappings = [
    "@evvm/testnet-contracts/=lib/Testnet-Contracts/src/"
]
```

## Next Steps

Explore individual library documentation:

1. **[EvvmService](./02-EvvmService.md)** - Complete service development framework
2. **[Primitives](./03-Primitives/01-Math.md)** - Low-level mathematical and cryptographic operations
3. **[Utils](./04-Utils/01-AdvancedStrings.md)** - String conversions, hash generation, signature verification, and contract detection
4. **[Service Utilities](./04-Utils/03-Service/02-StakingServiceUtils.md)** - Modular service components for staking integration

**Essential Libraries**: [CoreHashUtils](./04-Utils/05-CoreHashUtils.md), [CAUtils](./04-Utils/07-CAUtils.md) - Essential for understanding the centralized signature system

---

**Recommendation**: Start with `EvvmService` for fastest development, then explore individual utilities as you need more customization.
