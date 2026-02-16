---
description: "Overview of the EVVM CLI for deploying, registering, and managing EVVM instances with automated configuration"
sidebar_position: 1
---

# Overview

The EVVM CLI is a powerful command-line interface tool designed to simplify the deployment, registration, and management of EVVM (Ethereum Virtual Virtual Machine) instances.

## What is the EVVM CLI?

The EVVM CLI (`./evvm`) is an interactive tool that automates the entire lifecycle of EVVM deployments. It handles:

- **Configuration** - Interactive prompts for all deployment parameters
- **Validation** - Automated prerequisite checks and input validation
- **Deployment** - Contract compilation and deployment using Foundry
- **Verification** - Block explorer verification with multiple provider support
- **Registration** - EVVM Registry integration for official identification

## Prerequisites

Before using the EVVM CLI, ensure you have the following installed:

- **Foundry** - [Installation Guide](https://getfoundry.sh/introduction/installation/)
- **Bun** (≥ 1.0) - [Installation Guide](https://bun.sh/)
- **Git** - [Installation Guide](https://git-scm.com/downloads)

The CLI automatically validates these prerequisites before executing commands.

## Installation

Clone the repository and install dependencies:

**Option 1: Using CLI install command (recommended)**

```bash
git clone --recursive https://github.com/EVVM-org/Testnet-Contracts
cd Testnet-Contracts
./evvm install
```

**Option 2: Manual installation**

```bash
git clone --recursive https://github.com/EVVM-org/Testnet-Contracts
cd Testnet-Contracts
bun install
forge install
```

## CLI Structure

The EVVM CLI is organized into several commands:

| Command | Purpose |
|---------|---------|
| [`deploy`](./02-Deploy.md) | Deploy a new EVVM instance (single or cross-chain) |
| [`register`](./03-Register.md) | Register an existing EVVM instance in the registry |
| [`setUpCrossChainTreasuries`](./05-SetUpCrossChainTreasuries.md) | Configure cross-chain treasury stations |
| [`developer`](./06-Developer.md) | Developer utilities and helpers |
| [`help`](./04-HelpAndVersion.md) | Display CLI help information |
| [`version`](./04-HelpAndVersion.md) | Show the current CLI version |

## Basic Usage

```bash
# Display help
./evvm help

# Check version
./evvm version

# Deploy a single-chain EVVM instance
./evvm deploy

# Deploy a cross-chain EVVM instance
./evvm deploy --crossChain

# Register an existing EVVM
./evvm register --evvmAddress 0x...

# Register a cross-chain EVVM
./evvm register --crossChain --evvmAddress 0x...

# Configure cross-chain treasuries
./evvm setUpCrossChainTreasuries

# Generate contract interfaces (for developers)
./evvm developer --makeInterface

# Run test suite
./evvm developer --runTest
```

## Environment Configuration

The CLI uses environment variables from a `.env` file:

### Single-Chain Configuration
```bash
# Required: RPC URL for your target network
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Optional: Custom Ethereum Sepolia RPC for registry operations
EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"

# Optional: Etherscan API key for contract verification
ETHERSCAN_API="your_etherscan_api_key"
```

### Cross-Chain Configuration
```bash
# Host chain RPC (main EVVM deployment)
HOST_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# External chain RPC (Treasury External Station)
EXTERNAL_RPC_URL="https://sepolia.base.org"

# Optional: Custom Ethereum Sepolia RPC for registry operations
EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"

# Optional: Etherscan API key for contract verification
ETHERSCAN_API="your_etherscan_api_key"
```

:::info
If RPC URLs are not found in `.env`, the CLI will prompt you to enter them interactively.
:::

Create your `.env` file from the example:

```bash
cp .env.example .env
```

:::warning[Security]
Never store private keys in `.env` files. Use Foundry's encrypted keystore for wallet management.
:::

## Wallet Management

The CLI uses Foundry's encrypted keystore for secure wallet management:

```bash
# Import a wallet
cast wallet import defaultKey --interactive

# Use a custom wallet name
cast wallet import myWallet --interactive

# Specify wallet during deployment
./evvm deploy --walletName myWallet

# List imported wallets
cast wallet list
```

## Global Options

All commands support these global options:

- `-h`, `--help` - Show command help
- `-v`, `--version` - Show CLI version

## Next Steps

- **[Deploy Command](./02-Deploy.md)** - Learn how to deploy a new EVVM instance
- **[Register Command](./03-Register.md)** - Register your EVVM in the official registry
- **[QuickStart Guide](../02-QuickStart.md)** - Step-by-step deployment tutorial
