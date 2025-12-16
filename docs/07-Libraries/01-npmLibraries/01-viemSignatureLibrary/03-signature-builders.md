---
title: Signature Builders
description: "Comprehensive guide to using the EVVM Viem Signature Library's signature builders for various services."
sidebar_position: 3
---

# Signature Builders

Signature builders are specialized classes that construct and sign EVVM messages for different services. Each builder handles the specific requirements and patterns for its respective service.

## Available Signature Builders

### EVVMSignatureBuilder
Handles core EVVM payment operations:
- `signPay` - Individual payments to addresses or usernames
- `signDispersePay` - Multiple recipient payments in single transaction

### NameServiceSignatureBuilder
Handles identity management operations:
- `signPreRegistrationUsername` - Pre-register username with hash
- `signRegistrationUsername` - Register username with payment
- `signMakeOffer` - Make offer for existing username
- `signWithdrawOffer` - Withdraw previously made offer
- `signAcceptOffer` - Accept offer for your username
- `signRenewUsername` - Renew username registration
- `signAddCustomMetadata` - Add custom metadata to identity
- `signRemoveCustomMetadata` - Remove specific metadata entry
- `signFlushCustomMetadata` - Remove all metadata for identity
- `signFlushUsername` - Remove username completely

### StakingSignatureBuilder
Handles staking operations:
- `signGoldenStaking` - Golden staking (single signature, 5083 EVVM per stake)
- `signPresaleStaking` - Presale staking (dual signature with payment)
- `signPublicStaking` - Public staking (dual signature, flexible amounts)

### GenericSignatureBuilder
Handles custom service operations:
- Generic message construction for any EVVM function
- Future-proofing for new services

## Basic Usage Examples

### 1. Simple Payment (EVVMSignatureBuilder)

Basic payment signature for sending tokens or native currency:

```typescript
import { EVVMSignatureBuilder, PayInputData } from '@evvm/viem-signature-library';

const createPaymentSignature = async () => {
  const walletData = await getAccountWithRetry(config);
  const walletClient = await getWalletClient(config);
  const signatureBuilder = new EVVMSignatureBuilder(walletClient, walletData);

  const signature = await signatureBuilder.signPay(
    BigInt("1"), // evvmID
    "alice.evvm", // recipient (address or username)
    "0x0000000000000000000000000000000000000000" as `0x${string}`, // Native token
    BigInt("1000000000000000000"), // 1 ETH
    BigInt("50000000000000000"), // Priority fee
    BigInt("123"), // Nonce
    false, // Priority flag
    "0x742d35Cc6634C0532925a3b8D138068fd4C1B7a1" as `0x${string}` // Executor
  );

  return signature;
};
```

### 2. Service + Payment (StakingSignatureBuilder)

Dual signature example - service function that requires payment:

```typescript
import { StakingSignatureBuilder } from '@evvm/viem-signature-library';

const createPublicStakingSignature = async () => {
  const walletData = await getAccountWithRetry(config);
  const walletClient = await getWalletClient(config);
  const stakingBuilder = new StakingSignatureBuilder(walletClient, walletData);

  // Generate dual signatures (service + payment)
  const { paySignature, actionSignature } = await stakingBuilder.signPublicStaking(
    BigInt("1"), // evvmID
    "0xStakingAddress" as `0x${string}`,
    true, // isStaking
    BigInt("5"), // amount of MATE tokens
    BigInt("100"), // service nonce
    BigInt("25415000000000000000000"), // total price (5 * 5083 EVVM)
    BigInt("10000000000000000"), // priority fee
    BigInt("101"), // payment nonce
    false // priority flag
  );

  return { paySignature, actionSignature };
};
```

## GenericSignatureBuilder Usage

### Custom Service Functions

For new or custom EVVM services:

```typescript
import { GenericSignatureBuilder } from '@evvm/viem-signature-library';

const createCustomServiceSignature = async () => {
  const walletData = await getAccountWithRetry(config);
  const walletClient = await getWalletClient(config);
  const genericBuilder = new GenericSignatureBuilder(walletClient, walletData);

  // Example: Coffee shop service
  const serviceData = {
    coffeeType: "Fisher Espresso",
    quantity: BigInt(2),
    totalPrice: BigInt("2000000000000000"), // 0.002 ETH
    nonce: BigInt("42")
  };

  // Construct message parameters
  const messageParams = [
    serviceData.coffeeType,
    serviceData.quantity.toString(),
    serviceData.totalPrice.toString(),
    serviceData.nonce.toString()
  ].join(",");

  // Generate signature
  const signature = await genericBuilder.signGenericMessage(
    BigInt("1"), // evvmID
    "orderCoffee", // Function name
    messageParams // Parameters
  );

  // For custom services, you also need a payment signature
  const evvmBuilder = new EVVMSignatureBuilder(walletClient, walletData);
  const paymentSignature = await evvmBuilder.signPay(
    BigInt("1"),
    "0xCafeServiceAddress" as `0x${string}`,
    "0x0000000000000000000000000000000000000000" as `0x${string}`,
    serviceData.totalPrice,
    serviceData.totalPrice / BigInt(1000), // Priority fee (0.1% of price)
    BigInt("43"), // Different nonce for payment
    false,
    "0xCafeServiceAddress" as `0x${string}`
  );

  return {
    serviceSignature: signature,
    paymentSignature: paymentSignature,
    serviceData
  };
};
```

## Common Patterns and Best Practices

### Nonce Management

```typescript
// Sync nonces (priority: false)
const getSyncNonce = async (userAddress: string) => {
  return readContract(config, {
    abi: EvvmABI,
    address: evvmAddress,
    functionName: 'getNextCurrentSyncNonce',
    args: [userAddress],
  });
};

// Async nonces (priority: true) - use random numbers
const generateAsyncNonce = () => {
  return BigInt(Math.floor(Math.random() * 1000000));
};
```

### Error Handling

```typescript
const safeSignatureCreation = async () => {
  try {
    const signature = await signatureBuilder.signPay(/* parameters */);
    return signature;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        throw new Error('User cancelled signature request');
      } else if (error.message.includes('insufficient funds')) {
        throw new Error('Insufficient balance for gas fees');
      }
    }
    throw new Error('Failed to create signature');
  }
};
```

### Type Safety

```typescript
// Use proper typing for all inputs
interface PaymentFormData {
  evvmID: string;
  to: string;
  tokenAddress: `0x${string}`;
  amount: string;
  priorityFee: string;
  nonce: string;
  priorityFlag: boolean;
  executor: `0x${string}`;
}

// Validate addresses before signing
const isValidAddress = (address: string): address is `0x${string}` => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};
```

### Address vs Username Handling

```typescript
const handleRecipient = (input: string) => {
  if (input.startsWith('0x')) {
    // Address payment
    return {
      to_address: input as `0x${string}`,
      to_identity: ""
    };
  } else {
    // Username payment
    return {
      to_address: "0x0000000000000000000000000000000000000000" as `0x${string}`,
      to_identity: input
    };
  }
};
```

## Integration with React Components

### Form State Management

```typescript
const PaymentForm = () => {
  const [formData, setFormData] = useState<PaymentFormData>({
    evvmID: "1",
    to: "",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    amount: "",
    priorityFee: "",
    nonce: "",
    priorityFlag: false,
    executor: "0x0000000000000000000000000000000000000000"
  });

  const [payInputData, setPayInputData] = useState<PayInputData | null>(null);

  const handleSignature = async () => {
    const result = await createPaymentSignature();
    setPayInputData(result);
  };

  return (
    <form onSubmit={handleSignature}>
      {/* Form inputs */}
      <button type="submit">Create Signature</button>
      {payInputData && <PaymentReceipt data={payInputData} />}
    </form>
  );
};
```