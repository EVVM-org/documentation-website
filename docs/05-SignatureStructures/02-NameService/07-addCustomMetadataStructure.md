---
sidebar_position: 7
---

# Add Custom Metadata Signature Structure

To authorize the `addCustomMetadata` operation within the Name Service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library. This signature proves the current username owner's intent and authorization to add or update a specific custom metadata field (`_value`) associated with their identity (`_identity`).


## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "addCustomMetadata",                                // Action type
    string.concat(                                      // Concatenated parameters
        _identity,
        ",",
        _value,
        ",",
        AdvancedStrings.uintToString(_nameServiceNonce)
    ),
    signature,
    signer
);
```

### Internal Message Construction

This results in a message format:
```
"{evvmID},addCustomMetadata,{identity},{value},{nameServiceNonce}"
```

## Message Components

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"addCustomMetadata"`
- *Purpose*: Identifies this as an add custom metadata operation

**3. Concatenated Parameters (String):**

**3.1. Target Identity (String):**
- The `_identity` string itself
- *Purpose*: Specifies the identity (username) to which this custom metadata applies

**3.2. Metadata Value (String):**
- The `_value` string itself, exactly as provided by the user
- *Purpose*: Represents the custom data being associated with the identity

**3.3. Name Service Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nameServiceNonce)`
- *Purpose*: Provides replay protection for metadata operations

## Example

**Scenario:** Owner wants to add custom metadata to their identity "alice"

**Parameters:**
- `evvmID`: `1`
- `_identity`: `"alice"`
- `_value`: `"https://alice.example.com/profile"`
- `_nameServiceNonce`: `12`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,
    "addCustomMetadata",
    "alice,https://alice.example.com/profile,12",
    signature,
    signer
);
```

**Final message to be signed:**
```
1,addCustomMetadata,alice,https://alice.example.com/profile,12
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n59",
    "1,addCustomMetadata,alice,https://alice.example.com/profile,12"
))
```

:::tip Technical Details

- **Message Format**: `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Authorization**: Only the current owner of the identity can add custom metadata
- **Flexible Data**: `_value` can contain any string data (URLs, descriptions, custom information)
- **Metadata Management**: Allows users to associate additional information with their identities
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
