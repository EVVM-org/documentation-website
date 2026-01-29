---
title: "EVVM Service"
description: "Documentation for the EVVM service in evvm-js."
sidebar_position: 1
---

# EVVM Service

The `EVVM` service provides helper methods for core payment actions.

## `pay`

Creates and signs a `pay` action to transfer tokens to a recipient.

### Parameters

- `to` (HexString | string): Recipient address (`0x...`) or identity string.
- `tokenAddress` (HexString): The contract address of the token to be transferred.
- `amount` (bigint): The amount of tokens to send.
- `priorityFee` (bigint): The priority fee for the transaction.
- `nonce` (bigint): The EVVM nonce for this action.
- `priorityFlag` (boolean): Whether this action should be prioritized.
- `executor` (HexString, optional): The address of an optional executor.

### Returns

- `Promise<SignedAction<IPayData>>`: A signed action ready for execution.

### Example

```ts
import { EVVM } from "@evvm/evvm-js";

const evvm = new EVVM({
  signer,
  address: "EVVM_CONTRACT_ADDRESS",
  chainId: 1,
  evvmId: 1, // optional
});

const action = await evvm.pay({
  to: "0xRecipient",
  tokenAddress: "0xToken",
  amount: 100n,
  priorityFee: 0n,
  nonce: 1n,
  priorityFlag: false,
});

// The 'action' can be passed to the execute() function
```

## `dispersePay`

Creates and signs a `dispersePay` action to send tokens to multiple recipients in a single transaction.

### Parameters

- `toData` (array): An array of objects, each specifying a recipient and an amount.
  - `amount` (bigint): Amount for the recipient.
  - `toAddress` (HexString, optional): Recipient's address. (required if no toIdentity is provided)
  - `toIdentity` (HexString, optional): Recipient's identity. (required if no toAddress is provided)
- `tokenAddress` (HexString): The contract address of the token.
- `amount` (bigint): The total amount to be dispersed.
- `priorityFee` (bigint): The priority fee.
- `nonce` (bigint): The EVVM nonce.
- `priorityFlag` (boolean): Whether the action is prioritized.
- `executor` (HexString): The executor's address.

### Returns

- `Promise<SignedAction<IDispersePayData>>`: A signed disperse action.

### Example

```ts
const toData = [
  { amount: 50n, toAddress: "0xRecipient1" },
  { amount: 50n, toIdentity: "identity2" },
];

const action = await evvm.dispersePay({
  toData,
  tokenAddress: "0xToken",
  amount: 100n,
  priorityFee: 0n,
  nonce: 2n,
  priorityFlag: false,
  executor: "0xExecutorAddress",
});
```
