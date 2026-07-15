---
description: "Install all EVVM CLI dependencies including contracts, Bun packages, and Foundry libraries"
sidebar_position: 7
---

# Install Command

Install all dependencies required by the EVVM CLI, including smart contracts, Bun packages, and Foundry libraries.

## Command

```bash
./evvm install
```

## Description

The `install` command sets up the complete EVVM CLI environment by installing all required dependencies. It handles Git submodules, Bun packages, and Foundry libraries in a single step.

:::info
This is the recommended installation method after cloning the repository.
:::

## Workflow

### 1. Git Verification

The CLI verifies that Git is installed on the system.

```
Checking Git installation...
```

If Git is not found, the command exits with an error and installation instructions.

### 2. Contract Installation Check

The CLI checks if EVVM contracts are already installed at `lib/evvm/testnet/`:

- **Already installed**: Prompts whether to reinstall
- **Not installed**: Proceeds with installation

### 3. Contract Installation

The installation method depends on the environment:

#### Git Repository (standard clone)

If the CLI is running inside a Git repository, it updates submodules:

```bash
git submodule update --init --recursive --depth 1 --jobs 4
```

This fetches the EVVM testnet contracts as a Git submodule.

#### Non-Git Environment (bunx/npx)

If the CLI is running outside a Git repository (e.g., via `bunx` or `npx`), it clones the contracts directly:

```bash
git clone https://github.com/EVVM-org/testnet-Contracts
```

### 4. Bun Dependencies

Installs all Bun/Node.js packages for the CLI:

```bash
bun install
```

### 5. Contract Dependencies

Installs Bun packages inside the contracts directory:

```bash
cd lib/evvm/testnet && bun install
```

### 6. Foundry Libraries

Installs Foundry dependencies for the contracts:

```bash
cd lib/evvm/testnet && forge install
```

## Usage Examples

### Standard Installation

```bash
git clone --recursive https://github.com/EVVM-org/evvm-cli
cd evvm-cli
./evvm install
```

### Reinstall Dependencies

If contracts are already installed, the CLI will prompt:

```
Contracts are already installed. Reinstall? (y/n):
```

Choose `y` to force a clean reinstall, or `n` to skip contract installation and only install Bun/Foundry dependencies.

## What Gets Installed

| Component | Source | Location |
|-----------|--------|----------|
| EVVM Testnet Contracts | GitHub submodule | `lib/evvm/testnet/` |
| CLI Node Packages | `package.json` | `node_modules/` |
| Contract Node Packages | `lib/evvm/testnet/package.json` | `lib/evvm/testnet/node_modules/` |
| Foundry Libraries | `lib/evvm/testnet/foundry.toml` | `lib/evvm/testnet/lib/` |

## Troubleshooting

### Git Not Found

```
Error: Git is not installed.
```

**Solution**: Install Git from [git-scm.com](https://git-scm.com/downloads).

### Submodule Update Failed

```
Error: Failed to update submodules.
```

**Solution**: Ensure you cloned with `--recursive`, or run:
```bash
git submodule update --init --recursive
```

### Bun Install Failed

```
Error: bun install failed.
```

**Solution**: Ensure Bun is installed and up to date:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Forge Install Failed

```
Error: forge install failed.
```

**Solution**: Ensure Foundry is installed:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Related Commands

- [`deploy`](./02-Deploy.md) - Deploy EVVM contracts after installation
- [`developer`](./06-Developer.md) - Developer utilities
- [`help`](./04-HelpAndVersion.md) - Display all CLI commands
