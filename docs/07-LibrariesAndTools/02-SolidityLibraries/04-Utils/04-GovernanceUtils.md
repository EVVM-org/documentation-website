---
title: "Governance (Admin & ProposalStructs)"
description: "Time-delayed governance helpers and admin-controlled patterns"
sidebar_position: 4
---

# Governance Libraries

The governance libraries provide reusable primitives for time-delayed governance and safe admin handover. The package surface is intentionally minimal and focuses on the common pattern of proposing a new value, waiting a configured delay, and then accepting the proposal.

## Overview

**Contract Types**: Abstract contract (Admin) and Struct library (ProposalStructs)
**License**: EVVM-NONCOMMERCIAL-1.0
**Import Paths**: 
- `@evvm/testnet-contracts/library/utils/governance/Admin.sol`
- `@evvm/testnet-contracts/library/utils/governance/ProposalStructs.sol`

### Key Features

- Time-delayed proposals for addresses and uint values
- Simple boolean-flag proposals with delay
- Built-in events to track proposals and acceptances
- Small, audit-friendly surface

## ProposalStructs

`ProposalStructs` exposes simple structs used by governance-enabled contracts:

```solidity
struct AddressTypeProposal {
    address current;
    address proposal;
    uint256 timeToAccept;
}

struct UintTypeProposal {
    uint256 current;
    uint256 proposal;
    uint256 timeToAccept;
}

struct BoolTypeProposal {
    bool flag;
    uint256 timeToAcceptChange;
}
```

They are designed to store the current value, the proposed new value and the earliest timestamp when the proposal can be accepted.

## Admin Contract

`Admin` is an abstract contract that uses the `AddressTypeProposal` pattern to manage admin handovers with a time delay.

### Events

- `event AdminProposed(address indexed newAdmin, uint256 timeToAccept);`
- `event AdminAccepted(address indexed newAdmin);`

### Errors

- `error SenderIsNotAdmin();` — thrown when a non-admin attempts to perform admin-only actions
- `error ProposalNotReady();` — thrown when attempting to accept a proposal before `timeToAccept`

### Functions

#### proposeAdmin
```solidity
function proposeAdmin(address newAdmin, uint256 delay) external onlyAdmin
```
Proposes a new admin; sets `admin.proposal` and `admin.timeToAccept = block.timestamp + delay`, emits `AdminProposed`

#### acceptAdmin
```solidity
function acceptAdmin() external
```
Accepts the pending proposal; requires caller to be the proposed admin and `block.timestamp >= admin.timeToAccept`; sets `admin.current = admin.proposal` and clears the proposal fields; emits `AdminAccepted`

### Modifier

- `onlyAdmin()` — restricts execution to the currently active admin address

## Usage Example

```solidity
import {Admin} from "@evvm/testnet-contracts/library/utils/governance/Admin.sol";

contract MyService is Admin {
    constructor(address initialAdmin) Admin(initialAdmin) {}

    function proposeNewAdmin(address candidate, uint256 delay) external onlyAdmin {
        proposeAdmin(candidate, delay);
    }

    function acceptNewAdmin() external {
        acceptAdmin();
    }
    
    // Other admin-controlled functions
    function updateServiceParameter(uint256 value) external onlyAdmin {
        // Only current admin can call this
    }
}
```

## Usage in EVVM Contracts

Many EVVM contracts use the `Admin` base contract for governance:

- **TreasuryHostChainStation**: Uses `Admin` for admin management
- **TreasuryExternalChainStation**: Uses `Admin` for admin management
- **NameService**: Uses `Admin` patterns
- **Staking**: Uses `Admin` for governance
- **P2PSwap**: Uses `Admin` patterns

**Typical Pattern**:
```solidity
contract EVVMContract is Admin {
    ProposalStructs.AddressTypeProposal public someAddress;
    
    function proposeSomeAddress(address newAddress, uint256 delay) external onlyAdmin {
        someAddress.proposal = newAddress;
        someAddress.timeToAccept = block.timestamp + delay;
    }
    
    function acceptSomeAddress() external onlyAdmin {
        require(block.timestamp >= someAddress.timeToAccept, "Too early");
        someAddress.current = someAddress.proposal;
        someAddress.proposal = address(0);
        someAddress.timeToAccept = 0;
    }
}
```

## Best Practices

1. **Delay Duration**: Use 1 day (86400 seconds) minimum for production contracts
2. **Proposal Validation**: Check `newAdmin != address(0)` and `newAdmin != admin.current`
3. **Event Monitoring**: Listen for `AdminProposed` and `AdminAccepted` events
4. **Multi-sig Recommended**: Use multi-sig wallets for admin addresses

---

**Recommendation**: Inherit from `Admin` for any contract requiring admin governance with time-delayed changes.

**Note**: `delay` should be chosen according to governance risk model. For development and testing, short delays (minutes) are convenient. For production deployments consider multi-day delays.

## Best Practices

- Require `onlyAdmin` for functions that change critical configuration
- Use events to record proposal and acceptance timestamps for off-chain monitoring
- Keep proposals minimal (one field at a time) to simplify reasoning and audits

## Tests

Add unit tests that:
- Verify `proposeAdmin()` sets the proposal and emits `AdminProposed`
- Verify `acceptAdminProposal()` reverts before `timeToAccept` and succeeds after
- Verify `onlyAdmin` prevents unauthorized callers

## See Also

- **EvvmService** — services typically protect admin functions using `AdminControlled` or similar patterns
- **Governance processes** — consider adding documentation of expected delay values for testnets vs production
