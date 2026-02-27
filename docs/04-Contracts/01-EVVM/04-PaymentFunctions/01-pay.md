---
title: "pay Function"
description: "Detailed documentation of the EVVM Core Contract's primary single payment processing function."
sidebar_position: 1
---

# pay Function

**Function Type**: `external`  
**Function Signature**: `pay(address,address,string,address,uint256,uint256,address,uint256,bool,bytes)`

The `pay` function executes a payment from one address to a single recipient address or identity. This is EVVM Core's primary single payment function with intelligent staker detection and centralized signature verification.

**Key features:**
- **Single Payment**: Transfers tokens from one sender to one recipient (address or username)
- **Staker Detection**: Automatically detects if the executor is a staker and distributes rewards accordingly
- **Centralized Nonce Management**: Uses Core.sol's unified nonce system for enhanced security
- **Identity Resolution**: Can send payments to usernames which are resolved to addresses via NameService
- **Signature Verification**: Validated through Core.sol's centralized signature system

The function supports both synchronous and asynchronous nonce management through the `isAsyncExec` parameter, making it flexible for various execution patterns and use cases. For details on nonce types, see [Nonce Types in EVVM](../02-NonceTypes.md). For signature details, see [Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).

### Parameters

| Field            | Type      | Description                                                                                                                                    |
|------------------|-----------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `from`           | `address` | The address of the payment sender whose funds are being transferred and whose signature/nonce are validated.                                   |
| `to_address`     | `address` | Direct recipient address. Used when `to_identity` is empty.                                                                                    |
| `to_identity`    | `string`  | Username/identity of the recipient. If provided, the contract resolves it to an address via the NameService.                                   |
| `token`          | `address` | The token contract address for the transfer.                                                                                                   |
| `amount`         | `uint256` | The quantity of tokens to transfer from `from` to the recipient.                                                                               |
| `priorityFee`    | `uint256` | Additional fee for transaction priority. If the executor is a staker, they receive this fee as a reward.                                       |
| `senderExecutor` | `address` | Address authorized to execute this transaction. Use `address(0)` to allow any address to execute.                                              |
| `nonce`          | `uint256` | Transaction nonce value managed by Core.sol. Usage depends on `isAsyncExec`: if `false` (sync), must equal the expected synchronous nonce; if `true` (async), can be any unused nonce. |
| `isAsyncExec`    | `bool`    | Execution type flag: `false` = synchronous nonce (sequential), `true` = asynchronous nonce (parallel).                                          |
| `signature`      | `bytes`   | Cryptographic signature ([EIP-191](https://eips.ethereum.org/EIPS/eip-191)) from the `from` address authorizing this payment. Validated by Core.sol's centralized signature system.                 |

:::note[Centralized Nonce Management]
The `nonce` parameter is managed centrally by Core.sol. When `isAsyncExec` is `false` (synchronous), the provided `nonce` must equal `Core.getNextCurrentSyncNonce(from)`. When `true` (asynchronous), the nonce can be any value not yet used, checked via `Core.getIfUsedAsyncNonce(from, nonce)`.
:::

### Execution Methods

The function can be executed in multiple ways:

#### Fisher Execution

1. A user signs the payment details and sends the request (parameters + signature) to a fishing spot.
2. A fisher (preferably a staker for rewards) captures the transaction and validates the request.
3. The fisher submits the transaction to the function for processing and receives rewards if they are a staker.

#### Direct Execution

1. The user or any authorized service directly calls the `pay` function.
2. If a `senderExecutor` address is specified, only that address can submit the transaction.
3. If `senderExecutor` is set to `address(0)`, anyone can execute the transaction with a valid signature.

:::tip[Additional Security Using Executor Address]
When using a service as the executor, we recommend specifying the service's address in the `senderExecutor` parameter for additional security.
:::

### Workflow

1. **Signature Verification**: Validates the `signature` using Core.sol's centralized signature verification system:
   - Constructs signature payload: `buildSignaturePayload(evvmId, address(this), hashPayload, senderExecutor, nonce, isAsyncExec)`
   - `hashPayload` is generated via `CoreHashUtils.hashDataForPay(to_address, to_identity, token, amount, priorityFee)`
   - Recovers signer and compares with `from` address. Reverts with `InvalidSignature` on failure.

2. **User Validation**: Checks if the user is allowed to execute transactions using `canExecuteUserTransaction(from)`. Reverts with `UserCannotExecuteTransaction` if not allowed.

3. **Nonce Management**: Core.sol handles nonce verification and updates based on `isAsyncExec`:
   - **Async (isAsyncExec = true)**: Checks if the nonce hasn't been used via `asyncNonceStatus(from, nonce)`, then marks it as used. Reverts with `AsyncNonceAlreadyUsed` if already used, or `AsyncNonceIsReservedByAnotherService` if reserved by another service.
   - **Sync (isAsyncExec = false)**: Verifies the nonce matches `nextSyncNonce[from]`, then increments it. Reverts with `SyncNonceMismatch` on mismatch.

4. **Executor Validation**: If `senderExecutor` is not `address(0)`, checks that `msg.sender` matches the `senderExecutor` address. Reverts with `SenderIsNotTheSenderExecutor` if they don't match.

5. **Resolve Recipient Address**: Determines the final recipient address:
   - If `to_identity` is provided (not empty), resolves the identity to an owner address using `verifyStrictAndGetOwnerOfIdentity` from the NameService contract.
   - If `to_identity` is empty, uses the provided `to_address`.

6. **Balance Update**: Executes the payment transfer using the `_updateBalance` function, sending `amount` of `token` from the `from` address to the resolved recipient address.

7. **Staker Benefits Distribution**: If the executor (`msg.sender`) is a registered staker:
   - **Priority Fee Transfer**: If `priorityFee > 0`, transfers the `priorityFee` amount of `token` from the `from` address to the `msg.sender` (executor) as a staker reward.
   - **Principal Token Reward**: Grants 1x reward amount in principal tokens to the `msg.sender` (executor) using the `_giveReward` function.

:::info

For more information about the signature structure, refer to the [Payment Signature Structure section](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).

:::

:::tip
**Need to send from one user to multiple recipients?**  
Use [dispersePay](./03-dispersePay.md) to send tokens from a single sender to multiple different addresses or identities in one transaction.

**Need to execute multiple separate payments?**  
Use [batchPay](./02-batchPay.md) to process several individual `pay` operations within a single transaction, each with their own sender, recipient, and parameters.
:::

