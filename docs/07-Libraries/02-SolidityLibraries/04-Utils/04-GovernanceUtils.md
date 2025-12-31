---
title: "GovernanceUtils"
description: "Time-delayed governance helpers and admin-controlled patterns"
sidebar_position: 4
---

# GovernanceUtils

`GovernanceUtils` provides small, reusable primitives for time-delayed governance and safe admin handover. The package surface is intentionally minimal and focuses on the common pattern of proposing a new value, waiting a configured delay, and then accepting the proposal.

## Overview

**Contract Type**: Library and base abstract contract
**License**: EVVM-NONCOMMERCIAL-1.0
**Import Path**: `@evvm/testnet-contracts/library/utils/GovernanceUtils.sol`

### Key Features

- Time-delayed proposals for addresses and uint values
- Simple boolean-flag proposals with delay
- Built-in events to track proposals and acceptances
- Small, audit-friendly surface

## Structures

`ProposalStructs` exposes a few simple structs used by governance-enabled contracts:

- `AddressTypeProposal { address current; address proposal; uint256 timeToAccept; }`
- `UintTypeProposal    { uint256 current; uint256 proposal; uint256 timeToAccept; }`
- `BoolTypeProposal    { bool flag; uint256 timeToAcceptChange; }`

They are designed to store the current value, the proposed new value and the earliest timestamp when the proposal can be accepted.

## AdminControlled

`AdminControlled` is an abstract contract that uses the `AddressTypeProposal` pattern to manage admin handovers with a time delay.

### Events

- `event AdminProposed(address indexed newAdmin, uint256 timeToAccept);`
- `event AdminAccepted(address indexed newAdmin);`

### Errors

- `error SenderIsNotAdmin();` — thrown when a non-admin attempts to perform admin-only actions
- `error ProposalNotReady();` — thrown when attempting to accept a proposal before `timeToAccept`

### Functions

- `proposeAdmin(address newAdmin, uint256 delay)` — proposes a new admin; sets `admin.proposal` and `admin.timeToAccept = block.timestamp + delay`, emits `AdminProposed`
- `acceptAdminProposal()` — accepts the pending proposal; requires caller `onlyAdmin` and `block.timestamp >= admin.timeToAccept`; sets `admin.current = admin.proposal` and clears the proposal fields; emits `AdminAccepted`

### Modifier

- `onlyAdmin()` — restricts execution to the currently active admin address

## Usage Example

```solidity
contract MyService is AdminControlled {
    constructor(address initialAdmin) {
        admin.current = initialAdmin;
    }

    function proposeNewAdmin(address candidate, uint256 delay) external onlyAdmin {
        proposeAdmin(candidate, delay);
    }

    function acceptAdmin() external onlyAdmin {
        acceptAdminProposal();
    }
}
```

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
