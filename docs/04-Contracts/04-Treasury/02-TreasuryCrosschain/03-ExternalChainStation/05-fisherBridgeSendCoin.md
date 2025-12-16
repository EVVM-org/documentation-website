---
sidebar_position: 5
---

# fisherBridgeSendCoin

**Function Type**: `external payable`  
**Function Signature**: `fisherBridgeSendCoin(address,address,uint256,uint256,bytes)`  
**Access Control**: `onlyFisherExecutor`  
**Returns**: `void`

Facilitates native coin deposits from external chain to EVVM through the fisher bridge system. This function validates user signatures, accepts native currency payments, and emits events for cross-chain processing coordination.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `address` | User initiating the deposit from external chain |
| `addressToReceive` | `address` | Recipient address for EVVM balance credit |
| `priorityFee` | `uint256` | Fee amount paid to the fisher executor |
| `amount` | `uint256` | Amount of native coins to deposit to EVVM |
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

### 1. Signature Verification
```solidity
if (!SignatureUtils.verifyMessageSignedForFisherBridge(
    from,
    addressToReceive,
    nextFisherExecutionNonce[from],
    address(0), // Native coins represented as address(0)
    priorityFee,
    amount,
    signature
)) revert ErrorsLib.InvalidSignature();
```

:::info

For more information about the signature structure, refer to the [Fisher Bridge Signature Structure](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md).

:::

Note: Native coins are represented as `address(0)` in the signature.

### 2. Payment Validation
```solidity
if (msg.value != amount + priorityFee)
    revert ErrorsLib.InsufficientBalance();
```

Ensures the fisher executor sends exactly the required amount:
- `amount`: Native coins for deposit to EVVM
- `priorityFee`: Fee paid to the fisher executor

### 3. Nonce Management
```solidity
nextFisherExecutionNonce[from]++;
```
Increments the user's execution nonce to prevent replay attacks.

### 4. Event Emission
```solidity
emit FisherBridgeSend(
    from,
    addressToReceive,
    address(0), // Native coins
    priorityFee,
    amount,
    nextFisherExecutionNonce[from] - 1
);
```

Emits event with transfer details for cross-chain coordination.

## Native Coin Handling

### Payment Structure
The `msg.value` must equal the sum of:
- **Deposit Amount**: Native coins to be credited in EVVM
- **Priority Fee**: Compensation for the fisher executor

### Value Validation
```solidity
Total Required = amount + priorityFee
msg.value must equal Total Required
```

Unlike ERC20 deposits, native coin deposits require exact payment matching.

## Event Definition

```solidity
event FisherBridgeSend(
    address indexed from,
    address indexed addressToReceive,
    address indexed tokenAddress, // address(0) for native coins
    uint256 priorityFee,
    uint256 amount,
    uint256 nonce
);
```

### Event Parameters
- `from`: User who authorized the deposit (indexed)
- `addressToReceive`: Recipient on EVVM (indexed)
- `tokenAddress`: `address(0)` for native coins (indexed)
- `priorityFee`: Fee paid to fisher executor
- `amount`: Native coin deposit amount
- `nonce`: Execution nonce used for this transaction

## Cross-Chain Processing

### Host Chain Coordination
1. **Event Monitoring**: Host chain services monitor for `FisherBridgeSend` events with `tokenAddress == address(0)`
2. **Native Coin Recognition**: Identify native coin deposits by zero address
3. **EVVM Credit**: Host chain station credits `addressToReceive` with `amount` of native coins
4. **Fee Handling**: Priority fee management through EVVM balance system

### Signature Consistency
The signature format includes `address(0)` for native coins, ensuring consistency between external and host chain validation.

## Fisher Bridge Benefits

### For Users
- **Gasless Deposits**: Users don't pay gas fees on external chain
- **Direct Payment**: Simple native currency payment to fisher
- **Signature Authorization**: Single signature authorizes the deposit

### For Fisher Executors
- **Priority Fees**: Earn fees in native currency
- **Direct Payment**: Receive both deposit and fee in single transaction
- **Service Revenue**: Generate income from cross-chain deposit facilitation

## Security Features

### Signature Security
- **EIP-191 Standard**: Uses Ethereum's signed message standard (see [signature format](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md))
- **Native Coin Identifier**: `address(0)` clearly identifies native coin deposits
- **Replay Protection**: Nonce-based prevention of signature reuse
- **Parameter Binding**: Signature tied to specific deposit parameters

### Payment Security
- **Exact Value Matching**: Requires precise payment amount
- **Atomic Operation**: Payment and validation in single transaction
- **Fee Transparency**: Clear separation of deposit amount and priority fee

### Access Control
- **Fisher Authorization**: Only authorized executors can accept deposits
- **Signature Validation**: Cryptographic proof of user consent required (see [signature format](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md))

## Error Conditions

| Error | Condition |
|-------|-----------|
| `InvalidSignature` | Signature verification fails |
| `InsufficientBalance` | `msg.value != amount + priorityFee` |
| Access Control Revert | Called by unauthorized address |

## Usage Flow

1. **User Intent**: User wants to deposit native coins to EVVM
2. **Signature Creation**: User signs authorization message with deposit details
3. **Fisher Payment**: Fisher sends `amount + priorityFee` in native currency
4. **Fisher Execution**: Fisher calls `fisherBridgeSendCoin` with signature
5. **Validation**: Function validates signature and payment amount
6. **Event Emission**: Event emitted for cross-chain coordination
7. **Cross-Chain**: Host chain services process the deposit to EVVM
8. **Balance Credit**: Recipient receives native coins in EVVM balance

## Payment Example

For a deposit of 1 ETH with 0.01 ETH priority fee:

```solidity
fisherBridgeSendCoin{value: 1.01 ether}(
    userAddress,
    recipientAddress, 
    0.01 ether, // priorityFee
    1 ether,    // amount
    signature
);
```

Result:
- **External Station**: Receives 1.01 ETH
- **EVVM Credit**: Recipient gets 1 ETH balance
- **Fisher Fee**: 0.01 ETH compensation

## Integration Requirements

### Off-Chain Services
- **Event Monitoring**: Listen for `FisherBridgeSend` events with `address(0)`
- **Native Coin Processing**: Handle native currency cross-chain transfers
- **Nonce Synchronization**: Maintain coordination with host chain

### Payment Coordination
- **User-Fisher Agreement**: Establish terms for deposit and fee amounts
- **Payment Verification**: Ensure correct value transmission
- **Cross-Chain Messaging**: Coordinate with host chain for EVVM crediting

:::warning[Exact Payment Required]
The fisher executor must send exactly `amount + priorityFee` in native currency. Any deviation will cause transaction failure.
:::

:::info[Native Coin Representation]
Native coins are consistently represented as `address(0)` throughout the system, from signature creation to EVVM balance crediting.
:::