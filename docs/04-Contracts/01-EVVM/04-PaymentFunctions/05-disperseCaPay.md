---
title: "disperseCaPay Function"
description: "Detailed documentation of the EVVM Core Contract's contract-to-multiple-addresses payment distribution function for authorized smart contracts."
sidebar_position: 5
---

# disperseCaPay Function

**Function Type**: `external`  
**Function Signature**: `disperseCaPay((uint256,address)[],address,uint256)`

Contract-to-multiple-addresses payment distribution function that allows authorized smart contracts to distribute tokens to multiple recipients efficiently in a single transaction. This function is optimized for contract-based automated distributions with minimal overhead.

## Key Features

- **Contract-Only Execution:** Only smart contracts can call this function, verified via bytecode presence
- **Direct Address Distribution:** Optimized for direct address transfers without identity resolution
- **Batch Efficiency:** Single transaction distributes to multiple recipients with amount validation
- **No Authorization Overhead:** No signature verification or nonce management required
- **Staker Rewards:** Contracts that are registered stakers receive principal token rewards

## Parameters

| Parameter | Type                      | Description                                                                                                           |
| --------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `toData`  | `DisperseCaPayMetadata[]` | An array detailing each recipient's address and the amount they should receive. See struct below.                     |
| `token`   | `address`                 | The token address to distribute.                                                                                      |
| `amount`  | `uint256`                 | The total amount of tokens to distribute across all recipients. Must equal the sum of individual amounts in `toData`. |

## `DisperseCaPayMetadata` Struct

Defines the payment details for a single recipient within the `toData` array.

```solidity
struct DisperseCaPayMetadata {
   uint256 amount;
   address toAddress;
}
```

| Field       | Type      | Description                                     |
| ----------- | --------- | ----------------------------------------------- |
| `amount`    | `uint256` | The amount of tokens to send to this recipient. |
| `toAddress` | `address` | The recipient's direct wallet address.          |

## Workflow

1. **Contract Verification**: Validates that the caller (`msg.sender`) is a smart contract by checking its bytecode size using `extcodesize`. Reverts with `NotAnCA` if the caller is an Externally Owned Account (EOA).

2. **Balance Verification**: Checks that the calling contract has sufficient token balance to cover the total distribution amount. Reverts with `InsufficientBalance` if insufficient.

3. **Balance Deduction**: Subtracts the total `amount` from the calling contract's token balance upfront.

4. **Distribution Loop**: Iterates through each recipient in the `toData` array:

   - **Amount Tracking**: Maintains a running total (`accumulatedAmount`) of distributed amounts
   - **Overflow Check**: Validates that accumulated amount doesn't exceed the total amount during iteration
   - **Token Distribution**: Adds the specified amount directly to each recipient's balance

5. **Final Amount Validation**: Verifies that the total distributed amount exactly matches the specified `amount` parameter. Reverts with `InvalidAmount` if there's a mismatch.

6. **Staker Reward**: If the calling contract is a registered staker (`isAddressStaker(msg.sender)`), grants 1 principal token reward using `_giveReward`.
