---
sidebar_position: 3
---

# Withdrawal Signature Structure 

:::warning

**Currently Not Implemented in SignatureUtils.sol**

The withdrawal signature verification functionality is not currently implemented in the `SignatureUtils.sol` library. The current implementation only includes:
- `verifyMessageSignedForPay` - for single payment operations
- `verifyMessageSignedForDispersePay` - for disperse payment operations

This documentation is preserved for reference and will be updated when withdrawal signature verification is implemented.

:::

To authorize withdrawal operations from the EVVM protocol, the user whose funds are being withdrawn (`from`) must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard.

This signature proves the user's intent and authorization to withdraw a specific `amount` of a `token` to a designated external `addressToReceive` (if any), according to the parameters included in the signed message.

## Expected Signed Message Format

Based on the pattern established in the current SignatureUtils.sol implementation, withdrawal signature verification would likely follow this structure:

```solidity
SignatureRecover.signatureVerification(
    AdvancedStrings.uintToString(evvmID),        // EVVM ID as string
    "withdraw",                      // Action type (expected)
    string.concat(                   // Concatenated parameters
        AdvancedStrings.addressToString(addressToReceive),
        ",",
        AdvancedStrings.addressToString(_token),
        ",",
        AdvancedStrings.uintToString(_amount),
        ",",
        AdvancedStrings.uintToString(_priorityFee),
        ",",
        AdvancedStrings.uintToString(_nonce),
        ",",
        _priorityFlag ? "true" : "false",
        ",",
        AdvancedStrings.addressToString(_executor)
    ),
    signature,
    signer
);
```

### Expected Internal Message Construction

Following the `SignatureRecover` pattern, the function would construct the final message by concatenating:

```solidity
string.concat(evvmID, ",", functionName, ",", inputs)
```

This would result in a message format:
```
"{evvmID},withdraw,{addressToReceive},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}"
```

### Expected EIP-191 Message Hashing

The message would be hashed according to EIP-191 standard:

```solidity
bytes32 messageHash = keccak256(
    abi.encodePacked(
        "\x19Ethereum Signed Message:\n",
        AdvancedStrings.uintToString(bytes(message).length),
        message
    )
);
```

## Expected Message Components

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Expected value: `"withdraw"`
- *Purpose*: Identifies this as a withdrawal operation

**3. Concatenated Parameters (String):**
The parameters would be concatenated with comma separators:

**3.1. Recipient Address (String):**
- The result of `AdvancedStrings.addressToString(addressToReceive)`
- *Purpose*: The destination address on the external network where the withdrawn tokens should be sent via the bridge

**3.2. Token Address (String):**
- The result of `AdvancedStrings.addressToString(_token)`
- *Purpose*: The ERC20 token contract address being withdrawn

**3.3. Amount (String):**
- The result of `AdvancedStrings.uintToString(_amount)`
- *Purpose*: The quantity of the token the user authorizes to be withdrawn

**3.4. Priority Fee (String):**
- The result of `AdvancedStrings.uintToString(_priorityFee)`
- *Purpose*: The fee included in the transaction authorization

**3.5. Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nonce)`
- *Purpose*: Provides replay protection for the transaction

**3.6. Priority Flag (String):**
- `"true"`: If `_priorityFlag` is `true` (asynchronous)
- `"false"`: If `_priorityFlag` is `false` (synchronous)  
- *Purpose*: Explicitly includes the execution mode in the signed message

**3.7. Executor Address (String):**
- The result of `AdvancedStrings.addressToString(_executor)`
- *Purpose*: Specifies the address authorized to submit this withdrawal request

:::warning Expected Technical Details

**This structure is speculative** and based on the pattern used in the implemented payment functions:

- **Expected Message Format**: `"{evvmID},{functionName},{parameters}"`
- **Expected EIP-191 Compliance**: Would use `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Expected Hash Function**: `keccak256` would be used for the final message hash before signing
- **Expected Signature Recovery**: Would use `ecrecover` to verify the signature against the expected signer
- **String Conversion**:
  - `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Priority Flag**: Would determine execution mode (async=`true`, sync=`false`)
- **EVVM ID**: Would identify the specific EVVM instance for signature verification
- **Bridge Integration**: `addressToReceive` would specify the destination on external network

**Note**: The actual implementation may differ from this expected structure when withdrawal functionality is added to SignatureUtils.sol.

:::
