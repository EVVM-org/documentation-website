---
description: "EIP-191 signature structure for username owners to authorize adding custom metadata fields to their identity"
sidebar_position: 7
---

# Add Custom Metadata Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForAddCustomMetadata()` for hash generation.
:::

To authorize the `addCustomMetadata` operation within the Name Service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

## Hash Payload Generation

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForAddCustomMetadata(
    identity,  // Username
    value      // Metadata value
);
// Internal: keccak256(abi.encode("addCustomMetadata", identity, value))
```

## Example

**Scenario:** Owner wants to add custom metadata to their identity "alice"

```solidity
string memory identity = "alice";
string memory value = "https://alice.example.com/profile";

bytes32 hashPayload = NameServiceHashUtils.hashDataForAddCustomMetadata(identity, value);
```

**Message:** `1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,12,true`

:::tip Technical Details
- **Custom Fields**: Allows arbitrary data storage linked to username
- **Owner-Only**: Only current username owner can add metadata
- **Hash Independence**: Hash payload does NOT include executors
:::
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Authorization**: Only the current owner of the identity can add custom metadata
- **Flexible Data**: `_value` can contain any string data (URLs, descriptions, custom information)
- **Metadata Management**: Allows users to associate additional information with their identities
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
