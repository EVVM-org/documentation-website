---
description: "EIP-191 signature structure for authorizing makeOffer operations to place offers on registered usernames"
sidebar_position: 3
---

# Make Offer Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForMakeOffer()` for hash generation.
:::

To authorize the `makeOffer` operation within the Name Service, the user (the offeror) must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **senderExecutor**: Address that can call the function via msg.sender (`0x0...0` for anyone)
3. **hashPayload**: Hash of offer parameters (bytes32, from NameServiceHashUtils)
4. **originExecutor**: EOA that can initiate the transaction via tx.origin (`0x0...0` for anyone)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Always `true` for NameService (async execution)

## Hash Payload Generation

The `hashPayload` is generated using **NameServiceHashUtils.hashDataForMakeOffer()**:

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForMakeOffer(
    username,        // Target username
    amount,          // Offer amount in tokens
    expirationDate   // Unix timestamp when offer expires
);

// Internal implementation
// keccak256(abi.encode("makeOffer", username, amount, expirationDate))
```

## Example

**Scenario:** User wants to make an offer on username "alice"

**Step 1: Generate Hash Payload**
```solidity
string memory username = "alice";
uint256 amount = 1000;  // tokens
uint256 expirationDate = 1735689600;  // January 1, 2025

bytes32 hashPayload = NameServiceHashUtils.hashDataForMakeOffer(
    username,
    amount,
    expirationDate
);
```

**Step 2: Construct and Sign Message**
```
1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,5,true
```

:::tip Technical Details
- **Hash Independence**: The hash payload does NOT include executors (only username, amount, expirationDate)
- **Operation Name**: "makeOffer" is included in hash via NameServiceHashUtils
- **Async Execution**: Always uses async nonces (`isAsyncExec: true`)
:::

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
