---
title: "Utilities"
description: "Utility helpers included in evvm-js"
sidebar_position: 5
---

# Utilities

`evvm-js` exposes useful helpers to run signed actions and serialize/execute results.

## execute()

Executes a `SignedAction` using the signer's `writeContract` adapter.

Example:

```ts
import { execute } from "@evvm/evvm-js";

const signedAction = await evvm.pay({
  /* params */
});

// execute directly
const txHash = await execute(signer, signedAction);

// or

const serializedSignedAction = JSON.stringify(signedAction);

// when serialized for transport (through http for example)
const txHash = await execute(signer, serializedSignedAction);
```

### Options

`execute()` can be called with optional arguments:

```ts
const txHash = await execute(signer, signedAction, {
  gas: 10_000,
});
```

where

```ts
interface IExecuteOptions {
  gas?: number;
}
```
