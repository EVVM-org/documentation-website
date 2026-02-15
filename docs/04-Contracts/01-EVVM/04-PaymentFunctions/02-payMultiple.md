---
title: "payMultiple Function"
description: "Detailed documentation of the EVVM Core Contract's multi-payment processing function with individual success/failure tracking."
sidebar_position: 2
---

# payMultiple Function

**Function Type**: `external`  
**Function Signature**: `payMultiple((address,address,string,address,uint256,uint256,uint256,bool,address,bytes)[])`
**Returns**: `(uint256 successfulTransactions, bool[] memory results)`

Processes multiple payments in a single transaction batch with individual success/failure tracking. Each payment instruction can originate from different senders and supports both staker and non-staker payment types, with comprehensive transaction statistics and detailed results for each operation.



## Parameters

| Parameter | Type      | Description                                                   |
| --------- | --------- | ------------------------------------------------------------- |
| `payData` | PayData[] | An array of structs, each defining a single payment operation |

## Return Values

| Return Value             | Type        | Description                                                 |
| ------------------------ | ----------- | ----------------------------------------------------------- |
| `successfulTransactions` | `uint256`   | Number of payments that completed successfully              |
| `results`                | `bool[]`    | Boolean array indicating success/failure for each payment  |

## `PayData` Struct

Defines the complete set of parameters for a single, independent payment within the batch.

```solidity
struct PayData {
    address from;
    address to_address;
    string to_identity;
    address token;
    uint256 amount;
    uint256 priorityFee;
    uint256 nonce;
    bool priorityFlag;
    address executor;
    bytes signature;
}
```

| Field         | Type      | Description                                                                                                                                         |
| ------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from`        | `address` | The address of the payment sender whose funds are being transferred and whose signature/nonce are validated.                                        |
| `to_address`  | `address` | Direct recipient address. Used when `to_identity` is empty.                                                                                         |
| `to_identity` | `string`  | Username/identity of the recipient. If provided, the contract resolves it to an address via the NameService.                                        |
| `token`       | `address` | The token address for the transfer.                                                                                                        |
| `amount`      | `uint256` | The quantity of tokens to transfer from `from` to the recipient.                                                                                    |
| `priorityFee` | `uint256` | Fee amount distributed to stakers as reward (only paid if executor is a staker).                                                                    |
| `nonce`       | `uint256` | Nonce value for transaction ordering and replay protection (interpretation depends on `priorityFlag`).                                              |
| `priorityFlag`| `bool`    | Determines nonce type: `true` for asynchronous (custom nonce), `false` for synchronous (sequential nonce).                                          |
| `executor`    | `address` | Address authorized to execute this transaction. Use `address(0)` to allow any address to execute.                                                   |
| `signature`   | `bytes`   | Cryptographic signature ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)) from the `from` address authorizing this payment.                      |

:::info

If you want to know more about the signature structure, refer to the [Payment Signature Structure section](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).

:::

## Execution Methods

This function can be executed by any address, with different behavior depending on whether the executor is a staker:

### Fisher Execution

- A fisher collects multiple authorized `PayData` structures (with valid signatures) from various users through fishing spots.
- The fisher aggregates these into the `payData` array and submits the transaction.
- If the fisher is a staker, they receive priority fees and principal token rewards.

### Direct Execution

- A user or service constructs the `payData` array with one or multiple payment requests.
- They directly call `payMultiple` with appropriate authorization.
- Staker executors receive priority fees and principal token rewards based on successful transactions.


:::warning[Signature Validation Behavior]
 If any signature verification fails during processing, the entire transaction will revert and no payments will be executed. All signatures must be valid for the batch to proceed. Other validation failures (insufficient balance, nonce issues, etc.) will mark individual payments as failed but allow the transaction to continue processing the remaining payments.
:::

## Workflow

The function processes each payment in the `payData` array independently, allowing partial success:

1. **Initialize Results Array**: Creates a boolean array to track individual payment results.

2. **For each payment in the array**:

   a. **Signature Verification**: Validates the `signature` against all payment parameters using `verifyMessageSignedForPay`. Uses the appropriate nonce based on `priorityFlag`. Reverts with `InvalidSignature` if validation fails.

   b. **Executor Validation**: If `executor` is not `address(0)`, checks that `msg.sender` matches the `executor` address. If they don't match, marks the payment as failed and continues to the next payment.

   c. **Nonce Management**: Handles nonce verification and updates based on `priorityFlag`:
   - **Async (priorityFlag = true)**: Checks if the custom nonce hasn't been used, then marks it as used. If already used, marks payment as failed.
   - **Sync (priorityFlag = false)**: Verifies the nonce matches the expected sequential nonce, then increments it. If mismatch, marks payment as failed.

   d. **Recipient Resolution**: Determines the final recipient address:
   - If `to_identity` is provided, resolves it using `verifyStrictAndGetOwnerOfIdentity` from the NameService.
   - If `to_identity` is empty, uses `to_address`.

   e. **Balance Verification**: Checks if the sender has sufficient balance for both `amount` and `priorityFee`. If insufficient, marks payment as failed.

   f. **Payment Execution**: Executes the main transfer using `_updateBalance`. If the transfer fails, marks payment as failed.

   g. **Priority Fee Distribution**: If the payment succeeded and `priorityFee > 0` and the executor is a staker (`isAddressStaker(msg.sender)`), transfers the priority fee to the executor. If this fails, marks payment as failed.

   h. **Result Tracking**: Updates counters and result array based on payment success/failure.

3. **Staker Rewards**: After processing all payments, if the executor is a staker, grants principal token rewards equal to the number of successful transactions using `_giveReward`. 

4. **Return Values**: Returns the count of successful transactions, failed transactions, and the detailed results array.

:::note
Each payment is processed independently - failure of one payment (except for signature validation) doesn't affect others in the batch.
:::
