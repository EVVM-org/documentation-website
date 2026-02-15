---
sidebar_position: 2
---

# Disperse Payment Signature Structure

:::info[Centralized Verification]
dispersePay signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. The signature format uses hash-based payload encoding instead of individual parameters.
:::

To authorize disperse payment operations (splitting payments to multiple recipients), the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

Disperse payments allow distributing a total amount of tokens to multiple recipients in a single transaction, with individual amounts specified for each recipient.

## Signature Format

```
{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **serviceAddress**: Core.sol contract address
3. **hashPayload**: Hash of disperse payment parameters (bytes32, from CoreHashUtils)
4. **executor**: Address authorized to execute (address, `0x0...0` for unrestricted)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Execution mode - `true` for async, `false` for sync (boolean)

## Hash Payload Generation

The `hashPayload` is generated using **CoreHashUtils.hashDataForDispersePay()**:

```solidity
import {CoreHashUtils} from "@evvm/testnet-contracts/library/signature/CoreHashUtils.sol";
import {CoreStructs} from "@evvm/testnet-contracts/library/CoreStructs.sol";

bytes32 hashPayload = CoreHashUtils.hashDataForDispersePay(
    toData,        // Array of recipients and amounts
    token,         // ERC20 token address (0x0...0 for ETH)
    amount,        // Total amount (must equal sum of individual amounts)
    priorityFee    // Fee amount in wei
);
```

### Hash Generation Process

CoreHashUtils creates a deterministic hash that includes the recipient array:

```solidity
// Internal implementation (simplified)
function hashDataForDispersePay(
    CoreStructs.DispersePayMetadata[] memory toData,
    address token,
    uint256 amount,
    uint256 priorityFee
) internal pure returns (bytes32) {
    return keccak256(
        abi.encode("dispersePay", toData, token, amount, priorityFee)
    );
}
```

**Key Points:**
- `toData` is an array of `DispersePayMetadata` structs
- Hash includes the action identifier `"dispersePay"`
- Total `amount` must equal sum of individual recipient amounts
- Hash is deterministic: same parameters → same hash

### DispersePayMetadata Struct

Each recipient is defined by:

```solidity
struct DispersePayMetadata {
    uint256 amount;       // Amount to send to this recipient
    bytes32 to;           // Recipient identifier (address or username hash)
}
```

## Centralized Verification

Core.sol verifies the signature using `validateAndConsumeNonce()`:

```solidity
// Called internally by Core.sol.dispersePay()
Core(coreAddress).validateAndConsumeNonce(
    user,          // Signer's address
    hashPayload,   // From CoreHashUtils
    executor,      // Who can execute
    nonce,         // User's nonce
    isAsyncExec,   // Execution mode
    signature      // EIP-191 signature
);
```

**Verification Steps:**
1. Constructs signature message with all 6 components
2. Applies EIP-191 wrapping and hashing
3. Recovers signer from signature
4. Validates signer matches `user` parameter
5. Checks nonce status
6. Validates executor authorization
7. Marks nonce as consumed

## Complete Example: Disperse 0.1 ETH to 3 Recipients

**Scenario:** User distributes 0.1 ETH to three recipients (0.03 + 0.05 + 0.02 ETH)

### Step 1: Prepare Recipient Data

```solidity
import {CoreStructs} from "@evvm/testnet-contracts/library/CoreStructs.sol";

CoreStructs.DispersePayMetadata[] memory toData = 
    new CoreStructs.DispersePayMetadata[](3);

// Recipient 1: Address recipient (0.03 ETH)
toData[0] = CoreStructs.DispersePayMetadata({
    amount: 30000000000000000,
    to: bytes32(uint256(uint160(0x742d7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c)))
});

// Recipient 2: Username recipient (0.05 ETH)
bytes32 aliceHash = keccak256(abi.encodePacked("alice"));
toData[1] = CoreStructs.DispersePayMetadata({
    amount: 50000000000000000,
    to: aliceHash
});

// Recipient 3: Address recipient (0.02 ETH)
toData[2] = CoreStructs.DispersePayMetadata({
    amount: 20000000000000000,
    to: bytes32(uint256(uint160(0x8e3f2b4c5d6a7f8e9c1b2a3d4e5f6c7d8e9f0a1b)))
});
```

### Step 2: Generate Hash Payload

```solidity
address token = address(0);  // ETH
uint256 amount = 100000000000000000;  // 0.1 ETH total
uint256 priorityFee = 5000000000000000;  // 0.005 ETH

bytes32 hashPayload = CoreHashUtils.hashDataForDispersePay(
    toData,
    token,
    amount,
    priorityFee
);

// Result: 0xb7c3f2e9a4d5c8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4
```

### Step 3: Construct Signature Message

**Parameters:**
- `evvmId`: `1`
- `serviceAddress`: `0xCoreContractAddress` (deployed Core.sol)
- `hashPayload`: `0xb7c3f2e9a4d5c8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4`
- `executor`: `0x0000000000000000000000000000000000000000` (unrestricted)
- `nonce`: `25`
- `isAsyncExec`: `false`

**Final Message:**
```
1,0xCoreContractAddress,0xb7c3f2e9a4d5c8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4,0x0000000000000000000000000000000000000000,25,false
```

### Step 4: EIP-191 Formatted Hash

```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n138",
    "1,0xCoreContractAddress,0xb7c3f2e9a4d5c8e7f9b2a3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4,0x0000000000000000000000000000000000000000,25,false"
))
```

### Step 5: User Signs Message

```javascript
// Frontend example (ethers.js)
const message = "1,0xCoreAddress,0xb7c3...d3e4,0x0000...0000,25,false";
const signature = await signer.signMessage(message);
```

### Step 6: Submit Transaction

```solidity
// Call Core.sol dispersePay function
Core(coreAddress).dispersePay(
    toData,        // Recipient array
    token,         // ETH
    amount,        // 0.1 ETH
    priorityFee,   // 0.005 ETH
    executor,      // Unrestricted
    nonce,         // 25
    isAsyncExec,   // false (sync)
    signature      // User's signature
);
```

## Amount Validation

The dispersePay function validates that the total matches sum of individual amounts:

```solidity
// Internal validation in Core.sol
uint256 sum = 0;
for (uint i = 0; i < toData.length; i++) {
    sum += toData[i].amount;
}
require(sum == amount, "Amount mismatch");
```

**Critical:** Always ensure `amount` parameter equals the sum of all recipient amounts.

## Username Resolution

Recipients can be specified as addresses or usernames:

**Address Recipient:**
```solidity
bytes32 recipient = bytes32(uint256(uint160(0x742d...)));  // Left-pad address
```

**Username Recipient:**
```solidity
bytes32 recipient = keccak256(abi.encodePacked("alice"));  // Hash username
```

Core.sol resolves usernames via NameService integration during payment processing.

## Gas Efficiency

Disperse payments are more gas-efficient than multiple individual payments:

**Multiple pay() Calls:**
- Gas cost: ~52,000 per payment
- 3 payments = ~156,000 gas

**Single dispersePay() Call:**
- Gas cost: ~80,000 base + ~25,000 per recipient
- 3 recipients = ~155,000 gas (similar but atomic)

**Benefits:**
- Atomic execution (all or nothing)
- Single signature required
- Single nonce consumption
- Better UX for multi-recipient payments

## Best Practices

### Security
- **Validate recipient count**: Check array length before signing
- **Verify amounts**: Ensure individual amounts sum to total
- **Check recipients**: Validate each recipient address/username
- **Never reuse nonces**: Each signature needs unique nonce

### Development
- **Use CoreHashUtils**: Don't manually construct `hashPayload`
- **Test recipient arrays**: Verify data structure before signing
- **Handle username resolution**: Ensure usernames exist in NameService
- **Track nonces**: Query Core.sol for next available nonce

### Gas Optimization
- **Batch when possible**: Use dispersePay instead of multiple pay() calls
- **Prefer sync execution**: Async costs more due to nonce reservation
- **Optimize recipient count**: Balance atomic execution vs. gas costs
- **Consider payment size**: Large recipient arrays may hit gas limits

## Error Handling

Common validation failures:

```solidity
// Total amount mismatch
require(sum == amount, "Amount mismatch");

// Empty recipient array
require(toData.length > 0, "Empty recipients");

// Insufficient balance
require(balance >= amount + priorityFee, "Insufficient funds");

// Invalid recipient
// Checked during username resolution
```

## Related Operations

- **[Single Payment Signatures](./01-SinglePaymentSignatureStructure.md)** - One-to-one payments
- **[Withdrawal Signatures](./03-WithdrawalPaymentSignatureStructure.md)** - Withdraw from Core balance
- **[Core.sol Payment Functions](../../04-Contracts/01-EVVM/04-PaymentFunctions/03-dispersePay.md)** - Function reference

---

:::tip Key Takeaway
dispersePay provides **atomic multi-recipient payments** with centralized verification, hash-based payload encoding, and improved gas efficiency compared to multiple individual payments.
:::

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                              // EVVM ID as uint256
    "dispersePay",                       // Action type
    string.concat(                       // Concatenated parameters
        AdvancedStrings.bytes32ToString(hashList),
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
"{evvmID},dispersePay,{hashList},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}"
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
- Fixed value: `"dispersePay"`
- *Purpose*: Identifies this as a disperse payment operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Hash List (String):**
- The result of `AdvancedStrings.bytes32ToString(hashList)`
- Where `hashList = sha256(abi.encode(toData))`
- *Purpose*: Ensures signature covers the specific recipient list and amounts

**3.2. Token Address (String):**
- The result of `AdvancedStrings.addressToString(_token)`
- *Purpose*: Identifies the token being distributed

**3.3. Total Amount (String):**
- The result of `AdvancedStrings.uintToString(_amount)`
- *Purpose*: Specifies the total amount being distributed across all recipients

**3.4. Priority Fee (String):**
- The result of `AdvancedStrings.uintToString(_priorityFee)`
- *Purpose*: Specifies the fee paid to staking holders

**3.5. Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nonce)`
- *Purpose*: Provides replay protection for the transaction

**3.6. Priority Flag (String):**
- `"true"`: If `_priorityFlag` is `true` (asynchronous)
- `"false"`: If `_priorityFlag` is `false` (synchronous)
- *Purpose*: Explicitly includes the execution mode in the signed message

**3.7. Executor Address (String):**
- The result of `AdvancedStrings.addressToString(_executor)`
- *Purpose*: Specifies the address authorized to submit this payment request

:::tip

- `AdvancedStrings.bytes32ToString` converts a bytes32 hash to **lowercase hexadecimal** string with "0x" prefix
- `AdvancedStrings.addressToString` converts an address to a lowercase string
- `Strings.toString` converts a number to a string
- `_priorityFlag` indicates whether the payment will be executed asynchronously (`true`) or synchronously (`false`)
- The signature verification uses the `SignatureRecover.signatureVerification` function with structured parameters

:::

## Hash List Structure

The `hashList` component within the signature message is derived by ABI-encoding the entire `toData` array and then computing its `sha256` hash:

```solidity
bytes32 hashList = sha256(abi.encode(toData));
```

This ensures that the signature covers the specific recipient list and amounts.

## Example

Here's a practical example of constructing a signature message for distributing 0.1 ETH to multiple recipients:

**Scenario:** User wants to distribute 0.1 ETH to three recipients using synchronous processing

**Recipients (`toData` array):**
```solidity
DispersePayMetadata[] memory toData = new DispersePayMetadata[](3);
toData[0] = DispersePayMetadata({
    amount: 30000000000000000,  // 0.03 ETH
    to_address: 0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c,
    to_identity: ""
});
toData[1] = DispersePayMetadata({
    amount: 50000000000000000,  // 0.05 ETH
    to_address: address(0),
    to_identity: "alice"
});
toData[2] = DispersePayMetadata({
    amount: 20000000000000000,  // 0.02 ETH
    to_address: 0x8e3f2b4c5d6a7f8e9c1b2a3d4e5f6c7d8e9f0a1b,
    to_identity: ""
});
```

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `hashList`: `sha256(abi.encode(toData))` = `0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b`
- `_token`: `address(0)` (ETH)
- `_amount`: `100000000000000000` (0.1 ETH total)
- `_priorityFee`: `5000000000000000` (0.005 ETH)
- `_nonce`: `25`
- `_priorityFlag`: `false` (synchronous)
- `_executor`: `address(0)` (unrestricted)

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "dispersePay", // action type
    "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b,0x0000000000000000000000000000000000000000,100000000000000000,5000000000000000,25,false,0x0000000000000000000000000000000000000000",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,dispersePay,0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b,0x0000000000000000000000000000000000000000,100000000000000000,5000000000000000,25,false,0x0000000000000000000000000000000000000000
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n188",
    "1,dispersePay,0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b,0x0000000000000000000000000000000000000000,100000000000000000,5000000000000000,25,false,0x0000000000000000000000000000000000000000"
))
```

**Concatenated parameters breakdown:**
1. `0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b` - Hash of recipient data
2. `0x0000000000000000000000000000000000000000` - Token address (ETH)
3. `100000000000000000` - Total amount in wei (0.1 ETH)
4. `5000000000000000` - Priority fee in wei (0.005 ETH)
5. `25` - Nonce
6. `false` - Priority flag (synchronous)
7. `0x0000000000000000000000000000000000000000` - Executor (unrestricted)

## Signature Implementation Details

The `SignatureUtil` library performs signature verification in the following steps:

1. **Message Construction**: Concatenates `evvmID`, `functionName`, and `inputs` with commas
2. **EIP-191 Formatting**: Prepends `"\x19Ethereum Signed Message:\n"` + message length
3. **Hashing**: Applies `keccak256` to the formatted message
4. **Signature Parsing**: Splits the 65-byte signature into `r`, `s`, and `v` components
5. **Recovery**: Uses `ecrecover` via `SignatureRecover.recoverSigner` to recover the signer's address
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
  - `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
  - `AdvancedStrings.bytes32ToString` converts bytes32 hash to **lowercase hexadecimal** with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Hash List Integrity**: `hashList = sha256(abi.encode(toData))` ensures signature covers specific recipients
- **Amount Validation**: Total `_amount` should equal sum of all individual amounts in `toData` array
- **Priority Flag**: Determines execution mode (async=`true`, sync=`false`)
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::

## `DispersePayMetadata` Struct

Defines the payment details for a single recipient within the `toData` array.

```solidity
struct DispersePayMetadata {
    uint256 amount;
    address to_address;
    string to_identity;
}
```

- **amount**: The amount to send to this specific recipient
- **to_address**: Direct address (use `address(0)` if using identity)
- **to_identity**: Username/identity string (empty if using address)
