---
title: "dispersePay Function"
description: "Detailed documentation of the EVVM Core Contract's multi-recipient payment distribution function with staker rewards."
sidebar_position: 3
---

# dispersePay Function

**Function Type**: `external`  
**Function Signature**: `dispersePay(address,(uint256,address,string)[],address,uint256,uint256,address,address,uint256,bool,bytes)`

Distributes tokens from a single sender to multiple recipients with efficient single-source multi-recipient payment distribution. This function uses a single signature to authorize distribution to multiple recipients, supports both direct addresses and identity-based recipients, and includes integrated priority fee and staker reward systems.

The signature structure for these payments is detailed in the [Disperse Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/02-DispersePaySignatureStructure.md) section.

## Parameters

| Parameter        | Type                    | Description                                                                                                                       |
| ---------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `from`           | `address`               | The address of the payment sender whose funds will be distributed.                                                                |
| `toData`         | `DispersePayMetadata[]` | An array detailing each recipient's address/identity and the amount they should receive. See struct below.                        |
| `token`          | `address`               | The token address to be distributed.                                                                                              |
| `amount`         | `uint256`               | The total amount of tokens to distribute across all recipients. Must equal the sum of individual amounts in `toData`.             |
| `priorityFee`    | `uint256`               | Fee amount for the transaction executor (distributed to stakers as reward).                                                       |
| `senderExecutor` | `address`               | Address authorized to execute this transaction (`msg.sender`). Use `address(0)` to allow any service with the correct signature to execute. When set to a specific address, only that executor can consume the nonce. |
| `originExecutor` | `address`               | Address restriction for transaction origin (`tx.origin`). Use `address(0)` to allow any origin. Provides additional security layer for multi-service transaction flows. |
| `nonce`          | `uint256`               | Transaction nonce for replay protection managed by Core.sol. Usage depends on `isAsyncExec`.                                                     |
| `isAsyncExec`    | `bool`                  | Determines nonce type: `true` for asynchronous (parallel), `false` for synchronous (sequential).                        |
| `signature`      | `bytes`                 | Cryptographic signature ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)) from the `from` address authorizing the distribution. |

:::info

If you want to know more about the signature structure, refer to the [Disperse Payment Signature Structure section](../../../05-SignatureStructures/01-EVVM/02-DispersePaySignatureStructure.md).

:::

## `DispersePayMetadata` Struct

Defines the payment details for a single recipient within the `toData` array.

```solidity
struct DispersePayMetadata {
   uint256 amount;
   address to_address;
   string to_identity;
}
```

| Field         | Type      | Description                                                                                                  |
| ------------- | --------- | ------------------------------------------------------------------------------------------------------------ |
| `amount`      | `uint256` | The amount of tokens to be sent to this recipient.                                                           |
| `to_address`  | `address` | Direct recipient address. Used when `to_identity` is an empty string (`""`).                                           |
| `to_identity` | `string`  | Username/identity of the recipient. If provided, the contract resolves it to an address via the NameService. |

:::note
If `to_identity` is an empty string (`""`), the `to_address` field will be used as the recipient's destination address. Otherwise, the contract attempts to resolve the `to_identity` to its owner address using the NameService.
:::

## Execution Methods

This function can be executed by any address, with different behavior depending on whether the executor is a staker:

### Fisher Execution

- A fisher collects multiple disperse payment requests with valid signatures from users through fishing spots.
- The fisher submits the transaction and receives priority fees and principal token rewards if they are a staker.

### Direct Execution

- A user or service directly calls `dispersePay` with appropriate authorization.
- Staker executors receive priority fees and principal token rewards for processing.

:::tip[Executor Security Model]
The dual-executor model provides flexible security:
- **`senderExecutor = address(0)`**: Any service with the correct signature can execute - useful for competitive fisher markets
- **`senderExecutor = specific address`**: Only that specific service can execute - provides deterministic execution guarantees
- **`originExecutor`**: Additionally restricts `tx.origin` for extra security in multi-service flows

When building services that dispatch payments, both `senderExecutor` and `originExecutor` should be set to the service address for clear accountability.
:::

## Workflow {#disperse-pay-workflow}

1. **Signature Verification**: Validates the `signature` using Core.sol's centralized signature verification:
   - Constructs signature payload: `buildSignaturePayload(evvmId, senderExecutor, hashPayload, originExecutor, nonce, isAsyncExec)`
   - `hashPayload` is generated via `CoreHashUtils.hashDataForDispersePay(toData, token, amount, priorityFee)`
   - Recovers signer and compares with `from` address. Reverts with `InvalidSignature` on failure.

2. **Sender Executor Validation**: If `senderExecutor` is not `address(0)`, validates that `msg.sender` matches `senderExecutor`. Reverts with `SenderMismatch` if they don't match. When `address(0)`, any service can execute.

3. **Origin Executor Validation**: If `originExecutor` is not `address(0)`, validates that `tx.origin` matches `originExecutor`. Reverts with `OriginMismatch` if they don't match. Provides additional security for multi-service transactions.

4. **User Validation**: Checks if the user is allowed to execute transactions using `canExecuteUserTransaction(from)`. Reverts with `UserCannotExecuteTransaction` if not allowed.

5. **Nonce Management**: Core.sol handles nonce verification and updates based on `isAsyncExec`:
   - **Async (isAsyncExec = true)**: Checks nonce status via `asyncNonceStatus(from, nonce)`. If `senderExecutor` was `address(0)` in signature, any service can consume it; otherwise only the specified service. Reverts with `AsyncNonceAlreadyUsed` if already used, or `AsyncNonceIsReservedByAnotherService` if reserved by another service.
   - **Sync (isAsyncExec = false)**: Verifies the nonce matches `nextSyncNonce[from]`, then increments it. Reverts with `SyncNonceMismatch` on mismatch.

6. **Staker Check**: Determines if the executor (`msg.sender`) is a registered staker using `isAddressStaker`.

7. **Balance Verification**: Checks that the `from` address has sufficient balance. The required balance depends on staker status:
   - If executor is a staker: `amount + priorityFee`
   - If executor is not a staker: `amount` only (priorityFee is not collected)
   
   Reverts with `InsufficientBalance` if insufficient.

8. **Balance Deduction**: Subtracts the required amount from the sender's balance upfront:
   - If executor is a staker: deducts `amount + priorityFee`
   - If executor is not a staker: deducts `amount` only

9. **Distribution Loop**: Iterates through each recipient in the `toData` array:

   - **Amount Tracking**: Maintains a running total (`accumulatedAmount`) of distributed amounts
   - **Recipient Resolution**:
     - If `to_identity` is provided, verifies the identity exists using `strictVerifyIfIdentityExist` and resolves it to an owner address using `getOwnerOfIdentity`
     - If `to_identity` is empty, uses `to_address`
   - **Token Distribution**: Adds the specified amount to the recipient's balance

10. **Amount Validation**: Verifies that the total distributed amount (`accumulatedAmount`) exactly matches the specified `amount` parameter. Reverts with `InvalidAmount` if mismatch.

11. **Staker Benefits**: If the executor is a staker (`isAddressStaker(msg.sender)`):
   - Grants 1 principal token reward using `_giveReward`
   - Transfers the `priorityFee` to the executor's balance
