---
sidebar_position: 4
---

# Install Command

Install all project dependencies required for EVVM development and deployment.

## Command

```bash
./evvm install
```

## Description

The `install` command automatically installs all necessary dependencies for the EVVM project. It runs both package manager and Foundry dependency installations in sequence.

This command is equivalent to running:
```bash
bun install
forge install
```

## What It Does

### 1. Install Node.js Dependencies

Runs `bun install` to install all JavaScript/TypeScript dependencies defined in `package.json`:

- **@hyperlane-xyz/core** - Cross-chain messaging support
- **chalk** - Terminal styling
- **dotenv** - Environment variable management
- **execa** - Process execution utilities
- **prompts** - Interactive CLI prompts
- **viem** - Ethereum library for TypeScript

### 2. Install Solidity Dependencies

Runs `forge install` to install all Solidity dependencies defined in `foundry.toml`:

- **axelar-gmp-sdk-solidity** - Axelar GMP integration
- **forge-std** - Foundry standard library
- **LayerZero-v2** - LayerZero cross-chain protocol
- **openzeppelin-contracts** - OpenZeppelin contract library
- **solady** - Optimized Solidity utilities
- **solidity-bytes-utils** - Bytes manipulation utilities
- **v3-core** - Uniswap V3 core contracts
- **v3-periphery** - Uniswap V3 periphery contracts

## Usage

### Basic Installation

Install all dependencies:

```bash
./evvm install
```

### After Cloning

This command should be run immediately after cloning the repository:

```bash
git clone https://github.com/EVVM-org/Testnet-Contracts
cd Testnet-Contracts
./evvm install
```

### After Pulling Updates

Run after pulling updates that may include new dependencies:

```bash
git pull
./evvm install
```

## Output

The command displays progress for both installation steps:

```
Starting full test suite on EVVM...
[bun install output...]
[forge install output...]
Dependencies installed successfully.
```

## Options

This command has no options or flags. It always installs all dependencies.

## Prerequisites

Before running this command, ensure you have:

- **Bun** (≥ 1.0) - [Installation Guide](https://bun.sh/)
- **Foundry** - [Installation Guide](https://getfoundry.sh/)
- **Git** - [Installation Guide](https://git-scm.com/downloads)

## Dependency Structure

### Node.js Dependencies

Located in `package.json`:

```json
{
  "dependencies": {
    "@hyperlane-xyz/core": "^3.6.1",
    "chalk": "^5.3.0",
    "dotenv": "^16.4.5",
    "execa": "^8.0.1",
    "prompts": "^2.4.2",
    "viem": "^2.39.0"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/prompts": "^2.4.9",
    "forge-std": "^1.0.0",
    "typescript": "^5.3.0"
  }
}
```

### Solidity Dependencies

Located in `lib/` directory after installation:

```
lib/
  ├── axelar-gmp-sdk-solidity/
  ├── forge-std/
  ├── LayerZero-v2/
  ├── openzeppelin-contracts/
  ├── solady/
  ├── solidity-bytes-utils/
  ├── v3-core/
  └── v3-periphery/
```

## Troubleshooting

### Bun Not Found

```
Error: bun: command not found
```

**Solution**: Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

### Forge Not Found

```
Error: forge: command not found
```

**Solution**: Install Foundry:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Git Submodule Issues

If Forge dependencies fail to install:

```
Error: Failed to install git submodule
```

**Solution**: Update Git submodules manually:
```bash
git submodule update --init --recursive
```

### Permission Denied

```
Error: EACCES: permission denied
```

**Solution**: Run with appropriate permissions or fix directory ownership:
```bash
sudo chown -R $USER:$USER .
./evvm install
```

### Network Issues

If installation fails due to network issues:

**Solution**: 
- Check internet connection
- Try again later
- Use a VPN if certain repositories are blocked

### Dependency Conflicts

If you encounter version conflicts:

**Solution**: Clean and reinstall:
```bash
rm -rf node_modules
rm -rf lib
rm bun.lockb
./evvm install
```

## When to Run

You should run `./evvm install` when:

- **First-time setup**: After cloning the repository
- **After updates**: After pulling changes that modify dependencies
- **Dependency issues**: When encountering import or compilation errors
- **Clean installation**: After manually removing `node_modules` or `lib` directories
- **CI/CD pipelines**: As part of automated build processes

## Related Commands

- **[Deploy Command](./02-Deploy.md)** - Deploy EVVM after installation

## Manual Installation

If you prefer to install dependencies manually:

### Node.js Dependencies

```bash
bun install
```

### Solidity Dependencies

```bash
forge install
```

Both commands must be run for complete setup.

## See Also

- **[Overview](./01-Overview.md)** - CLI overview and setup
- **[QuickStart Guide](../02-QuickStart.md)** - Complete setup tutorial
