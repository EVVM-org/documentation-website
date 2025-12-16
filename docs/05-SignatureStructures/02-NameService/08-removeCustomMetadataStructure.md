---
sidebar_position: 8
---

# Remove Custom Metadata Signature Structure

To authorize the `removeCustomMetadata` operation within the MNS service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard.

The signature verification process uses the `SignatureUtil` library. This signature proves the current username owner's intent and authorization to remove a specific custom metadata entry (identified by its key/index `_key`) associated with their username (`_username`).


## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "removeCustomMetadata",                             // Action type
    string.concat(                                      // Concatenated parameters
        _username,
        ",",
        AdvancedStrings.uintToString(_key),
        ",",
        AdvancedStrings.uintToString(_nonce)
    ),
    signature,
    signer
);
```

### Internal Message Construction

This results in a message format:
```
"{evvmID},removeCustomMetadata,{username},{key},{nonce}"
```

## Message Components

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"removeCustomMetadata"`
- *Purpose*: Identifies this as a remove custom metadata operation

**3. Concatenated Parameters (String):**

**3.1. Target Username (String):**
- The `_username` string itself
- *Purpose*: Specifies the username from which the custom metadata entry will be removed

**3.2. Metadata Key/Index (String):**
- The result of `AdvancedStrings.uintToString(_key)`
- *Purpose*: The identifier for the specific metadata entry targeted for removal

**3.3. Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nonce)`
- *Purpose*: Provides replay protection for metadata removal operations

## Example

**Scenario:** Owner wants to remove custom metadata from their username "alice"

**Parameters:**
- `evvmID`: `1`
- `_username`: `"alice"`
- `_key`: `3` (metadata entry identifier)
- `_nonce`: `15`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,
    "removeCustomMetadata",
    "alice,3,15",
    signature,
    signer
);
```

**Final message to be signed:**
```
1,removeCustomMetadata,alice,3,15
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n33",
    "1,removeCustomMetadata,alice,3,15"
))
```

**Message Breakdown:**
- `8adf3927`: Function selector for remove custom metadata verification
- `alice`: The username from which the metadata will be removed
- `3`: The key/index of the specific metadata entry to remove
- `15`: The current username owner's nonce

This message would then be signed using EIP-191 standard, and the resulting signature would be used to verify the metadata removal request in the `verifyMessageSignedForRemoveCustomMetadata` function.
   
:::tip

- The function selector `8adf3927` is the first 4 bytes of the keccak256 hash of the function signature for `verifyMessageSignedForRemoveCustomMetadata`
- `Strings.toString` converts a number to a string (standard OpenZeppelin utility)
- The signature verification uses the EIP-191 standard for message signing
- Only the current owner of the username can remove custom metadata from their username
- The `_key` parameter identifies which specific metadata entry to remove by its index/identifier
- The `_nonce` parameter is the user's general nonce, not specifically the name service nonce

:::
