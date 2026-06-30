---
title: "PayloadUtils Library"
description: "ABI encoding/decoding utility for cross-chain transfer payloads"
sidebar_position: 8
---

# PayloadUtils Library

The `PayloadUtils` library provides standardized ABI encoding and decoding for cross-chain transfer payloads used by the Treasury two-chain system.

## Overview

**Library Type**: Pure functions
**License**: EVVM-NONCOMMERCIAL-1.0
**Import Path**: `@evvm/testnet-contracts/library/treasuryTwoChains/lib/PayloadUtils.sol`
**Solidity Version**: `^0.8.0`

### Key Features

- **Standardized payload format** for cross-chain transfers
- **ABI encoding** for reliable data transmission
- **Compatible** with Hyperlane, LayerZero, and Axelar protocols
- **Supports** both ERC20 tokens and native ETH

## Functions

### `encodePayload`

**Function Type**: `internal pure`
**Function Signature**: `encodePayload(address token, address toAddress, uint256 amount) returns (bytes memory payload)`

Encodes transfer parameters into a standardized cross-chain payload.

#### Parameters

| Parameter  | Type      | Description |
| ---------- | --------- | ----------- |
| `token`    | `address` | Token contract address. Use `address(0)` for native ETH |
| `toAddress`| `address` | Recipient address on the destination chain |
| `amount`   | `uint256` | Amount of tokens to transfer (in token's native decimals) |

#### Return Value

| Type     | Description |
| -------- | ----------- |
| `bytes`  | ABI-encoded payload containing the transfer parameters |

#### Implementation

```solidity
function encodePayload(
    address token,
    address toAddress,
    uint256 amount
) internal pure returns (bytes memory payload) {
    payload = abi.encode(token, toAddress, amount);
}
```

#### Example

```solidity
// Encode an ERC20 transfer
bytes memory payload = PayloadUtils.encodePayload(
    0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48, // USDC
    0x1234567890abcdef1234567890abcdef12345678,
    1000000 // 1 USDC (6 decimals)
);

// Encode a native ETH transfer
bytes memory ethPayload = PayloadUtils.encodePayload(
    address(0), // address(0) indicates native ETH
    0x1234567890abcdef1234567890abcdef12345678,
    1 ether
);
```

### `decodePayload`

**Function Type**: `internal pure`
**Function Signature**: `decodePayload(bytes memory payload) returns (address token, address toAddress, uint256 amount)`

Decodes a cross-chain payload back into transfer parameters.

#### Parameters

| Parameter | Type     | Description |
| --------- | -------- | ----------- |
| `payload` | `bytes`  | ABI-encoded bytes received from cross-chain protocols |

#### Return Value

| Type      | Description |
| --------- | ----------- |
| `token`   | Token contract address (`address(0)` indicates native ETH) |
| `toAddress`| Recipient address extracted from the payload |
| `amount`  | Amount of tokens to transfer in token's native decimals |

#### Implementation

```solidity
function decodePayload(
    bytes memory payload
) internal pure returns (address token, address toAddress, uint256 amount) {
    (token, toAddress, amount) = abi.decode(
        payload,
        (address, address, uint256)
    );
}
```

#### Example

```solidity
// Decode a received cross-chain payload
(address token, address toAddress, uint256 amount) = PayloadUtils.decodePayload(
    receivedPayload
);

if (token == address(0)) {
    // Native ETH transfer
    payable(toAddress).transfer(amount);
} else {
    // ERC20 transfer
    IERC20(token).transfer(toAddress, amount);
}
```

## Payload Structure

The payload uses standard ABI encoding with the following layout:

```
┌─────────────────────────────────────────────────────────┐
│                     Payload Layout                       │
├─────────────────────────────────────────────────────────┤
│ Bytes 0-31   │ token address      (address, 20 bytes)   │
│ Bytes 32-63  │ toAddress          (address, 20 bytes)   │
│ Bytes 64-95  │ amount             (uint256, 32 bytes)   │
├─────────────────────────────────────────────────────────┤
│ Total: 96 bytes (32 bytes × 3 fields)                   │
└─────────────────────────────────────────────────────────┘
```

## Usage in Cross-Chain Operations

### TreasuryHostChainStation

Used when sending tokens from the EVVM host chain to an external chain:

```solidity
// Encoding for cross-chain withdrawal
bytes memory payload = PayloadUtils.encodePayload(
    token,
    toAddress,
    amount
);

// Send via Hyperlane, LayerZero, or Axelar
```

### TreasuryExternalChainStation

Used when receiving tokens on the external chain from the host chain:

```solidity
// Decoding received cross-chain deposit
(address token, address toAddress, uint256 amount) = 
    PayloadUtils.decodePayload(message);

// Credit the recipient's balance
```

## Protocol Compatibility

The `PayloadUtils` library works with all three cross-chain protocols supported by EVVM:

| Protocol | Handler Function | Payload Format |
| -------- | ---------------- | -------------- |
| **Hyperlane** | `handle(uint32, bytes32, bytes)` | ABI-encoded |
| **LayerZero** | `_lzReceive(uint32, bytes, address, bytes)` | ABI-encoded |
| **Axelar** | `_execute(string, string, bytes)` | ABI-encoded |

All three protocols use the same `PayloadUtils` format for transfer data.

## Security Considerations

### 1. Payload Integrity

Cross-chain payloads should be validated before execution:

```solidity
function _execute(
    string memory,
    string memory,
    bytes memory payload
) internal override {
    (address token, address toAddress, uint256 amount) = 
        PayloadUtils.decodePayload(payload);
    
    // Validate decoded data
    require(toAddress != address(0), "Invalid recipient");
    require(amount > 0, "Zero amount");
    
    // Execute transfer
    _creditBalance(toAddress, token, amount);
}
```

### 2. Native ETH Handling

When `token == address(0)`, the payload represents a native ETH transfer. Ensure proper handling:

```solidity
if (token == address(0)) {
    // Native ETH: use payable transfer
    (bool success, ) = toAddress.call{value: amount}("");
    require(success, "ETH transfer failed");
} else {
    // ERC20: use safe transfer
    IERC20(token).safeTransfer(toAddress, amount);
}
```

### 3. Decoding Failures

If the payload is malformed, `abi.decode` will revert. Wrap decoding in try/catch if needed:

```solidity
try PayloadUtils.decodePayload(payload) returns (
    address token, 
    address toAddress, 
    uint256 amount
) {
    // Process transfer
} catch {
    revert InvalidPayload();
}
```

## Gas Costs

| Operation | Approximate Gas | Notes |
| --------- | --------------- | ----- |
| `encodePayload` | ~500 | ABI encoding overhead |
| `decodePayload` | ~500-800 | ABI decoding overhead |

## Related Documentation

- [Treasury Overview](../../../04-Contracts/04-Treasury/01-Overview.md) - Treasury system overview
- [HostChainStation](../../../04-Contracts/04-Treasury/02-TreasuryCrosschain/01-Overview.md) - Host chain withdrawal operations
- [ExternalChainStation](../../../04-Contracts/04-Treasury/02-TreasuryCrosschain/01-Overview.md) - External chain deposit operations
- [Fisher Bridge Signature](../../../05-SignatureStructures/04-Treasury/01-FisherBridgeSignatureStructure.md) - Cross-chain signature structure
