---
sidebar_position: 4
---

# Type Definitions

The EVVM TypeScript library provides comprehensive type definitions for all contract interactions, ensuring type safety and better development experience. All types are exported from the main package and can be imported individually.

## Core Types

### Base Signature Types

```typescript
import { SignatureResult, DualSignatureResult } from '@evvm/viem-signature-library';
```

**SignatureResult**: Used for single signature operations
```typescript
interface SignatureResult {
  signature: `0x${string}`;
}
```

**DualSignatureResult**: Used for operations requiring both payment and action signatures
```typescript
interface DualSignatureResult {
  paySignature?: `0x${string}`;
  actionSignature: `0x${string}`;
}
```

### Re-exported Viem/Wagmi Types

The library re-exports common types from viem and wagmi for convenience:

```typescript
import { Account, WalletClient, Config } from '@evvm/viem-signature-library';
```

## EVVM Payment Types

### PayInputData

Type definition for individual payment transactions:

```typescript
import { PayInputData } from '@evvm/viem-signature-library';

type PayInputData = {
  from: `0x${string}`;           // Sender address
  to_address: `0x${string}`;     // Recipient address
  to_identity: string;           // Recipient username (if applicable)
  token: `0x${string}`;          // Token contract address
  amount: bigint;                // Payment amount
  priorityFee: bigint;           // Priority fee for faster processing
  nonce: bigint;                 // Transaction nonce
  priority: boolean;             // Priority flag
  executor: string;              // Transaction executor
  signature: string;             // Transaction signature
};
```

### DispersePayInputData

Type definition for multi-recipient payments:

```typescript
import { DispersePayInputData, DispersePayMetadata } from '@evvm/viem-signature-library';

type DispersePayMetadata = {
  amount: bigint;                // Amount for this recipient
  to_address: `0x${string}`;     // Recipient address
  to_identity: string;           // Recipient username (if applicable)
};

type DispersePayInputData = {
  from: `0x${string}`;           // Sender address
  toData: DispersePayMetadata[]; // Array of recipients and amounts
  token: `0x${string}`;          // Token contract address
  amount: bigint;                // Total payment amount
  priorityFee: bigint;           // Priority fee
  priority: boolean;             // Priority flag
  nonce: bigint;                 // Transaction nonce
  executor: string;              // Transaction executor
  signature: string;             // Transaction signature
};
```

## NameService Types

All NameService operations use dual signature patterns with both service and payment signatures.

### Username Registration Types

```typescript
import { 
  PreRegistrationUsernameInputData,
  RegistrationUsernameInputData 
} from '@evvm/viem-signature-library';
```

**PreRegistrationUsernameInputData**: For username pre-registration
```typescript
type PreRegistrationUsernameInputData = {
  user: `0x${string}`;
  hashPreRegisteredUsername: string;
  nonce: bigint;
  signature: string;
  priorityFee_EVVM: bigint;
  nonce_EVVM: bigint;
  priorityFlag_EVVM: boolean;
  signature_EVVM: string;
};
```

**RegistrationUsernameInputData**: For final username registration
```typescript
type RegistrationUsernameInputData = {
  user: `0x${string}`;
  username: string;
  clowNumber: bigint;
  nonce: bigint;
  signature: string;
  priorityFee_EVVM: bigint;
  nonce_EVVM: bigint;
  priorityFlag_EVVM: boolean;
  signature_EVVM: string;
};
```

### Marketplace Types

```typescript
import { 
  MakeOfferInputData,
  WithdrawOfferInputData,
  AcceptOfferInputData,
  RenewUsernameInputData
} from '@evvm/viem-signature-library';
```

**MakeOfferInputData**: For creating username offers
```typescript
type MakeOfferInputData = {
  user: `0x${string}`;
  username: string;
  expireDate: bigint;
  amount: bigint;
  nonce: bigint;
  signature: string;
  priorityFee_EVVM: bigint;
  nonce_EVVM: bigint;
  priorityFlag_EVVM: boolean;
  signature_EVVM: string;
};
```

### Metadata Management Types

```typescript
import { 
  AddCustomMetadataInputData,
  RemoveCustomMetadataInputData,
  FlushCustomMetadataInputData,
  FlushUsernameInputData
} from '@evvm/viem-signature-library';
```

**AddCustomMetadataInputData**: For adding metadata to usernames
```typescript
type AddCustomMetadataInputData = {
  user: `0x${string}`;
  identity: string;
  value: string;
  nonce: bigint;
  signature: string;
  priorityFee_EVVM: bigint;
  nonce_EVVM: bigint;
  priorityFlag_EVVM: boolean;
  signature_EVVM: string;
};
```

## Staking Types

### Basic Staking Types

```typescript
import { 
  GoldenStakingInputData,
  PresaleStakingInputData,
  PublicStakingInputData,
  PublicServiceStakingInputData
} from '@evvm/viem-signature-library';
```

**GoldenStakingInputData**: For golden staking (single signature)
```typescript
type GoldenStakingInputData = {
  isStaking: boolean;
  amountOfStaking: bigint;
  signature_EVVM: string;
};
```

**PublicStakingInputData**: For public staking (dual signature)
```typescript
type PublicStakingInputData = {
  user: `0x${string}`;
  isStaking: boolean;
  amountOfStaking: bigint;
  nonce: bigint;
  signature: string;
  priorityFee_EVVM: bigint;
  nonce_EVVM: bigint;
  priorityFlag_EVVM: boolean;
  signature_EVVM: string;
};
```

**PublicServiceStakingInputData**: For service-specific staking
```typescript
type PublicServiceStakingInputData = {
  user: `0x${string}`;
  service: `0x${string}`;        // Service contract address
  isStaking: boolean;
  amountOfStaking: bigint;
  nonce: bigint;
  signature: string;
  priorityFee_EVVM: bigint;
  nonce_EVVM: bigint;
  priorityFlag_EVVM: boolean;
  signature_EVVM: string;
};
```

## ABI Types

### Contract ABI Structure

```typescript
import { 
  ABIFunction,
  ABIParameter,
  ContractABI,
  EstimatorABIType,
  EvvmABIType,
  NameServiceABIType,
  StakingABIType
} from '@evvm/viem-signature-library';
```

**ABIFunction**: Defines contract function structure
```typescript
interface ABIFunction {
  type: 'function' | 'constructor' | 'event' | 'error';
  name?: string;
  inputs: ABIParameter[];
  outputs?: ABIParameter[];
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
}
```

**ABIParameter**: Defines function parameter structure
```typescript
interface ABIParameter {
  name: string;
  type: string;
  internalType?: string;
  components?: ABIParameter[];
}
```

## Usage Patterns

### Type-Safe Contract Calls

```typescript
import { writeContract } from '@wagmi/core';
import { 
  PayInputData, 
  EvvmABI,
  EVVMSignatureBuilder 
} from '@evvm/viem-signature-library';

const executeTypedPayment = async (
  inputData: PayInputData,  // Type-safe input
  config: Config
) => {
  return writeContract(config, {
    abi: EvvmABI,              // Type-safe ABI
    address: evvmAddress,
    functionName: 'pay',       // Type-checked function name
    args: [                    // Type-checked arguments
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

### Dual Signature Pattern

```typescript
import { 
  StakingSignatureBuilder,
  PublicStakingInputData,
  DualSignatureResult 
} from '@evvm/viem-signature-library';

const createStakingInput = async (): Promise<PublicStakingInputData> => {
  // Generate dual signatures
  const signatures: DualSignatureResult = await stakingBuilder.signPublicStaking(
    /* parameters */
  );

  // Use typed input data structure
  const inputData: PublicStakingInputData = {
    user: account.address,
    isStaking: true,
    amountOfStaking: BigInt("5"),
    nonce: BigInt("100"),
    signature: signatures.actionSignature,
    priorityFee_EVVM: BigInt("0"),
    nonce_EVVM: BigInt("101"),
    priorityFlag_EVVM: false,
    signature_EVVM: signatures.paySignature || '0x',
  };

  return inputData;
};
```

### Custom Type Guards

```typescript
const isValidPayInputData = (data: any): data is PayInputData => {
  return (
    typeof data === 'object' &&
    typeof data.from === 'string' &&
    typeof data.to_address === 'string' &&
    typeof data.amount === 'bigint' &&
    typeof data.signature === 'string'
  );
};
```

## Type Import Patterns

### Individual Imports
```typescript
import { PayInputData, DispersePayInputData } from '@evvm/viem-signature-library';
import { PublicStakingInputData } from '@evvm/viem-signature-library';
import { RegistrationUsernameInputData } from '@evvm/viem-signature-library';
```

### Grouped Imports
```typescript
import { 
  // Core types
  SignatureResult,
  DualSignatureResult,
  
  // Payment types
  PayInputData,
  DispersePayInputData,
  
  // Staking types
  PublicStakingInputData,
  GoldenStakingInputData,
  
  // NameService types
  RegistrationUsernameInputData,
  MakeOfferInputData
} from '@evvm/viem-signature-library';
```

All types are designed to provide maximum type safety and integrate seamlessly with TypeScript's type checking system, ensuring robust and maintainable EVVM applications.