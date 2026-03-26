---
title: "Quick Start"
description: "Get started with @evvm/x402"
sidebar_position: 2
---

# Quick Start

This guide covers both server-side setup (protecting endpoints) and client-side payment flow.

## Server Setup

### 1. Create a facilitator

Create a facilitator file that will verify and settle payments:

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

### 2. Define payment offers

Create an offers file defining your payment requirements:

```typescript
// src/offers.ts
import { IEvvmSchema } from "@evvm/x402";

export const offers: IEvvmSchema[] = [
  {
    scheme: "evvm",
    network: "eip155:11155111", // Ethereum Sepolia
    amount: "1000000000000000", // 0.001 ETH in wei
    asset: "0x0000000000000000000000000000000000000000", // ETH
    payTo: "0xReceiverAccount",
    maxTimeoutSeconds: 300,
    extra: {
      coreContractAddress: "0xYourCoreContractAddress",
      evvmId: 1,
    },
  },
];
```

### 3. Add middleware

The middleware works with Express.js. For other frameworks (Nitro, Fastify, etc.), adapt the pattern:

```typescript
import express from "express";
import { requireEvvmPaymentExpress } from "@evvm/x402";
import { facilitator } from "./facilitator";
import { offers } from "./offers";

const app = express();

app.get(
  "/api/secure",
  requireEvvmPaymentExpress(facilitator, offers),
  (req, res) => {
    res.json({ data: "Access granted" });
  }
);

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
```

## Client-Side Payment

On the client, use `@evvm/evvm-js` to sign payments. The key is to extract the `coreContractAddress` and `originExecutor` from the `PAYMENT-REQUIRED` header to create the Core instance dynamically.

```typescript
import { Core, createSignerWithViem } from "@evvm/evvm-js";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";

// Initialize wallet and signer once
const account = privateKeyToAccount("YOUR_PRIVATE_KEY");
const client = createWalletClient({
  account,
  chain: sepolia,
  transport: http("YOUR_RPC_URL"),
});
const signer = await createSignerWithViem(client);

async function fetchWithPayment(url: string) {
  const response = await fetch(url);

  if (response.status === 402) {
    const paymentRequiredHeader = response.headers.get("PAYMENT-REQUIRED");
    if (!paymentRequiredHeader) throw new Error("No PAYMENT-REQUIRED header");

    // Parse the payment requirements
    const { offers } = JSON.parse(atob(paymentRequiredHeader));
    const required = offers[0];

    // Extract coreContractAddress and originExecutor from the payment requirements
    const coreContractAddress = required.extra.coreContractAddress;
    const originExecutor = required.extra.originExecutor;

    // Create Core instance with the address from the header
    const core = new Core({
      signer,
      address: coreContractAddress,
      chainId: 11155111, // Sepolia
    });

    // Generate a unique nonce using secure random
    const array = new BigUint64Array(1);
    crypto.getRandomValues(array);
    const nonce = array[0];

    // Sign the payment
    const signedAction = await core.pay({
      toAddress: required.payTo,
      tokenAddress: required.asset,
      amount: BigInt(required.amount),
      priorityFee: 0n,
      nonce,
      originExecutor,
      isAsyncExec: true, // Use async execution for gasless payments
    });

    // Build the x402 payment payload (v2 format)
    const paymentPayload = {
      x402Version: 2,
      accepted: required,
      payload: signedAction.toJSON(),
    };

    // Retry request with payment signature
    const retryResponse = await fetch(url, {
      headers: {
        "PAYMENT-SIGNATURE": btoa(JSON.stringify(paymentPayload)),
      },
    });

    return retryResponse.json();
  }

  return response.json();
}

const data = await fetchWithPayment("http://localhost:3000/api/secure");
```

### Key Points

1. **Extract `coreContractAddress`** from `PAYMENT-REQUIRED` header's `extra` field
2. **Extract `originExecutor`** from `extra` field (used in the pay() call)
3. **Create Core instance** dynamically with that address
4. **Use async execution** (`isAsyncExec: true`) for gasless client-side payments
5. **Generate unique nonce** using `crypto.getRandomValues()` for secure randomness
6. **Build x402 v2 payload** with `x402Version`, `accepted`, and `payload` fields

For the full implementation with wallet connection and automatic retry logic, see the [x402-demo client](https://github.com/menuRivera/x402-demo/tree/main/client).

## Full Example

For a complete working example with both backend and frontend, see the [x402-demo](https://github.com/menuRivera/x402-demo):

- **Backend** — Nitro server with x402 middleware
- **Client** — React + Wagmi + RainbowKit for wallet connection and payment signing

The demo includes:
- Wallet connection (MetaMask, Rainbow, Coinbase Wallet)
- Automatic x402 payment handling
- Dynamic Core instance creation (gets `coreContractAddress` from `PAYMENT-REQUIRED` header)
- Protected content access after payment

## Testnet Setup

To test locally, you'll need:

1. **Testnet tokens** — Get from the [EVVM Faucet](https://evvm.dev):
   - ETH for gas (paid by facilitator)
   - MATE (or your chosen token) for payments

2. **Network configuration**:
   | Parameter | Value |
   | --------- | ----- |
   | Chain | Ethereum Sepolia |
   | Network ID | `eip155:11155111` |
   | Token | MATE |
   | Token Address | `0x0000000000000000000000000000000000000001` |

## Next Steps

- [Facilitators](./03-facilitators.md) — Learn about LocalFacilitator and custom implementations
- [Express Middleware](./04-express.md) — Detailed Express.js setup
- [Next.js Middleware](./05-next.md) — Next.js 15+ App Router setup
