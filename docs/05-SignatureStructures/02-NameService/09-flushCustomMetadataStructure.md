---
description: "EIP-191 signature structure for username owners to authorize removal of all custom metadata entries"
sidebar_position: 9
---

# Flush Custom Metadata Signature Structure

To authorize the `flushCustomMetadata` operation within the MNS service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard.

The signature verification process uses the `SignatureUtil` library. This signature proves the current username owner's intent and authorization to remove **all** custom metadata entries associated with their username (`_username`).

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "flushCustomMetadata",                              // Action type
    string.concat(                                      // Concatenated parameters
        _identity,
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
"{evvmID},flushCustomMetadata,{identity},{nonce}"
```

## Example

**Scenario:** Owner wants to flush all custom metadata from their identity "alice"

**Parameters:**
- `evvmID`: `1`
- `_identity`: `"alice"`
- `_nonce`: `20`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,
    "flushCustomMetadata",
    "alice,20",
    signature,
    signer
);
```

**Final message to be signed:**
```
1,flushCustomMetadata,alice,20
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n31",
    "1,flushCustomMetadata,alice,20"
))
```

**Message Breakdown:**
- `3ca44e54`: Function selector for flush custom metadata verification
- `alice`: The identity (username) from which all metadata will be removed
- `20`: The current identity owner's nonce

This message would then be signed using EIP-191 standard, and the resulting signature would be used to verify the metadata flush request in the `verifyMessageSignedForFlushCustomMetadata` function.
   
:::tip

- The function selector `3ca44e54` is the first 4 bytes of the keccak256 hash of the function signature for `verifyMessageSignedForFlushCustomMetadata`
- `Strings.toString` converts a number to a string (standard OpenZeppelin utility)
- The signature verification uses the EIP-191 standard for message signing
- Only the current owner of the identity can flush all custom metadata from their identity
- This operation removes **all** custom metadata entries at once, unlike `removeCustomMetadata` which removes specific entries
- The `_nonce` parameter is the user's general nonce, similar to the remove function

:::
