---
sidebar_position: 4
---

# Help and Version Commands

Display CLI information and usage instructions.

## Help Command

### Command

```bash
./evvm help
```

or

```bash
./evvm --help
./evvm -h
```

### Description

Displays comprehensive CLI usage information including available commands, options, and examples.

### Output

The help command shows:

```
╔═══════════════════════════════════════════════════════════╗
║                     EVVM CLI Tool v2.2.0                  ║
╚═══════════════════════════════════════════════════════════╝

USAGE:
  evvm <command> [options]

COMMANDS:
  deploy              Deploy a new EVVM instance
                      Interactive wizard or use existing inputs (-s)

  register            Register an EVVM instance with the registry
                      Supports single- and cross-chain registration

  setUpCrossChainTreasuries
                      Configure cross-chain treasury stations (host ↔ external)

  fulltest            Run the complete test suite

  developer           Developer helpers and utilities

  help                Display this help message

  version             Show CLI version

DEPLOY OPTIONS:
  --skipInputConfig, -s
                      Skip interactive prompts and use existing ./input/BaseInputs.sol

  --walletName <name>
                      Wallet name imported with cast (default: defaultKey)

  --crossChain, -c
                      Deploy a cross-chain EVVM instance

  Tip: Import keys securely with cast wallet import <name> --interactive
        Never store private keys in .env

REGISTER OPTIONS:
  --evvmAddress <address>
                      EVVM contract address to register

  --walletName <name>
                      Wallet name for registry transactions

  --useCustomEthRpc
                      Use a custom Ethereum Sepolia RPC for registry calls
                      Reads EVVM_REGISTRATION_RPC_URL from .env or prompts if missing

  --crossChain, -c
                      Register a cross-chain EVVM (uses cross-chain registration flow)

SETUP CROSS-CHAIN OPTIONS:
  --treasuryHostStationAddress <address>
  --treasuryExternalStationAddress <address>
  --walletNameHost <name>
  --walletNameExternal <name>
                      Configure treasury station connections between chains

GLOBAL OPTIONS:
  -h, --help          Show help
  -v, --version       Show version

EXAMPLES:
  # Deploy with interactive configuration
  evvm deploy

  # Deploy with custom wallet
  evvm deploy --walletName myWallet

  # Deploy cross-chain
  evvm deploy --crossChain

  # Register EVVM
  evvm register --evvmAddress 0x...

  # Set up cross-chain treasuries
  evvm setUpCrossChainTreasuries

  # Run tests
  evvm developer --runTest

  # Generate interfaces
  evvm developer --makeInterface
```

### When to Use

Use the help command when you need:

- Overview of available commands
- Command syntax and options
- Usage examples
- Links to documentation

---

## Version Command

### Command

```bash
./evvm version
```

or

```bash
./evvm --version
./evvm -v
```

### Description

Displays the current version of the EVVM CLI tool.

### Output

```
EVVM CLI v2.2.0
```

The version number follows semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Incompatible API changes
- **MINOR**: Backwards-compatible functionality additions
- **PATCH**: Backwards-compatible bug fixes

### When to Use

Use the version command when:

- Reporting issues on GitHub
- Checking for updates
- Verifying installation
- Following documentation for specific versions

## Related Commands

- [`deploy`](./02-Deploy.md) - Deploy EVVM instances
- [`register`](./03-Register.md) - Register EVVM instances
- [`setUpCrossChainTreasuries`](./05-SetUpCrossChainTreasuries.md) - Configure cross-chain treasuries
- [`developer`](./06-Developer.md) - Developer utilities
v2.2.0
```

The version number follows [Semantic Versioning](https://semver.org/):
- **Major version** - Breaking changes
- **Minor version** - New features (backward compatible)
- **Patch version** - Bug fixes

### Version History

The CLI version is synchronized with the package version in `package.json`.

### When to Use

Check the version when:

- Reporting bugs or issues
- Verifying you have the latest version
- Checking compatibility with documentation
- Troubleshooting CLI behavior

### Updating the CLI

To get the latest version:

```bash
cd Testnet-Contracts
git pull
./evvm install
```

Or clone a fresh copy:

```bash
git clone --recursive https://github.com/EVVM-org/Testnet-Contracts
cd Testnet-Contracts
bun install
```

---

## Global Flags

Both `--help` and `--version` flags work with any command:

### Command-Specific Help

```bash
./evvm deploy --help
./evvm register --help
```

### Check Version Anywhere

```bash
./evvm deploy --version
./evvm register --version
```

All display the CLI version.

---

## Related Commands

- [`deploy`](./02-Deploy.md) - Deploy EVVM instances
- [`register`](./03-Register.md) - Register EVVM instances
- [`setUpCrossChainTreasuries`](./05-SetUpCrossChainTreasuries.md) - Configure cross-chain treasuries
- [`developer`](./06-Developer.md) - Developer utilities

