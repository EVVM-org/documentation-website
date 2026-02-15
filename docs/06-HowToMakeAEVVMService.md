---
sidebar_position: 8
---

# How to Create an EVVM Service

Build smart contracts where users don't pay gas fees. Let's learn by building a coffee shop!

## What You'll Learn

**The Problem:** Users hate paying gas fees.

**The Solution:** EVVM Services - users sign transactions off-chain (free), "fishers" execute them (and get rewarded).

## Coffee Shop Example

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
        address clientAddress,
        string memory coffeeType,
        uint256 quantity,
        uint256 totalPrice,
        address originExecutor,
        uint256 nonce,
        bool isAsyncExec,
        bytes memory signature,
        uint256 priorityFeeEvvm,
        uint256 nonceEvvm,
        bool isAsyncExecEvvm,
        bytes memory signatureEvvm
    ) external {
        // 1. Customer signed this off-chain (no gas!)
        // 2. Fisher executes this function (gets rewarded)
        // 3. Customer pays only coffee price through EVVM
        // 4. Everyone happy! ☕
    }
}
```

**What happens:**
1. **Customer**: Signs `"<evvmID>,orderCoffee,latte,1,1000000000000000,123456"` (1 latte for 0.001 ETH, no gas!)
2. **Fisher**: Executes the transaction (gets rewarded for doing it)
3. **EVVM**: Handles the payment (customer pays only for coffee)
4. **Result**: Customer gets coffee without gas fees!

### Who are "Fishers"?

**Fishers** = Anyone who executes EVVM transactions

- **Anyone can be a fisher** (even your grandma!)
- **Staker-fishers** get automatic rewards from EVVM
- **Regular fishers** get rewards only if you give them some

Think of fishers like Uber drivers - they provide a service (executing transactions) and get paid for it.

## Installation

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

## Building the Coffee Shop

Let's build step by step. We'll use `EvvmService` - a helper contract that makes everything easier.

### Step 1: Setup

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {EvvmService} from "@evvm/testnet-contracts/library/EvvmService.sol";
import {AdvancedStrings} from "@evvm/testnet-contracts/library/utils/AdvancedStrings.sol";

contract EVVMCafe is EvvmService {
    address ownerOfShop;
    
    constructor(address _coreAddress, address _stakingAddress, address _owner) 
        EvvmService(_coreAddress, _stakingAddress) 
    {
        ownerOfShop = _owner;
    }
}
```

**What we did:**
- Import `EvvmService` (gives us helper functions)
- Set owner address
- Connect to Core and Staking contracts

### Step 2: Order Coffee Function

```solidity
function orderCoffee(
    address clientAddress,
    string memory coffeeType,
    uint256 quantity,
    uint256 totalPrice,
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
        clientAddress,
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
        clientAddress,
        getEtherAddress(),
        totalPrice,
        priorityFeeEvvm,
        nonceEvvm,
        isAsyncExecEvvm,
        signatureEvvm
    );
    
    // 3. Reward the fisher (if shop is staker)
    if (core.isAddressStaker(address(this))) {
        makeCaPay(msg.sender, getEtherAddress(), priorityFeeEvvm);
        makeCaPay(msg.sender, getPrincipalTokenAddress(), core.getRewardAmount() / 2);
    }
}
```

**What each part does:**
1. **Validate and consume nonce** - Verify customer signature and prevent replay attacks in one call
2. **Process payment** - Customer pays shop through EVVM
3. **Reward fisher** - Give fisher incentive to execute (if shop is staker)

### Step 3: Staking & Withdrawals

```solidity
// Stake tokens to become a staker (earns automatic rewards)
function stake(uint256 amount) external onlyOwner {
    _makeStakeService(amount);
}

// Unstake when needed
function unstake(uint256 amount) external onlyOwner {
    _makeUnstakeService(amount);
}

// Withdraw coffee sale funds
function withdrawFunds(address to) external onlyOwner {
    uint256 balance = core.getBalance(address(this), getEtherAddress());
    makeCaPay(to, getEtherAddress(), balance);
}

// Withdraw accumulated rewards
function withdrawRewards(address to) external onlyOwner {
    uint256 balance = core.getBalance(address(this), getPrincipalTokenAddress());
    makeCaPay(to, getPrincipalTokenAddress(), balance);
}
```

**Why stake?**
- Shop becomes a staker → earns rewards on every transaction
- Can share rewards with fishers → fishers prioritize your transactions
- Creates sustainable economics for your service

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
- **Sync**: Must be in order (1, 2, 3...) - EVVM manages
- **Async**: Any unused number - You track (EVVMCafe uses this)

### Fishers & Rewards

| Who | Gets Rewards? |
|-----|---------------|
| Staker fisher + Paid service | ✅ Automatic |
| Regular fisher + Paid service | ❌ Only if you give custom rewards |
| Any fisher + Free service | ❌ No automatic rewards |

## Common Patterns

**Free Service** (no payments):
```solidity
function freeAction(address user, bytes signature) external {
    validateServiceSignature(...);
    // Your logic
}
```

**Paid Service** (automatic rewards for staker fishers):
```solidity
function paidAction(address user, uint256 amount, bytes signature) external {
    validateServiceSignature(...);
    requestPay(user, getEtherAddress(), amount, ...);
}
```

**Custom Rewards** (you decide who gets what):
```solidity
function customRewardAction(address user, bytes signature) external {
    validateServiceSignature(...);
    // Give custom reward
    makeCaPay(msg.sender, getPrincipalTokenAddress(), rewardAmount);
}
```

## Helper Functions Reference

**From EvvmService:**
```solidity
// Signature & nonce validation (validates signature and consumes nonce in one call)
core.validateAndConsumeNonce(user, hashPayload, originExecutor, nonce, isAsyncExec, signature);

// Payments
requestPay(from, token, amount, priorityFee, nonce, isAsyncExec, signature);
makeCaPay(to, token, amount);

// Addresses
getEtherAddress();              // address(0)
getPrincipalTokenAddress();     // address(1)

// Staking
_makeStakeService(amount);
_makeUnstakeService(amount);

// Check balances
core.getBalance(address, token);
core.isAddressStaker(address);
core.getRewardAmount();
```

## Frontend Example

```javascript
// User signs off-chain (no gas!)
async function orderCoffee(coffeeType, quantity, totalPrice, originExecutor) {
    const nonce = Date.now();
    const hashPayload = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ["string", "string", "uint256", "uint256"],
            ["orderCoffee", coffeeType, quantity, totalPrice]
        )
    );
    const message = `${evvmId},${serviceAddress},${hashPayload},${originExecutor},${nonce},true`;
    const signature = await signer.signMessage(message);
    
    // Send to fisher
    await fetch('/api/fisher', {
        method: 'POST',
        body: JSON.stringify({ 
            clientAddress, coffeeType, quantity, totalPrice, 
            originExecutor, nonce, isAsyncExec: true, signature 
        })
    });
}
```

## Next Steps

**What to explore:**
- **[Staking System](./04-Contracts/03-Staking/01-Overview.md)** - Make your service earn rewards
- **[Signature Structures](./05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md)** - Detailed signature formats
- **[Name Service](./04-Contracts/02-NameService/01-Overview.md)** - Add username support
- **[EVVM Core](./04-Contracts/01-EVVM/01-Overview.md)** - Advanced features

**Tips:**
1. Start with free services, add payments later
2. Test extensively on testnet
3. Consider staking for sustainable economics
4. Gasless UX is your biggest advantage

---

Copy the coffee shop example and start building! 🚀