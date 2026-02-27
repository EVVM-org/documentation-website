---
description: "Withdraw tokens from EVVM balance and bridge them to external chains via cross-chain protocols"
sidebar_position: 1
---

# withdraw

**Function Type**: `external payable`  
**Function Signature**: `withdraw(address,address,uint256,bytes1)`  
**Returns**: `void`

Withdraws tokens from EVVM balance and sends them to external chain via selected cross-chain protocol. This function validates balance, deducts from EVVM, and bridges via Hyperlane, LayerZero, or Axelar protocols.

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `toAddress` | `address` | Recipient address on the external chain |
| `token` | `address` | Token contract address or `address(0)` for native coin |
| `amount` | `uint256` | Amount to withdraw |
| `protocolToExecute` | `bytes1` | Cross-chain protocol identifier (`0x01`, `0x02`, or `0x03`) |

## Protocol Identifiers

| Value | Protocol | Description |
|-------|----------|-------------|
| `0x01` | Hyperlane | Uses Hyperlane mailbox for cross-chain messaging |
| `0x02` | LayerZero | Uses LayerZero endpoint for omnichain transfers |
| `0x03` | Axelar | Uses Axelar gateway for decentralized cross-chain communication |

## Workflow

### Initial Validations
1. **Principal Token Protection**: Validates token is not the Principal Token (MATE) using `core.getEvvmMetadata().principalTokenAddress`. Reverts with `Error.PrincipalTokenIsNotWithdrawable()` if attempted.
2. **Balance Verification**: Confirms user has sufficient EVVM balance using `core.getBalance(msg.sender, token)`. Reverts with `Error.InsufficientBalance()` if insufficient.
3. **EVVM Balance Deduction**: Calls `core.removeAmountFromUser(msg.sender, token, amount)` to deduct from user's virtual balance.

### Protocol-Specific Execution

#### Hyperlane (`0x01`)
```solidity
bytes memory payload = PayloadUtils.encodePayload(token, toAddress, amount);
uint256 quote = IMailbox(hyperlane.mailboxAddress).quoteDispatch(
    hyperlane.externalChainStationDomainId,
    hyperlane.externalChainStationAddress,
    payload
);
IMailbox(hyperlane.mailboxAddress).dispatch{value: quote}(
    hyperlane.externalChainStationDomainId,
    hyperlane.externalChainStationAddress,
    payload
);
```
- **Payload Encoding**: Uses `PayloadUtils.encodePayload()` for standardized message format
- **Quote Calculation**: Gets exact dispatch cost via `IMailbox.quoteDispatch()`
- **Message Dispatch**: Sends to external station via Hyperlane mailbox with proper gas payment

#### LayerZero (`0x02`)
```solidity
bytes memory payload = PayloadUtils.encodePayload(token, toAddress, amount);
MessagingFee memory fee = _quote(
    layerZero.externalChainStationEid,
    payload,
    options,
    false
);
_lzSend(
    layerZero.externalChainStationEid,
    payload,
    options,
    MessagingFee(fee.nativeFee, 0),
    msg.sender
);
```
- **Payload Encoding**: Uses `PayloadUtils.encodePayload()` for consistent data structure
- **Fee Quotation**: Calculates exact messaging fee via `_quote()` function
- **Omnichain Send**: Dispatches via LayerZero V2 endpoint with proper fee handling

#### Axelar (`0x03`)
```solidity
bytes memory payload = PayloadUtils.encodePayload(token, toAddress, amount);
IAxelarGasService(axelar.gasServiceAddress).payNativeGasForContractCall{
    value: msg.value
}(
    address(this),
    axelar.externalChainStationChainName,
    axelar.externalChainStationAddress,
    payload,
    msg.sender
);
gateway().callContract(
    axelar.externalChainStationChainName,
    axelar.externalChainStationAddress,
    payload
);
```
- **Payload Encoding**: Uses `PayloadUtils.encodePayload()` for cross-chain compatibility
- **Gas Service Payment**: Prepays execution gas to Axelar gas service contract
- **Gateway Dispatch**: Routes message through Axelar gateway with refund to sender

## Payload Encoding

The function uses standardized payload encoding via `PayloadUtils` library:
```solidity
bytes memory payload = PayloadUtils.encodePayload(token, toAddress, amount);
```

This creates a consistent format decoded on external chain station using:
```solidity
(address token, address toAddress, uint256 amount) = PayloadUtils.decodePayload(payload);
```

The payload structure ensures:
1. **Token identification**: ERC20 contract address or `address(0)` for native coins
2. **Recipient specification**: Exact recipient address on external chain  
3. **Amount precision**: Token amount in native decimals

## Gas Requirements

Users must send sufficient native tokens with the transaction to cover:
- **Hyperlane**: Mailbox dispatch fees
- **LayerZero**: Endpoint messaging fees  
- **Axelar**: Gas service payments

:::warning[Gas Payment Required]
The transaction will revert if insufficient native tokens are provided to cover cross-chain messaging costs. Use the respective quote functions to estimate required amounts.
:::

## Security Features

- **User Authorization**: Only holders can withdraw from their own EVVM balances
- **Principal Token Protection**: `Error.PrincipalTokenIsNotWithdrawable()` prevents MATE token withdrawal
- **Balance Verification**: `Error.InsufficientBalance()` protection with EVVM balance checks
- **Protocol Validation**: Reverts for invalid protocol identifiers
- **Cross-Chain Security**: Each protocol validates sender authorization on message receipt

## External Chain Processing

Upon successful cross-chain message delivery, the External Chain Station:
1. **Message Validation**: Verifies sender authorization and chain ID
2. **Payload Decoding**: Uses `PayloadUtils.decodePayload()` to extract transfer details
3. **Asset Transfer**: Transfers ERC20 tokens or native coins to recipient
4. **Event Emission**: Logs successful cross-chain transfer for tracking