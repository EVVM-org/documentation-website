---
description: "EIP-191 signature structure for username owners to authorize removal of specific custom metadata entries"
sidebar_position: 8
---

# Remove Custom Metadata Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForRemoveCustomMetadata()` for hash generation.
:::

To authorize the `removeCustomMetadata` operation within the Name Service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

## Hash Payload Generation

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForRemoveCustomMetadata(
    username,  // Username
    key        // Metadata key/index to remove
);
// Internal: keccak256(abi.encode("removeCustomMetadata", username, key))
```

## Example

**Scenario:** Owner wants to remove custom metadata from their username "alice"

```solidity
string memory username = "alice";
uint256 key = 3;  // Metadata entry identifier

bytes32 hashPayload = NameServiceHashUtils.hashDataForRemoveCustomMetadata(username, key);
```

**Message:** `1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,15,true`

:::tip Technical Details
- **Selective Removal**: Removes a specific metadata entry by key
- **Owner-Only**: Only current username owner can remove metadata
- **Hash Independence**: Hash payload does NOT include executors (only username, key)
:::
- `3`: The key/index of the specific metadata entry to remove
- `15`: The current username owner's nonce

This message would then be signed using EIP-191 standard, and the resulting signature would be used to verify the metadata removal request in the `verifyMessageSignedForRemoveCustomMetadata` function.
   
:::tip

- The function selector `8adf3927` is the first 4 bytes of the keccak256 hash of the function signature for `verifyMessageSignedForRemoveCustomMetadata`
- `Strings.toString` converts a number to a string (standard OpenZeppelin utility)
- The signature verification uses the EIP-191 standard for message signing
- Only the current owner of the username can remove custom metadata from their username
- The `_key` parameter identifies which specific metadata entry to remove by its index/identifier
- The `_nonce` parameter is the user's general nonce, not specifically the name service nonce

:::
