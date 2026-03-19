---
description: "EIP-191 signature structure for authorizing withdrawOffer operations to cancel previously placed username offers"
sidebar_position: 4
---

# Withdraw Offer Signature Structure

:::info[Centralized Verification]
NameService signatures are **verified by Core.sol** using `validateAndConsumeNonce()`. Uses `NameServiceHashUtils.hashDataForWithdrawOffer()` for hash generation.
:::

To authorize the `withdrawOffer` operation within the Name Service, the user (the original offeror) must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

## Signature Format

```
{evvmId},{senderExecutor},{hashPayload},{originExecutor},{nonce},{isAsyncExec}
```

## Hash Payload Generation

The `hashPayload` is generated using **NameServiceHashUtils.hashDataForWithdrawOffer()**:

```solidity
import {NameServiceHashUtils} from "@evvm/testnet-contracts/library/signature/NameServiceHashUtils.sol";

bytes32 hashPayload = NameServiceHashUtils.hashDataForWithdrawOffer(
    username,  // Username associated with the offer
    offerID    // ID of the offer to withdraw
);

// Internal implementation
// keccak256(abi.encode("withdrawOffer", username, offerID))
```

## Example

**Scenario:** User wants to withdraw their offer on username "alice"

```solidity
string memory username = "alice";
uint256 offerID = 42;

bytes32 hashPayload = NameServiceHashUtils.hashDataForWithdrawOffer(username, offerID);
```

**Message:** `1,0x0000000000000000000000000000000000000000,0x[hashPayload],0x0000000000000000000000000000000000000000,7,true`

:::tip Technical Details
- **Hash Independence**: The hash payload does NOT include executors (only username, offerID)
- **Operation Name**: "withdrawOffer" is included in hash via NameServiceHashUtils
- **Ownership Check**: Only the original offeror can withdraw their offer
:::
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Offer ID Validation**: `_offerId` must correspond to an existing offer made by the same user
- **Authorization**: Only the original offeror can withdraw their own offers
- **Replay Protection**: `_nameServiceNonce` prevents replay attacks
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::
