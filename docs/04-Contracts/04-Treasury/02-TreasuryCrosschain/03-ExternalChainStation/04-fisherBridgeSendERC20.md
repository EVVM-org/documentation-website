---
sidebar_position: 4
---

# fisherBridgeSendERC20

**Function Type**: `external`  
**Function Signature**: `fisherBridgeSendERC20(address,address,address,uint256,uint256,uint256,bytes)`  
**Access Control**: `onlyFisherExecutor`  
**Returns**: `void`

Processes Fisher bridge ERC20 token transfers to host chain. Validates signature using asyncNonce system, deposits tokens, and emits tracking event for cross-chain coordination.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `address` | User initiating the deposit from external chain |
| `addressToReceive` | `address` | Recipient address for EVVM balance credit |
| `tokenAddress` | `address` | ERC20 token contract address |
| `priorityFee` | `uint256` | Fee amount paid to the fisher executor |
| `amount` | `uint256` | Amount to deposit to EVVM |
| `nonce` | `uint256` | User-managed sequential nonce for replay protection |
| `signature` | `bytes` | Cryptographic signature ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)) from the `from` address authorizing this deposit. |

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

Checks if nonce has already been used. The External Chain Station uses `asyncNonce[from][nonce]` mapping instead of Core.sol's nonce system.

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

### 3. Token Transfer
```solidity
// Implementation calls:
verifyAndDepositERC20(tokenAddress, amount);

// Internally:
// if (token == address(0)) revert();
// if (IERC20(token).allowance(msg.sender, address(this)) < amount)
//     revert ErrorsLib.InsufficientBalance();
// IERC20(token).transferFrom(msg.sender, address(this), amount);
```

Transfers the deposit `amount` from the user to the contract using `transferFrom` (the implementation validates allowance and performs `transferFrom`). **Note:** the `priorityFee` is not transferred here — it is represented in the emitted event and will be credited to the fisher executor on the host chain when the message is processed.

### 4. Mark Nonce as Used
```solidity
asyncNonce[from][nonce] = true;
```
Marks this nonce as consumed to prevent replay attacks.

### 5. Event Emission
```solidity
emit FisherBridgeSend(
    from,
    addressToReceive,
    tokenAddress,
    priorityFee,
    amount,
    nonce
);
```

Emits event with transfer details for cross-chain coordination.

## Token Requirements

### ERC20 Approval
Before the fisher executor can call this function, the user must approve the external chain station:
```solidity
IERC20(tokenAddress).approve(externalChainStationAddress, amount);
```

### Transfer Validation
The function validates and executes the token transfer:
```solidity
function verifyAndDepositERC20(address token, uint256 amount) internal {
    if (token == address(0)) revert();
    if (IERC20(token).allowance(msg.sender, address(this)) < amount)
        revert Error.InsufficientBalance();
    
    IERC20(token).transferFrom(msg.sender, address(this), amount);
}
```

## Event Definition

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

### Event Parameters
- `from`: User who authorized the deposit (indexed)
- `addressToReceive`: Recipient on EVVM (indexed)
- `tokenAddress`: ERC20 token being deposited (indexed)
- `priorityFee`: Fee paid to fisher executor
- `amount`: Deposit amount
- `nonce`: Execution nonce used for this transaction

## Cross-Chain Processing

The emitted event serves as a signal for cross-chain operations:

### Host Chain Coordination
1. **Event Monitoring**: Host chain services monitor for `FisherBridgeSend` events
2. **Message Creation**: Create cross-chain message with event parameters
3. **EVVM Credit**: Host chain station credits `addressToReceive` with `amount`
4. **Fee Handling**: Priority fee management through EVVM balance system

### Signature Synchronization
The same signature used here should be processable by the host chain station's `fisherBridgeReceive` function for coordination.

## Fisher Bridge Benefits

### For Users
- **Gasless Deposits**: Fisher pays gas fees on external chain
- **Simplified UX**: Single signature authorizes the entire flow
- **Flexible Recipients**: Can specify different EVVM recipient addresses

### For Fisher Executors
- **Priority Fees**: Earn fees for facilitating deposits
- **Token Custody**: Temporary custody of tokens before cross-chain transfer
- **Service Provision**: Enable cross-chain deposit services

## Security Features

### Signature Security
- **EIP-191 Standard**: Uses Ethereum's signed message standard (see [signature format](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md))
- **SignatureRecover**: Uses `SignatureRecover.recoverSigner()` to validate signatures
- **AdvancedStrings**: Payload built with `AdvancedStrings.buildSignaturePayload()`
- **Replay Protection**: `asyncNonce` mapping prevents signature reuse
- **Parameter Binding**: Signature tied to specific transfer parameters

### Token Security
- **Allowance Validation**: Ensures sufficient approval before transfer
- **Transfer Verification**: Uses standard ERC20 `transferFrom` with revert on failure
- **Address Validation**: Rejects zero address for token parameter

### Access Control
- **Fisher Authorization**: Only authorized executors can initiate deposits
- **Signature Validation**: Requires valid user signature for each transaction (see [signature format](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md))

## Error Conditions

| Error | Condition |
|-------|-----------|  
| `CoreError.AsyncNonceAlreadyUsed()` | Nonce has already been used for this user |
| `CoreError.InvalidSignature()` | Signature verification fails |
| `Error.InsufficientBalance()` | Insufficient ERC20 allowance |
| ERC20 Transfer Failure | Token transfer reverts (insufficient balance, paused token, etc.) |
| Access Control Revert | Called by unauthorized address |

## Usage Flow

1. **User Approval**: User approves external chain station for token spending
2. **Signature Creation**: User signs authorization message with deposit details
3. **Fisher Execution**: Authorized fisher calls `fisherBridgeSendERC20`
4. **Validation**: Function validates signature and transfers tokens
5. **Event Emission**: Event emitted for cross-chain coordination
6. **Cross-Chain**: Host chain services process the deposit to EVVM
7. **Balance Credit**: Recipient receives tokens in EVVM balance

## Integration Requirements

### Off-Chain Services
- **Event Monitoring**: Listen for `FisherBridgeSend` events
- **Cross-Chain Messaging**: Send deposit instructions to host chain
- **Nonce Tracking**: Track used nonces in `asyncNonce[from][nonce]` mapping

### Token Handling
- **Custody Management**: External station holds tokens until cross-chain processing
- **Transfer Coordination**: Ensure tokens reach correct EVVM balances
- **Fee Distribution**: Handle priority fee allocation

:::warning[Token Approval Required]
Users must approve the external chain station contract before fishers can execute deposits. Insufficient allowance will cause transaction failure.
:::

:::info[Cross-Chain Coordination]
This function initiates the deposit process but requires off-chain services to complete the cross-chain transfer and EVVM balance crediting.
:::