---
sidebar_position: 5
title: P2P Swap
description: Maker and taker flows for the peer-to-peer order book — post orders, fill them, and read the live order list.
---

# P2P Swap — `/evvm/p2pswap`

Two roles share this page: **Maker** (post orders) and **Taker** (fill
existing orders).

## Make an order

Fields:

- **Offered Token** + **offered amount** — what you're giving up (locked into P2PSwap on submit)
- **Requested Token** + **requested amount** — what you want in return
- **Priority fee** — paid to the relayer that submits your `makeOrder`
  call

Orders don't expire on-chain — they sit in the order book until
filled or cancelled.

When you sign, the offered amount is locked into the swap contract via
the dual-signature pattern (action + EVVM-pay) — see the protocol's
**[Signature Structures Overview](/docs/SignatureStructures/Overview)**
for the action-hash and pay-envelope shapes the contract reconstructs.

## Cancel an order

Pulls the remaining offered tokens back. The form takes a single field — the
order ID, which you can find in the order list below the form.

## Dispatch (fill) an order

`dispatchOrder(orderId, amountOut, amountInMax)`

- **amountOut**: Amount of offeredToken the buyer wants to receive
- **amountInMax**: Maximum amount of requestedToken the buyer is willing to pay (including fee)

Fee = `netPayment × percentageFee / 10_000`. Default `percentageFee` is
**500 basis points (5%)** — configurable via governance.

The collected fee splits per the `basisPointsForReward` config: 50%
seller / 40% service / 10% mateStaker by default.

Partial fills are supported — the order remains active with reduced `amountAvailable` until fully filled or cancelled.

## Where to look in the code

- `packages/nextjs/src/app/evvm/p2pswap/page.tsx` — page composition
- `packages/nextjs/src/lib/evvmSignatures.ts` — `signMakeOrder`,
  `signCancelOrder`, `signDispatchOrder`
- `packages/nextjs/src/utils/transactionExecuters/p2pswapExecuter.ts` —
  submit functions
