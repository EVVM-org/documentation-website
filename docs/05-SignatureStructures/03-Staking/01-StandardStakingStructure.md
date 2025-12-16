---
sidebar_position: 1
---

# Standard Staking/Unstaking Signature Structure

To authorize standard staking operations like `presaleStaking` or `publicStaking`, or their corresponding unstaking actions, the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. This signature proves the user's intent and authorization to perform a specific staking or unstaking action with a defined amount of staking tokens, according to the parameters provided in the signed message.

## Verification Function

The signature is verified using the `verifyMessageSignedForStake` function:

```solidity
function verifyMessageSignedForStake(
    uint256 evvmID,
    address user,
    bool isExternalStaking,
    bool _isStaking,
    uint256 _amountOfStaking,
    uint256 _nonce,
    bytes memory signature
) internal pure returns (bool)
```

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                                 // EVVM ID as uint256
    isExternalStaking ? "publicStaking" : "presaleStaking", // Action type
    string.concat(                                          // Concatenated parameters
        _isStaking ? "true" : "false",
        ",",
        AdvancedStrings.uintToString(_amountOfStaking),
        ",",
        AdvancedStrings.uintToString(_nonce)
    ),
    signature,
    user
);
```

### Internal Message Construction

Internally, the `SignatureUtil.verifySignature` function constructs the final message by concatenating:

```solidity
string.concat(
    AdvancedStrings.uintToString(evvmID), 
    ",", 
    functionName, 
    ",", 
    inputs
)
```

This results in a message format:
```
"{evvmID},{actionType},{isStaking},{amountOfStaking},{nonce}"
```

Where `{actionType}` is either `"publicStaking"` or `"presaleStaking"` depending on `isExternalStaking`.

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

**1. EVVM ID (uint256):**
- Passed directly as `evvmID` (uint256)
- Internally converted to string with `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Conditional value based on `isExternalStaking`:
  - `"publicStaking"`: When `isExternalStaking` is `true`
  - `"presaleStaking"`: When `isExternalStaking` is `false`
- *Purpose*: Identifies the specific type of staking operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Staking Action Flag (String):**
- `"true"`: If the user intends to stake (`_isStaking` is `true`)
- `"false"`: If the user intends to unstake (`_isStaking` is `false`)
- *Purpose*: Indicates whether the operation is staking or unstaking

**3.2. Staking Amount (String):**
- The result of `AdvancedStrings.uintToString(_amountOfStaking)`
- *Purpose*: The quantity of staking tokens for this operation

**3.3. Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nonce)`
- *Purpose*: Provides replay protection for staking/unstaking operations

## Examples

### Public Staking Example

**Scenario:** User wants to stake 1000 tokens in public staking

**Parameters:**
- `evvmID`: `1`
- `isExternalStaking`: `true` (public staking)
- `_isStaking`: `true` (staking operation)
- `_amountOfStaking`: `1000`
- `_nonce`: `42`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,               // evvmID as uint256
    "publicStaking", // action type
    "true,1000,42",  // concatenated parameters
    signature,
    user
);
```

**Final message to be signed:**
```
1,publicStaking,true,1000,42
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n29",
    "1,publicStaking,true,1000,42"
))
```

### Presale Unstaking Example

**Scenario:** User wants to unstake 500 tokens from presale staking

**Parameters:**
- `evvmID`: `1`
- `isExternalStaking`: `false` (presale staking)
- `_isStaking`: `false` (unstaking operation)
- `_amountOfStaking`: `500`
- `_nonce`: `43`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,                // evvmID as uint256
    "presaleStaking", // action type
    "false,500,43",   // concatenated parameters
    signature,
    user
);
```

**Final message to be signed:**
```
1,presaleStaking,false,500,43
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n30",
    "1,presaleStaking,false,500,43"
))
```

## Signature Implementation Details

The `SignatureUtil` library performs signature verification in the following steps:

1. **Message Construction**: Concatenates `evvmID`, `functionName`, and `inputs` with commas
2. **EIP-191 Formatting**: Prepends `"\x19Ethereum Signed Message:\n"` + message length
3. **Hashing**: Applies `keccak256` to the formatted message
4. **Signature Parsing**: Splits the 65-byte signature into `r`, `s`, and `v` components
5. **Recovery**: Uses `ecrecover` via `SignatureRecover.recoverSigner` to recover the signer's address
6. **Verification**: Compares recovered address with expected user

### Signature Format Requirements

- **Length**: Exactly 65 bytes
- **Structure**: `[r (32 bytes)][s (32 bytes)][v (1 byte)]`
- **V Value**: Must be 27 or 28 (automatically adjusted if < 27)

:::tip Technical Details

- **Message Format**: The final message follows the pattern `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Hash Function**: `keccak256` is used for the final message hash before signing
- **Signature Recovery**: Uses `ecrecover` to verify the signature against the expected user
- **Action Types**: `"publicStaking"` for external staking, `"presaleStaking"` for internal staking
- **Dual Operations**: Single function handles both staking (`true`) and unstaking (`false`)
- **Nonce Management**: Each nonce should be unique to prevent replay attacks
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
