---
description: "EIP-191 signature structure for authorizing order creation operations in the P2P swap system"
sidebar_position: 1
---

# Make Order Signature Structure

To authorize order creation operations, users must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. The message is constructed by concatenating the EVVM ID, action type, and parameters, then wrapped with the EIP-191 prefix: `"\x19Ethereum Signed Message:\n"` + message length + message content.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                          // EVVM ID as uint256
    "makeOrder",                     // Action type
    string.concat(                   // Concatenated parameters
        AdvancedStrings.uintToString(_nonce),
        ",",
        AdvancedStrings.addressToString(_tokenA),
        ",",
        AdvancedStrings.addressToString(_tokenB),
        ",",
        AdvancedStrings.uintToString(_amountA),
        ",",
        AdvancedStrings.uintToString(_amountB)
    ),
    signature,
    signer
);
```

### Internal Message Construction

Internally, the `SignatureUtil.verifySignature` function constructs the final message by concatenating:

```solidity
string.concat(AdvancedStrings.uintToString(evvmID), ",", functionName, ",", inputs)
```

This results in a message format:
```
"{evvmID},makeOrder,{nonce},{tokenA},{tokenB},{amountA},{amountB}"
```

### EIP-191 Message Hashing

The message is then hashed according to EIP-191 standard:

```solidity
bytes32 messageHash = keccak256(
    abi.encodePacked(
        "\x19Ethereum Signed Message:\n",
        AdvancedStrings.uintToString(bytes(message).length),
        message
    )
);
```

This creates the final hash that the user must sign with their private key.

## Message Components

The signature verification takes three main parameters:

**1. EVVM ID (uint256):**
- Direct uint256 value (converted to string internally)
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"makeOrder"`
- *Purpose*: Identifies this as an order creation operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nonce)`
- *Purpose*: Provides replay protection for the P2P Swap transaction

**3.2. Token A Address (String):**
- The result of `AdvancedStrings.addressToString(_tokenA)`
- *Purpose*: Identifies the token being offered by the order creator

**3.3. Token B Address (String):**
- The result of `AdvancedStrings.addressToString(_tokenB)`
- *Purpose*: Identifies the token being requested in exchange

**3.4. Amount A (String):**
- The result of `AdvancedStrings.uintToString(_amountA)`
- *Purpose*: Specifies the quantity of tokenA being offered

**3.5. Amount B (String):**
- The result of `AdvancedStrings.uintToString(_amountB)`
- *Purpose*: Specifies the quantity of tokenB being requested

## Example

Here's a practical example of constructing a signature message for creating a swap order:

**Scenario:** User wants to create an order offering 100 USDC for 0.05 ETH

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `_nonce`: `15`
- `_tokenA`: `0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000` (USDC)
- `_tokenB`: `0x0000000000000000000000000000000000000000` (ETH)
- `_amountA`: `100000000` (100 USDC with 6 decimals)
- `_amountB`: `50000000000000000` (0.05 ETH in wei)

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "makeOrder", // action type
    "15,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,100000000,50000000000000000",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,makeOrder,15,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,100000000,50000000000000000
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n149",
    "1,makeOrder,15,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,100000000,50000000000000000"
))
```

**Concatenated parameters breakdown:**
1. `15` - P2P Swap nonce for replay protection
2. `0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000` - USDC token address (tokenA)
3. `0x0000000000000000000000000000000000000000` - ETH address (tokenB)
4. `100000000` - Amount of USDC being offered (100 USDC with 6 decimals)
5. `50000000000000000` - Amount of ETH being requested (0.05 ETH in wei)

## Signature Implementation Details

The `SignatureUtil` library performs signature verification in the following steps:

1. **Message Construction**: Concatenates `evvmID` (converted to string), `functionName`, and `inputs` with commas
2. **EIP-191 Formatting**: Prepends `"\x19Ethereum Signed Message:\n"` + message length
3. **Hashing**: Applies `keccak256` to the formatted message
4. **Signature Parsing**: Splits the 65-byte signature into `r`, `s`, and `v` components
5. **Recovery**: Uses `ecrecover` to recover the signer's address
6. **Verification**: Compares recovered address with expected signer

### Signature Format Requirements

- **Length**: Exactly 65 bytes
- **Structure**: `[r (32 bytes)][s (32 bytes)][v (1 byte)]`
- **V Value**: Must be 27 or 28 (automatically adjusted if < 27)

:::tip Technical Details

- **Message Format**: The final message follows the pattern `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Hash Function**: `keccak256` is used for the final message hash before signing
- **Signature Recovery**: Uses `ecrecover` to verify the signature against the expected signer
- **String Conversion**: 
  - `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **EVVM ID**: Identifies the specific EVVM instance for signature verification
- **Nonce Purpose**: P2P Swap specific nonce prevents replay attacks within the swap system

:::