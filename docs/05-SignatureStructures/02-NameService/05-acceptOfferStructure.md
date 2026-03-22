---
description: "EIP-191 signature structure for username owners to authorize acceptOffer operations, transferring ownership"
sidebar_position: 5
---

# Accept Offer Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForAcceptOffer()` for hash generation.
:::

To authorize the `acceptOffer` operation within the Name Service, the user who **currently owns the username** must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

## Hash Payload Generation

The `hashPayload` is generated using **NameServiceHashUtils.hashDataForAcceptOffer()**:

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForAcceptOffer(
    username,  // Username being sold
    offerID    // ID of the offer to accept
);

// Internal implementation
// keccak256(abi.encode("acceptOffer", username, offerID))
```

## Example

**Scenario:** Current owner of username "alice" wants to accept an offer

```solidity
string memory username = "alice";
uint256 offerID = 123;

bytes32 hashPayload = NameServiceHashUtils.hashDataForAcceptOffer(username, offerID);
```

**Message:** `1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,3,true`

:::tip Technical Details
- **Hash Independence**: The hash payload does NOT include executors (only username, offerID)
- **Operation Name**: "acceptOffer" is included in hash via NameServiceHashUtils
- **Ownership Transfer**: Accepting an offer transfers username ownership to the offeror
- **Owner-Only**: Only the current username owner can accept offers
:::
- **Authorization**: Only the current owner of the username can accept offers
- **Offer Validation**: `_offerId` must correspond to a valid, non-expired offer
- **Ownership Transfer**: Accepting an offer transfers username ownership to the offeror
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
