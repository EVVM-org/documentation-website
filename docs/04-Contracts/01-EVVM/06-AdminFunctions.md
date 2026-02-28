---
title: "Administrative Functions"
description: "Detailed documentation of the EVVM Core Contract's administrative functions for system configuration, governance, and access control."
sidebar_position: 6
---

# Administrative Functions

This section covers all administrative functions in the EVVM contract, including system configuration, governance, and access control mechanisms. These functions implement time-delayed governance for critical system changes to ensure security and allow for community review.

:::info[Proxy Management Functions]
The proxy management functions have been moved to their own dedicated section. See [Proxy Management Functions](./10-ProxyManagement.md) for complete documentation on implementation upgrades and proxy operations.
:::

---

## Initial Setup Functions

### _setupNameServiceAndTreasuryAddress

**Function Type**: `external`  
**Function Signature**: `_setupNameServiceAndTreasuryAddress(address,address)`

One-time setup function to configure the NameService and Treasury contract addresses. This function can only be called once due to a breaker flag mechanism for security.

#### Input Parameters

| Parameter              | Type      | Description                                    |
| ---------------------- | --------- | ---------------------------------------------- |
| `_nameServiceAddress`  | `address` | Address of the deployed NameService contract   |
| `_treasuryAddress`     | `address` | Address of the deployed Treasury contract      |

#### Setup Process

1. **Breaker Validation**: Ensures the function can only be called once
2. **NameService Configuration**: Sets the NameService contract address for identity resolution
3. **Initial Balance**: Provides 10,000 MATE tokens to the NameService contract
4. **Staker Registration**: Registers NameService as a privileged staker
5. **Treasury Configuration**: Sets the Treasury contract address for balance operations

#### Security Features

- **One-Time Execution**: Breaker flag prevents multiple calls
- **Essential Integration**: Configures critical system dependencies
- **Automatic Staking**: NameService receives staker privileges automatically
- **Initial Funding**: NameService gets operational balance for fees and operations

#### Workflow

```solidity
// Initial state: breakerSetupNameServiceAddress == FLAG_IS_STAKER (0x01)
// After execution: breakerSetupNameServiceAddress == 0x00 (prevents re-execution)

evvm._setupNameServiceAndTreasuryAddress(nameServiceAddr, treasuryAddr);
```

---

## Admin Management Functions

The contract implements time-delayed admin transfers with a 1-day security period.

### proposeAdmin

**Function Type**: `external onlyAdmin`  
**Function Signature**: `proposeAdmin(address)`

Proposes a new admin address with a 1-day time delay for security.

#### Input Parameters

| Parameter    | Type      | Description                      |
| ------------ | --------- | -------------------------------- |
| `_newOwner`  | `address` | Address of the proposed new admin |

#### Security Features

- **1-day time delay**: Shorter than implementation upgrades but provides safety
- **Non-zero validation**: Prevents setting admin to zero address
- **Self-assignment prevention**: Cannot propose current admin as new admin
- **Admin-only access**: Only current admin can propose changes

#### Workflow

1. Current admin proposes a new admin address
2. System sets acceptance deadline (current time + 1 day)
3. Proposed admin must accept the role after the time delay
4. Current admin can cancel the proposal if needed

---

### rejectProposalAdmin

**Function Type**: `external onlyAdmin`  
**Function Signature**: `rejectProposalAdmin()`

Cancels a pending admin change proposal.

#### Security Features

- **Admin-only access**: Only current admin can reject proposals
- **Immediate effect**: Cancellation takes effect immediately
- **State cleanup**: Clears both proposal address and acceptance deadline

---

### acceptAdmin

**Function Type**: `external`  
**Function Signature**: `acceptAdmin()`

Allows the proposed admin to accept the admin role after the time delay.

#### Security Features

- **Time delay enforcement**: Can only be called after the acceptance deadline
- **Proposed admin only**: Only the proposed admin can call this function
- **Two-step process**: Requires both proposal and acceptance for security

#### Workflow

1. Verifies that the current timestamp exceeds the acceptance deadline
2. Verifies that the caller is the proposed admin
3. Updates the current admin to the proposed admin
4. Clears the proposal state

---



## NameService Integration

### setNameServiceAddress

**Function Type**: `external onlyAdmin`  
**Function Signature**: `setNameServiceAddress(address)`

Updates the NameService contract address for identity resolution.

#### Input Parameters

| Parameter              | Type      | Description                           |
| ---------------------- | --------- | ------------------------------------- |
| `_nameServiceAddress`  | `address` | Address of the new NameService contract |

#### Security Features

- **Admin-only access**: Only admin can change NameService integration
- **Immediate effect**: Change takes effect immediately
- **Critical integration**: Affects identity resolution in payments

#### Use Cases

- Upgrading to a new NameService contract version
- Switching to a different identity resolution system
- Fixing integration issues with the current NameService

---

## Token List Management Functions

The EVVM Core contract implements a flexible token permission system using allowList and denyList mechanisms. This enables granular control over which tokens can be used in payments, deposits, and other interactions.

### List Modes
- **allowList**: Only explicitly allowed tokens can be used.
- **denyList**: All tokens are allowed except those explicitly denied.
- **None**: No restrictions; all tokens are permitted.

The active mode is managed through governance proposals.

### Key Functions

| Function | Signature |
|----------|-----------|
| verifyTokenInteractionAllowance | `function verifyTokenInteractionAllowance(address token) external view` |
| proposeListStatus | `function proposeListStatus(bytes1 newStatus) external onlyAdmin` |
| rejectListStatusProposal | `function rejectListStatusProposal() external onlyAdmin` |
| acceptListStatusProposal | `function acceptListStatusProposal() external onlyAdmin` |
| setTokenStatusOnAllowList | `function setTokenStatusOnAllowList(address token, bool status) external onlyAdmin` |
| setTokenStatusOnDenyList | `function setTokenStatusOnDenyList(address token, bool status) external onlyAdmin` |

#### Example Usage
```solidity
// Propose allowList mode
evvm.proposeListStatus(0x01);
// Wait for timelock and accept
evvm.acceptListStatusProposal();
// Add token to allowList
evvm.setTokenStatusOnAllowList(tokenAddress, true);
// Check if a token is allowed
evvm.verifyTokenInteractionAllowance(tokenAddress);
```

---

## Reward Flow Distribution Control

The Core contract includes a safety mechanism to halt or resume reward distribution when the supply reaches critical thresholds, managed by the `rewardFlowDistribution` flag.

### Purpose
- **Preserve supply:** If 99.99% of the supply is distributed, reward emission can be stopped.
- **Emergency control:** Admin can re-enable distribution if needed.

### Key Functions
| Variable/Function | Description |
|-------------------|-------------|
| rewardFlowDistribution.flag | Boolean flag indicating if rewards are distributed |
| proposeChangeRewardFlowDistribution | Propose flag change (admin only, timelock) |
| rejectChangeRewardFlowDistribution | Reject pending proposal |
| acceptChangeRewardFlowDistribution | Accept and apply the change after timelock |

#### Example
```solidity
evvm.proposeChangeRewardFlowDistribution();
// Wait for timelock
evvm.acceptChangeRewardFlowDistribution();
```

---

## Supply & Reward Governance

The Core contract provides administrative functions to manage critical economic parameters: the maximum supply and the base reward. All actions are protected by timelock.

### Deleting Maximum Supply
Allows the admin to "delete" (set to max uint256) the maximum supply, only in extreme scenarios.

| Function | Signature |
|----------|-----------|
| proposeDeleteTotalSupply | `function proposeDeleteTotalSupply() external onlyAdmin` |
| rejectDeleteTotalSupply | `function rejectDeleteTotalSupply() external onlyAdmin` |
| acceptDeleteTotalSupply | `function acceptDeleteTotalSupply() external onlyAdmin` |

#### Workflow
1. Propose deletion
2. Wait for timelock
3. Accept: max supply is set to uint256 max

### Changing Base Reward
Allows the admin to change the base reward for stakers and transaction processors.

| Function | Signature |
|----------|-----------|
| proposeChangeBaseRewardAmount | `function proposeChangeBaseRewardAmount(uint256 newBaseReward) external onlyAdmin` |
| rejectChangeBaseRewardAmount | `function rejectChangeBaseRewardAmount() external onlyAdmin` |
| acceptChangeBaseRewardAmount | `function acceptChangeBaseRewardAmount() external onlyAdmin` |

#### Workflow
1. Propose new reward
2. Wait for timelock
3. Accept: reward is updated

---

All these functions are subject to admin control and timelock periods for maximum security and transparency.

## Usage Examples

### Admin Transfer Process

```solidity
// 1. Current admin proposes new admin
evvm.proposeAdmin(newAdminAddress);

// 2. Wait 1 day

// 3. Proposed admin accepts the role
// (must be called by the proposed admin)
evvm.acceptAdmin();
```

## Security Considerations

### Time Delays

- **Admin changes**: 1-day delay for administrative control

### Access Control

- All administrative functions require `onlyAdmin` modifier
- Two-step process for admin transfers prevents accidental loss of control
- Cancellation mechanisms allow recovery from erroneous proposals

### State Management

- Admin proposals can only be executed after time delays
- State is properly cleaned up after execution or cancellation
- Clear proposal and acceptance process prevents confusion
