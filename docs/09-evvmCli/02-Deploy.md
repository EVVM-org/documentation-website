---
sidebar_position: 2
---

# Deploy Command

Deploy a complete EVVM instance to any supported blockchain network with interactive configuration.

## Command

```bash
./evvm deploy [options]
```

## Description

The `deploy` command is an interactive wizard that guides you through the entire EVVM deployment process. It handles configuration collection, input validation, contract deployment, block explorer verification, and optional registry registration.

## Options

### `--skipInputConfig`, `-s`

Skip the interactive configuration wizard and use the existing configuration file.

- **Type**: `boolean`
- **Default**: `false`
- **Usage**: `./evvm deploy --skipInputConfig`

When enabled, the CLI reads configuration from `./input/Inputs.sol` instead of prompting for user input. Useful for:
- Re-deploying with the same configuration
- Automated deployments
- Testing and development workflows

:::warning
Ensure `./input/Inputs.sol` exists and contains valid configuration before using this flag.
:::

### `--walletName <name>`, `-w <name>`

Specify which Foundry wallet to use for deployment transactions.

- **Type**: `string`
- **Default**: `defaultKey`
- **Usage**: `./evvm deploy --walletName myWallet`

The wallet must be previously imported into Foundry's keystore:

```bash
cast wallet import myWallet --interactive
```

## Required Environment Variables

The CLI reads the following from your `.env` file:

### `RPC_URL` (Required)

The RPC endpoint for the blockchain where you want to deploy EVVM.

```bash
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
```

If not found in `.env`, the CLI will prompt you to enter it.

### `ETHERSCAN_API` (Optional)

Required only if using Etherscan v2 verification.

```bash
ETHERSCAN_API="your_etherscan_api_key"
```

## Deployment Flow

### 1. Prerequisites Validation

The CLI validates that all required tools are installed and configured:

- ✅ Foundry installation check
- ✅ Wallet availability verification
- ✅ RPC connectivity test

### 2. Configuration Collection

#### Administrator Addresses

Three administrative addresses are required:

**Admin**
- Full contract administrator privileges
- Can modify system parameters
- Controls contract upgrades

**Golden Fisher**
- Sudo account with privileged staking operations
- Bypasses normal staking constraints
- Used for emergency operations

**Activator**
- Manages epoch activation in the Estimator contract
- Controls reward distribution timing
- Essential for staking rewards system

```
Enter the admin address: 0x...
Enter the goldenFisher address: 0x...
Enter the activator address: 0x...
```

#### Token Configuration

Configure your EVVM's native token:

```
EVVM Name [EVVM]: 
Principal Token Name [Mate Token]: 
Principal Token Symbol [MATE]: 
```

Values in brackets `[value]` are defaults. Press Enter to accept or type a new value.

#### Advanced Metadata (Optional)

Configure token economics and reward parameters:

```
Configure advanced metadata (totalSupply, eraTokens, reward)? (y/n):
```

If you choose `y`, you'll be prompted for:

- **totalSupply** - Total token supply (default: `2033333333000000000000000000`)
- **eraTokens** - Tokens allocated per era (default: `1016666666500000000000000000`)
- **reward** - Reward per block/action (default: `5000000000000000000`)

:::tip
Unless you have specific token economics requirements, use the default values by answering `n`. The defaults are designed for most use cases.
:::

#### Configuration Summary

Review all entered values:

```
═══════════════════════════════════════
          Configuration Summary
═══════════════════════════════════════

Addresses:
  admin: 0x...
  goldenFisher: 0x...
  activator: 0x...

EVVM Metadata:
  EvvmName: EVVM
  principalTokenName: Mate Token
  principalTokenSymbol: MATE
  principalTokenAddress: 0x0000000000000000000000000000000000000001
  totalSupply: 2033333333000000000000000000
  eraTokens: 1016666666500000000000000000
  reward: 5000000000000000000

Confirm configuration? (y/n):
```

### 3. Chain Validation

The CLI verifies that your target chain is supported:

- **Testnet chains**: Automatically validated against EVVM Registry
- **Local blockchains** (Chain ID 31337/1337): Skip validation, proceed directly
- **Unsupported chains**: Display error with instructions for requesting support

:::info[Local Development]
Local blockchains (Anvil, Hardhat) are detected automatically and skip registry validation.
:::

### 4. Block Explorer Verification

Choose how to verify your deployed contracts:

```
Select block explorer verification:
🭬 Etherscan v2
  Blockscout
  Sourcify
  Custom
  Skip verification (not recommended)
```

#### Verification Options

**Etherscan v2**
- Requires `ETHERSCAN_API` in `.env` file
- Supports Etherscan and Etherscan-compatible explorers
- Most common option for major networks

**Blockscout**
- Requires block explorer homepage URL
- CLI will prompt: `Enter your Blockscout homepage URL`
- Common for L2s and custom networks

**Sourcify**
- Automatically verifies on [Sourcify](https://sourcify.dev/)
- No API key required
- Decentralized verification

**Custom**
- Provide custom verification flags
- Example: `--verify --verifier-url <url> --verifier-api-key <key>`
- For specialized verification setups

**Skip verification**
- Deploys without verification
- Not recommended for production
- Use only for local testing

### 5. Contract Deployment

The CLI compiles and deploys all EVVM contracts:

```
═══════════════════════════════════════
             Deployment
═══════════════════════════════════════

 Chain ID: 421614
Starting deployment...
```

Six contracts are deployed in sequence:

1. **Staking** - Staking and reward management
2. **Evvm** - Core virtual machine logic
3. **Estimator** - Reward calculation engine
4. **NameService** - Domain name system
5. **Treasury** - Asset management
6. **P2PSwap** - Token exchange

The deployment automatically:
- Links contracts together
- Sets up initial permissions
- Configures cross-contract references

### 6. Deployment Success

After successful deployment, you'll see:

```
✓ Deployment completed successfully!

═══════════════════════════════════════
          Deployed Contracts
═══════════════════════════════════════

  ✓ Staking
    → 0x...
  ✓ Evvm
    → 0x...
  ✓ Estimator
    → 0x...
  ✓ NameService
    → 0x...
  ✓ Treasury
    → 0x...
  ✓ P2PSwap
    → 0x...
```

All contracts are verified on the block explorer with links to view them.

### 7. Registry Registration (Optional)

The CLI asks if you want to register your EVVM immediately:

```
═══════════════════════════════════════
          Next Step: Registration
═══════════════════════════════════════
Your EVVM instance is ready to be registered.

Important:
   To register now, your Admin address must match the defaultKey wallet.
   Otherwise, you can register later using:
   evvm register --evvmAddress 0x...

   📖 For more details, visit:
   https://www.evvm.info/docs/QuickStart#7-register-in-registry-evvm

Do you want to register the EVVM instance now? (y/n):
```

If you choose `y`:

1. CLI prompts for custom Ethereum Sepolia RPC (optional)
2. Calls EVVM Registry contract on Ethereum Sepolia
3. Receives EVVM ID (≥ 1000)
4. Updates your EVVM contract with the assigned ID

If you choose `n`, you can register later using the [`register` command](./03-Register.md).

## Examples

### Basic Deployment

Deploy with interactive configuration:

```bash
./evvm deploy
```

### Deploy with Existing Configuration

Use previously saved configuration:

```bash
./evvm deploy --skipInputConfig
```

### Deploy with Custom Wallet

Use a specific wallet for deployment:

```bash
./evvm deploy --walletName myWallet
```

### Combined Options

Skip configuration and use custom wallet:

```bash
./evvm deploy -s -w myWallet
```

## Output Files

### Configuration File

Generated at `./input/Inputs.sol`:

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import {EvvmStructs} from "@evvm/testnet-contracts/contracts/evvm/lib/EvvmStructs.sol";

abstract contract Inputs {
    address admin = 0x...;
    address goldenFisher = 0x...;
    address activator = 0x...;

    EvvmStructs.EvvmMetadata inputMetadata =
        EvvmStructs.EvvmMetadata({
            EvvmName: "EVVM",
            EvvmID: 0,
            principalTokenName: "Mate Token",
            principalTokenSymbol: "MATE",
            principalTokenAddress: 0x0000000000000000000000000000000000000001,
            totalSupply: 2033333333000000000000000000,
            eraTokens: 1016666666500000000000000000,
            reward: 5000000000000000000
        });
}
```

### Deployment Data

Saved at `./broadcast/Deploy.s.sol/[chainId]/run-latest.json`:

Contains:
- Transaction details
- Deployed contract addresses
- Constructor arguments
- Gas usage information
- Verification data

## Troubleshooting

### Foundry Not Found

```
Error: Foundry is not installed.
```

**Solution**: Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Wallet Not Found

```
Error: Wallet 'defaultKey' is not available.
```

**Solution**: Import your wallet:
```bash
cast wallet import defaultKey --interactive
```

### Chain Not Supported

```
Error: Host Chain ID 12345 is not supported.
```

**Solution**: 
- For testnet chains, request support at [evvm-registry-contracts](https://github.com/EVVM-org/evvm-registry-contracts)
- For mainnet, EVVM doesn't support mainnet yet
- For local testing, use an unregistered chain ID (e.g., 1337)

### Verification Failed

If verification fails, contracts are still deployed successfully. You can verify manually later using Foundry:

```bash
forge verify-contract <contract_address> <contract_name> \
  --chain-id <chain_id> \
  --etherscan-api-key <api_key>
```

## See Also

- **[Register Command](./03-Register.md)** - Register your deployed EVVM
- **[QuickStart Guide](../02-QuickStart.md)** - Complete deployment tutorial
- **[EVVM Registry](../08-RegistryEvvm/01-Overview.md)** - Registry system documentation
