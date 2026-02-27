---
description: "EIP-191 signature structure for authorizing withdrawOffer operations to cancel previously placed username offers"
sidebar_position: 4
---

# Withdraw Offer Signature Structure

To authorize the `withdrawOffer` operation within the Name Service, the user (the original offeror) must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library. This signature proves the offeror's intent and authorization to withdraw a specific, previously placed offer from a target username.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "withdrawOffer",                                    // Action type
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
"{evvmID},withdrawOffer,{username},{offerId},{nameServiceNonce}"
```


## Message Components

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"withdrawOffer"`
- *Purpose*: Identifies this as a withdraw offer operation

**3. Concatenated Parameters (String):**

**3.1. Target Username (String):**
- The `_username` string itself
- *Purpose*: Specifies the username associated with the offer being withdrawn

**3.2. Offer ID (String):**
- The result of `AdvancedStrings.uintToString(_offerId)`
- *Purpose*: The unique identifier assigned to the specific offer when created

**3.3. Name Service Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nameServiceNonce)`
- *Purpose*: Provides replay protection for withdraw offer actions

## Example

**Scenario:** User wants to withdraw their offer on username "alice"

**Parameters:**
- `evvmID`: `1`
- `_username`: `"alice"`
- `_offerId`: `42`
- `_nameServiceNonce`: `7`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,
    "withdrawOffer",
    "alice,42,7",
    signature,
    signer
);
```

**Final message to be signed:**
```
1,withdrawOffer,alice,42,7
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n27",
    "1,withdrawOffer,alice,42,7"
))
```

:::tip Technical Details

- **Message Format**: `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Offer ID Validation**: `_offerId` must correspond to an existing offer made by the same user
- **Authorization**: Only the original offeror can withdraw their own offers
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
