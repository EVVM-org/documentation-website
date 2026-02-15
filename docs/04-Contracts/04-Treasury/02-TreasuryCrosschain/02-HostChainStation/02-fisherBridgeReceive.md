---
sidebar_position: 2
---

# fisherBridgeReceive

**Function Type**: `external`  
**Function Signature**: `fisherBridgeReceive(address,address,address,uint256,uint256,bytes)`  
**Access Control**: `onlyFisherExecutor`  
**Returns**: `void`

Receives Fisher bridge transactions from external chain and credits EVVM balances. Verifies EIP-191 signature, increments nonce, and adds balance to recipient and executor for priority fees.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `from` | `address` | Original sender on the external chain |
| `addressToReceive` | `address` | Recipient address for the EVVM balance credit |
| `tokenAddress` | `address` | Token contract address or `address(0)` for native coin |
| `priorityFee` | `uint256` | Fee amount paid to the fisher executor |
| `amount` | `uint256` | Amount to credit to the recipient's EVVM balance |
| `signature` | `bytes` | Cryptographic signature ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)) from the `from` address authorizing this transaction. |

## Access Control

This function can only be called by addresses with the `fisherExecutor` role:

```solidity
modifier onlyFisherExecutor() {
    if (msg.sender != fisherExecutor.current) {
        revert();
    }
    _;
}
```

## Workflow

### 1. Signature Verification
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

### 2. EVVM Balance Updates

#### Recipient Credit
```solidity
core.addAmountToUser(addressToReceive, tokenAddress, amount);
```
Adds the transfer amount to recipient's EVVM balance via core contract integration.

#### Fisher Executor Fee
```solidity
if (priorityFee > 0)
    core.addAmountToUser(msg.sender, tokenAddress, priorityFee);
```
Credits priority fee to Fisher executor's EVVM balance as processing incentive.

## Signature Message Format

:::info

For more information about the signature structure, refer to the [Fisher Bridge Signature Structure](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md).

:::

## EVVM Integration

The function directly integrates with the EVVM core contract for balance management:

```solidity
core.addAmountToUser(addressToReceive, tokenAddress, amount);
```

This provides:
- **Direct Balance Credit**: Adds tokens to user's EVVM virtual balance
- **Token Type Support**: Handles both ERC20 tokens and native ETH (address(0))
- **Atomic Operations**: Ensures consistent state between Treasury and EVVM core
- **Fee Distribution**: Separates user funds from Fisher executor incentives
- **Nonce Management**: Core contract validates and consumes nonces to prevent replay attacks

## Security Features

- **Fisher Executor Authorization**: `onlyFisherExecutor` modifier restricts function access
- **EIP-191 Signature Verification**: Structured message format with EVVM ID binding
- **Nonce-Based Replay Protection**: Sequential nonce tracking per user address
- **EVVM ID Integration**: Cross-instance security through unique identifiers
- **Balance Segregation**: Separate handling of transfer amount and priority fees

## Cross-Chain Flow

1. **External Chain**: User initiates Fisher bridge transaction with signature
2. **Fisher Monitoring**: Fisher executor captures transaction from external station
3. **Host Chain Processing**: This function validates and credits EVVM balances
4. **Balance Availability**: Tokens immediately available in user's EVVM account
    }
}
```

## Fisher Bridge Benefits

### For Users
- **Gasless Transactions**: Users don't need native tokens on the host chain
- **Flexible Recipients**: Can specify different recipient addresses
- **Signature-based Authorization**: Secure consent without direct interaction

### For Fisher Executors
- **Priority Fees**: Earn fees for facilitating transfers
- **Batch Processing**: Can process multiple transfers efficiently
- **Automated Operations**: Enable programmatic cross-chain services

## Security Features

### Signature Security
- **EIP-191 Standard**: Uses Ethereum's signed message standard (see [signature format](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md))
- **Replay Protection**: Nonce-based prevention of signature reuse
- **Address Binding**: Signature tied to specific sender address

### Access Control
- **Fisher Authorization**: Only authorized executors can call the function
- **Signature Validation**: Cryptographic proof of user consent required (see [signature format](../../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md))

### Balance Management
- **Direct EVVM Integration**: Secure balance updates through authorized treasury functions
- **Atomic Operations**: Balance credits are processed atomically

## Error Conditions

| Error | Condition |
|-------|-----------|
| `InvalidSignature()` | Signature verification fails |
| Access Control Revert | Called by unauthorized address (not current fisher executor) |

## Usage Example

A typical fisher bridge receive flow:

1. User signs a message on external chain authorizing the transfer
2. Fisher executor receives the signature and transfer details
3. Fisher calls `fisherBridgeReceive` with the signature and transfer parameters
4. Function validates signature and credits EVVM balances
5. User receives tokens in EVVM, fisher receives priority fee (if applicable)

:::info[Fisher Executor Management]
Fisher executors are managed through a time-delayed governance system. See [Admin Functions](./05-AdminFunctions.md) for details on executor management.
:::