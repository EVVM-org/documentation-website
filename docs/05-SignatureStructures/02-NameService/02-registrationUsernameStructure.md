---
description: "EIP-191 signature structure for authorizing the registrationUsername operation, the reveal phase following pre-registration"
sidebar_position: 2
---

# Registration of username Signature Structure 

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForRegistrationUsername()` for hash generation.
:::

To authorize the `registrationUsername` operation (the reveal phase following pre-registration), the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **senderExecutor**: Address that can call the function via msg.sender (`0x0...0` for anyone)
3. **hashPayload**: Hash of registration parameters (bytes32, from NameServiceHashUtils)
4. **originExecutor**: EOA that can initiate the transaction via tx.origin (`0x0...0` for anyone)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Always `true` for NameService (async execution)

## Hash Payload Generation

The `hashPayload` is generated using **NameServiceHashUtils.hashDataForRegistrationUsername()**:

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForRegistrationUsername(
    username,    // The username to register
    lockNumber   // Secret number from pre-registration
);

// Internal implementation
// keccak256(abi.encode("registrationUsername", username, lockNumber))
```

## Centralized Verification

Core.sol verifies the signature using `validateAndConsumeNonce()`:

```solidity
// Called internally by NameService.sol.registrationUsername()
Core(coreAddress).validateAndConsumeNonce(
    user,             // Signer's address
    senderExecutor,   // Who can call via msg.sender
    hashPayload,      // From NameServiceHashUtils
    originExecutor,   // Who can initiate via tx.origin
    nonce,            // User's nonce
    true,             // Always async for NameService
    signature         // EIP-191 signature
);
```

## Example

**Scenario:** User wants to register the username "alice" revealing the secret lockNumber from pre-registration

**Step 1: Generate Hash Payload**
```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

string memory username = "alice";
uint256 lockNumber = 123456789;  // Secret from pre-registration

bytes32 hashPayload = NameServiceHashUtils.hashDataForRegistrationUsername(
    username,
    lockNumber
);
// Result: 0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b
```

**Step 2: Construct Signature Message**
```
1,0x0000000000000000000000000000000000000000,0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b,0x0000000000000000000000000000000000000000,5,true
```

Components:
- `evvmId`: `1`
- `senderExecutor`: `0x0000...` (anyone can call)
- `hashPayload`: `0x1a2b...` (from Step 1)
- `originExecutor`: `0x0000...` (anyone can initiate)
- `nonce`: `5`
- `isAsyncExec`: `true`

**Step 3: Sign with Wallet**
```javascript
const message = "1,0x0000000000000000000000000000000000000000,0x1a2b...a2b,0x0000000000000000000000000000000000000000,5,true";
const signature = await signer.signMessage(message);
```

:::tip Technical Details

- **Commit-Reveal Scheme**: Registration is phase 2 after pre-registration (commit). The lockNumber proves ownership of the pre-registration.
- **Hash Independence**: The hash payload does NOT include executors (only username, lockNumber)
- **Operation Name**: "registrationUsername" is included in hash via NameServiceHashUtils
- **Async Execution**: Always uses async nonces (`isAsyncExec: true`)

:::
    1,  // evvmID as uint256
    "registrationUsername", // action type
    "alice,123456789,5",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,registrationUsername,alice,123456789,5
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n37",
    "1,registrationUsername,alice,123456789,5"
))
```

**Concatenated parameters breakdown:**
1. `alice` - The username to register
2. `123456789` - The secret clowNumber used during pre-registration
3. `5` - The user's name service nonce

**Commit-Reveal Verification:**
The system will verify that `keccak256(abi.encodePacked("alice", 123456789))` matches the hash that was pre-registered.


## Signature Implementation Details

The `SignatureUtil` library performs signature verification in the following steps:

1. **Message Construction**: Concatenates `evvmID`, `functionName`, and `inputs` with commas
2. **EIP-191 Formatting**: Prepends `"\x19Ethereum Signed Message:\n"` + message length
3. **Hashing**: Applies `keccak256` to the formatted message
4. **Signature Parsing**: Splits the 65-byte signature into `r`, `s`, and `v` components
5. **Recovery**: Uses `ecrecover` to recover the signer's address
6. **Verification**: Compares recovered address with expected signer

### Signature Format Requirements

- **Length**: Exactly 65 bytes
- **Structure**: `[r (32 bytes)][s (32 bytes)][v (1 byte)]`
- **V Value**: Must be 27 or 28 (automatically adjusted if < 27)

:::tip Technical Details

- **Message Format**: The final message follows the pattern `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Hash Function**: `keccak256` is used for the final message hash before signing
- **Signature Recovery**: Uses `ecrecover` to verify the signature against the expected signer
- **String Conversion**: `Strings.toString` converts numbers to decimal strings
- **Commit-Reveal Scheme**: The `clowNumber` and username combination must match what was used during pre-registration
- **Hash Verification**: System verifies `keccak256(abi.encodePacked(_username, _clowNumber))` matches pre-registration hash
- **EVVM ID**: Identifies the specific EVVM instance for signature verification
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks for registration actions

:::