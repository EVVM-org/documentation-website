---
description: "Receives and validates Fisher bridge transactions from host chain on external chains"
sidebar_position: 3
---

# fisherBridgeReceive

**Function Type**: `external`  
**Function Signature**: `fisherBridgeReceive(address,address,address,uint256,uint256,uint256,bytes)`  
**Access Control**: `onlyFisherExecutor`  
**Returns**: `void`

Receives and validates Fisher bridge transactions from host chain. Verifies EIP-191 signature using asyncNonce system (independent from Core.sol) and marks nonce as used to prevent replay attacks.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `address` | Original sender on the host chain (user requesting withdrawal) |
| `addressToReceive` | `address` | Recipient address on the external chain |
| `tokenAddress` | `address` | Token contract address or `address(0)` for native coin |
| `priorityFee` | `uint256` | Fee amount paid to the fisher executor |
| `amount` | `uint256` | Amount to transfer to the recipient |
| `nonce` | `uint256` | User-managed sequential nonce for replay protection |
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

### 1. Nonce Validation
```solidity
if (asyncNonce[from][nonce]) revert CoreError.AsyncNonceAlreadyUsed();
```

Checks if nonce has already been used. The External Chain Station uses `asyncNonce[from][nonce]` mapping instead of Core.sol's nonce system (which doesn't exist on external chains).

### 2. Signature Verification
```solidity
if (
    SignatureRecover.recoverSigner(
        AdvancedStrings.buildSignaturePayload(
            evvmID,
            hostChainAddress.currentAddress,
            Hash.hashDataForFisherBridge(
                addressToReceive,
                tokenAddress,
                priorityFee,
                amount
            ),
            fisherExecutor.current,
            nonce,
            true
        ),
        signature
    ) != from
) revert CoreError.InvalidSignature();
```

Validates EIP-191 signature by recovering the signer and comparing to `from` address. Uses `SignatureRecover.recoverSigner()` with payload built by `AdvancedStrings.buildSignaturePayload()`.

### 3. Mark Nonce as Used
```solidity
asyncNonce[from][nonce] = true;
```
Marks this nonce as consumed to prevent replay attacks.

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
The External Chain Station uses an independent `asyncNonce[from][nonce]` mapping:
- **NOT Core.sol**: External chains don't have Core.sol, so this is a separate nonce system
- **User-Managed**: Each user maintains their own sequential nonces
- **Replay Protection**: Once `asyncNonce[from][nonce]` is true, that signature cannot be reused
- **Coordination**: Both host and external chain stations mark the same nonce as used

## Security Features

### Signature Security
- **EIP-191 Compliance**: Standard Ethereum signed message format
- **SignatureRecover**: Uses `SignatureRecover.recoverSigner()` to validate signatures
- **AdvancedStrings**: Payload built with `AdvancedStrings.buildSignaturePayload()`
- **Replay Protection**: `asyncNonce` mapping prevents signature reuse
- **User Authorization**: Cryptographic proof of user consent
- **Address Binding**: Signature tied to specific sender address

### Access Control
- **Fisher Authorization**: Only authorized executors can validate signatures
- **Distributed Validation**: Same signature validates on both chains

### Nonce Management
- **AsyncNonce System**: Uses `asyncNonce[from][nonce]` mapping (NOT Core.sol)
- **Independent System**: External Chain doesn't have Core.sol
- **Mark as Used**: Sets `asyncNonce[from][nonce] = true` after validation
- **Per-User Tracking**: Individual nonce tracking for each user

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
| `CoreError.AsyncNonceAlreadyUsed()` | Nonce has already been used for this user |
| `CoreError.InvalidSignature()` | Signature verification fails |
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

:::warning[AsyncNonce System]
The External Chain Station uses `asyncNonce[from][nonce]` mapping instead of Core.sol's nonce system. This is because Core.sol doesn't exist on external chains. Users must manage their own sequential nonces, and each nonce can only be used once.
:::