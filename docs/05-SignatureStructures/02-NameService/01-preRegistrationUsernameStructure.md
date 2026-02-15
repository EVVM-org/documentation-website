---
sidebar_position: 1
---

# Username Pre-Registration Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. This applies to the commit phase of username registration.
:::

To authorize the `preRegistrationUsername` operation (commit phase of username registration), the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard.

Pre-registration uses a **commit-reveal scheme** to prevent front-running: users first commit a hash of their desired username + secret lock number, then reveal it within 30 minutes.

## Signature Format

```
{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **serviceAddress**: NameService.sol contract address
3. **hashPayload**: Hash of pre-registration parameters (bytes32, from NameServiceHashUtils)
4. **executor**: Address authorized to execute (address, `0x0...0` for unrestricted)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Execution mode - `true` for async, `false` for sync (boolean)

## Hash Payload Generation

The `hashPayload` is generated using **NameServiceHashUtils.hashDataForPreRegistrationUsername()**:

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

// Step 1: Create username commitment
bytes32 hashUsername = keccak256(abi.encodePacked(username, lockNumber));

// Step 2: Generate hash payload
bytes32 hashPayload = NameServiceHashUtils.hashDataForPreRegistrationUsername(
    hashUsername  // Commitment hash
);
```

### Hash Generation Process

NameServiceHashUtils creates a deterministic hash:

```solidity
// Internal implementation (simplified)
function hashDataForPreRegistrationUsername(
    bytes32 hashUsername
) internal pure returns (bytes32) {
    return keccak256(abi.encode("preRegistrationUsername", hashUsername));
}
```

**Key Points:**
- `hashUsername` is `keccak256(username + lockNumber)` - prevents front-running
- Lock number must be kept secret until reveal phase (registration)
- Pre-registration valid for 30 minutes
- Hash includes operation identifier `"preRegistrationUsername"`

## Commit-Reveal Scheme

### Phase 1: Commit (Pre-Registration)
```solidity
// Secret values (kept private)
string memory username = "alice";
uint256 lockNumber = 123456789;  // Random secret

// Create commitment
bytes32 hashUsername = keccak256(abi.encodePacked(username, lockNumber));

// Generate hash payload
bytes32 hashPayload = NameServiceHashUtils.hashDataForPreRegistrationUsername(
    hashUsername
);

// Sign and submit pre-registration
// (signature includes hashPayload, but NOT username or lockNumber)
```

### Phase 2: Reveal (Registration - within 30 minutes)
```solidity
// Reveal secret values
NameService.registrationUsername(
    username,      // "alice" (revealed)
    lockNumber,    // 123456789 (revealed)
    ...signature params...
);

// Contract verifies: keccak256(username, lockNumber) == stored hashUsername
```

**Security:** Front-runners see only the hash during commit phase, not the actual username.

## Centralized Verification

Core.sol verifies the signature using `validateAndConsumeNonce()`:

```solidity
// Called internally by NameService.sol.preRegistrationUsername()
Core(coreAddress).validateAndConsumeNonce(
    user,          // Signer's address
    hashPayload,   // From NameServiceHashUtils
    executor,      // Who can execute
    nonce,         // User's nonce
    isAsyncExec,   // Execution mode
    signature      // EIP-191 signature
);
```

## Complete Example: Pre-Register "alice"

**Scenario:** User wants to reserve username "alice" with commit-reveal

### Step 1: Generate Commitment

```solidity
string memory username = "alice";
uint256 lockNumber = 987654321;  // Keep this secret!

bytes32 hashUsername = keccak256(abi.encodePacked(username, lockNumber));
// Result: 0xa7f3c2d8e9b4f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1
```

### Step 2: Generate Hash Payload

```solidity
bytes32 hashPayload = NameServiceHashUtils.hashDataForPreRegistrationUsername(
    hashUsername
);
// Result: 0xb4c2d8e9f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3
```

### Step 3: Construct Signature Message

**Parameters:**
- `evvmId`: `1`
- `serviceAddress`: `0xNameServiceAddress` (deployed NameService.sol)
- `hashPayload`: `0xb4c2d8e9f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3`
- `executor`: `0x0000000000000000000000000000000000000000` (unrestricted)
- `nonce`: `15`
- `isAsyncExec`: `false`

**Final Message:**
```
1,0xNameServiceAddress,0xb4c2d8e9f1a6c5d8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3,0x0000000000000000000000000000000000000000,15,false
```

### Step 4: Sign and Submit

```javascript
// Frontend (ethers.js)
const message = "1,0xNameServiceAddress,0xb4c2...c2d3,0x0000...0000,15,false";
const signature = await signer.signMessage(message);
```

```solidity
// Submit pre-registration
NameService(nameServiceAddress).preRegistrationUsername(
    hashUsername,   // Commitment (not the username!)
    executor,       // Unrestricted
    nonce,          // 15
    isAsyncExec,    // false (sync)
    signature       // User's signature
);
```

### Step 5: Reveal (Within 30 Minutes)

After pre-registration is confirmed, reveal the username and lock number:

```solidity
// Now reveal the actual values
NameService(nameServiceAddress).registrationUsername(
    username,       // "alice" (revealed)
    lockNumber,     // 987654321 (revealed)
    executor,
    nonce + 1,      // New nonce
    isAsyncExec,
    registrationSignature  // New signature for registration
);
```

## Security Considerations

### Front-Running Protection
- **Commit phase**: Only hash is public, actual username is hidden
- **Reveal phase**: Must match commitment within 30 minutes
- **Attack prevention**: Front-runners can't steal username without lock number

### Time Window
```solidity
// Pre-registration expires after 30 minutes
require(block.timestamp <= preRegTime + 30 minutes, "Expired");
```

**Important:** Complete registration within 30 minutes or pre-registration expires.

### Lock Number Requirements
- **Randomness**: Use cryptographically random lock number
- **Secrecy**: Never share lock number before reveal phase
- **Storage**: Store securely client-side until registration
- **Size**: uint256 (0 to 2^256-1)

## Gas Costs

**Pre-Registration:**
- Base cost: ~50,000 gas
- Signature verification: ~5,000 gas
- Storage: ~20,000 gas
- **Total:** ~75,000 gas

**Registration (Reveal):**
- Base cost: ~100,000 gas
- Username storage: ~40,000 gas
- Payment: 100x EVVM reward
- **Total:** ~140,000 gas + payment

## Best Practices

### Security
- **Generate random lock numbers**: Use `crypto.randomBytes(32)` or equivalent
- **Never reuse lock numbers**: Each username needs unique lock number
- **Store safely**: Keep lock number in secure local storage
- **Complete quickly**: Register within 30-minute window

### Development
- **Use NameServiceHashUtils**: Don't manually construct hashes
- **Validate username**: Check format before committing
- **Track expiration**: Monitor 30-minute countdown
- **Handle failures**: Implement retry logic for expired pre-registrations

### UX Optimization
- **Show countdown**: Display time remaining for reveal
- **Warn before expiry**: Alert user when < 5 minutes remain
- **Auto-proceed**: Automatically trigger registration after commit
- **Cache lock number**: Store encrypted in browser local storage

## Error Handling

Common validation failures:

```solidity
// Pre-registration expired
require(block.timestamp <= preRegTime + 30 minutes, "Expired");

// Username already taken
require(!isUsernameTaken(username), "Username exists");

// Commitment mismatch (during reveal)
require(
    keccak256(abi.encodePacked(username, lockNumber)) == storedHash,
    "Invalid reveal"
);
```

## Related Operations

- **[Registration Signature](./02-registrationUsernameStructure.md)** - Reveal phase (complete registration)
- **[NameService Functions](../../04-Contracts/02-NameService/01-Overview.md)** - Complete NameService reference
- **[Core.sol Verification](../../04-Contracts/01-EVVM/03-SignatureAndNonceManagement.md)** - Signature verification system

---

:::tip Key Takeaway
Pre-registration uses **commit-reveal with centralized verification**. The hash-based approach prevents front-running while Core.sol handles signature validation.
:::

:::note[All NameService Signatures]
All 10 NameService operations follow this pattern:
- preRegistrationUsername (commit phase)
- registrationUsername (reveal phase)
- makeOffer, withdrawOffer, acceptOffer (marketplace)
- renewUsername (extend expiration)
- addCustomMetadata, removeCustomMetadata, flushCustomMetadata
- flushUsername (delete account)

Each uses its respective `NameServiceHashUtils.hashDataFor...()` function.
:::

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "preRegistrationUsername",                          // Action type
    string.concat(                                      // Concatenated parameters
        AdvancedStrings.bytes32ToString(_hashUsername),
        ",",
        AdvancedStrings.uintToString(_nameServiceNonce)
    ),
    signature,
    signer
);
```

### Internal Message Construction

Internally, the `SignatureUtil.verifySignature` function constructs the final message by concatenating:

```solidity
string.concat(evvmID, ",", functionName, ",", inputs)
```

This results in a message format:
```
"{evvmID},preRegistrationUsername,{hashUsername},{nameServiceNonce}"
```

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

This creates the final hash that the user must sign with their private key.

## Message Components

The signature verification takes three main parameters:

**1. EVVM ID (String):**
- The result of `AdvancedStrings.uintToString(evvmID)`
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"preRegistrationUsername"`
- *Purpose*: Identifies this as a username pre-registration operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Username Hash (String):**
- The result of `AdvancedStrings.bytes32ToString(_hashUsername)`
- *Purpose*: String representation of the `bytes32` hash commitment being pre-registered

**3.2. Name Service Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nameServiceNonce)`
- *Purpose*: Provides replay protection for pre-registration actions by the user

## Example

Here's a practical example of constructing a signature message for pre-registering a username:

**Scenario:** User wants to pre-register the username "alice" with a secret clowNumber

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- Username: `"alice"`
- ClowNumber: `123456789` (secret value)
- `_hashUsername`: `keccak256(abi.encodePacked("alice", 123456789))` = `0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef`
- `_nameServiceNonce`: `15`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "preRegistrationUsername", // action type
    "0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef,15",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,preRegistrationUsername,0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef,15
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n97",
    "1,preRegistrationUsername,0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef,15"
))
```

**Concatenated parameters breakdown:**
1. `0xa1b2c3d4e5f6789abcdef123456789abcdef123456789abcdef123456789abcdef` - Hash of username and clowNumber
2. `15` - Name Service nonce


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
- **String Conversion**:
  - `AdvancedStrings.bytes32ToString` converts bytes32 values to **lowercase hexadecimal** with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Username Hash**: Must be calculated as `keccak256(abi.encodePacked(_username, _clowNumber))`
- **Commit-Reveal Scheme**: The `_clowNumber` is secret during pre-registration and revealed during registration
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::


## Hash Username Structure

For pre-registration of a username, users must provide a hash of the username. The hash is calculated using keccak256 with the following structure:

```solidity
keccak256(abi.encodePacked(_username, _clowNumber));
```

Where:

- `_username` is the desired username (string)
- `_clowNumber` is the secret key number (uint256) that will be used in the `registrationUsername` function

**Important:** The `_clowNumber` must be kept secret during pre-registration and revealed during the actual registration process.
