# EVVM Frontend Tooling

The EVVM Signature Constructor Frontend provides a comprehensive web application infrastructure for constructing, signing, and executing EVVM transactions. Built on Next.js with TypeScript, it implements the complete EIP-191 signature specification and transaction lifecycle management for the EVVM ecosystem.

This frontend infrastructure directly supports the transaction process described in [Process of a Transaction](../03-ProcessOfATransaction.md) by providing user interfaces for transaction creation, EIP-191 signing, and fisher interaction through various fishing spots.

### Deployed Frontend
If you want to test the deployed contracts you can use this
[live version](https://evvm.dev/)

## Quick Start

### Prerequisites

Before using the EVVM Signature Constructor Frontend, ensure you have:

- A deployed EVVM instance (follow the [QuickStart](../02-QuickStart.md) guide)
- A compatible wallet (MetaMask, WalletConnect-compatible wallets)
- Access to supported networks (Sepolia or Arbitrum Sepolia for testnet)

### Setup and Installation

```bash
# Clone the frontend repository
git clone https://github.com/EVVM-org/EVVM-Signature-Constructor-Front
cd EVVM-Signature-Constructor-Front

# Install dependencies
npm install
# or
pnpm install

# Configure environment
cp .env.example .env
# Add your Reown Project ID from https://cloud.reown.com
echo "NEXT_PUBLIC_PROJECT_ID=your_project_id_here" >> .env

# Run development server
npm run dev
# or
pnpm dev
```

### Basic Usage

1. **Connect Wallet**: Click the connect button and select your wallet
2. **Choose Function Type**: Select from available transaction types:
   - **Faucet Functions**: Get testnet tokens (testnet only)
   - **Payment Signatures**: Single and batch payments
   - **Staking Signatures**: Staking operations
   - **Name Service Signatures**: Username and metadata operations
3. **Fill Parameters**: Enter transaction parameters in the forms
4. **Sign Transaction**: Generate EIP-191 signatures
5. **Execute Transaction**: Submit to fishers for processing

For detailed deployment and EVVM setup, refer to the [QuickStart](../02-QuickStart.md) documentation.

---

## Infrastructure Overview

The frontend application serves as a critical infrastructure component that bridges user interactions with the EVVM protocol through standardized signature construction and transaction execution pipelines. It implements the complete transaction lifecycle from the [EVVM transaction process](../03-ProcessOfATransaction.md), enabling users to interact with the abstract blockchain infrastructure without managing traditional blockchain complexity.

### Core Architecture

```
EVVM-Signature-Constructor-Front/
├── public/                         # Static assets and branding
├── src/
│   ├── app/                        # Next.js application layer
│   │   ├── layout.tsx              # Application shell and providers
│   │   ├── page.tsx                # Main application entry point
│   │   ├── globals.css             # Global styling framework
│   │   └── fonts/                  # Typography assets
│   ├── components/                 # React component library
│   │   ├── ConnectButton.tsx       # Wallet connection interface
│   │   ├── ActionButtonList.tsx    # Action dispatch interface
│   │   ├── InfoList.tsx            # Account information display
│   │   └── SigConstructors/        # Signature construction modules
│   │       ├── SigMenu.tsx         # Navigation and routing logic
│   │       ├── FaucetFunctions/    # Testnet token distribution
│   │       ├── PaymentFunctions/   # Payment signature construction
│   │       ├── StakingFunctions/   # Staking operation signatures
│   │       ├── NameServiceFunctions/   # Name service signatures
│   │       └── InputsAndModules/   # Reusable UI components
│   ├── config/                     # Application configuration
│   │   └── index.ts                # Wagmi and network configuration
│   ├── constants/                  # Protocol constants and ABIs
│   │   ├── address.tsx             # Contract address registry
│   │   └── abi/                    # Smart contract interfaces
│   │       ├── Evvm.json           # Core EVVM contract ABI
│   │       ├── NameService.json    # Name service contract ABI
│   │       ├── Staking.json        # Staking contract ABI
│   │       └── Estimator.json      # Fee estimation contract ABI
│   ├── context/                    # React context providers
│   │   └── index.tsx               # Application state management
│   ├── hooks/                      # Custom React hooks
│   │   └── useClientMount.ts       # Client-side mounting logic
│   └── utils/                      # Core utility libraries
│       ├── SignatureBuilder/       # EIP-191 signature construction
│       ├── TransactionExecuter/    # Smart contract interaction
│       ├── TransactionVerify/      # Pre-execution validation
│       ├── TypeInputStructures/    # TypeScript type definitions
│       └── [utility functions]     # Supporting utilities
├── docs/                           # Documentation
├── package.json                    # Dependency management
├── tsconfig.json                   # TypeScript configuration
├── next.config.ts                  # Next.js configuration
├── .eslintrc.json                  # Code quality configuration
└── .env.example                    # Environment template
```

### Technology Stack

**Core Framework:**
- Next.js 15.3.0 with App Router architecture
- React 19.0.0 with modern concurrent features
- TypeScript 5 for type safety and developer experience

**Blockchain Integration:**
- Wagmi 2.12.31 for Ethereum wallet integration
- Viem 2.21.44 for low-level blockchain interactions
- Reown AppKit 1.7.5 for wallet connection management

**State Management:**
- TanStack Query 5.59.20 for server state management
- React Context for application state
- Cookie storage for session persistence

**Development Tools:**
- ESLint for code quality enforcement
- TypeScript strict mode for type safety
- Next.js development tools for debugging

---

## Signature Construction Infrastructure

The application implements the complete EIP-191 signature specification as defined in the EVVM Signature Structures documentation section. All signature construction follows the standardized message formats for cryptographic security and replay protection, ensuring compatibility with the fisher-based validation system described in [Process of a Transaction](../03-ProcessOfATransaction.md).

### EIP-191 Implementation

The frontend implements the exact EIP-191 signature specification as documented in the Signature Structures section, with function selectors and message construction matching the protocol requirements precisely.

```typescript
// Core signature construction pattern
const constructMessage = (
  functionSelector: string,
  ...parameters: string[]
): string => {
  return [functionSelector, ...parameters].join(',');
};

// Example: Single payment signature
const buildMessageSignedForPay = (
  from: string,
  to_address: string,
  to_identity: string,
  token: string,
  amount: string,
  priorityFee: string,
  nonce: string,
  priority: boolean,
  executor: string
): string => {
  const priorityFlag = priority ? "f4e1895b" : "4faa1fa2";
  const recipient = to_address === "0x0000000000000000000000000000000000000000" 
    ? to_identity 
    : to_address;
    
  return constructMessage(
    priorityFlag,
    recipient,
    token,
    amount,
    priorityFee,
    nonce,
    priority.toString(),
    executor
  );
};
```

### Signature Builder Hooks

The application provides specialized React hooks for each transaction type, implementing the exact signature structures defined in the protocol specification.

#### EVVM Payment Signatures

The payment signature implementation follows the exact specifications from [Single Payment Signature Structure](../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md) and [Disperse Payment Signature Structure](../05-SignatureStructures/01-EVVM/02-DispersePaySignatureStructure.md).

```typescript
export const useEVVMSignatureBuilder = () => {
  const { signMessage } = useSignMessage();
  
  const signPay = (
    amount: string,
    to: string,
    tokenAddress: string,
    priorityFee: string,
    nonce: string,
    priority: boolean,
    executor: string,
    onSuccess: (signature: string) => void,
    onError: (error: Error) => void
  ) => {
    const message = buildMessageSignedForPay(
      // Message construction parameters
    );
    
    signMessage({ message }, {
      onSuccess: (signature) => onSuccess(signature),
      onError: (error) => onError(error)
    });
  };
  
  const signDispersePay = (
    toData: DispersePayMetadata[],
    tokenAddress: string,
    amount: string,
    priorityFee: string,
    nonce: string,
    priority: boolean,
    executor: string,
    onSuccess: (signature: string) => void,
    onError: (error: Error) => void
  ) => {
    const message = buildMessageSignedForDispersePay(
      // Disperse payment construction parameters
    );
    
    signMessage({ message }, {
      onSuccess: (signature) => onSuccess(signature),
      onError: (error) => onError(error)
    });
  };
  
  return { signPay, signDispersePay };
};
```

#### Name Service Signatures

The Name Service signature implementation follows the exact specifications from the [Name Service Signature Structures](../05-SignatureStructures/02-NameService/01-preRegistrationUsernameStructure.md), implementing all functions including pre-registration, registration, offers, and metadata management.

```typescript
export const useNameServiceSignatureBuilder = () => {
  const { signMessage } = useSignMessage();
  
  // Pre-registration signature (Function Selector: 5d232a55)
  // Implements the exact structure from PreRegistrationUsernameStructure documentation
  const signPreRegistrationUsername = (
    hashUsername: string,
    nameServiceNonce: string,
    onSuccess: (signature: string) => void,
    onError: (error: Error) => void
  ) => {
    const message = constructMessage(
      "5d232a55",
      hashUsername,
      nameServiceNonce
    );
    
    signMessage({ message }, { onSuccess, onError });
  };
  
  // Registration signature (Function Selector: a5ef78b2)
  // Implements the exact structure from RegistrationUsernameStructure documentation
  const signRegistrationUsername = (
    username: string,
    clowNumber: string,
    nameServiceNonce: string,
    onSuccess: (signature: string) => void,
    onError: (error: Error) => void
  ) => {
    const message = constructMessage(
      "a5ef78b2",
      username,
      clowNumber,
      nameServiceNonce
    );
    
    signMessage({ message }, { onSuccess, onError });
  };
  
  return { 
    signPreRegistrationUsername,
    signRegistrationUsername,
    // ... other name service signatures
  };
};
```

#### Staking Signatures

The Staking signature implementation follows the specifications from [Staking Signature Structures](../05-SignatureStructures/03-Staking/01-StandardStakingStructure.md), supporting all staking operations including golden staking, presale staking, and public staking functions.

```typescript
export const useStakingSignatureBuilder = () => {
  const { signMessage } = useSignMessage();
  
  // Standard staking signature construction
  const signStaking = (
    stakingType: string,
    amount: string,
    stakingNonce: string,
    additionalData: string,
    onSuccess: (signature: string) => void,
    onError: (error: Error) => void
  ) => {
    const functionSelector = getFunctionSelectorForStaking(stakingType);
    const message = constructMessage(
      functionSelector,
      amount,
      stakingNonce,
      additionalData
    );
    
    signMessage({ message }, { onSuccess, onError });
  };
  
  return { signStaking };
};
```

---

## Transaction Execution Infrastructure

The transaction execution layer provides standardized interfaces for interacting with EVVM smart contracts using the constructed signatures. This implementation directly supports the execution phase described in [Process of a Transaction](../03-ProcessOfATransaction.md), where fishers execute validated transactions and distribute rewards.

### Contract Interaction Patterns

```typescript
// Generic transaction execution pattern
const executeTransaction = async (
  contractAddress: `0x${string}`,
  abi: any[],
  functionName: string,
  args: any[],
  config: Config
): Promise<void> => {
  try {
    const result = await writeContract(config, {
      abi,
      address: contractAddress,
      functionName,
      args
    });
    
    return result;
  } catch (error) {
    throw new Error(`Transaction execution failed: ${error.message}`);
  }
};

// EVVM payment execution
// Supports both staker and non-staker payment functions as defined in EVVM Core
export const executePay = async (
  inputData: PayInputData,
  evvmAddress: `0x${string}`,
  asStaker: boolean
): Promise<void> => {
  // Function name selection follows EVVM Core contract specifications
  // payMateStaking_* for stakers, payNoMateStaking_* for non-stakers
  // _async for priority transactions, _sync for standard processing
  const functionName = inputData.priority
    ? (asStaker ? "payMateStaking_async" : "payNoMateStaking_async")
    : (asStaker ? "payMateStaking_sync" : "payNoMateStaking_sync");
    
  return executeTransaction(
    evvmAddress,
    EvvmABI.abi,
    functionName,
    [
      inputData.from,
      inputData.to_address,
      inputData.to_identity,
      inputData.token,
      inputData.amount,
      inputData.priorityFee,
      inputData.nonce,
      inputData.executor,
      inputData.signature
    ],
    config
  );
};
```

### Type System Infrastructure

The application implements comprehensive TypeScript types that correspond exactly to the smart contract interfaces and signature requirements defined in the EVVM protocol documentation.

```typescript
// Core EVVM transaction types
interface PayInputData {
  from: `0x${string}`;
  to_address: `0x${string}`;
  to_identity: string;
  token: `0x${string}`;
  amount: bigint;
  priorityFee: bigint;
  nonce: bigint;
  priority: boolean;
  executor: string;
  signature: string;
}

interface DispersePayMetadata {
  amount: bigint;
  to_address: `0x${string}`;
  to_identity: string;
}

interface DispersePayInputData {
  from: `0x${string}`;
  toData: DispersePayMetadata[];
  token: `0x${string}`;
  amount: bigint;
  priorityFee: bigint;
  priority: boolean;
  nonce: bigint;
  executor: string;
  signature: string;
}

// Name Service transaction types
interface PreRegistrationUsernameInputData {
  user: `0x${string}`;
  hashUsername: string;
  nameServiceNonce: bigint;
  signature: string;
}

interface RegistrationUsernameInputData {
  user: `0x${string}`;
  username: string;
  clowNumber: bigint;
  nameServiceNonce: bigint;
  signature: string;
}

// Staking transaction types
interface StakingInputData {
  user: `0x${string}`;
  amount: bigint;
  stakingNonce: bigint;
  additionalData: string;
  signature: string;
}
```

---

## Network Configuration Infrastructure

The application supports multiple blockchain networks with configurable contract addresses and network parameters. The supported networks align with the EVVM deployment strategy described in [QuickStart](../02-QuickStart.md).

### Network Registry

```typescript
// Network configuration
export const networks = [
  sepolia,          // Ethereum Sepolia Testnet
  arbitrumSepolia   // Arbitrum Sepolia Testnet
] as [AppKitNetwork, ...AppKitNetwork[]];

// Contract address registry by network
export const contractAddress = {
  11155111: {  // Sepolia
    evvm: "0x5c66EB3CAAD38851C9c6291D77510b0Eaa8B3c84",
    nameService: "0x7F41487e77D092BA53c980171C4ebc71d68DC5AE",
    staking: "0x0fb1aD66636411bB50a33458a8De6507D9b270E8",
    estimator: "0xF66464ccf2d0e56DFA15572c122C6474B0A1c82C"
  },
  421614: {    // Arbitrum Sepolia
    evvm: "0xaBee6F8014468e88035041E94d530838d2ce025C",
    nameService: "0xfd54B984637AC288B8bd24AD0915Ef6fBaEA5400",
    staking: "0xb39a3134D1714AcFa6d0Bc3C9235C09918bbe2a6",
    estimator: "0xA319d1Ba0Eb0bd8aaeb7Fe931F3Ef70383fAA3A5"
  }
};

// Token address constants matching EVVM protocol specifications
// MATE token uses address 0x0000000000000000000000000000000000000001
// ETH uses zero address as per EVVM conventions
export const tokenAddress = {
  mate: "0x0000000000000000000000000000000000000001",
  ether: "0x0000000000000000000000000000000000000000"
};
```

### Wagmi Configuration

```typescript
// Wagmi adapter configuration for SSR compatibility
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: cookieStorage,
  }),
  ssr: true,
  projectId,
  networks,
});

export const config = wagmiAdapter.wagmiConfig;
```

---

## User Interface Architecture

The UI layer provides modular components for each transaction type, following the signature structure specifications exactly.

### Component Architecture Pattern

```typescript
// Generic signature constructor component pattern
interface SignatureConstructorProps {
  title: string;
  functionSelector: string;
  onSignatureComplete: (signature: string, data: any) => void;
  onExecutionComplete: () => void;
}

const SignatureConstructorComponent: React.FC<SignatureConstructorProps> = ({
  title,
  functionSelector,
  onSignatureComplete,
  onExecutionComplete
}) => {
  const [formData, setFormData] = useState({});
  const [signedData, setSignedData] = useState(null);
  
  const handleSignature = async () => {
    // Construct signature using appropriate builder
    // Call onSignatureComplete with results
  };
  
  const handleExecution = async () => {
    // Execute transaction using signed data
    // Call onExecutionComplete on success
  };
  
  return (
    <div className="signature-constructor">
      <h2>{title}</h2>
      {/* Form inputs for transaction parameters */}
      <button onClick={handleSignature}>Sign Transaction</button>
      {signedData && (
        <button onClick={handleExecution}>Execute Transaction</button>
      )}
    </div>
  );
};
```

### Input Validation Infrastructure

```typescript
// Address validation
const validateEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Amount validation
const validateAmount = (amount: string): boolean => {
  try {
    const parsed = BigInt(amount);
    return parsed > 0n;
  } catch {
    return false;
  }
};

// Nonce validation
const validateNonce = (nonce: string): boolean => {
  try {
    const parsed = BigInt(nonce);
    return parsed >= 0n;
  } catch {
    return false;
  }
};
```

---

## Error Handling and Resilience

The infrastructure implements comprehensive error handling and retry mechanisms for robust operation in production environments.

### Retry Mechanisms

```typescript
// Account retrieval with retry
export const getAccountWithRetry = async (
  config: Config, 
  maxRetries: number = 3,
  delay: number = 1000
): Promise<GetAccountReturnType | null> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const account = getAccount(config);
      if (account.address) {
        return account;
      }
    } catch (error) {
      console.warn(`Account retrieval attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        console.error("Max retries reached for account retrieval");
        return null;
      }
      
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  return null;
};

// Transaction execution with retry
const executeTransactionWithRetry = async (
  transactionFn: () => Promise<any>,
  maxRetries: number = 3
): Promise<any> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await transactionFn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};
```

### Error Classification

```typescript
// Error types for proper handling
enum TransactionErrorType {
  USER_REJECTED = "USER_REJECTED",
  INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS",
  NETWORK_ERROR = "NETWORK_ERROR",
  CONTRACT_ERROR = "CONTRACT_ERROR",
  SIGNATURE_ERROR = "SIGNATURE_ERROR"
}

const classifyError = (error: any): TransactionErrorType => {
  if (error.code === 4001) return TransactionErrorType.USER_REJECTED;
  if (error.message?.includes("insufficient funds")) return TransactionErrorType.INSUFFICIENT_FUNDS;
  if (error.message?.includes("network")) return TransactionErrorType.NETWORK_ERROR;
  if (error.message?.includes("execution reverted")) return TransactionErrorType.CONTRACT_ERROR;
  return TransactionErrorType.SIGNATURE_ERROR;
};
```

---

## Development and Deployment Infrastructure

### Build Configuration

```typescript
// Next.js configuration for production optimization
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
```

### Environment Configuration

```bash
# Production environment variables
NEXT_PUBLIC_PROJECT_ID=your_production_project_id
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_NETWORK_MODE=mainnet
```

### Deployment Pipeline

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:e2e": "playwright test"
  }
}
```

---

## Integration Patterns

### API Integration

```typescript
// External service integration pattern
interface ExternalServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
}

class EVVMServiceClient {
  constructor(private config: ExternalServiceConfig) {}
  
  async validateTransaction(transactionData: any): Promise<boolean> {
    // Validate transaction against external service
  }
  
  async estimateFees(transactionType: string, amount: bigint): Promise<bigint> {
    // Get fee estimation from external service
  }
}
```

### Monitoring Integration

```typescript
// Transaction monitoring
const monitorTransaction = async (
  txHash: string,
  onUpdate: (status: TransactionStatus) => void
) => {
  const receipt = await waitForTransaction({
    hash: txHash,
    confirmations: 2
  });
  
  onUpdate({
    status: receipt.status === "success" ? "confirmed" : "failed",
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed
  });
};
```

---

### Security Considerations

The frontend implements multiple security layers as required by the EVVM ecosystem:

### Signature Security

- All signatures implement EIP-191 standard for security as specified in Signature Structures section
- Nonce-based replay protection for all transaction types following EVVM protocol requirements
- Function selector validation for transaction integrity
- Message format validation before signing ensures compatibility with fisher validation

### Input Sanitization

- Address validation using regex patterns
- Amount validation with BigInt conversion
- Nonce validation for sequential integrity
- String sanitization for identity fields

### Session Management

- Cookie-based session persistence with security flags
- Wallet connection state management
- Automatic session cleanup on disconnect

---

## Performance Optimization

### Code Splitting

```typescript
// Dynamic imports for large components
const PaymentComponent = dynamic(
  () => import('./PaymentFunctions/PaySignaturesComponent'),
  { loading: () => <div>Loading payment interface...</div> }
);

const StakingComponent = dynamic(
  () => import('./StakingFunctions/GoldenStakingComponent'),
  { loading: () => <div>Loading staking interface...</div> }
);
```

### Caching Strategy

```typescript
// React Query configuration for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

---

## Extension and Customization

### Adding New Transaction Types

1. **Define Type Structure:**
```typescript
// Add to TypeInputStructures
interface CustomTransactionData {
  customField: string;
  amount: bigint;
  nonce: bigint;
  signature: string;
}
```

2. **Implement Signature Builder:**
```typescript
// Add to SignatureBuilder
const signCustomTransaction = (data: CustomTransactionParams, onSuccess, onError) => {
  const message = constructMessage(
    "custom_selector",
    data.customField,
    data.amount.toString(),
    data.nonce.toString()
  );
  
  signMessage({ message }, { onSuccess, onError });
};
```

3. **Create UI Component:**
```typescript
// Add to SigConstructors
export const CustomTransactionComponent = () => {
  // Implementation following established patterns
};
```

4. **Add Transaction Executor:**
```typescript
// Add to TransactionExecuter
export const executeCustomTransaction = async (
  inputData: CustomTransactionData,
  contractAddress: `0x${string}`
) => {
  return executeTransaction(
    contractAddress,
    CustomContractABI.abi,
    "customFunction",
    [inputData.customField, inputData.amount, inputData.nonce, inputData.signature],
    config
  );
};
```

### Network Extension

```typescript
// Add new network support
import { polygon, bsc } from "@reown/appkit/networks";

export const networks = [
  sepolia,
  arbitrumSepolia,
  polygon,    // New network
  bsc         // New network
];

// Update contract addresses
const contractAddress = {
  // ... existing networks
  137: {      // Polygon Mainnet
    evvm: "0x...",
    nameService: "0x...",
    staking: "0x...",
    estimator: "0x..."
  },
  56: {       // BSC Mainnet
    evvm: "0x...",
    nameService: "0x...",
    staking: "0x...",
    estimator: "0x..."
  }
};
```

---

## Documentation and Maintenance

### Code Documentation Standards

```typescript
/**
 * Constructs and signs an EVVM payment transaction
 * 
 * @param amount - Payment amount in token units
 * @param to - Recipient address or identity string
 * @param tokenAddress - Token contract address
 * @param priorityFee - Priority fee for transaction processing
 * @param nonce - Unique nonce for replay protection
 * @param priority - Priority flag for async/sync processing
 * @param executor - Executor address for transaction execution
 * @param onSuccess - Success callback with signature
 * @param onError - Error callback with error details
 * 
 * @example
 * ```typescript
 * signPay(
 *   "1000000000000000000", // 1 token
 *   "0x123...",            // Recipient address
 *   "0x000...001",         // MATE token
 *   "100000000000000",     // Priority fee
 *   "12345",               // Nonce
 *   true,                  // High priority
 *   "0x000...000",         // No executor
 *   (signature) => console.log("Signed:", signature),
 *   (error) => console.error("Error:", error)
 * );
 * ```
 */
const signPay = (/* parameters */) => {
  // Implementation
};
```

### Testing Infrastructure

```typescript
// Unit test example
describe('SignatureBuilder', () => {
  describe('buildMessageSignedForPay', () => {
    it('should construct correct message format for high priority payment', () => {
      const message = buildMessageSignedForPay(
        "0x1234567890123456789012345678901234567890",
        "0x0987654321098765432109876543210987654321",
        "",
        "0x0000000000000000000000000000000000000001",
        "1000000000000000000",
        "100000000000000",
        "12345",
        true,
        "0x0000000000000000000000000000000000000000"
      );
      
      expect(message).toBe(
        "f4e1895b,0x0987654321098765432109876543210987654321,0x0000000000000000000000000000000000000001,1000000000000000000,100000000000000,12345,true,0x0000000000000000000000000000000000000000"
      );
    });
  });
});
```

---

## References and Related Documentation

### EVVM Core Documentation
- [Introduction](../intro) - EVVM abstract blockchain overview
- [QuickStart](../02-QuickStart.md) - Deploy your EVVM instance
- [Process of a Transaction](../03-ProcessOfATransaction.md) - Complete transaction lifecycle
- [EVVM Core Contract](../04-Contracts/01-EVVM/01-Overview.md) - Payment processing and token management

### Service Documentation
- [Staking System](../04-Contracts/03-Staking/01-Overview.md) - Staking infrastructure and rewards
- [Name Service](../04-Contracts/02-NameService/01-Overview.md) - Username and identity management
- [Treasury System](../04-Contracts/04-Treasury/01-Overview.md) - Cross-chain operations and bridging

### Development Resources
- [How to Create an EVVM Service](../06-HowToMakeAEVVMService.md) - Service development guide
- [Testnet Functions](../04-Contracts/06-TestnetExclusiveFunctions.md) - Testing and faucet functions

### External Libraries
- [Wagmi Documentation](https://wagmi.sh/) - React hooks for Ethereum
- [Viem Documentation](https://viem.sh/) - TypeScript Ethereum client
- [Reown AppKit](https://docs.reown.com/appkit/overview) - Wallet connection infrastructure
- [Next.js Documentation](https://nextjs.org/docs) - React framework
- [EIP-191 Specification](https://eips.ethereum.org/EIPS/eip-191) - Signed message standard

---

This infrastructure documentation provides comprehensive technical details for developers implementing, extending, or integrating with the EVVM Signature Constructor Frontend. The modular architecture ensures maintainability and extensibility while adhering to the EVVM protocol specifications for secure transaction processing.
