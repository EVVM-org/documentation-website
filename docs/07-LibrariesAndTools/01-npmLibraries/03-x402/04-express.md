---
title: "Express.js"
description: "Express.js middleware for EVVM payments"
sidebar_position: 4
---

# Express.js Middleware

The Express middleware validates incoming payment headers and settles payments before passing requests to your route handlers.

## Install

```bash
npm install @evvm/x402 @evvm/evvm-js
```

## Usage

```typescript
import express from "express";
import { requireEvvmPaymentExpress, LocalFacilitator } from "@evvm/x402";
import { createSignerWithEthers } from "@evvm/evvm-js";
import { ethers } from "ethers";

const app = express();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const signer = await createSignerWithEthers(wallet);
const facilitator = new LocalFacilitator(signer);

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

app.get(
  "/api/secure",
  requireEvvmPaymentExpress(facilitator, offers),
  (req, res) => {
    res.json({ data: "Access granted" });
  }
);

app.listen(3000);
```

## API Reference

### requireEvvmPaymentExpress

```typescript
function requireEvvmPaymentExpress(
  facilitator: IFacilitator,
  offers: IEvvmSchema[],
): RequestHandler;
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
4. **Verify Signature** — Uses the facilitator to verify the payment signature (off-chain)
5. **Settle Payment** — Executes the payment transaction (on-chain)
6. **Pass to Handler** — Adds `PAYMENT-RESPONSE` header and continues to your route

## Response Headers

The middleware adds headers to successful responses:

| Header | Description |
|--------|-------------|
| `PAYMENT-RESPONSE` | Base64-encoded settlement result |

On 402 responses:

| Header | Description |
|--------|-------------|
| `PAYMENT-REQUIRED` | Base64-encoded payment requirements |

## Error Handling

The middleware handles errors and returns appropriate responses:

```typescript
app.use(
  requireEvvmPaymentExpress(facilitator, offers),
  (err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error("Payment error:", err.message);
    res.status(400).json({ error: err.message });
  }
);
```

## Multiple Routes

Apply the middleware to multiple routes:

```typescript
const paymentMiddleware = requireEvvmPaymentExpress(facilitator, offers);

app.get("/api/data", paymentMiddleware, (req, res) => {
  res.json({ data: "Data" });
});

app.post("/api/analyze", paymentMiddleware, (req, res) => {
  res.json({ result: "Analysis complete" });
});
```

## Full Example

See the [x402-demo backend](https://github.com/menuRivera/x402-demo/tree/main/backend) for a complete working example with:
- Nitro server setup
- Multiple protected endpoints
- Payment verification logging
- Error handling
