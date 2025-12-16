---
sidebar_position: 5
---

# Utility Functions

The EVVM TypeScript library provides utility functions for message construction and data hashing. These utilities are essential for creating properly formatted signatures and ensuring data integrity across the EVVM ecosystem.

## Message Construction

### Overview

Message construction utilities generate formatted strings for EVVM signatures following the universal format: `evvmID,functionName,param1,param2,...,paramN`. These functions ensure consistent message formatting across all contract interactions.

### Import Pattern

```typescript
import { 
  buildMessageSignedForPay,
  buildMessageSignedForDispersePay,
  buildMessageSignedForPublicStaking,
  buildMessageSignedForRegistrationUsername,
  basicMessageBuilder
} from '@evvm/viem-signature-library';
```

### EVVM Payment Messages

#### buildMessageSignedForPay

Constructs messages for individual payment transactions:

```typescript
const buildMessageSignedForPay = (
  evvmID: bigint,
  to: `0x${string}` | string,
  tokenAddress: `0x${string}`,
  amount: bigint,
  priorityFee: bigint,
  nonce: bigint,
  priorityFlag: boolean,
  executor: `0x${string}`
): string
```

**Parameters:**
- `evvmID`: Network identifier
- `to`: Recipient address or username
- `tokenAddress`: Token contract address
- `amount`: Payment amount in wei
- `priorityFee`: Priority fee for faster processing
- `nonce`: Transaction nonce
- `priorityFlag`: Priority transaction flag
- `executor`: Transaction executor address

**Example:**
```typescript
const payMessage = buildMessageSignedForPay(
  1n,                                                           // EVVM ID
  "0x742d35Cc6634C0532925a3b8D00B6d0e98A8887e",               // Recipient
  "0x0000000000000000000000000000000000000001",               // Native token
  BigInt("1000000000000000000"),                               // 1 ETH
  BigInt("10000000000000000"),                                 // 0.01 ETH priority
  BigInt("100"),                                               // Nonce
  false,                                                       // Not priority
  "0x8ba1f109551bD432803012645Hac136c22C177ec183"             // Executor
);
// Returns: "1,pay,0x742d35cc6634c0532925a3b8d00b6d0e98a8887e,0x0000000000000000000000000000000000000001,1000000000000000000,10000000000000000,100,false,0x8ba1f109551bd432803012645hac136c22c177ec183"
```

#### buildMessageSignedForDispersePay

Constructs messages for multi-recipient payments:

```typescript
const buildMessageSignedForDispersePay = (
  evvmID: bigint,
  hashList: string,
  tokenAddress: `0x${string}`,
  amount: bigint,
  priorityFee: bigint,
  nonce: bigint,
  priorityFlag: boolean,
  executor: `0x${string}`
): string
```

**Parameters:**
- `hashList`: Hashed recipient data (without 0x prefix)
- Other parameters same as `buildMessageSignedForPay`

**Example:**
```typescript
const disperseMessage = buildMessageSignedForDispersePay(
  1n,
  "a1b2c3d4e5f6789...", // Hashed recipient list
  "0x0000000000000000000000000000000000000001",
  BigInt("5000000000000000000"), // Total 5 ETH
  BigInt("50000000000000000"),   // Priority fee
  BigInt("101"),
  false,
  "0x8ba1f109551bD432803012645Hac136c22C177ec183"
);
```

### Staking Messages

#### buildMessageSignedForPublicStaking

```typescript
const buildMessageSignedForPublicStaking = (
  evvmID: bigint,
  isStaking: boolean,
  amountOfSMate: bigint,
  nonce: bigint
): string
```

**Example:**
```typescript
const stakingMessage = buildMessageSignedForPublicStaking(
  1n,      // EVVM ID
  true,    // Staking (not unstaking)
  5n,      // 5 MATE tokens
  100n     // Nonce
);
// Returns: "1,publicStaking,true,5,100"
```

#### buildMessageSignedForPresaleStaking

```typescript
const buildMessageSignedForPresaleStaking = (
  evvmID: bigint,
  isStaking: boolean,
  amountOfSMate: bigint,
  nonce: bigint
): string
```

#### buildMessageSignedForPublicServiceStake

```typescript
const buildMessageSignedForPublicServiceStake = (
  evvmID: bigint,
  serviceAddress: string,
  isStaking: boolean,
  amountOfSMate: bigint,
  nonce: bigint
): string
```

### NameService Messages

#### Username Registration

```typescript
const buildMessageSignedForRegistrationUsername = (
  evvmID: bigint,
  username: string,
  clowNumber: bigint,
  nonceNameService: bigint
): string

const buildMessageSignedForPreRegistrationUsername = (
  evvmID: bigint,
  hashUsername: string,
  nonceNameService: bigint
): string
```

**Example:**
```typescript
const registrationMessage = buildMessageSignedForRegistrationUsername(
  1n,           // EVVM ID
  "myusername", // Username
  12345n,       // Clown number
  100n          // Nonce
);
// Returns: "1,registrationUsername,myusername,12345,100"
```

#### Marketplace Operations

```typescript
const buildMessageSignedForMakeOffer = (
  evvmID: bigint,
  username: string,
  dateExpire: bigint,
  amount: bigint,
  nonceNameService: bigint
): string

const buildMessageSignedForWithdrawOffer = (
  evvmID: bigint,
  username: string,
  offerId: bigint,
  mateNameServiceNonce: bigint
): string

const buildMessageSignedForAcceptOffer = (
  evvmID: bigint,
  username: string,
  offerId: bigint,
  mateNameServiceNonce: bigint
): string
```

#### Metadata Management

```typescript
const buildMessageSignedForAddCustomMetadata = (
  evvmID: bigint,
  identity: string,
  value: string,
  mateNameServiceNonce: bigint
): string

const buildMessageSignedForRemoveCustomMetadata = (
  evvmID: bigint,
  identity: string,
  key: bigint,
  nonceNameService: bigint
): string

const buildMessageSignedForFlushCustomMetadata = (
  evvmID: bigint,
  identity: string,
  nonceNameService: bigint
): string

const buildMessageSignedForFlushUsername = (
  evvmID: bigint,
  username: string,
  nonceNameService: bigint
): string
```

### Basic Message Builder

The foundational function used by all message builders:

```typescript
const basicMessageBuilder = (
  evvmID: string,
  functionName: string,
  inputs: string
): string
```

**Example:**
```typescript
const customMessage = basicMessageBuilder(
  "1",
  "customFunction",
  "param1,param2,param3"
);
// Returns: "1,customFunction,param1,param2,param3"
```

## Hash Utilities

### Overview

Hash utilities provide cryptographic functions for data integrity and privacy in the EVVM ecosystem. These functions use industry-standard hashing algorithms.

### Import Pattern

```typescript
import { 
  hashDispersePaymentUsersToPay,
  hashPreRegisteredUsername
} from '@evvm/viem-signature-library';
```

### hashDispersePaymentUsersToPay

Hashes payment data for multiple recipients in disperse payment operations:

```typescript
const hashDispersePaymentUsersToPay = (
  toData: DispersePayMetadata[]
): `0x${string}`
```

**Parameters:**
- `toData`: Array of payment metadata objects

**Example:**
```typescript
import { DispersePayMetadata } from '@evvm/viem-signature-library';

const paymentData: DispersePayMetadata[] = [
  {
    amount: BigInt("1000000000000000000"), // 1 ETH
    to_address: "0x742d35Cc6634C0532925a3b8D00B6d0e98A8887e" as `0x${string}`,
    to_identity: "alice"
  },
  {
    amount: BigInt("2000000000000000000"), // 2 ETH
    to_address: "0x8ba1f109551bD432803012645Hac136c22C177ec183" as `0x${string}`,
    to_identity: "bob"
  }
];

const hashedData = hashDispersePaymentUsersToPay(paymentData);
// Returns: "0x1a2b3c4d5e6f789..."
```

### hashPreRegisteredUsername

Creates a hash for username pre-registration:

```typescript
const hashPreRegisteredUsername = (
  username: string,
  clowNumber: bigint
): `0x${string}`
```

**Parameters:**
- `username`: Username to register
- `clowNumber`: Unique clown number for the username

**Example:**
```typescript
const usernameHash = hashPreRegisteredUsername(
  "myusername",
  12345n
);
// Returns: "0xa1b2c3d4e5f6789..."

// Use in pre-registration message
const preRegMessage = buildMessageSignedForPreRegistrationUsername(
  1n,
  usernameHash.slice(2), // Remove 0x prefix
  100n
);
```

## Usage Patterns

### Complete Payment Flow

```typescript
import { 
  buildMessageSignedForPay,
  EVVMSignatureBuilder 
} from '@evvm/viem-signature-library';

const executePaymentWithUtils = async (
  walletClient: WalletClient,
  account: Account,
  recipient: string,
  amount: bigint
) => {
  // 1. Build message using utility
  const message = buildMessageSignedForPay(
    1n,                                    // EVVM ID
    recipient,                            // Recipient
    "0x0000000000000000000000000000000000000001" as `0x${string}`,
    amount,                               // Amount
    0n,                                   // No priority fee
    100n,                                 // Nonce
    false,                                // Not priority
    account.address                       // Executor
  );

  // 2. Sign message using signature builder
  const signatureBuilder = new EVVMSignatureBuilder(walletClient, account);
  const signature = await signatureBuilder.signMessage(message);

  return { message, signature };
};
```

### Disperse Payment with Hashing

```typescript
import { 
  hashDispersePaymentUsersToPay,
  buildMessageSignedForDispersePay,
  DispersePayMetadata 
} from '@evvm/viem-signature-library';

const createDispersePayment = async (recipients: DispersePayMetadata[]) => {
  // 1. Hash recipient data
  const hashedRecipients = hashDispersePaymentUsersToPay(recipients);
  
  // 2. Calculate total amount
  const totalAmount = recipients.reduce(
    (sum, recipient) => sum + recipient.amount, 
    0n
  );
  
  // 3. Build message
  const message = buildMessageSignedForDispersePay(
    1n,                           // EVVM ID
    hashedRecipients.slice(2),    // Hash without 0x
    "0x0000000000000000000000000000000000000001" as `0x${string}`,
    totalAmount,                  // Total amount
    0n,                          // Priority fee
    101n,                        // Nonce
    false,                       // Priority flag
    account.address              // Executor
  );

  return { message, hashedRecipients };
};
```

### Username Registration Flow

```typescript
import { 
  hashPreRegisteredUsername,
  buildMessageSignedForPreRegistrationUsername,
  buildMessageSignedForRegistrationUsername 
} from '@evvm/viem-signature-library';

const registerUsernameComplete = async (username: string, clowNumber: bigint) => {
  // 1. Pre-registration
  const usernameHash = hashPreRegisteredUsername(username, clowNumber);
  const preRegMessage = buildMessageSignedForPreRegistrationUsername(
    1n,
    usernameHash.slice(2), // Remove 0x prefix
    100n
  );

  // 2. Registration
  const regMessage = buildMessageSignedForRegistrationUsername(
    1n,
    username,
    clowNumber,
    101n
  );

  return { preRegMessage, regMessage, usernameHash };
};
```

## Error Handling

### Message Construction Validation

```typescript
const safeMessageConstruction = (to: string, amount: bigint) => {
  try {
    if (!to || typeof to !== 'string') {
      throw new Error('Invalid recipient address');
    }
    
    if (amount <= 0n) {
      throw new Error('Amount must be greater than zero');
    }

    return buildMessageSignedForPay(
      1n, to, tokenAddress, amount, 0n, nonce, false, executor
    );
  } catch (error) {
    console.error('Message construction failed:', error);
    throw error;
  }
};
```

### Hash Validation

```typescript
const validateHashedData = (toData: DispersePayMetadata[]) => {
  if (!Array.isArray(toData) || toData.length === 0) {
    throw new Error('Invalid payment data array');
  }
  
  for (const item of toData) {
    if (!item.to_address || item.amount <= 0n) {
      throw new Error('Invalid payment metadata');
    }
  }
  
  return hashDispersePaymentUsersToPay(toData);
};
```

All utility functions are designed to work seamlessly with the signature builders and provide the foundation for secure, consistent EVVM operations.