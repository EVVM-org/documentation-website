---
title: "Admin Functions"
description: "Detailed documentation of the EVVM Estimator Contract's administrative functions for managing critical contract addresses with time-delayed governance."
sidebar_position: 3
---

# Admin Functions

The Estimator contract implements a comprehensive administrative governance system with time-delayed proposals for all critical address updates. This system ensures security through a 24-hour delay period for all administrative changes.

## Governance Architecture

### Time-Delayed Proposal System
All administrative functions follow a secure three-step process:
1. **Proposal Creation**: Admin proposes a new address with 24-hour delay
2. **Waiting Period**: 24-hour security delay before acceptance
3. **Proposal Execution**: Anyone can execute the proposal after the delay period

### Managed Addresses
The system manages four critical contract addresses:
- **Activator**: Controls epoch notifications and system activation
- **EVVM Address**: Core EVVM contract for payment processing
- **Staking Address**: Staking contract for user data access
- **Admin**: Primary administrative control address

## Activator Address Management

### `setActivatorProposal`
**Access Control**: `onlyActivator`  
**Function Signature**: `setActivatorProposal(address)`

Creates a proposal to change the activator address.

**Parameters:**
- `_proposal` (address): New proposed activator address

**Process:**
1. Sets the proposed activator address
2. Establishes acceptance time as current timestamp + 24 hours
3. Requires current activator authorization

### `cancelActivatorProposal`
**Access Control**: `onlyActivator`  
**Function Signature**: `cancelActivatorProposal()`

Cancels any pending activator address proposal.

**Process:**
1. Resets proposal address to zero address
2. Resets acceptance time to zero
3. Prevents unauthorized address changes

### `acceptActivatorProposal`
**Access Control**: `public`  
**Function Signature**: `acceptActivatorProposal()`

Executes the activator address change after the delay period.

**Requirements:**
- Current timestamp must exceed the acceptance time
- Valid proposal must exist

**Process:**
1. Verifies delay period has elapsed
2. Updates actual activator address to proposed address
3. Clears proposal data

## EVVM Address Management

### `setEvvmAddressProposal`
**Access Control**: `onlyAdmin`  
**Function Signature**: `setEvvmAddressProposal(address)`

Creates a proposal to update the EVVM contract address.

**Parameters:**
- `_proposal` (address): New proposed EVVM contract address

### `cancelEvvmAddressProposal`
**Access Control**: `onlyAdmin`  
**Function Signature**: `cancelEvvmAddressProposal()`

Cancels any pending EVVM address proposal.

### `acceptEvvmAddressProposal`
**Access Control**: `onlyAdmin`  
**Function Signature**: `acceptEvvmAddressProposal()`

Executes the EVVM address change after verification of the delay period.

## Staking Address Management

### `setAddressStakingProposal`
**Access Control**: `onlyAdmin`  
**Function Signature**: `setAddressStakingProposal(address)`

Creates a proposal to update the staking contract address.

**Parameters:**
- `_proposal` (address): New proposed staking contract address

### `cancelAddressStakingProposal`
**Access Control**: `onlyAdmin`  
**Function Signature**: `cancelAddressStakingProposal()`

Cancels any pending staking address proposal.

### `acceptAddressStakingProposal`
**Access Control**: `onlyAdmin`  
**Function Signature**: `acceptAddressStakingProposal()`

Executes the staking address change after the required delay period.

## Admin Address Management

### `setAdminProposal`
**Access Control**: `onlyAdmin`  
**Function Signature**: `setAdminProposal(address)`

Creates a proposal to transfer administrative control to a new address.

**Parameters:**
- `_proposal` (address): New proposed admin address

### `cancelAdminProposal`
**Access Control**: `onlyAdmin`  
**Function Signature**: `cancelAdminProposal()`

Cancels any pending admin address proposal.

### `acceptAdminProposal`
**Access Control**: `public`  
**Function Signature**: `acceptAdminProposal()`

Executes the admin address transfer after the delay period.

**Note:** This function is publicly callable to ensure admin transfer can occur even if the current admin becomes unavailable.

## Security Features

### Time-Lock Protection
- **24-Hour Delay**: All address changes require a 24-hour waiting period
- **Proposal Visibility**: All proposals are publicly visible during the waiting period
- **Emergency Cancellation**: Current authorized addresses can cancel proposals

### Access Control Patterns
- **Role-Based Permissions**: Each function has specific role requirements
- **Separation of Concerns**: Different roles for different administrative functions
- **Public Execution**: Some acceptance functions are public to prevent admin lockout

### Proposal Structure
Each address proposal includes:
```solidity
struct AddressTypeProposal {
    address actual;      // Current active address
    address proposal;    // Proposed new address  
    uint256 timeToAccept; // Timestamp when proposal can be executed
}
```

## Integration Points

### With Core Contracts
- **Staking Contract**: Maintains connection for user data access
- **EVVM Contract**: Coordinates payment processing integration
- **Activator System**: Controls epoch and system activation functions

### With Governance
- **Decentralized Control**: Time delays provide community oversight opportunity
- **Emergency Response**: Cancellation functions provide emergency controls
- **Transparent Process**: All proposals are publicly visible and verifiable

## Usage Workflows

### Standard Address Update
1. **Proposal Creation**: Authorized address creates proposal
2. **Community Review**: 24-hour period for community oversight
3. **Proposal Execution**: Anyone executes proposal after delay
4. **System Update**: Contract begins using new address

### Emergency Cancellation
1. **Threat Detection**: Unauthorized or malicious proposal detected
2. **Immediate Cancellation**: Authorized address cancels proposal
3. **System Protection**: Prevents unauthorized address changes

:::warning

All administrative functions include time delays for security. Plan address updates in advance to accommodate the 24-hour waiting period.

:::

:::info

The public nature of acceptance functions ensures that administrative changes can be completed even if the current admin becomes unavailable, preventing system lockout scenarios.

:::
