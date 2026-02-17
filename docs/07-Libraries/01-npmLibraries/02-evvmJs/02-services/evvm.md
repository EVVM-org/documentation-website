---
title: "Core Service"
description: "Documentation for the Core service in evvm-js."
sidebar_position: 1
---

# Core Service

The `Core` service provides helper methods for core payment actions.

## `pay`

Creates and signs a `pay` action to transfer tokens to a recipient.

### Parameters

- `toAddress` (HexString, optional): Recipient address (`0x...`). Use either `toAddress` **or** `toIdentity`.
- `toIdentity` (string, optional): Recipient identity string. Use either `toAddress` **or** `toIdentity`.
- `tokenAddress` (HexString): The contract address of the token to be transferred.
- `amount` (bigint): The amount of tokens to send.
- `priorityFee` (bigint): The priority fee for the transaction.
- `nonce` (bigint): The EVVM nonce for this action.
- `isAsyncExec` (boolean): `true` for asynchronous execution, `false` for synchronous.
- `senderExecutor` (HexString, optional): Optional senderExecutor address used in the signed message.

### Returns

- `Promise<SignedAction<IPayData>>`: A signed action ready for execution.

### Example

```ts
import { Core } from "@evvm/evvm-js";

const core = new Core({
  signer,
  address: "EVVM_CONTRACT_ADDRESS",
  chainId: 1,
});

const action = await core.pay({
  toAddress: "0xRecipient",
  tokenAddress: "0xToken",
  amount: 100n,
  priorityFee: 0n,
  nonce: 1n,
  isAsyncExec: false,
});

// The 'action' can be passed to the execute() function
```

## `dispersePay`

Creates and signs a `dispersePay` action to send tokens to multiple recipients in a single transaction.

### Parameters

- `toData` (array): An array of objects, each specifying a recipient and an amount.
  - `amount` (bigint): Amount for the recipient.
  - `toAddress` (HexString, optional): Recipient's address. (required if no toIdentity is provided)
  - `toIdentity` (string, optional): Recipient's identity. (required if no toAddress is provided)
- `tokenAddress` (HexString): The contract address of the token.
- `amount` (bigint): The total amount to be dispersed.
- `priorityFee` (bigint): The priority fee.
- `nonce` (bigint): The EVVM nonce.
- `isAsyncExec` (boolean): Whether the action is asynchronous (`true`) or synchronous (`false`).
- `senderExecutor` (HexString): The senderExecutor address used in the signed message.

### Returns

- `Promise<SignedAction<IDispersePayData>>`: A signed disperse action.

### Example

```ts
const toData = [
  { amount: 50n, toAddress: "0xRecipient1" },
  { amount: 50n, toIdentity: "identity2" },
];

const action = await core.dispersePay({
  toData,
  tokenAddress: "0xToken",
  amount: 100n,
  priorityFee: 0n,
  nonce: 2n,
  isAsyncExec: false,
  senderExecutor: "0xExecutorAddress",
});
```
