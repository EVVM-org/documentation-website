---
description: "EIP-191 signature structure for username owners to authorize complete removal of their username registration"
sidebar_position: 10
---

# Flush Username Signature Structure

To authorize the `flushUsername` operation within the Name Service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library. This signature proves the current username owner's intent and authorization to completely remove and "flush" their username registration from the system.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "flushUsername",                                    // Action type
    string.concat(                                      // Concatenated parameters
        _username,
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
"{evvmID},flushUsername,{username},{nonce}"
```

## Example

**Scenario:** Owner wants to permanently delete their username "alice"

**Parameters:**
- `evvmID`: `1`
- `_username`: `"alice"`
- `_nonce`: `25`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,
    "flushUsername",
    "alice,25",
    signature,
    signer
);
```

**Final message to be signed:**
```
1,flushUsername,alice,25
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n23",
    "1,flushUsername,alice,25"
))
```

⚠️ **Warning**: This operation is **irreversible** and will permanently delete the username registration and all associated data.



:::tip

- The function selector `044695cb` is the first 4 bytes of the keccak256 hash of the function signature for `verifyMessageSignedForFlushUsername`
- `Strings.toString` converts a number to a string (standard OpenZeppelin utility)
- The signature verification uses the EIP-191 standard for message signing
- Only the current owner of the username can flush their own username
- This operation is **irreversible** and permanently deletes the username registration and all associated data
- The `_nonce` parameter is the user's general nonce, similar to other deletion operations

:::
