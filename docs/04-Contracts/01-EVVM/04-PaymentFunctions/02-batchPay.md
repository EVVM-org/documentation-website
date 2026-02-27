---
title: "batchPay Function"
description: "Detailed documentation of the EVVM Core Contract's batch payment processing function with individual success/failure tracking."
sidebar_position: 2
---

# batchPay Function

**Function Type**: `external`  
**Function Signature**: `batchPay((address,address,string,address,uint256,uint256,address,uint256,bool,bytes)[])`
**Returns**: `(uint256 successfulTransactions, bool[] memory results)`

Processes multiple payments in a single transaction batch with individual success/failure tracking. Each payment instruction can originate from different senders and supports both staker and non-staker payment types, with comprehensive transaction statistics and detailed results for each operation.

## Parameters

| Parameter   | Type          | Description                                                   |
| ----------- | ------------- | ------------------------------------------------------------- |
| `batchData` | BatchData[] | An array of structs, each defining a single payment operation |

## Return Values

| Return Value             | Type        | Description                                                 |
| ------------------------ | ----------- | ----------------------------------------------------------- |
| `successfulTransactions` | `uint256`   | Number of payments that completed successfully              |
| `results`                | `bool[]`    | Boolean array indicating success/failure for each payment  |

## `BatchData` Struct

Defines the complete set of parameters for a single, independent payment within the batch.

```solidity
struct BatchData {
    address from;
    address to_address;
    string to_identity;
    address token;
    uint256 amount;
    uint256 priorityFee;
    address senderExecutor;
    uint256 nonce;
    bool isAsyncExec;
    bytes signature;
}
```

| Field            | Type      | Description                                                                                                                                         |
| ---------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `from`           | `address` | The address of the payment sender whose funds are being transferred and whose signature/nonce are validated.                                        |
| `to_address`     | `address` | Direct recipient address. Used when `to_identity` is empty.                                                                                         |
| `to_identity`    | `string`  | Username/identity of the recipient. If provided, the contract resolves it to an address via the NameService.                                        |
| `token`          | `address` | The token address for the transfer.                                                                                                        |
| `amount`         | `uint256` | The quantity of tokens to transfer from `from` to the recipient.                                                                                    |
| `priorityFee`    | `uint256` | Fee amount distributed to stakers as reward (only paid if executor is a staker).                                                                    |
| `senderExecutor` | `address` | Address authorized to execute this transaction. Use `address(0)` to allow any address to execute.                                                   |
| `nonce`          | `uint256` | Nonce value for transaction ordering and replay protection (managed centrally by Core.sol).                                              |
| `isAsyncExec`    | `bool`    | Determines nonce type: `true` for asynchronous (parallel), `false` for synchronous (sequential).                                          |
| `signature`      | `bytes`   | Cryptographic signature ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)) from the `from` address authorizing this payment.                      |

:::info[Signature Structure]
For details on signature construction, refer to the [Payment Signature Structure section](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md). Uses the centralized format: `{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}`.
:::

## Execution Methods

This function can be executed by any address, with different behavior depending on whether the executor is a staker:

### Fisher Execution

- A fisher collects multiple authorized `BatchData` structures (with valid signatures) from various users through fishing spots.
- The fisher aggregates these into the `batchData` array and submits the transaction.
- If the fisher is a staker, they receive priority fees and principal token rewards.

### Direct Execution

- A user or service constructs the `batchData` array with one or multiple payment requests.
- They directly call `batchPay` with appropriate authorization.
- Staker executors receive priority fees and principal token rewards based on successful transactions.

:::warning[Signature Validation Behavior]
If any signature verification fails during processing, the transaction will mark that specific payment as failed but continue processing remaining payments. Individual signature failures do not revert the entire batch. Other validation failures (insufficient balance, nonce issues, etc.) also mark individual payments as failed while allowing the batch to continue.
:::

## Workflow

The function processes each payment in the `batchData` array independently, allowing partial success:

1. **Initialize Staker Status**: Checks once if `msg.sender` is a staker to optimize gas usage across all payments.

2. **Initialize Results Array**: Creates a boolean array to track individual payment results.

3. **For each payment in the array**:

   a. **Signature Verification**: Validates the `signature` using Core.sol's centralized signature verification:
   - Constructs signature payload: `buildSignaturePayload(evvmId, address(this), hashPayload, executor, nonce, isAsyncExec)`
   - `hashPayload` is generated via `CoreHashUtils.hashDataForPay(to_address, to_identity, token, amount, priorityFee)`
   - If signature is invalid, marks payment as failed and continues to next payment.

   b. **User Validation**: Checks if the user is allowed to execute transactions using `canExecuteUserTransaction()`. If not allowed, marks payment as failed.

   c. **Nonce Management**: Handles nonce verification and updates via Core.sol's centralized nonce system based on `isAsyncExec`:
   - **Async (isAsyncExec = true)**: Checks if the nonce hasn't been used via `asyncNonceStatus()`, then marks it as used. If already used or reserved by another service, marks payment as failed.
   - **Sync (isAsyncExec = false)**: Verifies the nonce matches the expected sequential nonce from `nextSyncNonce[from]`, then increments it. If mismatch, marks payment as failed.

   d. **Executor Validation**: If `senderExecutor` is not `address(0)`, checks that `msg.sender` matches the `senderExecutor` address. If they don't match, marks the payment as failed and continues to the next payment.

   e. **Balance Verification**: Checks if the sender has sufficient balance for both `amount` and `priorityFee` (if executor is a staker). If insufficient, marks payment as failed.

   f. **Recipient Resolution**: Determines the final recipient address:
   - If `to_identity` is provided, resolves it using `getOwnerOfIdentity()` from the NameService.
   - If `to_identity` is empty, uses `to_address`.
   - If identity resolution fails, marks payment as failed.

   g. **Payment Execution**: Executes the main transfer using `_updateBalance()` to move tokens from sender to recipient.

   h. **Priority Fee Distribution**: If the payment succeeded and `priorityFee > 0` and the executor is a staker, transfers the priority fee to the executor.

   i. **Result Tracking**: Marks the payment as successful and increments the success counter.

4. **Staker Rewards**: After processing all payments, if the executor is a staker, grants principal token rewards equal to the number of successful transactions using `_giveReward()`. 

5. **Return Values**: Returns the count of successful transactions and the detailed results array.

:::note[Independent Processing]
Each payment is processed independently - failure of one payment (including signature validation) doesn't affect others in the batch. This allows for partial batch execution and maximum flexibility.
:::
