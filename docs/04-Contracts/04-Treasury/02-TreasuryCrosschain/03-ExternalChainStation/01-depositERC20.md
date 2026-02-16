---
description: "Deposit ERC20 tokens to host chain via cross-chain protocols"
sidebar_position: 1
---

# depositERC20

**Function Type**: `external payable`  
**Function Signature**: `depositERC20(address,address,uint256,bytes1)`  
**Returns**: `void`

Deposits ERC20 tokens and sends them to host chain via selected cross-chain protocol. Supports Hyperlane, LayerZero, and Axelar protocols for reliable token bridging to EVVM ecosystem.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `toAddress` | `address` | Recipient address for EVVM balance credit |
| `token` | `address` | ERC20 token contract address (cannot be `address(0)`) |
| `amount` | `uint256` | Amount of tokens to deposit |
| `protocolToExecute` | `bytes1` | Cross-chain protocol identifier (`0x01`, `0x02`, or `0x03`) |

## Protocol Identifiers

| Value | Protocol | Description |
|-------|----------|-------------|
| `0x01` | Hyperlane | Uses Hyperlane mailbox for cross-chain messaging |
| `0x02` | LayerZero | Uses LayerZero endpoint for omnichain transfers |
| `0x03` | Axelar | Uses Axelar gateway for decentralized cross-chain communication |

## Workflow

### 1. Payload Encoding
```solidity
bytes memory payload = PayloadUtils.encodePayload(token, toAddress, amount);
```
Creates standardized cross-chain message payload using PayloadUtils library.

### 2. Token Transfer and Validation
```solidity
verifyAndDepositERC20(token, amount);
```
Internally verifies token approval and executes `transferFrom` to custody tokens in this contract.

### 3. Protocol-Specific Cross-Chain Execution

#### Hyperlane (`0x01`)
```solidity
uint256 quote = IMailbox(hyperlane.mailboxAddress).quoteDispatch(
    hyperlane.hostChainStationDomainId,
    hyperlane.hostChainStationAddress,
    payload
);
IMailbox(hyperlane.mailboxAddress).dispatch{value: quote}(
    hyperlane.hostChainStationDomainId,
    hyperlane.hostChainStationAddress,
    payload
);
```
- **Quote Calculation**: Gets exact dispatch cost from Hyperlane mailbox
- **Message Dispatch**: Sends encoded payload to host chain station
- **Gas Payment**: Uses quoted amount for precise fee payment

#### LayerZero (`0x02`)
```solidity
MessagingFee memory fee = _quote(
    layerZero.hostChainStationEid,
    payload,
    options,
    false
);
_lzSend(
    layerZero.hostChainStationEid,
    payload,
    options,
    MessagingFee(fee.nativeFee, 0),
    msg.sender
);
```
- **Fee Quotation**: Calculates exact LayerZero messaging costs
- **Omnichain Send**: Utilizes LayerZero V2 OApp framework
- **Refund Handling**: Excess fees automatically refunded to sender

#### Axelar (`0x03`)
```solidity
IAxelarGasService(axelar.gasServiceAddress).payNativeGasForContractCall{
    value: msg.value
}(
    address(this),
    axelar.hostChainStationChainName,
    axelar.hostChainStationAddress,
    payload,
    msg.sender
);
gateway().callContract(
    axelar.hostChainStationChainName,
    axelar.hostChainStationAddress,
    payload
);
```
- **Gas Service Payment**: Prepays execution gas via Axelar gas service
- **Gateway Routing**: Routes message through Axelar's decentralized gateway
- **Refund Management**: Gas refunds processed through Axelar's system

## Token Requirements

### ERC20 Transfer Process
The function uses an internal validation function for secure token transfers:
```solidity
verifyAndDepositERC20(token, amount);
```

This internally:
1. Verifies token is not `address(0)`
2. Checks user has approved this contract for the deposit amount
3. Executes `IERC20(token).transferFrom(msg.sender, address(this), amount)`

### Prerequisites
- **Token Approval**: Users must approve the External Chain Station contract for the deposit amount
- **Sufficient Balance**: User must have adequate token balance for the transfer
- **Valid Token**: Token contract must be a valid ERC20 implementation

## Cross-Chain Message Processing

### Payload Structure
```solidity
bytes memory payload = PayloadUtils.encodePayload(token, toAddress, amount);
```

### Host Chain Processing
Upon successful cross-chain message delivery:
1. **Payload Decoding**: `PayloadUtils.decodePayload()` extracts transfer parameters
2. **EVVM Integration**: `core.addAmountToUser(toAddress, token, amount)`  
3. **Balance Credit**: Recipient's EVVM balance immediately reflects the deposited tokens

## Gas Requirements

Users must provide sufficient native tokens (`msg.value`) to cover cross-chain messaging costs:

- **Hyperlane**: Mailbox dispatch fees
- **LayerZero**: Endpoint messaging fees
- **Axelar**: Gas service payments for execution

Use the respective quote functions to estimate required amounts:
- `getQuoteHyperlane(toAddress, token, amount)`
- `quoteLayerZero(toAddress, token, amount)`

## Security Features

### Input Validation
- **Token Address**: `verifyAndDepositERC20()` prevents `address(0)` deposits
- **Allowance Check**: Function reverts with `Error.InsufficientBalance()` if insufficient approval
- **Safe Transfer**: Standard `IERC20.transferFrom()` with approval verification
- **Protocol Support**: Validates supported protocol identifiers (0x01, 0x02, 0x03)

### Cross-Chain Security  
- **Message Authentication**: Each protocol validates sender and origin chain
- **Payload Integrity**: `PayloadUtils` ensures consistent encoding/decoding
- **Recipient Verification**: Direct address binding prevents misdirected funds

## Error Conditions

| Error | Condition |
|-------|-----------|
| `Error.InsufficientBalance()` | User hasn't approved sufficient tokens |
| Generic Revert | Token address is `address(0)` |
| Protocol Revert | Invalid `protocolToExecute` value |
| Insufficient Gas | `msg.value` doesn't cover cross-chain messaging costs |

## Usage Example

```solidity
// 1. Approve tokens
IERC20(tokenAddress).approve(externalChainStationAddress, depositAmount);

// 2. Get gas quote
uint256 gasRequired = getQuoteHyperlane(recipientAddress, tokenAddress, depositAmount);

// 3. Execute deposit
depositERC20{value: gasRequired}(
    recipientAddress,
    tokenAddress, 
    depositAmount,
    0x01 // Hyperlane
);
```

## Integration with EVVM

The deposit flow connects external chain assets to EVVM balances:

1. **External Chain**: User transfers ERC20 tokens to external station
2. **Cross-Chain**: Message sent to host chain station  
3. **Host Chain**: Host station receives message and credits EVVM balance
4. **EVVM**: Recipient can use tokens within the EVVM ecosystem

:::warning[Gas Payment Required]
Ensure sufficient native tokens are sent with the transaction to cover cross-chain messaging costs. Insufficient gas will cause transaction failure and potential token loss.
:::

:::info[ERC20 Approval Required]
Users must approve the external chain station contract before calling this function. The approval should cover at least the deposit amount.
:::