---
+title: "Administrative Functions"
+description: "Detailed documentation of the EVVM Core Contract's administrative functions for system configuration, governance, and access control."
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
