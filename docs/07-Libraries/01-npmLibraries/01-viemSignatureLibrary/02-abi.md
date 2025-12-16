---
sidebar_position: 2
---

# ABI Interfaces

The EVVM TypeScript library includes pre-compiled Application Binary Interfaces (ABIs) for all EVVM contracts. These ABIs enable type-safe contract interactions using wagmi and viem.

## Available ABIs

The library exports four main contract ABIs:

### EVVM Core Contract
```typescript
import { EvvmABI } from '@evvm/viem-signature-library';
```
Contains functions for:
- Payment operations and transactions
- Multi-recipient payment handling
- Administrative and governance functions
- System getters and state queries

### NameService Contract
```typescript
import { NameServiceABI } from '@evvm/viem-signature-library';
```
Contains functions for:
- Username registration and renewal
- Offer marketplace operations
- Custom metadata management
- Identity resolution functions

### Staking Contract
```typescript
import { StakingABI } from '@evvm/viem-signature-library';
```
Contains functions for:
- Golden staking operations
- Public and presale staking
- Service staking functions
- Reward and estimation functions

### Estimator Contract
```typescript
import { EstimatorABI } from '@evvm/viem-signature-library';
```
Contains functions for:
- Reward calculations
- Economic parameter estimation
- System metrics and analytics

## Usage with wagmi

### Basic Contract Interaction

The most common pattern is using ABIs with wagmi's `writeContract` function:

```typescript
import { writeContract } from '@wagmi/core';
import { EvvmABI, PayInputData } from '@evvm/viem-signature-library';

const executePay = async (
  inputData: PayInputData,
  evvmAddress: `0x${string}`,
  config: Config
) => {
  return writeContract(config, {
    abi: EvvmABI,
    address: evvmAddress,
    functionName: 'pay',
    args: [
      inputData.from,
      inputData.to_address,
      inputData.to_identity,
      inputData.token,
      inputData.amount,
      inputData.priorityFee,
      inputData.nonce,
      inputData.priority,
      inputData.executor,
      inputData.signature,
    ],
  });
};
```

### Reading Contract Data

For reading contract state, use `readContract`:

```typescript
import { readContract } from '@wagmi/core';
import { EvvmABI } from '@evvm/viem-signature-library';

const getUserNonce = async (
  userAddress: `0x${string}`,
  evvmAddress: `0x${string}`,
  config: Config
) => {
  return readContract(config, {
    abi: EvvmABI,
    address: evvmAddress,
    functionName: 'getNonce',
    args: [userAddress],
  });
};
```

## Complete Transaction Flow

Here's a complete example showing how to use ABIs with signature builders:

```typescript
import { writeContract } from '@wagmi/core';
import { 
  EVVMSignatureBuilder,
  EvvmABI,
  PayInputData 
} from '@evvm/viem-signature-library';

const executePayment = async (
  walletClient: WalletClient,
  account: Account,
  config: Config,
  evvmAddress: `0x${string}`,
  recipient: string,
  amount: bigint
) => {
  // 1. Create signature builder
  const signatureBuilder = new EVVMSignatureBuilder(walletClient, account);
  
  // 2. Get current nonce
  const nonce = await readContract(config, {
    abi: EvvmABI,
    address: evvmAddress,
    functionName: 'getNonce',
    args: [account.address],
  });

  // 3. Generate signature
  const signature = await signatureBuilder.signPay(
    1n, // evvmID
    recipient,
    '0x0000000000000000000000000000000000000001' as `0x${string}`, // Native token
    amount,
    0n, // No priority fee
    nonce,
    false, // Not priority
    account.address
  );

  // 4. Prepare input data
  const payInputData: PayInputData = {
    from: account.address,
    to_address: recipient as `0x${string}`,
    to_identity: '',
    token: '0x0000000000000000000000000000000000000001' as `0x${string}`,
    amount,
    priorityFee: 0n,
    nonce,
    priority: false,
    executor: account.address,
    signature,
  };

  // 5. Execute transaction
  return writeContract(config, {
    abi: EvvmABI,
    address: evvmAddress,
    functionName: 'pay',
    args: [
      payInputData.from,
      payInputData.to_address,
      payInputData.to_identity,
      payInputData.token,
      payInputData.amount,
      payInputData.priorityFee,
      payInputData.nonce,
      payInputData.priority,
      payInputData.executor,
      payInputData.signature,
    ],
  });
};
```

## NameService ABI Usage

Example of using NameService ABI for username registration:

```typescript
import { writeContract } from '@wagmi/core';
import { NameServiceSignatureBuilder, NameServiceABI } from '@evvm/viem-signature-library';

const registerUsername = async (
  walletClient: WalletClient,
  account: Account,
  config: Config,
  nameServiceAddress: `0x${string}`,
  username: string,
  clowNumber: bigint
) => {
  const nameBuilder = new NameServiceSignatureBuilder(walletClient, account);
  
  const nonce = await readContract(config, {
    abi: NameServiceABI,
    address: nameServiceAddress,
    functionName: 'getNonce',
    args: [account.address],
  });

  const { paySignature, actionSignature } = await nameBuilder.signRegistrationUsername(
    1n, nameServiceAddress, username, clowNumber, nonce,
    100000000000000000n, 0n, nonce + 1n, false
  );

  return writeContract(config, {
    abi: NameServiceABI,
    address: nameServiceAddress,
    functionName: 'registrationUsername',
    args: [account.address, username, clowNumber, nonce, actionSignature, 0n, nonce + 1n, false, paySignature || '0x'],
  });
};
```

## Staking ABI Usage

Example of using Staking ABI for public staking:

```typescript
import { writeContract } from '@wagmi/core';
import { StakingSignatureBuilder, StakingABI } from '@evvm/viem-signature-library';

const executePublicStaking = async (
  walletClient: WalletClient,
  account: Account,
  config: Config,
  stakingAddress: `0x${string}`,
  stakingAmount: bigint
) => {
  const stakingBuilder = new StakingSignatureBuilder(walletClient, account);
  
  const nonce = await readContract(config, {
    abi: StakingABI,
    address: stakingAddress,
    functionName: 'getNonce',
    args: [account.address],
  });

  const { paySignature, actionSignature } = await stakingBuilder.signPublicStaking(
    1n, stakingAddress, true, stakingAmount, nonce, stakingAmount, 0n, nonce + 1n, false
  );

  return writeContract(config, {
    abi: StakingABI,
    address: stakingAddress,
    functionName: 'publicStaking',
    args: [account.address, true, stakingAmount, nonce, actionSignature, 0n, nonce + 1n, false, paySignature || '0x'],
  });
};
```

## Error Handling

When working with ABIs and contract calls, proper error handling is essential:

```typescript
const safeExecutePay = async (
  inputData: PayInputData,
  evvmAddress: `0x${string}`,
  config: Config
) => {
  try {
    const txHash = await writeContract(config, {
      abi: EvvmABI,
      address: evvmAddress,
      functionName: 'pay',
      args: [/* all required arguments */],
    });
    
    return txHash;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient balance for transaction');
      } else if (error.message.includes('nonce')) {
        throw new Error('Invalid nonce - transaction may be duplicate');
      }
    }
    throw error;
  }
};
```

## ABI Export Patterns

The library provides multiple ways to import ABIs:

```typescript
// Individual imports
import { EvvmABI, NameServiceABI, StakingABI, EstimatorABI } from '@evvm/viem-signature-library';

// Default export
import ABIs from '@evvm/viem-signature-library';
const evvmContract = { abi: ABIs.Evvm, address: evvmAddress };
```

## TypeScript Integration

The ABIs are fully typed, providing compile-time validation:

```typescript
const result = await writeContract(config, {
  abi: EvvmABI,
  address: evvmAddress,
  functionName: 'pay', // ✅ Valid function name
  args: [/* properly typed arguments */],
});
```
