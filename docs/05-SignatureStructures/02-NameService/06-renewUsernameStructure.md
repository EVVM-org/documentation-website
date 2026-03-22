---
description: "EIP-191 signature structure for username owners to authorize renewUsername operations extending registration validity"
sidebar_position: 6
---

# Renew Username Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForRenewUsername()` for hash generation.
:::

To authorize the `renewUsername` operation within the Name Service, the user (the current username owner) must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

## Hash Payload Generation

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForRenewUsername(username);
// Internal: keccak256(abi.encode("renewUsername", username))
```

## Example

**Scenario:** Current owner wants to renew their username "alice"

```solidity
string memory username = "alice";
bytes32 hashPayload = NameServiceHashUtils.hashDataForRenewUsername(username);
```

**Message:** `1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,8,true`

:::tip Technical Details
- **Owner-Only**: Only the current username owner can renew
- **Extends Registration**: Renewal extends the username's expiration period
- **Hash Independence**: Hash payload does NOT include executors (only username)
:::
