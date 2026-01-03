---
sidebar_position: 2
---

# QuickStart

Deploy your EVVM virtual blockchain in minutes.

:::info[Building Services Instead?]
Want to build dApps on existing EVVM? Go to **[How to Create an EVVM Service](./06-HowToMakeAEVVMService.md)**.
:::

:::info[Want to experiment with a EVVM?]
You can start with the **[scaffold-evvm](https://github.com/EVVM-org/scaffold-evvm)**.
:::

---

## Prerequisites

- **Foundry** - [Install](https://getfoundry.sh/introduction/installation/)
- **Bun** (≥ 1.0) - [Install](https://bun.sh/)
- **Git** - [Install](https://git-scm.com/downloads)

The CLI validates these automatically.

## 1. Clone and Install

```bash
git clone --recursive https://github.com/EVVM-org/Testnet-Contracts
cd Testnet-Contracts
bun install
forge install
```

## 2. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your values:
```bash
# RPC URL for blockchain to deploy EVVM
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Optional: Custom Ethereum Sepolia RPC for registry operations
EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"

# Optional: Etherscan API Key for contract verification
ETHERSCAN_API="your_etherscan_api_key"
```

### Cross-Chain Configuration (Optional)
```bash
# Host chain RPC (main EVVM deployment)
HOST_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# External chain RPC (Treasury External Station)
EXTERNAL_RPC_URL="https://sepolia.base.org"

# Optional: Custom Ethereum Sepolia RPC for registry
EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"

# Optional: Etherscan API Key for verification
ETHERSCAN_API="your_etherscan_api_key"
```

:::warning[Never Store Private Keys in .env]
Use Foundry's encrypted keystore to protect your private keys. The `.env` file should only contain RPC URLs and API keys.
:::

## 3. Import Wallet

```bash
cast wallet import defaultKey --interactive
```

This command securely encrypts and stores your private key.

:::tip[Custom Wallet Name]
You can use any name instead of `defaultKey`:
```bash
cast wallet import myWallet --interactive
```

Then specify it during deployment:
```bash
./evvm deploy --walletName myWallet
```
:::

## 4. Deploy with CLI

If you are on linux or macOS, run:
```bash
./evvm deploy
```

If you are on Windows, run on PowerShell:
```bash
.\evvm.bat deploy
```

:::info
Some systems may require `chmod +x evvm` to make the script executable.
:::


The interactive wizard will:
1. Validate prerequisites
2. Configure your EVVM (addresses, metadata, network)
3. Deploy contracts
4. Verify on block explorer
5. Register in EVVM Registry (optional)

### Configuration

The interactive wizard prompts for:

**Administrator Addresses (required):**
- **Admin** - Full contract administrator privileges
- **Golden Fisher** - Sudo account for privileged staking operations
- **Activator** - Manages epoch activation for rewards

```
Enter the admin address: 0x...
Enter the goldenFisher address: 0x...
Enter the activator address: 0x...
```

**Token Configuration (required):**
```
EVVM Name [EVVM]: My EVVM
Principal Token Name [Mate Token]: My Token
Principal Token Symbol [MATE]: MYT
```

Press Enter to accept the default values shown in brackets `[default]`, or type a new value.

**Advanced Metadata (optional):**

The CLI will ask:
```
Configure advanced metadata (totalSupply, eraTokens, reward)? (y/n):
```

If you answer `y`, you'll configure:
- **totalSupply** - Maximum token supply (default: `2033333333000000000000000000`)
- **eraTokens** - Tokens allocated per era (default: `1016666666500000000000000000`)
- **reward** - Reward per transaction (default: `5000000000000000000`)

:::tip[Recommended for Most Users]
Unless you have specific token economics requirements, **answer `n`** to use default values. The defaults are optimized for most use cases.
:::

**Configuration Summary:**

Review all values before deployment:
```
═════════════════════════════════════════
        Configuration Summary
═════════════════════════════════════════

Addresses:
  admin: 0x...
  goldenFisher: 0x...
  activator: 0x...

Token Metadata:
  EvvmName: My EVVM
  Token Name: My Token
  Token Symbol: MYT

Confirm configuration? (y/n):
```

The CLI shows a summary before deployment. Review and confirm to proceed.

**Block Explorer Verification:**

Choose a verification method for automatic contract verification:

```
Select block explorer verification:
  🭬 Etherscan v2
    Blockscout
    Sourcify
    Custom
    Skip verification (not recommended)
```

**Available Options:**

- **Etherscan v2** - Requires `ETHERSCAN_API` in `.env` file
  - Best for: Major networks (Ethereum, Arbitrum, Base, Optimism)
  - Note: Most common option

- **Blockscout** - Requires block explorer homepage URL
  - Best for: Custom L2s and networks with Blockscout explorer
  - Example URL: `https://sepolia.arbiscan.io/`

- **Sourcify** - No API key required
  - Best for: Decentralized verification across all networks
  - Uses: [https://sourcify.dev/](https://sourcify.dev/)

- **Custom** - Provide custom verification parameters
  - For: Specialized verification setups
  - Example: `--verify --verifier-url <url> --verifier-api-key <key>`

- **Skip verification** - Deploy without verification
  - ⚠️ Not recommended for production
  - Use only for local testing


## 5. Deployment Output

The deployment compiles and deploys **6 core contracts**:

| Contract | Purpose |
|----------|---------|
| **Evvm** | Core virtual machine logic |
| **Staking** | Staking and reward management |
| **Estimator** | Reward calculation engine |
| **NameService** | Domain name system |
| **Treasury** | Asset management and liquidity |
| **P2PSwap** | Peer-to-peer token exchange |

**Success Screen:**

After deployment, you'll see:
```
✓ Deployment completed successfully!

═══════════════════════════════════════
       Deployed Contracts
═══════════════════════════════════════

  ✓ Staking
    → 0x1111111111111111111111111111111111111111
  ✓ Evvm
    → 0x2222222222222222222222222222222222222222
  ✓ Estimator
    → 0x3333333333333333333333333333333333333333
  ✓ NameService
    → 0x4444444444444444444444444444444444444444
  ✓ Treasury
    → 0x5555555555555555555555555555555555555555
  ✓ P2PSwap
    → 0x6666666666666666666666666666666666666666
```

**Verification:**

All contracts are automatically verified on the block explorer with direct links to view them.

**Artifacts:**

- Deployment data: `broadcast/Deploy.s.sol/[chainId]/run-latest.json`
- Generated config: `input/BaseInputs.sol`
- Output summary: `output/evvmDeployment.json` (if saved)


## 6. Register in EVVM Registry

After deployment, register your EVVM to obtain an official EVVM ID.

### During Deployment

The CLI asks if you want to register immediately:
```
Your EVVM instance is ready to be registered.

Do you want to register the EVVM instance now? (y/n):
```

If you choose `y`:
1. CLI prompts for Ethereum Sepolia RPC (optional, uses default if not provided)
2. Submits registration to EVVM Registry contract
3. Receives unique EVVM ID (≥ 1000)
4. Updates your EVVM contract with the assigned ID

If you choose `n`, register later using the command below.

### Register Later

```bash
./evvm register --evvmAddress 0x...
```

**Options:**
```bash
# Basic registration
./evvm register --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2

# With custom wallet
./evvm register \
  --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2 \
  --walletName myWallet

# With custom Ethereum Sepolia RPC
./evvm register \
  --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2 \
  --useCustomEthRpc
```

### EVVM Registry Details

- **Address:** `0x389dC8fb09211bbDA841D59f4a51160dA2377832`
- **Network:** Ethereum Sepolia
- **View:** [Etherscan](https://sepolia.etherscan.io/address/0x389dC8fb09211bbDA841D59f4a51160dA2377832#writeProxyContract)

**ID Assignment Rules:**
- IDs 1-999: Reserved for official EVVM deployments
- IDs ≥ 1000: Public community registrations
- ID is **permanent** after 24 hours

:::warning[Critical Requirements]
**All registrations happen on Ethereum Sepolia**, regardless of where your EVVM is deployed.

You need ETH Sepolia for gas fees:
- [EthGlobal Faucet](https://ethglobal.com/faucet/)
- [Alchemy Sepolia Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
:::

**Verify Registration:**

After registration, verify using the registry contract:
```bash
# Check EVVM ID metadata (on Ethereum Sepolia)
cast call 0x389dC8fb09211bbDA841D59f4a51160dA2377832 \
  "getEvvmIdMetadata(uint256)" <evvmID>

# Check ID on your EVVM contract (on your deployment chain)
cast call <your_evvm_address> "getEvvmID()" --rpc-url <your_rpc>
```

## CLI Command Reference

**Deployment & Registration:**
```bash
./evvm deploy                    # Deploy EVVM interactively (single-chain)
./evvm deploy --skipInputConfig  # Deploy using saved config (non-interactive)
./evvm deploy --crossChain       # Deploy cross-chain EVVM instance
./evvm register                  # Register EVVM in registry (interactive)
./evvm register --crossChain     # Register cross-chain EVVM
./evvm register --evvmAddress 0x...
```

**Cross-Chain & Developer:**
```bash
./evvm setUpCrossChainTreasuries  # Connect treasury stations
./evvm developer --makeInterface  # Generate Solidity interfaces
./evvm developer --runTest        # Run test suite
./evvm install                    # Install dependencies
```

**Information:**
```bash
./evvm help                       # Show comprehensive help
./evvm version                    # Show CLI version
```

**Common examples:**
```bash
# Interactive deploy with custom wallet
./evvm deploy --walletName myWallet

# Non-interactive deploy (use saved config)
./evvm deploy --skipInputConfig --walletName myWallet

# Register an EVVM
./evvm register --evvmAddress 0x... --walletName myWallet

# Run tests
./evvm developer --runTest

# Generate interfaces
./evvm developer --makeInterface
```

**Wallet Management:**
```bash
# Import a wallet securely
cast wallet import defaultKey --interactive

# Import with custom name
cast wallet import myWallet --interactive

# List available wallets
cast wallet list
```

**Support:** `https://github.com/EVVM-org/Testnet-Contracts/issues`

## Next Steps

**Learn More About CLI:**
- **[EVVM CLI Overview](./09-evvmCli/01-Overview.md)** - Complete CLI reference
- **[Deploy Command Details](./09-evvmCli/02-Deploy.md)** - Advanced deployment options
- **[Register Command Details](./09-evvmCli/03-Register.md)** - Registration options
- **[Cross-Chain Setup](./09-evvmCli/05-SetUpCrossChainTreasuries.md)** - For cross-chain deployments

**Build Services on Your EVVM:**
- **[How to Make an EVVM Service](./06-HowToMakeAEVVMService.md)** - Build dApps on your EVVM
- **[Transaction Flow](./03-ProcessOfATransaction.md)** - Understand transaction processing
- **[Core Contracts Documentation](./04-Contracts/01-EVVM/01-Overview.md)** - Technical details

**Advanced Topics:**
- **[Signature Structures](./05-SignatureStructures/Overview.md)** - EIP-191 specifications
- **[Registry System](./08-RegistryEvvm/01-Overview.md)** - Registry governance
- **[npm Library Usage](./07-Libraries/01-npmLibraries/)** - Use EVVM contracts in your dApps

---

**Support & Issues:**
- GitHub Issues: https://github.com/EVVM-org/Testnet-Contracts/issues
- Documentation: https://www.evvm.info/
- Discord/Community: Check GitHub for community links

Your EVVM is ready for development! 
