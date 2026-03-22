---
description: "EIP-191 signature structure for username owners to authorize complete removal of their username registration"
sidebar_position: 10
---

# Flush Username Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForFlushUsername()` for hash generation.
:::

To authorize the `flushUsername` operation within the Name Service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

## Hash Payload Generation

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForFlushUsername(username);
// Internal: keccak256(abi.encode("flushUsername", username))
```

## Example

**Scenario:** Owner wants to permanently delete their username "alice"

```solidity
string memory username = "alice";
bytes32 hashPayload = NameServiceHashUtils.hashDataForFlushUsername(username);
```

**Message:** `1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,25,true`

⚠️ **Warning**: This operation is **irreversible** and will permanently delete the username registration and all associated data.

:::tip Technical Details
- **Permanent Deletion**: This operation is **irreversible**
- **Complete Removal**: Deletes username registration and all associated data
- **Owner-Only**: Only current username owner can flush their username
- **Hash Independence**: Hash payload does NOT include executors (only username)
:::
