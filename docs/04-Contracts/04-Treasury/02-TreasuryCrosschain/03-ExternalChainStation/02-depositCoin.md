---
sidebar_position: 2
---

# depositCoin

**Function Type**: `external payable`  
**Function Signature**: `depositCoin(address,uint256,bytes1)`  
**Returns**: `void`

Deposits native ETH and sends it to host chain via selected cross-chain protocol. The msg.value must cover both the deposit amount and protocol messaging fees.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `toAddress` | `address` | Recipient address for EVVM balance credit |
| `amount` | `uint256` | Amount of native coins to deposit |
| `protocolToExecute` | `bytes1` | Cross-chain protocol identifier (`0x01`, `0x02`, or `0x03`) |

## Protocol Identifiers

| Value | Protocol | Description |
|-------|----------|-------------|
| `0x01` | Hyperlane | Uses Hyperlane mailbox for cross-chain messaging |
| `0x02` | LayerZero | Uses LayerZero endpoint for omnichain transfers |
| `0x03` | Axelar | Uses Axelar gateway for decentralized cross-chain communication |

## Workflow

### 1. Input Validation
```solidity
if (amount == 0) revert ErrorsLib.DepositAmountMustBeGreaterThanZero();
```
Prevents zero-value deposits and ensures meaningful transaction amounts.

### 2. Payload Encoding
```solidity
bytes memory payload = PayloadUtils.encodePayload(address(0), toAddress, amount);
```
Creates standardized payload with `address(0)` representing native ETH using PayloadUtils library.

### 3. Protocol-Specific Cross-Chain Execution

#### Hyperlane (`0x01`)
```solidity
uint256 quote = IMailbox(hyperlane.mailboxAddress).quoteDispatch(
    hyperlane.hostChainStationDomainId,
    hyperlane.hostChainStationAddress,
    payload
);
if (msg.value < (amount + quote)) 
    revert ErrorsLib.InvalidDepositAmount();
    
IMailbox(hyperlane.mailboxAddress).dispatch{value: quote}(
    hyperlane.hostChainStationDomainId,
    hyperlane.hostChainStationAddress,
    payload
);
```
- **Quote Calculation**: Gets exact dispatch cost from Hyperlane mailbox
- **Total Validation**: `msg.value >= amount + quote` ensures sufficient funds
- **Fee Payment**: Uses precise quote for gas payment

#### LayerZero (`0x02`)
```solidity
MessagingFee memory fee = _quote(
    layerZero.hostChainStationEid,
    payload,
    options,
    false
);
if (msg.value < (amount + fee.nativeFee)) 
    revert ErrorsLib.InvalidDepositAmount();
    
_lzSend(
    layerZero.hostChainStationEid,
    payload,
    options,
    MessagingFee(fee.nativeFee, 0),
    msg.sender
);
```
- **Fee Quotation**: Calculates exact LayerZero V2 messaging costs
- **Balance Validation**: Ensures sufficient funds for deposit + messaging
- **Refund Mechanism**: LayerZero handles excess fee refunds automatically

#### Axelar (`0x03`)
```solidity
if (msg.value <= amount) 
    revert ErrorsLib.InvalidDepositAmount();
    
IAxelarGasService(axelar.gasServiceAddress).payNativeGasForContractCall{
    value: msg.value - amount
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
- **Fund Separation**: `msg.value > amount` ensures gas budget available
- **Gas Service Payment**: `msg.value - amount` allocated for cross-chain execution
- **Gateway Dispatch**: Routes message through Axelar's decentralized network

## Native Coin Handling

### Value Distribution
The `msg.value` serves dual purposes:
1. **Deposit Amount**: Actual ETH being bridged to EVVM ecosystem
2. **Protocol Fees**: Gas costs for cross-chain message execution

### Fee Structure by Protocol
- **Hyperlane**: `msg.value >= amount + quote` for precise fee calculation
- **LayerZero**: `msg.value >= amount + fee.nativeFee` with automatic refunds
- **Axelar**: `msg.value > amount` with remainder allocated to gas service

## Cross-Chain Message Processing

### Payload Structure
```solidity
bytes memory payload = PayloadUtils.encodePayload(address(0), toAddress, amount);
```
Uses standardized PayloadUtils with `address(0)` representing native ETH.

### Host Chain Processing
Upon successful cross-chain message delivery:
1. **Payload Decoding**: `PayloadUtils.decodePayload()` extracts `(address(0), toAddress, amount)`
2. **EVVM Integration**: `Evvm(evvmAddress).addAmountToUser(toAddress, address(0), amount)`
3. **Balance Update**: Recipient's EVVM balance reflects deposited native coins

## Gas Estimation

Before calling this function, estimate total required value:

### Hyperlane
```solidity
uint256 gasQuote = getQuoteHyperlane(toAddress, address(0), amount);
uint256 totalRequired = amount + gasQuote;
```

### LayerZero
```solidity
uint256 layerZeroFee = quoteLayerZero(toAddress, address(0), amount);
uint256 totalRequired = amount + layerZeroFee;
```

### Axelar
For Axelar, provide sufficient value to cover both deposit and gas service:
```solidity
uint256 totalRequired = amount + estimatedAxelarGas;
```

## Security Features

### Input Validation
- **Amount Check**: `ErrorsLib.DepositAmountMustBeGreaterThanZero()` prevents zero deposits
- **Balance Validation**: Protocol-specific checks ensure sufficient `msg.value`
- **Atomic Processing**: Deposit and cross-chain messaging happen atomically

### Cross-Chain Security
- **Message Authentication**: Each protocol validates sender authorization
- **Payload Integrity**: `PayloadUtils` ensures consistent data encoding
- **Native Asset Handling**: Standardized `address(0)` convention across protocols

## Error Conditions

| Error | Condition |
|-------|-----------|
| `DepositAmountMustBeGreaterThanZero()` | Amount parameter is zero |
| `InvalidDepositAmount()` | Insufficient `msg.value` for deposit + protocol fees |
| Protocol Revert | Unsupported `protocolToExecute` identifier |
| Cross-Chain Failure | Insufficient gas payment for selected protocol |

## Usage Examples

### Hyperlane Deposit
```solidity
// 1. Get gas quote
uint256 gasRequired = getQuoteHyperlane(recipientAddress, address(0), depositAmount);
uint256 totalValue = depositAmount + gasRequired;

// 2. Execute deposit
depositCoin{value: totalValue}(
    recipientAddress,
    depositAmount,
    0x01 // Hyperlane
);
```

### LayerZero Deposit
```solidity
// 1. Get fee quote
uint256 layerZeroFee = quoteLayerZero(recipientAddress, address(0), depositAmount);
uint256 totalValue = depositAmount + layerZeroFee;

// 2. Execute deposit
depositCoin{value: totalValue}(
    recipientAddress,
    depositAmount,
    0x02 // LayerZero
);
```

### Axelar Deposit
```solidity
// 1. Estimate total (deposit + gas)
uint256 totalValue = depositAmount + estimatedAxelarGas;

// 2. Execute deposit
depositCoin{value: totalValue}(
    recipientAddress,
    depositAmount,
    0x03 // Axelar
);
```

## Integration Flow

1. **External Chain**: User sends native coins to external station
2. **Value Split**: Coins divided between deposit amount and gas fees
3. **Cross-Chain**: Message sent to host chain station with deposit details
4. **Host Chain**: Host station credits EVVM balance with native coin equivalent
5. **EVVM**: Recipient can use deposited coins within EVVM ecosystem

:::warning[Sufficient Value Required]
Ensure `msg.value` covers both the deposit amount and cross-chain messaging fees. Each protocol has different gas requirements that must be satisfied for successful execution.
:::

:::info[Native Coin Representation]
Native coins are represented as `address(0)` in EVVM balances, consistent with the standard convention for native currency handling.
:::