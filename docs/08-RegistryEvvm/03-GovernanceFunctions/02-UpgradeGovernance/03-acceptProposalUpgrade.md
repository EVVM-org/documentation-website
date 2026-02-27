---
description: "Executes pending upgrade proposals after the 7-day waiting period has elapsed"
sidebar_position: 3
---

# acceptProposalUpgrade

**Function Type**: `external`  
**Access Control**: `isSuperUser`  
**Function Signature**: `acceptProposalUpgrade()`

Accepts a pending upgrade proposal and executes the contract upgrade after the mandatory 7-day waiting period has elapsed.

## Description

This function completes the final step of the time-delayed governance process for contract upgrades. It validates the time delay, executes the upgrade to the new implementation, and cleans up the proposal state.

## Access Control

**Modifier**: `isSuperUser`

Only the current superUser can execute pending upgrade proposals, maintaining governance authority over system changes.

## Requirements

### Time Delay Validation
- Current timestamp must be greater than or equal to `upgradeProposal.timeToAccept`
- The full 7-day waiting period must have elapsed

### Proposal State Validation
- A valid proposal must exist (proposal address cannot be zero)
- Proposal must not have been rejected or expired

## Security Features

### Time Delay Enforcement
- Mandatory 7-day waiting period cannot be bypassed
- Provides community oversight and intervention opportunity
- Allows for thorough security review

### Atomic Execution
- Upgrade and state cleanup happen in single transaction
- Prevents partial state issues
- Ensures clean governance transition

### UUPS Pattern Compliance
- Uses OpenZeppelin's `upgradeToAndCall` for secure upgrades
- Maintains proxy pattern integrity
- Preserves storage layout and state

### Workflow

1. **Access Control**: Validates that the caller is the current superUser using the `isSuperUser` modifier. Reverts with `InvalidUser` if not authorized.
2. **Time Validation**: Checks that the 7-day acceptance period has elapsed using the `timeElapsed` modifier. Reverts with `TimeNotElapsed` if called too early.
3. **Upgrade Execution**: Calls the internal `_authorizeUpgrade` function to perform the contract upgrade.
4. **State Cleanup**: Clears the proposal data after successful upgrade execution.

## Related Functions

### Upgrade Lifecycle
- [`proposeUpgrade()`](./01-proposeUpgrade.md) - Initiate upgrade proposals
- [`rejectProposalUpgrade()`](./02-rejectProposalUpgrade.md) - Cancel proposals

### State Queries
- [`getUpgradeProposalData()`](../../05-GetterFunctions/08-getUpgradeProposalData.md) - Monitor proposal status
- [`getVersion()`](../../05-GetterFunctions/09-getVersion.md) - Verify upgrade success

The `acceptProposalUpgrade` function represents the culmination of the upgrade governance process, executing irreversible system changes with appropriate safeguards and validation.