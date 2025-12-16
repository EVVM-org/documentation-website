---
sidebar_position: 2
---

# Disperse Payment Signature Structure 

To authorize disperse payment operations the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. The message is constructed by concatenating the EVVM ID, action type (`"dispersePay"`), and parameters (including a hash of the recipient data array), then wrapped with the EIP-191 prefix: `"\x19Ethereum Signed Message:\n"` + message length + message content.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                              // EVVM ID as uint256
    "dispersePay",                       // Action type
    string.concat(                       // Concatenated parameters
        AdvancedStrings.bytes32ToString(hashList),
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
"{evvmID},dispersePay,{hashList},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}"
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
- Fixed value: `"dispersePay"`
- *Purpose*: Identifies this as a disperse payment operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Hash List (String):**
- The result of `AdvancedStrings.bytes32ToString(hashList)`
- Where `hashList = sha256(abi.encode(toData))`
- *Purpose*: Ensures signature covers the specific recipient list and amounts

**3.2. Token Address (String):**
- The result of `AdvancedStrings.addressToString(_token)`
- *Purpose*: Identifies the token being distributed

**3.3. Total Amount (String):**
- The result of `AdvancedStrings.uintToString(_amount)`
- *Purpose*: Specifies the total amount being distributed across all recipients

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

:::tip

- `AdvancedStrings.bytes32ToString` converts a bytes32 hash to **lowercase hexadecimal** string with "0x" prefix
- `AdvancedStrings.addressToString` converts an address to a lowercase string
- `Strings.toString` converts a number to a string
- `_priorityFlag` indicates whether the payment will be executed asynchronously (`true`) or synchronously (`false`)
- The signature verification uses the `SignatureRecover.signatureVerification` function with structured parameters

:::

## Hash List Structure

The `hashList` component within the signature message is derived by ABI-encoding the entire `toData` array and then computing its `sha256` hash:

```solidity
bytes32 hashList = sha256(abi.encode(toData));
```

This ensures that the signature covers the specific recipient list and amounts.

## Example

Here's a practical example of constructing a signature message for distributing 0.1 ETH to multiple recipients:

**Scenario:** User wants to distribute 0.1 ETH to three recipients using synchronous processing

**Recipients (`toData` array):**
```solidity
DispersePayMetadata[] memory toData = new DispersePayMetadata[](3);
toData[0] = DispersePayMetadata({
    amount: 30000000000000000,  // 0.03 ETH
    to_address: 0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c,
    to_identity: ""
});
toData[1] = DispersePayMetadata({
    amount: 50000000000000000,  // 0.05 ETH
    to_address: address(0),
    to_identity: "alice"
});
toData[2] = DispersePayMetadata({
    amount: 20000000000000000,  // 0.02 ETH
    to_address: 0x8e3f2b4c5d6a7f8e9c1b2a3d4e5f6c7d8e9f0a1b,
    to_identity: ""
});
```

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `hashList`: `sha256(abi.encode(toData))` = `0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b`
- `_token`: `address(0)` (ETH)
- `_amount`: `100000000000000000` (0.1 ETH total)
- `_priorityFee`: `5000000000000000` (0.005 ETH)
- `_nonce`: `25`
- `_priorityFlag`: `false` (synchronous)
- `_executor`: `address(0)` (unrestricted)

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "dispersePay", // action type
    "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b,0x0000000000000000000000000000000000000000,100000000000000000,5000000000000000,25,false,0x0000000000000000000000000000000000000000",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,dispersePay,0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b,0x0000000000000000000000000000000000000000,100000000000000000,5000000000000000,25,false,0x0000000000000000000000000000000000000000
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n188",
    "1,dispersePay,0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b,0x0000000000000000000000000000000000000000,100000000000000000,5000000000000000,25,false,0x0000000000000000000000000000000000000000"
))
```

**Concatenated parameters breakdown:**
1. `0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b` - Hash of recipient data
2. `0x0000000000000000000000000000000000000000` - Token address (ETH)
3. `100000000000000000` - Total amount in wei (0.1 ETH)
4. `5000000000000000` - Priority fee in wei (0.005 ETH)
5. `25` - Nonce
6. `false` - Priority flag (synchronous)
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
  - `AdvancedStrings.bytes32ToString` converts bytes32 hash to **lowercase hexadecimal** with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Hash List Integrity**: `hashList = sha256(abi.encode(toData))` ensures signature covers specific recipients
- **Amount Validation**: Total `_amount` should equal sum of all individual amounts in `toData` array
- **Priority Flag**: Determines execution mode (async=`true`, sync=`false`)
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::

## `DispersePayMetadata` Struct

Defines the payment details for a single recipient within the `toData` array.

```solidity
struct DispersePayMetadata {
    uint256 amount;
    address to_address;
    string to_identity;
}
```

- **amount**: The amount to send to this specific recipient
- **to_address**: Direct address (use `address(0)` if using identity)
- **to_identity**: Username/identity string (empty if using address)
