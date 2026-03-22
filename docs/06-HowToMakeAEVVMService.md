---
description: "Tutorial on building gasless smart contract services using EVVM, demonstrated through a coffee shop example"
sidebar_position: 8
---

# How to Create an EVVM Service

Building a EVVM service is easy as pie! (or should we say, easy as brewing coffee?) In this guide, we'll walk you through creating a simple EVVM service that allows users to pay for coffee without paying gas fees. We'll cover the entire process, from setting up your contract to handling payments and rewards for fishers.

## What You'll Learn

- How to create a gasless service using EVVM
- Creating and validating signatures for secure transactions
- Processing payments through EVVM
- Staking as a service provider to earn rewards
- Best practices for building EVVM services


## The EVVM Service Model

The principal problem around blockchain adoption is gas fees. Users want to interact with smart contracts without worrying about paying for gas. EVVM services solve this by allowing users to sign transactions off-chain (for free) and having "fishers" execute them on-chain, getting rewarded for their work. This creates a win-win situation:
- **Users**: Get a seamless, gasless experience
- **Fishers**: Earn rewards for executing transactions
- **Service Providers**: Attract more users and can earn rewards by staking

```solidity
// ❌ Traditional Contract: Users pay gas + coffee price
contract TraditionalCafe {
    function buyCoffee() external payable {
        require(msg.value >= 0.01 ether, "Not enough for coffee");
        // User paid gas + coffee = bad UX
    }
}

// ✅ EVVM Service: Users pay only coffee price, no gas!
contract EVVMCafe {
    function orderCoffee(
        address user,
        string memory coffeeType,
        uint256 quantity,
        uint256 totalPrice,
        address senderExecutor,
        address originExecutor,
        uint256 nonce,
        bool isAsyncExec,
        bytes memory signature,
        uint256 priorityFeePay,
        uint256 noncePay,
        bool isAsyncExecPay,
        bytes memory signaturePay
    ) external {
        // 1. Customer signed this off-chain (no gas!)
        // 2. Fisher executes this function (gets rewarded)
        // 3. Customer pays only coffee price through EVVM
        // 4. Everyone happy! 
    }
}
```
So let's break down the basics on EVVM services and how to create one!

The basic flow of an EVVM service looks like this:
1. User creates a transaction and signs it off-chain using ERC-191 standard (gasless for them) for the service and if it has payments, also signs a payment transaction for EVVM
2. User broadcasts the signed transaction to a fishing spot (a place where fishers look for transactions to execute)
3. Fishers capture the transaction, validate the signature, and execute it on your service contract
4. If the service involves payments, the user pays through EVVM, and fishers get rewarded for executing the transaction.
5. Service provider can also stake to earn rewards and share them with fishers for better prioritization


### Who are "Fishers"?

**Fishers** = Anyone who executes EVVM transactions

- **Anyone can be a fisher** (even your grandma!)
- **Staker-fishers** get automatic rewards from EVVM
- **Regular fishers** get rewards only if you give them some

Think of fishers like Uber drivers - they provide a service (executing transactions) and get paid for it.

## Installation

To get started, you can use either Foundry or NPM to install the necessary contracts and libraries for building your EVVM service.

**Foundry (Recommended):**
```bash
forge install EVVM-org/Testnet-Contracts
```

Add to `foundry.toml`:
```toml
remappings = ["@evvm/testnet-contracts/=lib/Testnet-Contracts/src/"]
```

**NPM:**
```bash
npm install @evvm/testnet-contracts
```

## Setting Up Your EVVM Service Contract

Let's build step by step. We'll use `EvvmService` a helper contract that makes everything easier.

:::info[Tip]
You need to know what EVVM instance you're targeting (which virtual blockchain) and have the Core and Staking contract addresses for that instance.
:::

### Step 1: Setup

First, we create our service contract and inherit from `EvvmService` to get access to all the helper functions for signature validation, payments, and staking.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";

contract EVVMCafe is EvvmService {
    address ownerOfShop;
    
    /**
     * @param _coreAddress Address of the EVVM Core contract for your target instance
     * @param _stakingAddress Address of the EVVM Staking contract for your target instance
     * @param _ownerOfShop Your address (owner of the coffee shop)
     */
    constructor(
        address _coreAddress, 
        address _stakingAddress, 
        address _ownerOfShop
    ) EvvmService(_coreAddress, _stakingAddress) {
        ownerOfShop = _ownerOfShop;
    }
}
```
**What we did:**
- Import `EvvmService` (gives us helper functions for payments, staking, and nonce management)
- Set owner address
- Connect to Core and Staking contracts via the `EvvmService` constructor

### Step 2: Defining the Service Function Parameters

Now we define the function that users will call. In this case, `orderCoffee` allows users to order coffee and pay for it through EVVM. We need parameters to capture the order details, payment info, and signatures for validation.

```solidity
function orderCoffee(
    address user,
    string memory coffeeType,
    uint256 quantity,
    uint256 totalPrice,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec,
    bytes memory signature,
    uint256 priorityFeeEvvm,
    uint256 nonceEvvm,
    bool isAsyncExecEvvm,
    bytes memory signatureEvvm
) external {
}
```

**Input parameters** 
We have two sets of parameters, the service parameters and the core payment parameters. Let's break down what each parameter is for:

**Service parameters**
- `user`: The address of the customer placing the order (the coffee buyer)
- `coffeeType`: Type of coffee (e.g., latte, espresso)
- `quantity`: How many coffees they want
- `totalPrice`: Total price for the order (in wei)
- `senderExecutor`: The contract address that will consume the nonce — in most cases this is `address(this)` (the service contract). The user must include this in the signed message so EVVM can verify who is calling
- `originExecutor`: The address who exclusively can execute this transaction. Think of this as a ticket for who can execute the transaction. If you want to allow anyone to execute, set this to `address(0)`
- `nonce`: A unique number to prevent replay attacks
- `isAsyncExec`: Whether this transaction can be executed with async nonce (`true`) or must follow sequential order with sync nonce (`false`)
- `signature`: The customer's ERC-191 signature authorizing this service action

**Core payment parameters**
- `priorityFeeEvvm`: Extra fee to incentivize fishers to execute this transaction faster
- `nonceEvvm`: A unique number for the payment transaction to prevent replay attacks
- `isAsyncExecEvvm`: Whether the payment transaction can be executed with async nonce
- `signatureEvvm`: The customer's signature authorizing the EVVM payment

### Step 3: Implementing Nonce and Signature Validation

For this step we will use the most important function for all EVVM services: `validateAndConsumeNonce`. This function does two things in one call:
1. Validates the customer's signature to ensure they authorized this transaction
2. Consumes the nonce to prevent replay attacks (ensures the same transaction can't be executed multiple times)

```solidity
function orderCoffee(
    address user,
    string memory coffeeType,
    uint256 quantity,
    uint256 totalPrice,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec,
    bytes memory signature,
    uint256 priorityFeeEvvm,
    uint256 nonceEvvm,
    bool isAsyncExecEvvm,
    bytes memory signatureEvvm
) external {
    // Verify customer's signature and consume nonce (prevents replay attacks)
    core.validateAndConsumeNonce(
        user,
        senderExecutor,
        keccak256(abi.encode(
            "orderCoffee",
            coffeeType,
            quantity,
            totalPrice
        )),
        originExecutor,
        nonce,
        isAsyncExec,
        signature
    );
}
```
**How it works:**

1. A user signs a message (string) off-chain using the ERC-191 standard like this: 
```
<evvmId>,<senderExecutor>,<hashPayload>,<originExecutor>,<nonce>,<isAsyncExec>
```
Where each field is:
- **evvmId** — The ID of the EVVM instance (obtained from `getEvvmID()`)
- **senderExecutor** — The address of your service contract (`address(this)`) that will consume the nonce. The user puts this in the signed message so EVVM knows which contract is authorized to act on their behalf
- **hashPayload** — The keccak256 hash of the service parameters using `abi.encode`. The standard way is to encode the function name and parameters:
    
```solidity
keccak256(abi.encode(
    "nameOfYourFunction",
    serviceParam1,
    serviceParam2,
    ...,
    serviceParamN
))
```
- **originExecutor** — The address that can execute this transaction, or `address(0)` for anyone
- **nonce** — A unique number to prevent replay attacks
- **isAsyncExec** — `true` for async nonce, `false` for sync nonce

2. The user sends this signed message to a fishing spot and a fisher picks it up to execute on-chain
3. When the fisher calls `validateAndConsumeNonce`, the EVVM Core contract:
    1. Rebuilds the expected message from the parameters
    2. Recovers the signer from the signature and checks it matches the `user`
    3. Checks the nonce hasn't been used (async) or is the next expected nonce (sync)
    4. If everything is valid, it marks the nonce as consumed and allows the transaction to proceed. If not, it reverts.

### Step 4: Processing Payments through EVVM

If your function requires payment, call `requestPay` right after validating the service transaction. This function requests the payment from the user and gives the reward and priority fee to the service contract (only if the service contract is a staker, otherwise the reward and priority fee cannot be claimed by anyone).

:::tip
Even if the function doesn't require payment, we recommend using `requestPay` with `0` amount and letting the priority fee be decided by the user. This way you can reward fishers for executing service transactions and increase the chances of them being executed faster.
:::

```solidity
function orderCoffee(
    address user,
    string memory coffeeType,
    uint256 quantity,
    uint256 totalPrice,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec,
    bytes memory signature,
    uint256 priorityFeeEvvm,
    uint256 nonceEvvm,
    bool isAsyncExecEvvm,
    bytes memory signatureEvvm
) external {
    // 1. Verify customer's signature and consume nonce (prevents replay attacks)
    core.validateAndConsumeNonce(
        user,
        senderExecutor,
        keccak256(abi.encode(
            "orderCoffee",
            coffeeType,
            quantity,
            totalPrice
        )),
        originExecutor,
        nonce,
        isAsyncExec,
        signature
    );
    
    // 2. Process payment through EVVM
    requestPay(
        user,
        core.getChainHostCoinAddress(),
        totalPrice,
        priorityFeeEvvm,
        originExecutor,
        nonceEvvm,
        isAsyncExecEvvm,
        signatureEvvm
    );
}
```

**About `requestPay`:**
- The user signs a **second** message authorizing the payment (separate from the service signature)
- `core.getChainHostCoinAddress()` returns the address representing the native coin (ETH) in EVVM
- `originExecutor` is reused here — the same fisher that can execute the service can also execute the payment. You could also use `address(0)` to allow any fisher
- If this contract is staked, it automatically receives the `priorityFeeEvvm` and one EVVM reward. If not staked, these go unclaimed

### Step 5: Rewarding Fishers

Now let's put it all together and add the fisher incentive system. After payment processing, we can optionally redistribute some of the earned rewards to the fisher who executed the transaction. This creates an economic incentive for fishers to prioritize your service:

```solidity
function orderCoffee(
    address user,
    string memory coffeeType,
    uint256 quantity,
    uint256 totalPrice,
    address senderExecutor,
    address originExecutor,
    uint256 nonce,
    bool isAsyncExec,
    bytes memory signature,
    uint256 priorityFeeEvvm,
    uint256 nonceEvvm,
    bool isAsyncExecEvvm,
    bytes memory signatureEvvm
) external {
    // 1. Verify customer's signature and consume nonce
    core.validateAndConsumeNonce(
        user,
        senderExecutor,
        keccak256(abi.encode(
            "orderCoffee",
            coffeeType,
            quantity,
            totalPrice
        )),
        originExecutor,
        nonce,
        isAsyncExec,
        signature
    );
    
    // 2. Process payment through EVVM
    requestPay(
        user,
        core.getChainHostCoinAddress(),
        totalPrice,
        priorityFeeEvvm,
        originExecutor,
        nonceEvvm,
        isAsyncExecEvvm,
        signatureEvvm
    );
    
    // 3. Reward the fisher (only if shop is a staker)
    if (core.isAddressStaker(address(this))) {
        // Give the fisher the full priority fee as immediate incentive
        makeCaPay(msg.sender, core.getChainHostCoinAddress(), priorityFeeEvvm);
        // Give the fisher half of the EVVM reward (in principal tokens)
        makeCaPay(msg.sender, getPrincipalTokenAddress(), core.getRewardAmount() / 2);
    }
}
```

**Breaking down the fisher reward system:**

1. **`core.isAddressStaker(address(this))`** — First we check if our coffee shop contract is registered as a staker. Only stakers receive priority fees and rewards from EVVM transactions.

2. **`makeCaPay(msg.sender, ...)`** — This is a contract-authorized payment (no signature needed). Since the service contract owns these funds in EVVM, it can freely send them using `makeCaPay`. `msg.sender` is the fisher who called this function.

3. **Why redistribute rewards?** — You don't have to! But sharing rewards creates a positive feedback loop:
   - Fishers see your service gives good rewards → they prioritize your transactions → users get faster execution → more users use your service → more rewards for everyone

4. **The split is your choice** — In this example we give the fisher:
   - 100% of the priority fee (paid in the native coin)
   - 50% of the EVVM reward (paid in principal tokens, MATE)
   
   The remaining 50% of the EVVM reward stays in the shop's balance. You can adjust these percentages however you want!

:::note
You could also restrict rewards to only staker fishers by adding `core.isAddressStaker(msg.sender)` to the condition. This encourages fishers to also stake, strengthening the network.
:::

### Step 6: Access Control and Events

Before putting it all together, let's add proper access control and events. These are essential for any production service:

```solidity
contract EVVMCafe is EvvmService {
    // Custom error for unauthorized access (gas-efficient)
    error Unauthorized();

    address ownerOfShop;

    // Event to track coffee orders on-chain
    event CoffeeOrdered(
        address indexed client,
        string indexed coffeeType,
        uint256 indexed quantity
    );

    // Modifier to restrict admin functions to the shop owner
    modifier onlyOwner() {
        if (msg.sender != ownerOfShop) revert Unauthorized();
        _;
    }

    constructor(
        address _coreAddress,
        address _stakingAddress,
        address _ownerOfShop
    ) EvvmService(_coreAddress, _stakingAddress) {
        ownerOfShop = _ownerOfShop;
    }
    
    function orderCoffee(...) external {
        // ... validation, payment, rewards (from previous steps) ...
        
        // Emit event at the end so indexers can track orders
        emit CoffeeOrdered(user, coffeeType, quantity);
    }
}
```

**Why these matter:**
- **Custom errors** (`error Unauthorized()`) — More gas-efficient than `require` with string messages, and cleaner to read
- **Events** — Allow off-chain systems (frontends, analytics, indexers) to track what's happening. Use `indexed` for fields you want to filter/search by
- **Modifiers** — Reusable access control. The `onlyOwner` modifier will protect admin functions like staking and withdrawals

### Step 7: Staking and Withdrawals

Now let's add the functions that let the shop owner manage staking and withdraw funds. These are admin-only operations protected by the `onlyOwner` modifier:

**Staking:**

```solidity
function stake(uint256 amountToStake) external onlyOwner {
    _makeStakeService(amountToStake);
}

function unstake(uint256 amountToUnstake) external onlyOwner {
    _makeUnstakeService(amountToUnstake);
}
```

`_makeStakeService` is inherited from `EvvmService` and handles the entire staking process atomically:
1. Calls `staking.prepareServiceStaking(amount)` to reserve a staking slot
2. Pays the staking price in principal tokens (MATE) via `core.caPay`
3. Calls `staking.confirmServiceStaking()` to finalize

`_makeUnstakeService` handles unstaking, refunding the principal tokens back to the contract's EVVM balance.

**Withdrawals:**

The shop accumulates two types of funds: coffee sale revenue (in native coin) and EVVM rewards (in principal tokens). The owner needs functions to withdraw both:

```solidity
function withdrawFunds(address to) external onlyOwner {
    uint256 balance = core.getBalance(address(this), core.getChainHostCoinAddress());
    makeCaPay(to, core.getChainHostCoinAddress(), balance);
}

function withdrawRewards(address to) external onlyOwner {
    uint256 balance = core.getBalance(address(this), getPrincipalTokenAddress());
    makeCaPay(to, getPrincipalTokenAddress(), balance);
}
```

**How it works:**
- `core.getBalance(address, token)` checks how much the contract holds in EVVM for a given token
- `makeCaPay(to, token, amount)` transfers from the contract's EVVM balance to any address — no signature needed since the contract itself authorizes it
- `core.getChainHostCoinAddress()` → native coin (ETH) from coffee sales
- `getPrincipalTokenAddress()` → principal token (MATE) from EVVM rewards

**Why stake?**
- Shop becomes a staker → earns rewards on every transaction processed
- Can share rewards with fishers → fishers prioritize your transactions
- Creates sustainable economics for your service

### Step 8: View Functions

Finally, let's add some getter functions so the owner (or anyone) can check the shop's status:

```solidity
function getOwnerOfShop() external view returns (address) {
    return ownerOfShop;
}

function getAmountOfPrincipalTokenInShop() external view returns (uint256) {
    return core.getBalance(address(this), getPrincipalTokenAddress());
}

function getAmountOfEtherInShop() external view returns (uint256) {
    return core.getBalance(address(this), core.getChainHostCoinAddress());
}
```

These are standard view functions — they don't modify state and cost no gas when called off-chain. Useful for building frontends that display the shop's balance and status.

## Putting It All Together

Here's a summary of all the pieces working together:

```
User signs service msg + payment msg (off-chain, gasless)
         │
         ▼
Fisher picks up transaction from fishing spot
         │
         ▼
Fisher calls orderCoffee() on your contract
         │
         ├─► validateAndConsumeNonce() → verifies service signature + burns nonce
         │
         ├─► requestPay() → processes payment (user → shop via EVVM)
         │
         ├─► makeCaPay() × 2 → rewards fisher (if shop is staker)
         │
         └─► emit CoffeeOrdered() → logs the event
```

:::info[Complete Code]
See the full implementation: [EVVMCafe.sol](https://github.com/EVVM-org/Hackathon-CoffeShop-Example/blob/main/contracts/src/EVVMCafe.sol)
:::

## Key Concepts

### Nonces (Prevent Replay Attacks)

```solidity
// Without nonce: Evil person can copy signature and order 1000 coffees!
// With nonce: Each signature can only be used once
```

**Two types:**
- **Sync**: Must be in order (1, 2, 3...) — EVVM manages the counter automatically
- **Async**: Any unused number — More flexible, can execute in any order

### The Two Signatures

Every paid EVVM service transaction requires the user to sign **two** messages:
1. **Service signature** — Authorizes the specific action (e.g., "order 2 lattes for 0.01 ETH")
2. **Payment signature** — Authorizes the EVVM payment (e.g., "pay 0.01 ETH to the shop contract")

Each signature has its own nonce, so they are independently replay-protected.

### Fishers & Rewards

| Who | Gets Rewards? |
|-----|---------------|
| Staker fisher + Staked service | ✅ Automatic rewards from EVVM |
| Regular fisher + Staked service | ❌ Only if the service gives custom rewards |
| Any fisher + Non-staked service | ❌ No automatic rewards available |

## Common Patterns

**Free Service** (no payments):
```solidity
function freeAction(
    address user, address senderExecutor, address originExecutor,
    uint256 nonce, bool isAsyncExec, bytes memory signature
) external {
    core.validateAndConsumeNonce(
        user, senderExecutor,
        keccak256(abi.encode("freeAction")),
        originExecutor, nonce, isAsyncExec, signature
    );
    // Your logic here
}
```

**Paid Service** (automatic rewards for staker fishers):
```solidity
function paidAction(
    address user, uint256 amount, address senderExecutor, address originExecutor,
    uint256 nonce, bool isAsyncExec, bytes memory signature,
    uint256 priorityFee, uint256 noncePay, bool isAsyncExecPay, bytes memory signaturePay
) external {
    core.validateAndConsumeNonce(
        user, senderExecutor,
        keccak256(abi.encode("paidAction", amount)),
        originExecutor, nonce, isAsyncExec, signature
    );
    requestPay(user, core.getChainHostCoinAddress(), amount, priorityFee, originExecutor, noncePay, isAsyncExecPay, signaturePay);
}
```

**Custom Rewards** (you decide who gets what):
```solidity
function customRewardAction(
    address user, address senderExecutor, address originExecutor,
    uint256 nonce, bool isAsyncExec, bytes memory signature
) external {
    core.validateAndConsumeNonce(
        user, senderExecutor,
        keccak256(abi.encode("customRewardAction")),
        originExecutor, nonce, isAsyncExec, signature
    );
    // Give custom reward to the fisher
    makeCaPay(msg.sender, getPrincipalTokenAddress(), rewardAmount);
}
```

## Helper Functions Reference

**From EvvmService:**
```solidity
// Signature & nonce validation (validates signature and consumes nonce in one call)
core.validateAndConsumeNonce(user, senderExecutor, hashPayload, originExecutor, nonce, isAsyncExec, signature);

// Payments (user → service, requires signature)
requestPay(from, token, amount, priorityFee, originExecutor, nonce, isAsyncExec, signature);

// Contract-authorized payment (service → anyone, no signature needed)
makeCaPay(to, token, amount);

// Token addresses
core.getChainHostCoinAddress();  // Native coin (ETH)
getPrincipalTokenAddress();      // Principal token (MATE) — address(1)

// Staking
_makeStakeService(amount);
_makeUnstakeService(amount);

// Read-only helpers
core.getBalance(address, token);
core.isAddressStaker(address);
core.getRewardAmount();
getEvvmID();
```

## Next Steps

**What to explore:**
- **[Staking System](./04-Contracts/03-Staking/01-Overview.md)** — Make your service earn rewards
- **[Signature Structures](./05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md)** — Detailed signature formats
- **[Name Service](./04-Contracts/02-NameService/01-Overview.md)** — Add username support
- **[EVVM Core](./04-Contracts/01-EVVM/01-Overview.md)** — Advanced features

**Tips:**
1. Start with free services, add payments later
2. Test extensively on testnet
3. Consider staking for sustainable economics
4. Gasless UX is your biggest advantage

---

Copy the coffee shop example and start building! 🚀