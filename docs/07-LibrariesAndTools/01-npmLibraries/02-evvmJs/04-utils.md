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

const signedAction = await core.pay({
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

## Server-Side Validation

Use Zod schemas to validate incoming signed actions on the server or fisher side. This is essential when building payment middleware (e.g., with `@evvm/x402`).

### Validate a Signed Action

```typescript
import { 
  getSerializableSignedActionSchema, 
  PayDataSchema 
} from "@evvm/evvm-js";

const { success, data, error } = 
  getSerializableSignedActionSchema(PayDataSchema).safeParse(payload);

if (!success) {
  console.error("Validation failed:", error.message);
  return invalidPaymentResponse("Invalid signed action payload");
}

// Continue with signature verification...
```

### Available Schemas

| Schema | Description |
|--------|-------------|
| **Core** | |
| `PayDataSchema` | Zod schema for pay action data |
| `DispersePayDataSchema` | Zod schema for dispersePay action data |
| **Staking** | |
| `PresaleStakingDataSchema` | Zod schema for presale staking |
| `PublicStakingDataSchema` | Zod schema for public staking |
| `GoldenStakingDataSchema` | Zod schema for golden staking |
| **P2PSwap** | |
| `MakeOrderDataSchema` | Zod schema for making an order |
| `CancelOrderDataSchema` | Zod schema for canceling an order |
| `DispatchOrderDataSchema` | Zod schema for dispatching an order |
| `DispatchOrderFixedFeeDataSchema` | Zod schema for dispatching with fixed fee |
| **NameService** | |
| `AcceptOfferDataSchema` | Zod schema for accepting an offer |
| `AddCustomMetadataDataSchema` | Zod schema for adding custom metadata |
| `FlushCustomMetadataDataSchema` | Zod schema for flushing custom metadata |
| `FlushUsernameDataSchema` | Zod schema for flushing username |
| `MakeOfferDataSchema` | Zod schema for making an offer |
| `PreRegistrationUsernameDataSchema` | Zod schema for pre-registration |
| `RegistrationUsernameDataSchema` | Zod schema for username registration |
| `RemoveCustomMetadataDataSchema` | Zod schema for removing custom metadata |
| `RenewUsernameDataSchema` | Zod schema for renewing username |
| `WithdrawOfferDataSchema` | Zod schema for withdrawing an offer |

### Helper Functions

| Function | Description |
|----------|-------------|
| `getSerializableSignedActionSchema(dataSchema)` | Creates a Zod schema for validating a full signed action (includes functionName, functionAbi, contractAddress, chainId, evvmId, data, args) |
| `createSerializableSchema(schema)` | Transforms a Zod schema to use strings instead of BigInt (for serialization) |
| `SchemaOutput<T>` | Type helper - output type of a transformed Zod schema |
| `SerializeBigInts<T>` | Type helper - serializable type with BigInt fields as strings |

### How It Works

1. Receive the `PAYMENT-SIGNATURE` header from the client
2. Parse it using `@evvm/x402`'s `parseHeader()`
3. Use `getSerializableSignedActionSchema(PayDataSchema).safeParse()` to validate the structure
4. Pass the validated `signedAction` to the facilitator for signature verification

See the [x402-demo backend](https://github.com/menuRivera/x402-demo/tree/main/backend) for a complete example.
