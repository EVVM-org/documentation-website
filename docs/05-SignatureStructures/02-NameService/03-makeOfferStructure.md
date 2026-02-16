---
description: "EIP-191 signature structure for authorizing makeOffer operations to place offers on registered usernames"
sidebar_position: 3
---

# Make Offer Signature Structure

To authorize the `makeOffer` operation within the Name Service, the user (the offeror) must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library. This signature proves the offeror's intent and authorization to place a specific offer on a target username under the specified terms (amount, expiration).

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "makeOffer",                                        // Action type
    string.concat(                                      // Concatenated parameters
        _username,
        ",",
        AdvancedStrings.uintToString(_dateExpire),
        ",",
        AdvancedStrings.uintToString(_amount),
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
"{evvmID},makeOffer,{username},{dateExpire},{amount},{nameServiceNonce}"
```

## Message Components

The signature verification takes three main parameters:

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"makeOffer"`
- *Purpose*: Identifies this as a make offer operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Target Username (String):**
- The `_username` string itself
- *Purpose*: Specifies the username on which the offer is being placed

**3.2. Offer Expiration Date (String):**
- The result of `AdvancedStrings.uintToString(_dateExpire)`
- *Purpose*: Unix timestamp indicating when this offer expires

**3.3. Offer Amount (String):**
- The result of `AdvancedStrings.uintToString(_amount)`
- *Purpose*: The quantity of tokens being offered in exchange for the username

**3.4. Name Service Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nameServiceNonce)`
- *Purpose*: Provides replay protection for make offer actions

## Example

Here's a practical example of constructing a signature message for making an offer:

**Scenario:** User wants to make an offer on username "alice"

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `_username`: `"alice"`
- `_dateExpire`: `1735689600` (Unix timestamp for January 1, 2025)
- `_amount`: `1000` (tokens)
- `_nameServiceNonce`: `5`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "makeOffer", // action type
    "alice,1735689600,1000,5",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,makeOffer,alice,1735689600,1000,5
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n36",
    "1,makeOffer,alice,1735689600,1000,5"
))
```

**Concatenated parameters breakdown:**
1. `alice` - The username being offered on
2. `1735689600` - Unix timestamp when the offer expires
3. `1000` - Amount of tokens being offered
4. `5` - The offeror's name service nonce

:::tip Technical Details

- **Message Format**: `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Expiration Logic**: `_dateExpire` must be a future Unix timestamp
- **Token Amount**: `_amount` represents the total tokens offered for the username
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks for offer actions
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::

:::tip

- The function selector `d82e5d8b` is the first 4 bytes of the keccak256 hash of the function signature for `verifyMessageSignedForMakeOffer`
- `Strings.toString` converts a number to a string (standard OpenZeppelin utility)
- The signature verification uses the EIP-191 standard for message signing
- The `_dateExpire` parameter should be a Unix timestamp representing when the offer expires
- The `_amount` represents the total amount of tokens being offered for the username

:::
