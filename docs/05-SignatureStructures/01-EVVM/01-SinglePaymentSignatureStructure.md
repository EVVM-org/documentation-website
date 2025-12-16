---
sidebar_position: 1
---

# Single Payment Signature Structure 

To authorize payment operations the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. The message is constructed by concatenating the EVVM ID, action type, and parameters, then wrapped with the EIP-191 prefix: `"\x19Ethereum Signed Message:\n"` + message length + message content.

The structure uses conditional logic to determine whether to use a direct address or identity string for the recipient.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                              // EVVM ID as uint256
    "pay",                               // Action type
    string.concat(                       // Concatenated parameters
        _receiverAddress == address(0)
            ? _receiverIdentity
            : AdvancedStrings.addressToString(_receiverAddress),
        ",",
        AdvancedStrings.addressToString(_token),
        ",",
        AdvancedStrings.uintToString(_amount),
        ",",
        AdvancedStrings.uintToString(_priorityFee),
        ",",
        AdvancedStrings.uintToString(_nonce),
        ",",
        _priorityFlag ? "true" : "false",
        ",",
        AdvancedStrings.addressToString(_executor)
    ),
    signature,
    signer
);
```

### Internal Message Construction

Internally, the `SignatureUtil.verifySignature` function constructs the final message by concatenating:

```solidity
string.concat(
    AdvancedStrings.uintToString(evvmID), 
    ",", 
    functionName, 
    ",", 
    inputs
)
```

This results in a message format:
```
"{evvmID},pay,{receiver},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}"
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

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"pay"`
- *Purpose*: Identifies this as a payment operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Recipient Identifier (String):**
- If `_receiverAddress == address(0)`: Use `_receiverIdentity` string directly
- If `_receiverAddress != address(0)`: Use `AdvancedStrings.addressToString(_receiverAddress)`
- *Purpose*: Specifies the intended recipient using either address or identity

**3.2. Token Address (String):**
- The result of `AdvancedStrings.addressToString(_token)`
- *Purpose*: Identifies the token being transferred

**3.3. Amount (String):**
- The result of `AdvancedStrings.uintToString(_amount)`
- *Purpose*: Specifies the quantity of the token to be transferred

**3.4. Priority Fee (String):**
- The result of `AdvancedStrings.uintToString(_priorityFee)`
- *Purpose*: Specifies the fee paid to staking holders

**3.5. Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nonce)`
- *Purpose*: Provides replay protection for the transaction

**3.6. Priority Flag (String):**
- `"true"`: If `_priorityFlag` is `true` (asynchronous)
- `"false"`: If `_priorityFlag` is `false` (synchronous)
- *Purpose*: Explicitly includes the execution mode in the signed message

**3.7. Executor Address (String):**
- The result of `AdvancedStrings.addressToString(_executor)`
- *Purpose*: Specifies the address authorized to submit this payment request

## Example

Here's a practical example of constructing a signature message for sending 0.05 ETH:

**Scenario:** User wants to send 0.05 ETH to another user using synchronous processing

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `_priorityFlag`: `false` (synchronous processing)
- `_receiverAddress`: `0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c`
- `_token`: `address(0)` (ETH)
- `_amount`: `50000000000000000` (0.05 ETH in wei)
- `_priorityFee`: `1000000000000000` (0.001 ETH in wei)
- `_nonce`: `42`
- `_executor`: `0x0000000000000000000000000000000000000000` (unrestricted)

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "pay", // action type
    "0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c,0x0000000000000000000000000000000000000000,50000000000000000,1000000000000000,42,false,0x0000000000000000000000000000000000000000",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,pay,0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c,0x0000000000000000000000000000000000000000,50000000000000000,1000000000000000,42,false,0x0000000000000000000000000000000000000000
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n145",
    "1,pay,0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c,0x0000000000000000000000000000000000000000,50000000000000000,1000000000000000,42,false,0x0000000000000000000000000000000000000000"
))
```

**Concatenated parameters breakdown:**
1. `0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c` - Receiver address
2. `0x0000000000000000000000000000000000000000` - Token address (ETH)
3. `50000000000000000` - Amount in wei (0.05 ETH)
4. `1000000000000000` - Priority fee in wei (0.001 ETH)
5. `42` - Nonce
6. `false` - Priority flag (synchronous)
7. `0x0000000000000000000000000000000000000000` - Executor (unrestricted)

## Example with Username

Here's another example using a username instead of an address:

**Scenario:** User wants to send 0.05 ETH to username "example" using asynchronous processing

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `_priorityFlag`: `true` (asynchronous processing)
- `_receiverAddress`: `address(0)` (using identity instead)
- `_receiverIdentity`: `"example"`
- `_token`: `address(0)` (ETH)
- `_amount`: `50000000000000000` (0.05 ETH in wei)
- `_priorityFee`: `2000000000000000` (0.002 ETH in wei)  
- `_nonce`: `15`
- `_executor`: `0x0000000000000000000000000000000000000000` (unrestricted)

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "pay", // action type
    "example,0x0000000000000000000000000000000000000000,50000000000000000,2000000000000000,15,true,0x0000000000000000000000000000000000000000",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,pay,example,0x0000000000000000000000000000000000000000,50000000000000000,2000000000000000,15,true,0x0000000000000000000000000000000000000000
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n134",
    "1,pay,example,0x0000000000000000000000000000000000000000,50000000000000000,2000000000000000,15,true,0x0000000000000000000000000000000000000000"
))
```

**Concatenated parameters breakdown:**
1. `example` - Receiver identity (username)
2. `0x0000000000000000000000000000000000000000` - Token address (ETH)
3. `50000000000000000` - Amount in wei (0.05 ETH)
4. `2000000000000000` - Priority fee in wei (0.002 ETH)
5. `15` - Nonce
6. `true` - Priority flag (asynchronous)
7. `0x0000000000000000000000000000000000000000` - Executor (unrestricted)

## Signature Implementation Details

The `SignatureUtil` library performs signature verification in the following steps:

1. **Message Construction**: Concatenates `evvmID`, `functionName`, and `inputs` with commas
2. **EIP-191 Formatting**: Prepends `"\x19Ethereum Signed Message:\n"` + message length
3. **Hashing**: Applies `keccak256` to the formatted message
4. **Signature Parsing**: Splits the 65-byte signature into `r`, `s`, and `v` components
5. **Recovery**: Uses `ecrecover` via `SignatureRecover.recoverSigner` to recover the signer's address
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
- **Priority Flag**: Determines execution mode (async=`true`, sync=`false`)
- **Recipient Logic**: Uses `_receiverIdentity` if `_receiverAddress == address(0)`, otherwise uses the address
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
