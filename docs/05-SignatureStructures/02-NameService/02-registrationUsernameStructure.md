---
description: "EIP-191 signature structure for authorizing the registrationUsername operation, the reveal phase following pre-registration"
sidebar_position: 2
---

# Registration of username Signature Structure 

To authorize the `registrationUsername` operation (the reveal phase following pre-registration), the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. This signature proves ownership of the pre-registration commit by revealing the original username and the secret `clowNumber`. The message is constructed by concatenating the EVVM ID, action type (`"registrationUsername"`), and parameters, then wrapped with the EIP-191 prefix.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "registrationUsername",                             // Action type
    string.concat(                                      // Concatenated parameters
        _username,
        ",",
        AdvancedStrings.uintToString(_clowNumber),
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
"{evvmID},registrationUsername,{username},{clowNumber},{nameServiceNonce}"
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

## Message Components

The signature verification takes three main parameters:

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"registrationUsername"`
- *Purpose*: Identifies this as a username registration operation (reveal phase)

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Username (String):**
- The `_username` string itself
- *Purpose*: The actual, plain-text username that the user intends to register. This must match the username used to generate the hash during pre-registration

**3.2. Clow Number (String):**
- The result of `AdvancedStrings.uintToString(_clowNumber)`
- *Purpose*: The string representation of the secret `uint256` number chosen by the user during the pre-registration phase

**3.3. Name Service Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nameServiceNonce)`
- *Purpose*: Provides replay protection for registration actions by the user

## Example

Here's a practical example of constructing a signature message for registering a username:

**Scenario:** User wants to register the username "alice" revealing the secret clowNumber from pre-registration

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `_username`: `"alice"`
- `_clowNumber`: `123456789` (secret value from pre-registration)
- `_nameServiceNonce`: `5`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "registrationUsername", // action type
    "alice,123456789,5",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,registrationUsername,alice,123456789,5
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n37",
    "1,registrationUsername,alice,123456789,5"
))
```

**Concatenated parameters breakdown:**
1. `alice` - The username to register
2. `123456789` - The secret clowNumber used during pre-registration
3. `5` - The user's name service nonce

**Commit-Reveal Verification:**
The system will verify that `keccak256(abi.encodePacked("alice", 123456789))` matches the hash that was pre-registered.


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
- **String Conversion**: `Strings.toString` converts numbers to decimal strings
- **Commit-Reveal Scheme**: The `clowNumber` and username combination must match what was used during pre-registration
- **Hash Verification**: System verifies `keccak256(abi.encodePacked(_username, _clowNumber))` matches pre-registration hash
- **EVVM ID**: Identifies the specific EVVM instance for signature verification
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks for registration actions

:::