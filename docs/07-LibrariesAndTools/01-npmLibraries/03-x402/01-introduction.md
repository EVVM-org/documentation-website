---
title: "Overview"
description: "Middleware for EVVM payments in Express.js and Next.js"
sidebar_position: 1
---

# @evvm/x402

`@evvm/x402` is a TypeScript library for integrating EVVM payments into Node.js and edge applications. It provides middleware for Express.js and Next.js (App Router 15+), along with facilitator utilities for handling payment verification and settlement.

This library implements the [x402 payment protocol](https://x402.org), using EVVM for native payment processing.

## Install

```bash
npm install @evvm/x402 @evvm/evvm-js
# or
bun add @evvm/x402 @evvm/evvm-js
```

## High-level concepts

- **Facilitators** — objects that verify payment signatures and settle payments on-chain. The package includes a built-in `LocalFacilitator` for local verification, or implement a custom `IFacilitator`.
- **Payment Offers** — an array of `IEvvmSchema` objects defining payment requirements (amount, token, recipient, network, etc.).
- **Middleware** — Express.js or Next.js middleware that intercepts requests, validates payments, and returns 402 if payment is missing.
- **Response Headers** — the middleware adds headers to responses:
  - `PAYMENT-REQUIRED` — Base64-encoded payment requirements (402 response)
  - `PAYMENT-RESPONSE` — Base64-encoded settlement result
  - `PAYMENT-SIGNATURE` — Client-provided payment signature

## How it works

1. **Client** requests a protected resource (`GET /protected`)
2. **Backend** responds with `402 Payment Required` + `PAYMENT-REQUIRED` header
3. **Client** signs an EVVM payment authorization (off-chain, gasless)
4. **Client** retries the request with the `PAYMENT-SIGNATURE` header
5. **Backend** validates the signature using EVVM (off-chain)
6. **Backend** settles the payment on-chain via facilitator
7. **Backend** serves the protected content

## Key Features

- **Gasless for users**: Client only signs, doesn't pay gas
- **Off-chain validation**: EVVM validates signatures without on-chain calls
- **Facilitator pays gas**: Gas fees are covered by the facilitator
- **EVVM scheme**: Uses EVVM for payment validation

## Related Links

- [x402 Specification](https://github.com/coinbase/x402)
- [x402 Documentation](https://docs.cdp.coinbase.com/x402/welcome)
- [x402.org](https://x402.org)
- [EVVM Official Site](https://evvm.org)
- [EVVM Documentation](https://evvm.info)
- [@evvm/evvm-js](https://github.com/EVVM-org/evvm-js) - JavaScript SDK for EVVM
