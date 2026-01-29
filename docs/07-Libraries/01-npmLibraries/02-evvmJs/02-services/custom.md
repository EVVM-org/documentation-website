---
title: "Custom Services"
description: "Documentation for creating custom services"
sidebar_position: 5
---

# Custom Services

`@evvm/evvm-js` allows users to create their own services interacting with the evvm, they must initially follow the [evvm service spec](/docs/HowToMakeAEVVMService); this documentation focuses on building the signature creation tool that users can then use in their own dapps.

## Creation of custom services

Creating a custom service using the `@evvm/evvm-js` involves creating a class for your service that inherits from `BaseService` abstract class, extending it with your custom actions, they all must be decorated with `@SignMethod` and return a `SignedAction`:

```ts
import { BaseService, SignedAction, SignMethod } from "@evvm/evvm-js";

interface ICustomActionData {
  /* params as desribed in your service smart contract function */
}

export class MyCustomService extends BaseService {
  @SignMethod
  async myCustomAction() /* params required to build the SignedAction */
  : Promise<SignedAction<ICustomActionData>> {
    const evvmId = await this.getEvvmID();
    const functionName = "myCustomAction";
    const inputs = "<your concatenated inputs here>";

    const signature = await this.signer.signGenericEvvmMessage(
      evvmId,
      functionName,
      inputs,
    );

    return new SignedAcion(this, evvmId, functionName, {
      /* params as described in ICustomActionData */
    });
  }
}
```

So that you can use `MyCustomService` as follows:

```ts
import { MyCustomService } from "./MyCustomService.ts";
import { MyCustomServiceABI } from "./MyCustomServiceABI.ts";
import { execute, IAbi } from "@evvm/evvm-js";

const signer = createSignerWithEthers(ethersSigner);
const myCustomService = new MyCustomService({
  signer,
  address: "CUSTOM_SERVICE_ADDRESS",
  abi: MyCustomServiceABI as IAbi,
  chainId: 1,
});

const signedAction = await myCustomService.myCustomAction(/* params */);

// an then execute it with:
const txHash = await execute(signer, signedAction);
```
