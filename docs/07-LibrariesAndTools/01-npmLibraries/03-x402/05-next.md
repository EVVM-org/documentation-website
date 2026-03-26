---
title: "Next.js"
description: "Next.js 15+ App Router middleware for EVVM payments"
sidebar_position: 5
---

# Next.js Middleware

The Next.js middleware works with Next.js 15+ App Router. It uses the Edge Runtime for optimal performance.

## Install

```bash
npm install @evvm/x402 @evvm/evvm-js next@^15
```

## Usage

### 1. Create the facilitator

```typescript
// src/facilitator.ts
import { LocalFacilitator } from "@evvm/x402";
import { createSignerWithEthers } from "@evvm/evvm-js";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const signer = await createSignerWithEthers(wallet);

export const facilitator = new LocalFacilitator(signer);
```

### 2. Create the middleware

```typescript
// middleware.ts
import { createEvvmMiddlewareNext } from "@evvm/x402";
import { facilitator } from "./src/facilitator";

const offers = [
  {
    scheme: "evvm",
    network: "eip155:11155111",
    amount: "1000000000000000",
    asset: "0x0000000000000000000000000000000000000000",
    payTo: "0xReceiverAccount",
    maxTimeoutSeconds: 300,
    extra: {
      coreContractAddress: "0xYourCoreContractAddress",
      evvmId: 1,
    },
  },
];

export default createEvvmMiddlewareNext(facilitator, offers);

export const config = {
  matcher: "/api/:path*",
};
```

## API Reference

### createEvvmMiddlewareNext

```typescript
function createEvvmMiddlewareNext(
  facilitator: IFacilitator,
  offers: IEvvmSchema[],
): (request: NextRequest) => Promise<Response>;
```

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `facilitator` | `IFacilitator` | Facilitator for payment verification |
| `offers` | `IEvvmSchema[]` | Array of payment offers |

## How It Works

1. **Check for Payment Header** — Looks for `PAYMENT-SIGNATURE` header
2. **Return 402 if Missing** — If not present, returns HTTP 402 with payment requirements
3. **Parse & Validate** — Parses the payment payload and validates the EVVM schema
4. **Verify Signature** — Uses the facilitator to verify the payment signature
5. **Settle Payment** — Executes the payment transaction
6. **Pass to Handler** — Adds `PAYMENT-RESPONSE` header and continues to the route handler

## Route Matcher

Configure which routes are protected using the `config.matcher`:

```typescript
export const config = {
  matcher: [
    "/api/:path*",
    "/protected/:path*",
  ],
};
```

Multiple matchers and complex patterns are supported. See [Next.js docs](https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher) for details.

## Response Headers

The middleware adds headers to successful responses:

| Header | Description |
|--------|-------------|
| `PAYMENT-RESPONSE` | Base64-encoded settlement result |

On 402 responses:

| Header | Description |
|--------|-------------|
| `PAYMENT-REQUIRED` | Base64-encoded payment requirements |

## Client-Side Handling

On the client, you need to handle the 402 response and retry with the payment signature. The implementation extracts the `coreContractAddress` from the payment requirements to create the Core instance dynamically.

For the complete implementation with wallet connection, automatic retry logic, and proper nonce handling, see the [x402-demo client](https://github.com/menuRivera/x402-demo/tree/main/client).

## Full Example

See the [x402-demo](https://github.com/menuRivera/x402-demo) for a complete working example with:
- Next.js 15 App Router
- React client with Wagmi + RainbowKit
- Wallet connection
- Automatic x402 payment handling
