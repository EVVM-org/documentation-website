---
description: "EIP-191 signature structure for username owners to authorize removal of all custom metadata entries"
sidebar_position: 9
---

# Flush Custom Metadata Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForFlushCustomMetadata()` for hash generation.
:::

To authorize the `flushCustomMetadata` operation within the Name Service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

## Hash Payload Generation

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForFlushCustomMetadata(identity);
// Internal: keccak256(abi.encode("flushCustomMetadata", identity))
```

## Example

**Scenario:** Owner wants to flush all custom metadata from their identity "alice"

```solidity
string memory identity = "alice";
bytes32 hashPayload = NameServiceHashUtils.hashDataForFlushCustomMetadata(identity);
```

**Message:** `1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,20,true`

:::tip Technical Details
- **Batch Removal**: Removes ALL custom metadata entries at once
- **Owner-Only**: Only current username owner can flush metadata
- **Hash Independence**: Hash payload does NOT include executors (only identity)
- **Difference from Remove**: Unlike `removeCustomMetadata` which removes specific entries, this removes all
:::
