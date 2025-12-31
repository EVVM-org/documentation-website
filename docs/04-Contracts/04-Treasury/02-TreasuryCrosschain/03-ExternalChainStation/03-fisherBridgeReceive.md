---
sidebar_position: 3
---

# fisherBridgeReceive

**Function Type**: `external`  
**Function Signature**: `fisherBridgeReceive(address,address,address,uint256,uint256,bytes)`  
**Access Control**: `onlyFisherExecutor`  
**Returns**: `void`

Receives and validates Fisher bridge transactions from host chain. Verifies EIP-191 signature and increments nonce but doesn't transfer tokens (validation-only function for external chain).

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `address` | Original sender on the host chain (user requesting withdrawal) |
| `addressToReceive` | `address` | Recipient address on the external chain |
| `tokenAddress` | `address` | Token contract address or `address(0)` for native coin |
| `priorityFee` | `uint256` | Fee amount paid to the fisher executor |
| `amount` | `uint256` | Amount to transfer to the recipient |
| `signature` | `bytes` | Cryptographic signature ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)) from the `from` address authorizing this transaction. |

## Access Control

```solidity
modifier onlyFisherExecutor() {
    if (msg.sender != fisherExecutor.current) {
        revert();
    }
    _;
}
```

Only addresses with the current `fisherExecutor` role can call this function.

## Workflow

### 1. Signature Verification
```solidity
if (!SignatureUtils.verifyMessageSignedForFisherBridge(
    EVVM_ID,
    from,
    addressToReceive,
    nextFisherExecutionNonce[from],
    tokenAddress,
    priorityFee,
    amount,
    signature
)) revert ErrorsLib.InvalidSignature();
```

Validates EIP-191 signature with EVVM ID integration using structured message format: `"{EVVM_ID},fisherBridge,{addressToReceive},{nonce},{tokenAddress},{priorityFee},{amount}"`.

### 2. Nonce Increment
```solidity
nextFisherExecutionNonce[from]++;
```
Increments Fisher bridge nonce to prevent replay attacks across cross-chain operations.

## Validation-Only Function

This function serves as a validation endpoint and **does not perform token transfers**. Its purpose:

1. **Signature Validation**: Cryptographically verifies user authorization for Fisher bridge operations
2. **Nonce Management**: Tracks sequential nonces to prevent replay attacks
3. **Access Control**: Ensures only authorized Fisher executors can validate transactions
4. **Cross-Chain Coordination**: Provides secure validation for off-chain Fisher bridge processes

**Note**: Actual token transfers on the external chain must be handled by separate Fisher bridge mechanisms that coordinate with this validation system.

## Signature Message Format

:::info

For more information about the signature structure, refer to the [Fisher Bridge Signature Structure](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md).

:::

## Fisher Bridge Architecture

### Cross-Chain Coordination
1. **Host Chain**: User authorizes withdrawal via `fisherBridgeSend`
2. **Event Emission**: Host chain emits `FisherBridgeSend` event
3. **External Chain**: Fisher executor calls `fisherBridgeReceive` with same signature
4. **Validation**: External station validates signature and nonce
5. **Execution**: Off-chain services execute the actual token transfer

### Nonce Synchronization
Both host and external chain stations maintain synchronized nonce counters:
- **Host Chain**: Increments nonce in `fisherBridgeSend`
- **External Chain**: Increments nonce in `fisherBridgeReceive`
- **Coordination**: Both must use the same nonce value for signature validation

## Security Features

### Signature Security
- **EIP-191 Compliance**: Standard Ethereum signed message format
- **Replay Protection**: Nonce-based prevention of signature reuse
- **User Authorization**: Cryptographic proof of user consent
- **Address Binding**: Signature tied to specific sender address

### Access Control
- **Fisher Authorization**: Only authorized executors can validate signatures
- **Distributed Validation**: Same signature validates on both chains

### Nonce Management
- **Sequential Increment**: Nonces increase monotonically
- **Per-User Tracking**: Individual nonce counters for each user
- **Cross-Chain Sync**: Coordination between host and external chains

## Integration with External Services

Since this function only validates signatures, external services must:

### Monitor Host Chain Events
```solidity
event FisherBridgeSend(
    address indexed from,
    address indexed addressToReceive,
    address indexed tokenAddress,
    uint256 priorityFee,
    uint256 amount,
    uint256 nonce
);
```

### Execute Token Transfers
Based on validated parameters:
- **Native Coins**: Transfer `amount` of native currency to `addressToReceive`
- **ERC20 Tokens**: Transfer `amount` of `tokenAddress` tokens to `addressToReceive`
- **Priority Fees**: Handle fee distribution to fisher executor

### Error Handling
- **Signature Validation**: Use this function to verify user authorization (see [signature format](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md))
- **Nonce Tracking**: Ensure nonce synchronization with host chain
- **Transfer Validation**: Verify successful token transfers

## Error Conditions

| Error | Condition |
|-------|-----------|
| `InvalidSignature()` | Signature verification fails |
| Access Control Revert | Called by unauthorized address (not current fisher executor) |

## Usage Flow

1. **Host Chain**: User calls `fisherBridgeSend` with signature
2. **Event Monitoring**: External services detect `FisherBridgeSend` event
3. **Signature Validation**: Fisher calls `fisherBridgeReceive` with same parameters
4. **Nonce Increment**: External station increments user's nonce
5. **Token Transfer**: External services execute actual transfer
6. **Fee Distribution**: Priority fees handled by external coordination

## Coordination Requirements

For proper fisher bridge operation:

### Signature Consistency
- Same signature used on both host and external chains
- Identical parameter values across chains
- Synchronized nonce values

### Service Integration
- Off-chain monitoring of host chain events
- External token transfer execution
- Priority fee distribution mechanisms
- Error handling and retry logic

:::info[Off-chain Coordination Required]
This function only validates signatures and manages nonces. Actual token transfers on the external chain require off-chain services that coordinate between the validation and execution steps.
:::

:::warning[Nonce Synchronization Critical]
Nonce values must remain synchronized between host and external chain stations. Mismatched nonces will cause signature validation failures and break the fisher bridge system.
:::