---
title: "Signers"
description: "How to create and use signers with evvm-js"
sidebar_position: 3
---

# Signers

`evvm-js` provides signer factory helpers that adapt popular wallet libraries into the library's [ISigner](#signer-interface) interface.

Available helpers:

- `createSignerWithEthers(signer)` — wraps an `ethers` Signer (v6).
- `createSignerWithViem(walletClient)` — wraps a `viem` `WalletClient`.

## Ethers

```ts
import { EVVM, createSignerWithEthers } from "@evvm/evvm-js";
import { ethers } from "ethers";

// 1. Create ethers signer
const provider = new ethers.BrowserProvider(window.ethereum);
const ethersSigner = await provider.getSigner();

// 2. Create evvm signer
const signer = await createSignerWithEthers(ethersSigner);

// 3. Instantiate a service
const evvm = new EVVM(signer, "EVVM_CONTRACT_ADDRESS");
// ...
```

> Refer to the official [ethers](https://docs.ethers.org/v6/) documentation for more about signer usage and creation.

## Viem

```ts
import { EVVM } from "@evvm/evvm-js";
import { createSignerWithViem } from "@evvm/evvm-js/signers";
import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";

// 1. Create a viem walletClient
const account = privateKeyToAccount("YOUR_PRIVATE_KEY");
const client = createWalletClient({
  account,
  chain: mainnet,
  transport: http("YOUR_RPC_URL"),
});
// 2. Create evvm signer
const signer = await createSignerWithViem(client);

// 3. Instantiate a service
const evvm = new EVVM(signer, "EVVM_CONTRACT_ADDRESS");
```

> Refer to the official [viem](https://viem.sh/) documentation for more about wallet usage and creation.

## Signer interface

Returned from `createSignerWithViem()` and `createSignerWithEthers()` utilities. It includes:

- `address` and `chainId` properties
- `signMessage(message)` — low-level message sign
- `signGenericEvvmMessage(evvmId, functionName, inputs)` — convenience
- `readContract()` and `writeContract()` — adapter methods to interact with contracts

Signers intentionally normalize return types (e.g., BigInt conversion for numeric ABI inputs when using `viem`).

```ts
interface ISendTransactionParams {
  contractAddress: HexString;
  contractAbi: IAbi;
  functionName: string;
  args: any[];
}

interface ISigner {
  address: HexString;
  chainId: number;
  signMessage(message: string): Promise<string>; // signature
  signGenericEvvmMessage(
    evvmId: bigint,
    functionName: string,
    inputs: string,
  ): Promise<string>;
  writeContract(params: ISendTransactionParams): Promise<HexString>; // txHash
  readContract<T>(params: ISendTransactionParams): Promise<T>;
}
```

> These interfaces can be imported from `@evvm/evvm-js`
