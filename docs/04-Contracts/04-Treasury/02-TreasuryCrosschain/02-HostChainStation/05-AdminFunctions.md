---
sidebar_position: 5
---

# Admin Functions

The Treasury Host Chain Station includes comprehensive administrative functions with time-delayed governance to ensure secure management of critical system parameters and roles.

## Admin Management

### proposeAdmin

**Function Type**: `external`  
**Function Signature**: `proposeAdmin(address)`  
**Access Control**: `onlyAdmin`

Proposes a new admin address with a mandatory 1-day time delay for security.

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `_newOwner` | `address` | Address of the proposed new admin |

#### Workflow
1. **Validation**: Ensures new address is not zero address or current admin
2. **Proposal Setup**: Sets `admin.proposal = _newOwner`
3. **Time Lock**: Sets `admin.timeToAccept = block.timestamp + 1 days`

```solidity
function proposeAdmin(address _newOwner) external onlyAdmin {
    if (_newOwner == address(0) || _newOwner == admin.current) revert();
    
    admin.proposal = _newOwner;
    admin.timeToAccept = block.timestamp + 1 days;
}
```

### rejectProposalAdmin

**Function Type**: `external`  
**Function Signature**: `rejectProposalAdmin()`  
**Access Control**: `onlyAdmin`

Cancels a pending admin change proposal.

#### Workflow
1. **Reset Proposal**: Sets `admin.proposal = address(0)`
2. **Clear Timestamp**: Sets `admin.timeToAccept = 0`

### acceptAdmin

**Function Type**: `external`  
**Function Signature**: `acceptAdmin()`  
**Access Control**: Proposed admin only

Accepts a pending admin proposal and completes the admin transition.

#### Workflow
1. **Time Validation**: Ensures `block.timestamp >= admin.timeToAccept`
2. **Authority Check**: Validates `msg.sender == admin.proposal`
3. **Admin Transfer**: Sets `admin.current = admin.proposal`
4. **Cleanup**: Resets proposal and timestamp to zero

```solidity
function acceptAdmin() external {
    if (block.timestamp < admin.timeToAccept) revert();
    if (msg.sender != admin.proposal) revert();
    
    admin.current = admin.proposal;
    admin.proposal = address(0);
    admin.timeToAccept = 0;
}
```

## Fisher Executor Management

### proposeFisherExecutor

**Function Type**: `external`  
**Function Signature**: `proposeFisherExecutor(address)`  
**Access Control**: `onlyAdmin`

Proposes a new fisher executor with the same time-delay mechanism as admin changes.

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `_newFisherExecutor` | `address` | Address of the proposed new fisher executor |

#### Workflow
1. **Validation**: Ensures new address is not zero or current executor
2. **Proposal Setup**: Sets `fisherExecutor.proposal = _newFisherExecutor`
3. **Time Lock**: Sets `fisherExecutor.timeToAccept = block.timestamp + 1 days`

### rejectProposalFisherExecutor

**Function Type**: `external`  
**Function Signature**: `rejectProposalFisherExecutor()`  
**Access Control**: `onlyAdmin`

Cancels a pending fisher executor change proposal.

### acceptFisherExecutor

**Function Type**: `external`  
**Function Signature**: `acceptFisherExecutor()`  
**Access Control**: Proposed fisher executor only

Accepts a pending fisher executor proposal and completes the transition.

#### Workflow
1. **Time Validation**: Ensures sufficient time has passed
2. **Authority Check**: Validates caller is the proposed executor
3. **Role Transfer**: Updates current fisher executor
4. **Cleanup**: Resets proposal state

## Getter Functions

### getAdmin

**Function Type**: `external view`  
**Function Signature**: `getAdmin()`  
**Returns**: `AddressTypeProposal memory`

Returns the complete admin state including current admin, proposed admin, and acceptance timestamp.

```solidity
struct AddressTypeProposal {
    address current;    // Current admin address
    address proposal;   // Proposed new admin (address(0) if none)
    uint256 timeToAccept; // Timestamp when proposal can be accepted
}
```

### getFisherExecutor

**Function Type**: `external view`  
**Function Signature**: `getFisherExecutor()`  
**Returns**: `AddressTypeProposal memory`

Returns the complete fisher executor state with the same structure as admin state.

### getNextFisherExecutionNonce

**Function Type**: `external view`  
**Function Signature**: `getNextFisherExecutionNonce(address)`  
**Returns**: `uint256`

Returns the next nonce value for a specific user's fisher bridge operations.

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `user` | `address` | User address to query nonce for |

### getEvvmAddress

**Function Type**: `external view`  
**Function Signature**: `getEvvmAddress()`  
**Returns**: `address`

Returns the address of the connected EVVM core contract.

### Configuration Getters

#### getHyperlaneConfig
**Returns**: `HyperlaneConfig memory`
```solidity
struct HyperlaneConfig {
    uint32 externalChainStationDomainId;
    bytes32 externalChainStationAddress;
    address mailboxAddress;
}
```

#### getLayerZeroConfig  
**Returns**: `LayerZeroConfig memory`
```solidity
struct LayerZeroConfig {
    uint32 externalChainStationEid;
    bytes32 externalChainStationAddress;
    address endpointAddress;
}
```

#### getAxelarConfig
**Returns**: `AxelarConfig memory`
```solidity
struct AxelarConfig {
    string externalChainStationChainName;
    string externalChainStationAddress;
    address gasServiceAddress;
    address gatewayAddress;
}
```

#### getOptions
**Returns**: `bytes memory`

Returns the LayerZero execution options used for cross-chain messaging.

## Security Features

### Time-Delayed Governance
- **1-Day Delay**: All role changes require 24-hour waiting period
- **Proposal/Accept Pattern**: Two-step process prevents accidental changes
- **Current Admin Control**: Only current admin can propose changes
- **Self-Accept**: Proposed addresses must accept their own appointments

### Role Separation
- **Admin Role**: Controls system configuration and role proposals
- **Fisher Executor Role**: Processes fisher bridge transactions
- **Distinct Management**: Separate proposal/accept cycles for each role

### Access Control
```solidity
modifier onlyAdmin() {
    if (msg.sender != admin.current) {
        revert();
    }
    _;
}

modifier onlyFisherExecutor() {
    if (msg.sender != fisherExecutor.current) {
        revert();
    }
    _;
}
```

## Governance Flow Example

### Admin Change Process
1. **Proposal**: Current admin calls `proposeAdmin(newAddress)`
2. **Wait Period**: 24-hour delay begins
3. **Acceptance**: Proposed admin calls `acceptAdmin()` after delay
4. **Completion**: Admin role transferred, proposal state cleared

### Emergency Rejection
- Current admin can call `rejectProposalAdmin()` at any time to cancel pending changes
- Useful for responding to compromised proposed addresses or changed requirements

:::warning[Governance Security]
The time-delayed governance system protects against unauthorized role changes but requires careful coordination:
- Ensure proposed addresses are controlled and available for acceptance
- Current admins retain rejection power during the delay period  
- Lost access to proposed addresses requires starting the proposal process over
:::