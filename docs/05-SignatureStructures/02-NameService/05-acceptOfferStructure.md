---
description: "EIP-191 signature structure for username owners to authorize acceptOffer operations, transferring ownership"
sidebar_position: 5
---

# Accept Offer Signature Structure

To authorize the `acceptOffer` operation within the Name Service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library. This signature proves the current username owner's intent and authorization to accept a specific offer (`_offerId`), thereby agreeing to transfer ownership of their username (`_username`) in exchange for the offered amount.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "acceptOffer",                                      // Action type
    string.concat(                                      // Concatenated parameters
        _username,
        ",",
        AdvancedStrings.uintToString(_offerId),
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
"{evvmID},acceptOffer,{username},{offerId},{nameServiceNonce}"
```

## Message Components

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"acceptOffer"`
- *Purpose*: Identifies this as an accept offer operation

**3. Concatenated Parameters (String):**

**3.1. Target Username (String):**
- The `_username` string itself
- *Purpose*: Specifies the username that the owner is agreeing to sell

**3.2. Offer ID (String):**
- The result of `AdvancedStrings.uintToString(_offerId)`
- *Purpose*: The unique identifier of the specific offer being accepted

**3.3. Name Service Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nameServiceNonce)`
- *Purpose*: Provides replay protection for accept offer actions

## Example

**Scenario:** Current owner of username "alice" wants to accept an offer

**Parameters:**
- `evvmID`: `1`
- `_username`: `"alice"`
- `_offerId`: `123`
- `_nameServiceNonce`: `3`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,
    "acceptOffer",
    "alice,123,3",
    signature,
    signer
);
```

**Final message to be signed:**
```
1,acceptOffer,alice,123,3
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n25",
    "1,acceptOffer,alice,123,3"
))
```

:::tip Technical Details

- **Message Format**: `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Authorization**: Only the current owner of the username can accept offers
- **Offer Validation**: `_offerId` must correspond to a valid, non-expired offer
- **Ownership Transfer**: Accepting an offer transfers username ownership to the offeror
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
