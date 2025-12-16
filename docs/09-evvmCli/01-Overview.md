---
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
git clone https://github.com/EVVM-org/Testnet-Contracts
cd Testnet-Contracts
./evvm install
```

**Option 2: Manual installation**

```bash
git clone https://github.com/EVVM-org/Testnet-Contracts
cd Testnet-Contracts
bun install
forge install
```

## CLI Structure

The EVVM CLI is organized into several commands:

| Command | Purpose |
|---------|---------|
| [`deploy`](./02-Deploy.md) | Deploy a new EVVM instance to a blockchain |
| [`register`](./03-Register.md) | Register an existing EVVM instance in the registry |
| [`install`](./04-Install.md) | Install all project dependencies |
| [`help`](./05-HelpAndVersion.md) | Display CLI help information |
| [`version`](./05-HelpAndVersion.md) | Show the current CLI version |

## Basic Usage

```bash
# Display help
./evvm help

# Check version
./evvm version

# Deploy a new EVVM instance
./evvm deploy

# Register an existing EVVM
./evvm register --evvmAddress 0x...

# Install dependencies
./evvm install
```

## Environment Configuration

The CLI uses environment variables from a `.env` file:

```bash
# Required: RPC URL for your target network
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Optional: Custom Ethereum Sepolia RPC for registry operations
ETH_SEPOLIA_RPC="https://gateway.tenderly.co/public/sepolia"

# Optional: Etherscan API key for contract verification
ETHERSCAN_API="your_etherscan_api_key"
```

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
```

## Global Options

All commands support these global options:

- `-h`, `--help` - Show command help
- `-v`, `--version` - Show CLI version
- `-w`, `--walletName <name>` - Specify wallet name (default: `defaultKey`)

## Next Steps

- **[Deploy Command](./02-Deploy.md)** - Learn how to deploy a new EVVM instance
- **[Register Command](./03-Register.md)** - Register your EVVM in the official registry
- **[QuickStart Guide](../02-QuickStart.md)** - Step-by-step deployment tutorial
