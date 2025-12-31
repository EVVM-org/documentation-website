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

- **EvvmService**: Base contract providing complete EVVM service functionality with built-in helpers for payments, signatures, nonces, and staking

### Primitive Libraries

- **Math**: Standard mathematical operations with overflow protection (OpenZeppelin-based)
- **SignatureRecover**: EIP-191 signature recovery and verification primitives

### Utility Libraries

- **AdvancedStrings**: Type conversion utilities (uint/address/bytes to string)
- **SignatureUtil**: High-level signature verification for EVVM messages
- **GovernanceUtils**: Time-delayed governance helpers (`AdminControlled`)

### Service Utilities

- **AsyncNonce**: Async nonce tracking and validation
- **SyncNonceService**: Sequential nonce management
- **MakeServicePaymentOnEvvm**: Payment processing helpers
- **StakingServiceUtils**: Service staking integration utilities

## Quick Start

### Using EvvmService (Recommended)

The `EvvmService` abstract contract is the recommended way to build EVVM services. It combines all essential utilities:

```solidity
import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";

contract MyService is EvvmService {
    constructor(
        address evvmAddress,
        address stakingAddress
    ) EvvmService(evvmAddress, stakingAddress) {}

    function myFunction(
        address user,
        string memory data,
        uint256 nonce,
        bytes memory signature,
        uint256 priorityFee,
        uint256 evvmNonce,
        bool useAsync,
        bytes memory paymentSig
    ) external {
        // Validate signature
        validateServiceSignature("myFunction", data, signature, user);

        // Check nonce
        verifyAsyncNonce(user, nonce);

        // Process payment
        requestPay(user, getEtherAddress(), 1 ether, priorityFee, evvmNonce, useAsync, paymentSig);

        // Mark nonce as used
        markAsyncNonceAsUsed(user, nonce);
    }
}
```

### Using Individual Utilities

For more granular control, use individual libraries:

```solidity
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";
import {AsyncNonce} from "@evvm/testnet-contracts/library/utils/nonces/AsyncNonce.sol";

contract MyCustomService is AsyncNonce {
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
- Payment processing
- Nonce management
- Service staking
- EVVM/Staking integration

**Best for**: New services, quick prototyping, standard use cases

### 2. Primitive Operations

Low-level utilities for fundamental operations:

- Signature recovery (EIP-191)
- Mathematical operations
- Type conversions

**Best for**: Building custom validation logic, advanced cryptographic operations

### 3. Service Utilities

Modular helpers for specific service functionalities:

- Nonce tracking (async/sync)
- Payment processing
- Staking integration

**Best for**: Custom service architectures, mixing and matching functionality

## Design Patterns

### Pattern 1: Full EvvmService Integration
```solidity
contract Service is EvvmService {
    // Inherit all functionality - fastest development
}
```

### Pattern 2: Modular Composition
```solidity
contract Service is AsyncNonce, MakeServicePaymentOnEvvm {
    // Mix utilities as needed - granular control
}
```

### Pattern 3: Library-Only Usage
```solidity
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";

contract Service {
    using SignatureUtil for bytes;
    using AdvancedStrings for uint256;
    // Pure library usage - maximum flexibility
}
```

## Common Use Cases

### Standard EVVM Service
Use `EvvmService` for complete service functionality:

```solidity
contract CoffeeShop is EvvmService {
    function orderCoffee(...) external {
        validateServiceSignature(...);
        verifyAsyncNonce(...);
        requestPay(...);
        markAsyncNonceAsUsed(...);
    }
}
```

### Read-Only Service
Use `SignatureUtil` for signature verification:

```solidity
import {SignatureUtil} from "@evvm/testnet-contracts/library/utils/SignatureUtil.sol";

contract Validator {
    function isValidSignature(bytes memory sig, address user) public pure returns (bool) {
        return SignatureUtil.verifySignature(evvmId, "action", params, sig, user);
    }
}
```

### Custom Nonce Strategy
Inherit both nonce services:

```solidity
import {AsyncNonce} from "@evvm/testnet-contracts/library/utils/nonces/AsyncNonce.sol";
import {SyncNonceService} from "@evvm/testnet-contracts/library/utils/service/SyncNonceService.sol";

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

## Installation

```bash
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
3. **[Utils](./04-Utils/01-AdvancedStrings.md)** - String conversions and signature verification
4. **[Service Utilities](./04-Utils/03-Service/01-AsyncNonceService.md)** - Modular service components (see `AsyncNonce` for async nonce management)

---

**Recommendation**: Start with `EvvmService` for fastest development, then explore individual utilities as you need more customization.
