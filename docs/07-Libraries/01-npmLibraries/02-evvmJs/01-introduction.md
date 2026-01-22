---
title: "Overview"
description: "JavaScript/TypeScript client library for EVVM"
sidebar_position: 1
---

# evvm-js

`@evvm/evvm-js` is the official TypeScript/JavaScript client library for building and signing EVVM actions, interacting with EVVM services, and executing signed actions on-chain.

This section covers how to use the library from a developer perspective: creating signers, constructing signed actions (payments, disperse, staking, name service), and executing those actions.

## Install

```bash
npm install @evvm/evvm-js
# or
bun add @evvm/evvm-js
# or
yarn add @evvm/evvm-js
```

## High-level concepts

- **Services** — classes (e.g., `EVVM`, `NameService`, `Staking`, `P2PSwap`) that build and sign actions. They do not send transactions directly; they produce `SignedAction` objects.
- **Signers** — adapters that wrap `ethers` or `viem` wallets and expose a consistent `ISigner` interface used by the services.
- **SignedAction** — a serializable object containing ABI args, evvmId, signature, and metadata required to execute the call anywhere.
- **execute()** — helper to push a `SignedAction` through a signer (writes the transaction using the signer’s `writeContract`).

Use the following pages for practical examples: Services, Signers, Types, Utilities.

## Quick Start

Here's a quick example of how to use EVVM JS to sign a payment action:

**With Ethers.js**

```typescript
import { EVVM, execute } from "@evvm/evvm-js";
import { createSignerWithEthers } from "@evvm/evvm-js/signers";
import { ethers } from "ethers";

// 1. Create a signer
const provider = new ethers.JsonRpcProvider("YOUR_RPC_URL");
const privateKey = "YOUR_PRIVATE_KEY";
const wallet = new ethers.Wallet(privateKey, provider);
const signer = await createSignerWithEthers(wallet);

// 2. Instantiate the EVVM service
const evvm = new EVVM(signer, "EVVM_CONTRACT_ADDRESS");

// 3. Call a method to create a signed action
const signedAction = await evvm.pay({
  to: "RECIPIENT_ADDRESS",
  tokenAddress: "TOKEN_ADDRESS",
  amount: 100n, // Use BigInt for amounts
  priorityFee: 0n,
  nonce: 1n,
  priorityFlag: false,
});

// 4. Execute the signed action
const result = await execute(signer, signedAction);
console.log(result);
```

**With Viem**

```typescript
import { EVVM } from "@evvm/evvm-js";
import { createSignerWithViem } from "@evvm/evvm-js/signers";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

// 1. Create a signer
const account = privateKeyToAccount("YOUR_PRIVATE_KEY");
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http("YOUR_RPC_URL"),
});
const signer = await createSignerWithViem(client);

// 2. Instantiate the EVVM service
const evvm = new EVVM(signer, "EVVM_CONTRACT_ADDRESS");

// Continue with steps 3 and 4 exactly as shown in the ethers.js example
```

