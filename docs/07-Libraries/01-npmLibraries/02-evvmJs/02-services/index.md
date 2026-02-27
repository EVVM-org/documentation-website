---
title: "Services Overview"
description: "How to use services in evvm-js"
sidebar_label: Overview
---

# Services

`evvm-js` exposes service classes that help you construct and sign EVVM actions. Services are focused on building correct payloads and signatures — they return `SignedAction` objects which can be executed via `execute()`.

Common services:

- `Core` — core payment helpers: `pay()` and `dispersePay()`.
- `NameService` — identity creation and management helpers.
- `Staking` — stake/unstake and reward helpers.
- `P2PSwap` — utilities for peer-to-peer swaps.

## Using services

In order to use services, the user must first create a signer, please refer to the [signers documentation](/docs/Libraries/npmLibraries/evvmJs/signers) to learn how to create signers using either ethersjs or viem.
After successfully creating a signer, a new service instance can be created, and used to create [SignedActions](#signed-actions) and use [nonces](#nonce-management).

Example: create a `Core` service and sign a payment

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

// `action` is a SignedAction — serialize or pass to `execute()`
```

Notes:

- Services call the read-only contract methods (e.g., `getEvvmID`) via the provided signer to include id/chain context in signatures.
- Services build EIP-191 style messages for signing: `"<evvmId>,<functionName>,<inputs>"`.

## Nonce management

It is up to the user to provide the nonce in every signature creation function call, that's why every service have an utility to either get the current sync nonce, or to validate an arbitrary async nonce, please refer to the [nonces documentation](/docs/ProcessOfATransaction#nonce-verification) to learn more about nonces in the EVVM.

### Sync nonce

Example: get the next sync nonce for the Core service

```ts
import { Core } from "@evvm/evvm-js";

const core = new Core({
  signer,
  address: "EVVM_CONTRACT_ADDRESS",
  chainId: 1,
});

const nonce = await core.getSyncNonce();

const signedAction = await core.pay({
  toAddress: "0xRecipient",
  tokenAddress: "0xToken",
  amount: 100n,
  priorityFee: 0n,
  nonce,
  isAsyncExec: false, // false, because we are using sync nonces
});
```

### Async nonce

Example: use an arbitrary async nonce

```ts
import { Core } from "@evvm/evvm-js";

const core = new Core({
  signer,
  address: "EVVM_CONTRACT_ADDRESS",
  chainId: 1,
});
const nonce = BigInt(getRandomNumber());
const isValidNonce = await core.isValidAsyncNonce(nonce);

if (!isValidNonce) throw new Error("Nonce invalid, has been used before");

const signedAction = await core.pay({
  toAddress: "0xRecipient",
  tokenAddress: "0xToken",
  amount: 100n,
  priorityFee: 0n,
  nonce,
  isAsyncExec: true, // true, because we are using async nonces
});
```

> Every service has it's own nonce records, thus, every service described in this documentation includes the methods `getSyncNonce()` and `isValidAsyncNonce()`

## Signed Actions

Signed actions are designed to encapsulate everything needed to send and [execute](/docs/Libraries/npmLibraries/evvmJs/utils#execute) an EVVM transaction anywhere, this could be the same application where the signature was built, or a [fisher](/docs/HowToMakeAEVVMService#who-are-fishers) that caugh the tx from whatever [fishing spot](/docs/ProcessOfATransaction#3-broadcast-to-fishing-spot) the user decided to use.
