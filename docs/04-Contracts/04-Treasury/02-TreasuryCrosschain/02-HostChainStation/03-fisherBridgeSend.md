---
sidebar_position: 3
---

# fisherBridgeSend

**Function Type**: `external`  
**Function Signature**: `fisherBridgeSend(address,address,address,uint256,uint256,bytes)`  
**Access Control**: `onlyFisherExecutor`  
**Returns**: `void`

Processes Fisher bridge token transfers from host to external chain. Validates balance and signature, deducts from sender, pays executor fee, and emits event for external chain processing.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `address` | User initiating the withdrawal from EVVM |
| `addressToReceive` | `address` | Recipient address on the external chain |
| `tokenAddress` | `address` | Token contract address or `address(0)` for native coin |
| `priorityFee` | `uint256` | Fee amount paid to the fisher executor |
| `amount` | `uint256` | Amount to withdraw from user's EVVM balance |
| `signature` | `bytes` | Cryptographic signature ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)) from the `from` address authorizing this withdrawal. |

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

### 1. Principal Token Protection
```solidity
if (tokenAddress == core.getEvvmMetadata().principalTokenAddress)
    revert Error.PrincipalTokenIsNotWithdrawable();
```
Prevents withdrawal of Principal Token (MATE) to protect ecosystem integrity.

### 2. Balance Validation
```solidity
if (core.getBalance(from, tokenAddress) < amount)
    revert Error.InsufficientBalance();
```
Verifies user has sufficient EVVM balance for the withdrawal amount (note: priority fee is deducted separately).

### 3. Signature Verification
```solidity
core.validateAndConsumeNonce(
    from,
    Hash.hashDataForFisherBridge(
        addressToReceive,
        tokenAddress,
        priorityFee,
        amount
    ),
    fisherExecutor.current,
    nonce,
    true,
    signature
);
```

Validates EIP-191 signature using Core contract's nonce system. The hash is generated using `TreasuryCrossChainHashUtils.hashDataForFisherBridge()` with the transaction parameters. The `async: true` parameter indicates this uses a separate nonce system from regular EVVM operations.

### 4. EVVM Balance Operations

#### User Balance Deduction
```solidity
core.removeAmountFromUser(from, tokenAddress, amount + priorityFee);
```
Deducts total amount (transfer + fee) from user's EVVM balance.

#### Fisher Executor Fee
```solidity
if (priorityFee > 0)
    core.addAmountToUser(msg.sender, tokenAddress, priorityFee);
```
Credits priority fee to Fisher executor's EVVM balance as processing incentive.

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

Emits an event containing all transfer details for external chain monitoring and processing.

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
- `from`: User who initiated the withdrawal (indexed)
- `addressToReceive`: Recipient on external chain (indexed)  
- `tokenAddress`: Token being withdrawn (indexed)
- `priorityFee`: Fee paid to fisher executor
- `amount`: Withdrawal amount
- `nonce`: Execution nonce used for this transaction

## External Chain Processing

The emitted event serves as a signal for external chain operations. The corresponding external chain station or fisher services should:

1. Monitor for `FisherBridgeSend` events
2. Extract transfer details from event parameters
3. Execute the actual token transfer on the external chain
4. Transfer `amount` of `tokenAddress` to `addressToReceive`

## Security Features

### Signature Security
- **EIP-191 Compliance**: Standard Ethereum signed message format
- **Nonce Protection**: Prevents signature replay attacks
- **User Authorization**: Cryptographic proof of user consent

### Balance Protection
- **Principal Token Guard**: Prevents withdrawal of ecosystem's core token
- **Sufficient Balance Check**: Validates user has adequate funds
- **Atomic Operations**: Balance updates are processed atomically

### Access Control
- **Fisher Authorization**: Only current fisher executor can initiate withdrawals
- **Signature Validation**: Requires valid user signature for each transaction (see [signature format](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md))

## Fee Structure

The priority fee mechanism incentivizes fisher executors:
- **User Pays**: Total debit of `amount + priorityFee` from user balance
- **Fisher Receives**: Priority fee credited to executor's EVVM balance
- **Net Transfer**: User receives `amount` on external chain

## Error Conditions

| Error | Condition |
|-------|-----------|
| `PrincipalTokenIsNotWithdrawable()` | Attempting to withdraw principal token |
| `InsufficientBalance()` | User lacks sufficient EVVM balance |
| `InvalidSignature()` | Signature verification fails |
| Access Control Revert | Called by unauthorized address |

## Usage Flow

1. **User Intent**: User wants to withdraw tokens from EVVM to external chain
2. **Signature Creation**: User signs withdrawal authorization message
3. **Fisher Execution**: Authorized fisher calls `fisherBridgeSend` with signature
4. **Validation**: Function validates signature and user balance
5. **Balance Update**: EVVM balances updated (user debited, fisher credited fee)
6. **Event Emission**: Event emitted for external chain processing
7. **External Transfer**: External services process the actual token transfer

:::warning[Off-chain Coordination Required]
This function only updates EVVM balances and emits events. The actual token transfer on the external chain must be handled by off-chain services monitoring these events.
:::