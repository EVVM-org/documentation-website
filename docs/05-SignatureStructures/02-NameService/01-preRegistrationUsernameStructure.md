---
sidebar_position: 1
---

# Pre-registration of username Signature Structure 

To authorize the `preRegistrationUsername` operation, the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. The message is constructed by concatenating the EVVM ID, action type (`"preRegistrationUsername"`), and parameters, then wrapped with the EIP-191 prefix: `"\x19Ethereum Signed Message:\n"` + message length + message content.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "preRegistrationUsername",                          // Action type
    string.concat(                                      // Concatenated parameters
        AdvancedStrings.bytes32ToString(_hashUsername),
        ",",
        AdvancedStrings.uintToString(_nameServiceNonce)
    ),
    signature,
    signer
);
```

### Internal Message Construction

Internally, the `SignatureUtil.verifySignature` function constructs the final message by concatenating:

```solidity
string.concat(evvmID, ",", functionName, ",", inputs)
```

This results in a message format:
```
"{evvmID},preRegistrationUsername,{hashUsername},{nameServiceNonce}"
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
- Fixed value: `"preRegistrationUsername"`
- *Purpose*: Identifies this as a username pre-registration operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Username Hash (String):**
- The result of `AdvancedStrings.bytes32ToString(_hashUsername)`
- *Purpose*: String representation of the `bytes32` hash commitment being pre-registered

**3.2. Name Service Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nameServiceNonce)`
- *Purpose*: Provides replay protection for pre-registration actions by the user

## Example

Here's a practical example of constructing a signature message for pre-registering a username:

**Scenario:** User wants to pre-register the username "alice" with a secret clowNumber

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- Username: `"alice"`
- ClowNumber: `123456789` (secret value)
- `_hashUsername`: `keccak256(abi.encodePacked("alice", 123456789))` = `0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef`
- `_nameServiceNonce`: `15`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "preRegistrationUsername", // action type
    "0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef,15",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,preRegistrationUsername,0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef,15
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n97",
    "1,preRegistrationUsername,0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef,15"
))
```

**Concatenated parameters breakdown:**
1. `0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef` - Hash of username and clowNumber
2. `15` - Name Service nonce


## Signature Implementation Details

The `SignatureUtil` library performs signature verification in the following steps:

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

:::tip Technical Details

- **Message Format**: The final message follows the pattern `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Hash Function**: `keccak256` is used for the final message hash before signing
- **Signature Recovery**: Uses `ecrecover` to verify the signature against the expected signer
- **String Conversion**:
  - `AdvancedStrings.bytes32ToString` converts bytes32 values to **lowercase hexadecimal** with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Username Hash**: Must be calculated as `keccak256(abi.encodePacked(_username, _clowNumber))`
- **Commit-Reveal Scheme**: The `_clowNumber` is secret during pre-registration and revealed during registration
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::


## Hash Username Structure

For pre-registration of a username, users must provide a hash of the username. The hash is calculated using keccak256 with the following structure:

```solidity
keccak256(abi.encodePacked(_username, _clowNumber));
```

Where:

- `_username` is the desired username (string)
- `_clowNumber` is the secret key number (uint256) that will be used in the `registrationUsername` function

**Important:** The `_clowNumber` must be kept secret during pre-registration and revealed during the actual registration process.
