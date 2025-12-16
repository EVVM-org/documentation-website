---
sidebar_position: 5
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
  deploy              Deploy a new EVVM instance to a blockchain
                      Includes configuration, deployment, and optional registration

  register            Register an existing EVVM instance
                      Links your EVVM to the EVVM Registry

  install             Install all project dependencies
                      Runs bun install and forge install

  help                Display this help message

  version             Show CLI version

DEPLOY OPTIONS:
  --skipInputConfig, -s
                      Skip interactive configuration and use existing ./input/Inputs.sol
  
  --walletName <name>
                      Specify wallet name for deployment (default: defaultKey)

  Note: RPC URL is read from RPC_URL in .env file
        If not found, you will be prompted to enter it

REGISTER OPTIONS:
  --evvmAddress <address>
                      EVVM contract address to register
  
  --walletName <name>
                      Specify wallet name for registration (default: defaultKey)

  --useCustomEthRpc
                      Use custom Ethereum Sepolia RPC for registry contract calls
                      Read from ETH_SEPOLIA_RPC in .env or prompts if not found
                      Default: Uses public RPC

  Note: Host chain RPC URL is read from RPC_URL in .env file
        If not found, you will be prompted to enter it

GLOBAL OPTIONS:
  -h, --help          Show help
  -v, --version       Show version

EXAMPLES:
  # Deploy with interactive configuration
  evvm deploy

  # Deploy using existing config
  evvm deploy --skipInputConfig

  # Register an EVVM instance
  evvm register --evvmAddress 0x123...

  # Register with custom wallet
  evvm register --evvmAddress 0x123... --walletName myWallet

  # Register with custom Ethereum Sepolia RPC
  evvm register --evvmAddress 0x123... --useCustomEthRpc

  # Install dependencies
  evvm install

DOCUMENTATION:
  https://www.evvm.info/docs

SUPPORT:
  https://github.com/EVVM-org/Playgrounnd-Contracts/issues
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
git clone https://github.com/EVVM-org/Testnet-Contracts
cd Testnet-Contracts
./evvm install
```

---

## Global Flags

Both `--help` and `--version` flags work with any command:

### Command-Specific Help

```bash
./evvm deploy --help
./evvm register --help
```

Shows the same general help screen (command-specific help is not implemented).

### Check Version Anywhere

```bash
./evvm deploy --version
./evvm register --version
```

All display the CLI version before executing any command.

---

## See Also

- **[Overview](./01-Overview.md)** - CLI introduction and setup
- **[Deploy Command](./02-Deploy.md)** - Deploy EVVM instances
- **[Register Command](./03-Register.md)** - Register in EVVM Registry
- **[Install Command](./04-Install.md)** - Install dependencies
- **[QuickStart Guide](../02-QuickStart.md)** - Complete tutorial
