---
description: "EIP-191 signature structure for username owners to authorize renewUsername operations extending registration validity"
sidebar_position: 6
---

# Renew Username Signature Structure

To authorize the `renewUsername` operation within the Name Service, the user (the current username owner) must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library. This signature proves the owner's intent and authorization to extend the validity period of their username registration.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "renewUsername",                                    // Action type
    string.concat(                                      // Concatenated parameters
        _username,
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
"{evvmID},renewUsername,{username},{nameServiceNonce}"
```

## Message Components

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"renewUsername"`
- *Purpose*: Identifies this as a username renewal operation

**3. Concatenated Parameters (String):**

**3.1. Target Username (String):**
- The `_username` string itself
- *Purpose*: Specifies the username whose registration is being renewed

**3.2. Name Service Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nameServiceNonce)`
- *Purpose*: Provides replay protection for renewal actions

## Example

**Scenario:** Current owner wants to renew their username "alice"

**Parameters:**
- `evvmID`: `1`
- `_username`: `"alice"`
- `_nameServiceNonce`: `8`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,
    "renewUsername",
    "alice,8",
    signature,
    signer
);
```

**Final message to be signed:**
```
1,renewUsername,alice,8
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n22",
    "1,renewUsername,alice,8"
))
```

:::tip Technical Details

- **Message Format**: `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Authorization**: Only the current owner of the username can renew their own username
- **Renewal Logic**: Extends the username's expiration period and may involve a renewal fee
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
