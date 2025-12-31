---
sidebar_position: 6
---

# Admin Functions

The Treasury External Chain Station includes comprehensive administrative functions with time-delayed governance, following the same security patterns as the host chain station but adapted for external chain operations.

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
3. **Time Lock**: Sets `admin.timeToAccept = block.timestamp + 1 minutes` (current testnet/dev setting; production may use `+ 1 days`)

### rejectProposalAdmin

**Function Type**: `external`  
**Function Signature**: `rejectProposalAdmin()`  
**Access Control**: `onlyAdmin`

Cancels a pending admin change proposal.

### acceptAdmin

**Function Type**: `external`  
**Function Signature**: `acceptAdmin()`  
**Access Control**: Proposed admin only

Accepts a pending admin proposal and completes the admin transition.

## Fisher Executor Management

### proposeFisherExecutor

**Function Type**: `external`  
**Function Signature**: `proposeFisherExecutor(address)`  
**Access Control**: `onlyAdmin`

Proposes a new fisher executor with the same time-delay mechanism.

### rejectProposalFisherExecutor

**Function Type**: `external`  
**Function Signature**: `rejectProposalFisherExecutor()`  
**Access Control**: `onlyAdmin`

Cancels a pending fisher executor change proposal.

### acceptFisherExecutor

**Function Type**: `external`  
**Function Signature**: `acceptFisherExecutor()`  
**Access Control**: Proposed fisher executor only

Accepts a pending fisher executor proposal.

## Cross-Chain Configuration

### setHostChainAddress

**Function Type**: `external`  
**Function Signature**: `setHostChainAddress(bytes32,string)`  
**Access Control**: `onlyAdmin`

Configures the host chain station address for all supported cross-chain protocols.

#### Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `hostChainStationAddressBytes32` | `bytes32` | Host station address in bytes32 format (for Hyperlane and LayerZero) |
| `hostChainStationAddressString` | `string` | Host station address in string format (for Axelar) |

#### Workflow
```solidity
function setHostChainAddress(
    bytes32 hostChainStationAddressBytes32,
    string memory hostChainStationAddressString
) external onlyAdmin {
    hyperlane.hostChainStationAddress = hostChainStationAddressBytes32;
    layerZero.hostChainStationAddress = hostChainStationAddressBytes32;
    axelar.hostChainStationAddress = hostChainStationAddressString;
    _setPeer(
        layerZero.hostChainStationEid,
        layerZero.hostChainStationAddress
    );
}
```

## Getter Functions

### getAdmin

**Function Type**: `external view`  
**Function Signature**: `getAdmin()`  
**Returns**: `AddressTypeProposal memory`

Returns the complete admin state including current admin, proposed admin, and acceptance timestamp.

### getFisherExecutor

**Function Type**: `external view`  
**Function Signature**: `getFisherExecutor()`  
**Returns**: `AddressTypeProposal memory`

Returns the complete fisher executor state.

### getNextFisherExecutionNonce

**Function Type**: `external view`  
**Function Signature**: `getNextFisherExecutionNonce(address)`  
**Returns**: `uint256`

Returns the next nonce value for a specific user's fisher bridge operations.

### getEvvmAddress

**Function Type**: `external view`  
**Function Signature**: `getEvvmAddress()`  
**Returns**: `address`

Returns the address of the connected EVVM core contract (used for reference, not direct interaction).

### Configuration Getters

#### getHyperlaneConfig
**Returns**: `HyperlaneConfig memory`
```solidity
struct HyperlaneConfig {
    uint32 hostChainStationDomainId;
    bytes32 hostChainStationAddress;
    address mailboxAddress;
}
```

#### getLayerZeroConfig
**Returns**: `LayerZeroConfig memory`
```solidity
struct LayerZeroConfig {
    uint32 hostChainStationEid;
    bytes32 hostChainStationAddress;
    address endpointAddress;
}
```

#### getAxelarConfig
**Returns**: `AxelarConfig memory`
```solidity
struct AxelarConfig {
    string hostChainStationChainName;
    string hostChainStationAddress;
    address gasServiceAddress;
    address gatewayAddress;
}
```

#### getOptions
**Returns**: `bytes memory`

Returns the LayerZero execution options used for cross-chain messaging.

## External Chain Specific Features

### Asset Management
Unlike the host chain station, the external chain station:
- **Holds Real Assets**: Manages actual ERC20 tokens and native coins
- **No EVVM Integration**: Doesn't directly interact with EVVM balances
- **Transfer Execution**: Handles final asset delivery to users

### Cross-Chain Coordination
- **Message Reception**: Receives withdrawal instructions from host chain
- **Asset Distribution**: Transfers tokens/coins to specified recipients
- **Event Emission**: Signals deposit operations for host chain processing

## Security Features

### Time-Delayed Governance
- **1-Day Delay**: All role changes require 24-hour waiting period
- **Proposal/Accept Pattern**: Two-step process prevents accidental changes
- **Emergency Rejection**: Current admin can cancel pending proposals

### Asset Security
- **Real Asset Custody**: Manages actual tokens and native coins
- **Transfer Validation**: Ensures sufficient balances before transfers
- **Address Verification**: Validates recipient addresses for asset delivery

### Cross-Chain Security
- **Protocol Authentication**: Validates messages from authorized host chain station
- **Address Configuration**: Secure setup of cross-chain communication endpoints
- **Message Integrity**: Ensures accurate parameter transmission across chains

## Configuration Requirements

### Host Chain Setup
Before calling `setHostChainAddress`:
1. **Host Station Deployment**: Ensure host chain station is deployed and configured
2. **Address Verification**: Confirm both bytes32 and string formats represent same address
3. **Protocol Compatibility**: Verify host station supports all three protocols

### Asset Requirements
For proper operation, ensure:
1. **Token Holdings**: Sufficient ERC20 token balances for withdrawal processing
2. **Native Balance**: Adequate native coins for user withdrawals and gas fees
3. **Allowance Management**: Proper token approval mechanisms if needed

## Error Conditions

Similar to host chain station:
- **Access Control**: Unauthorized calls to admin-only functions
- **Time Validation**: Premature acceptance attempts
- **Address Validation**: Invalid or duplicate address proposals

## Governance Flow

The administrative flow mirrors the host chain station:
1. **Proposal**: Current admin proposes changes
2. **Time Delay**: 24-hour waiting period
3. **Acceptance**: Proposed address accepts the role
4. **Completion**: Role transfer and state cleanup

:::warning[Cross-Chain Coordination]
When changing admin or fisher executor roles, ensure coordination between host and external chain stations to maintain synchronized operations.
:::

:::info[Asset Custody Responsibility]
The external chain station holds real assets and is responsible for their secure management and distribution. Admin changes affect control over these assets.
:::