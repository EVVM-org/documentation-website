---
title: "Facilitators"
description: "Payment verification and settlement"
sidebar_position: 3
---

# Facilitators

Facilitators handle payment verification and settlement. They verify that payment signatures are valid and execute the payment transactions on-chain.

## LocalFacilitator

The built-in `LocalFacilitator` verifies signatures and settles payments using a local signer.

### Features

- **Signature Verification** — Recovers the signer from the signature and validates it matches the payer
- **Nonce Validation** — Ensures the transaction nonce is correct (for both sync and async executions)
- **Balance Checks** — Verifies the payer has sufficient balance
- **Payment Settlement** — Executes the EVVM payment transaction

### Usage

```typescript
import { LocalFacilitator } from "@evvm/x402";
import { createSignerWithEthers } from "@evvm/evvm-js";
import { ethers } from "ethers";

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL!);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const signer = await createSignerWithEthers(wallet);

export const facilitator = new LocalFacilitator(signer);
```

### Constructor Options

| Parameter | Type | Description |
|-----------|------|-------------|
| `signer` | `ISigner` | Signer for executing transactions |

## Custom Facilitator

Implement the `IFacilitator` interface for custom payment handling. This is useful when the facilitator lives in a different service or location.

### Interface

```typescript
import type { IFacilitator } from "@evvm/x402";
import type {
  ISerializableSignedAction,
  IPayData,
  HexString,
} from "@evvm/evvm-js";

class CustomFacilitator implements IFacilitator {
  async verifyPaySignature(
    signedAction: ISerializableSignedAction<IPayData>,
  ): Promise<{ success: boolean; error?: string }> {
    // Custom verification logic
    // Return { success: true } if signature is valid
    return { success: true };
  }

  async settlePayment(
    signedAction: ISerializableSignedAction<IPayData>,
  ): Promise<HexString | null> {
    // Custom settlement logic
    // Return transaction hash or null
    return "0xTransactionHash";
  }
}
```

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `verifyPaySignature(signedAction)` | `Promise<{ success: boolean; error?: string }>` | Verifies the payment signature is valid |
| `settlePayment(signedAction)` | `Promise<HexString \| null>` | Settles the payment on-chain, returns tx hash |

### Example: Remote Facilitator

```typescript
import type { IFacilitator } from "@evvm/x402";
import type {
  ISerializableSignedAction,
  IPayData,
  HexString,
} from "@evvm/evvm-js";

class RemoteFacilitator implements IFacilitator {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async verifyPaySignature(
    signedAction: ISerializableSignedAction<IPayData>,
  ): Promise<{ success: boolean; error?: string }> {
    const response = await fetch(`${this.apiUrl}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signedAction),
    });
    
    if (!response.ok) {
      return { success: false, error: "Verification failed" };
    }
    
    return { success: true };
  }

  async settlePayment(
    signedAction: ISerializableSignedAction<IPayData>,
  ): Promise<HexString | null> {
    const response = await fetch(`${this.apiUrl}/settle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(signedAction),
    });
    const data = await response.json();
    return data.txHash;
  }
}
```

## Payment Offers Schema

Payment offers define the payment requirements using `IEvvmSchema`:

```typescript
import { IEvvmSchema } from "@evvm/x402";

export const offers: IEvvmSchema[] = [
  {
    scheme: "evvm",                    // Payment scheme (evvm, erc20, etc.)
    network: "eip155:1",              // Network identifier (eip155:chainId)
    amount: "1000000000000000",       // Amount in wei
    asset: "0x0000000000000000000000000000000000000000", // Token address (ETH = zeros)
    payTo: "0xRecipientAddress",     // Payment recipient
    maxTimeoutSeconds: 300,          // Max payment timeout
    extra: {
      coreContractAddress: "0xCoreContract",
      evvmId: 1,
      originExecutor: "0xExecutor",  // Optional executor
    },
  },
];
```

### Schema Fields

| Field | Type | Description |
|-------|------|-------------|
| `scheme` | string | Payment scheme (use "evvm" for EVVM payments) |
| `network` | string | Network ID in EIP-155 format (e.g., "eip155:1") |
| `amount` | string | Payment amount as a string (wei) |
| `asset` | string | Token contract address (ETH = `0x0...0`) |
| `payTo` | string | Recipient address |
| `maxTimeoutSeconds` | number | Maximum time before payment expires |
| `extra` | object | Additional EVVM-specific data |
| `extra.coreContractAddress` | string | EVVM core contract address |
| `extra.evvmId` | number | EVVM identifier |
| `extra.originExecutor` | string | (optional) Origin executor address |
