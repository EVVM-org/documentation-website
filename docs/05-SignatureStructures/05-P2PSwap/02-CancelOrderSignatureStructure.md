---
sidebar_position: 2
---

# Cancel Order Signature Structure

To authorize order cancellation operations, users must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. The message is constructed by concatenating the EVVM ID, action type, and parameters, then wrapped with the EIP-191 prefix.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                          // EVVM ID as uint256
    "cancelOrder",                   // Action type
    string.concat(                   // Concatenated parameters
        AdvancedStrings.uintToString(_nonce),
        ",",
        AdvancedStrings.addressToString(_tokenA),
        ",",
        AdvancedStrings.addressToString(_tokenB),
        ",",
        AdvancedStrings.uintToString(_orderId)
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
"{evvmID},cancelOrder,{nonce},{tokenA},{tokenB},{orderId}"
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
- Fixed value: `"cancelOrder"`
- *Purpose*: Identifies this as an order cancellation operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nonce)`
- *Purpose*: Provides replay protection for the P2P Swap transaction

**3.2. Token A Address (String):**
- The result of `AdvancedStrings.addressToString(_tokenA)`
- *Purpose*: Identifies the token that was offered in the original order

**3.3. Token B Address (String):**
- The result of `AdvancedStrings.addressToString(_tokenB)`
- *Purpose*: Identifies the token that was requested in the original order

**3.4. Order ID (String):**
- The result of `AdvancedStrings.uintToString(_orderId)`
- *Purpose*: Specifies the unique ID of the order to be cancelled

## Example

Here's a practical example of constructing a signature message for cancelling a swap order:

**Scenario:** User wants to cancel their order #3 in the USDC/ETH market

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `_nonce`: `25`
- `_tokenA`: `0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000` (USDC)
- `_tokenB`: `0x0000000000000000000000000000000000000000` (ETH)
- `_orderId`: `3`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "cancelOrder", // action type
    "25,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,3",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,cancelOrder,25,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,3
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n134",
    "1,cancelOrder,25,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,3"
))
```

**Concatenated parameters breakdown:**
1. `25` - P2P Swap nonce for replay protection
2. `0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000` - USDC token address (tokenA from original order)
3. `0x0000000000000000000000000000000000000000` - ETH address (tokenB from original order)
4. `3` - Order ID to be cancelled

## Example with Different Token Pair

**Scenario:** User wants to cancel their order #7 in the MATE/USDC market

**Parameters:**
- `evvmID`: `1`
- `_nonce`: `42`
- `_tokenA`: `0x0000000000000000000000000000000000000001` (MATE)
- `_tokenB`: `0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000` (USDC)
- `_orderId`: `7`

**Final message to be signed:**
```
1,cancelOrder,42,0x0000000000000000000000000000000000000001,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,7
```

**Concatenated parameters breakdown:**
1. `42` - P2P Swap nonce
2. `0x0000000000000000000000000000000000000001` - MATE token address
3. `0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000` - USDC token address
4. `7` - Order ID to cancel

## Signature Implementation Details

The `SignatureRecover` library performs signature verification in the following steps:

1. **Message Construction**: Concatenates `evvmID`, `functionName`, and `inputs` with commas
2. **EIP-191 Formatting**: Prepends `"\x19Ethereum Signed Message:\n"` + message length
3. **Hashing**: Applies `keccak256` to the formatted message
4. **Signature Parsing**: Splits the 65-byte signature into `r`, `s`, and `v` components
5. **Recovery**: Uses `ecrecover` to recover the signer's address
6. **Verification**: Compares recovered address with expected signer

### Signature Format Requirements

- **Length**: Exactly 65 bytes
- **Structure**: `[r (32 bytes)][s (32 bytes)][v (1 byte)]`
- **V Value**: Must be 27 or 28 (automatically adjusted if < 27)

## Security Considerations

### Order Ownership Validation

The signature alone does not prove order ownership. The contract performs additional validation:

1. **Signature Verification**: Confirms the user signed the cancellation request
2. **Order Existence**: Verifies the order exists in the specified market
3. **Ownership Check**: Confirms the signer is the original order creator
4. **Nonce Validation**: Ensures the nonce hasn't been used before

### Market Identification

The token pair (tokenA, tokenB) must match the original order exactly:
- **Token Addresses**: Must be identical to the original order
- **Market Resolution**: Used to find the correct market for the order
- **Order Lookup**: Combined with orderId to locate the specific order

:::tip Technical Details

- **Message Format**: The final message follows the pattern `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Hash Function**: `keccak256` is used for the final message hash before signing
- **Signature Recovery**: Uses `ecrecover` to verify the signature against the expected signer
- **String Conversion**: 
  - `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Order Identification**: Requires both token pair and order ID to uniquely identify the order
- **Nonce Independence**: P2P Swap nonces are separate from EVVM payment nonces

:::