---
description: "Time-delayed proposal system for configuring external chain station addresses across cross-chain protocols"
sidebar_position: 4
---

# External Chain Address Management

The Treasury Host Chain Station uses a time-delayed proposal system to configure external chain station addresses for all supported cross-chain protocols. This administrative governance ensures secure management of cross-chain connections.

## proposeExternalChainAddress

**Function Type**: `external`  
**Function Signature**: `proposeExternalChainAddress(address,string)`  
**Access Control**: `onlyAdmin`  
**Returns**: `void`

Proposes new external chain station addresses for all protocols with a mandatory time delay for security. Note: **the current implementation sets the delay to `1 minute` (for testnet/dev convenience); in production this is expected to be a longer period (e.g., 1 day).**

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `externalChainStationAddress` | `address` | External station address for Hyperlane and LayerZero |
| `externalChainStationAddressString` | `string` | External station address for Axelar (string format) |

### Workflow

1. **One-Time Check**: Validates `fuseSetExternalChainAddress != 0x01` to ensure this is not initial setup
2. **Proposal Setup**: Creates `ChangeExternalChainAddressParams` with both address formats
3. **Time Lock**: Sets `timeToAccept = block.timestamp + 1 day` (or configured delay)

```solidity
externalChainAddressChangeProposal = ChangeExternalChainAddressParams({
    porposeAddress_AddressType: externalChainStationAddress,
    porposeAddress_StringType: externalChainStationAddressString,
    timeToAccept: block.timestamp + 1 minutes
});
```

## rejectProposalExternalChainAddress

**Function Type**: `external`  
**Function Signature**: `rejectProposalExternalChainAddress()`  
**Access Control**: `onlyAdmin`  
**Returns**: `void`

Cancels a pending external chain address change proposal.

### Workflow

Resets the proposal to default state:
```solidity
externalChainAddressChangeProposal = ChangeExternalChainAddressParams({
    porposeAddress_AddressType: address(0),
    porposeAddress_StringType: "",
    timeToAccept: 0
});
```

## acceptExternalChainAddress

**Function Type**: `external`  
**Function Signature**: `acceptExternalChainAddress()`  
**Access Control**: `public` (anyone can execute after time delay)  
**Returns**: `void`

Accepts pending external chain address changes and updates all protocol configurations.

### Workflow

1. **Time Validation**: Ensures `block.timestamp >= externalChainAddressChangeProposal.timeToAccept`
2. **Hyperlane Update**: Converts address to bytes32 and sets `hyperlane.externalChainStationAddress`
3. **LayerZero Update**: Converts address to bytes32 and sets `layerZero.externalChainStationAddress`
4. **Axelar Update**: Sets `axelar.externalChainStationAddress` using string format
5. **Peer Setup**: Calls `_setPeer()` to establish LayerZero peer relationship

## Governance Workflow

The complete process for changing external chain addresses:

1. **Propose**: Admin calls `proposeExternalChainAddress()` with new addresses
2. **Wait**: Mandatory time delay (typically 1 day) for security review
3. **Accept or Reject**: 
   - Anyone can call `acceptExternalChainAddress()` after delay
   - Admin can call `rejectProposalExternalChainAddress()` to cancel

## Protocol-Specific Address Formats

### Hyperlane & LayerZero
- **Input Format**: `address`
- **Stored Format**: `bytes32` (converted internally)
- **Usage**: Direct address representation for protocol routing

### Axelar
- **Format**: `string`
- **Usage**: Human-readable address for Axelar gateway calls
- **Example**: `"0x742d35Cc6634C0532925a3b8D43C1C16bE8c9123"`

## Security Considerations

### Time-Delayed Governance
- **Proposal Period**: 1-day delay provides time for community review
- **Cancellation**: Admin can reject proposals before acceptance
- **Public Execution**: Anyone can execute after delay expires

### Address Validation
- **Critical Setup**: Incorrect addresses will break cross-chain communication
- **Format Consistency**: Both address and string parameters must represent the same contract
- **One-Time Fuse**: `fuseSetExternalChainAddress` prevents certain re-configurations

## Usage Example

```solidity
// Step 1: Propose new external chain address
proposeExternalChainAddress(
    0x742d35Cc6634C0532925a3b8D43C1C16bE8c9123, // address format
    "0x742d35Cc6634C0532925a3b8D43C1C16bE8c9123"  // string format
);

// Step 2: Wait for time delay (1 day)
// ...

// Step 3: Accept the proposal
acceptExternalChainAddress();
```

:::warning[Critical Configuration]
This system establishes the foundation for all cross-chain communication. Incorrect addresses will result in failed transfers and potential loss of funds. Always verify external station deployment and address accuracy before proposing changes.
:::