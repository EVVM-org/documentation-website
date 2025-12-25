---
sidebar_position: 5
---

# SetUp Cross-Chain Treasuries Command

Configure connections between Host and External treasury stations for cross-chain EVVM instances.

## Command

```bash
./evvm setUpCrossChainTreasuries [options]
```

## Description

The `setUpCrossChainTreasuries` command establishes the bidirectional connection between the Treasury Host Station (deployed on the host chain) and the Treasury External Station (deployed on the external chain). This connection is essential for cross-chain EVVM instances to function properly.

:::warning[Prerequisites]
Before running this command, you must:
1. Deploy a cross-chain EVVM instance using `./evvm deploy --crossChain`
2. Have both treasury station addresses from the deployment output
3. Have wallets with gas tokens on both chains
:::

## Options

### `--treasuryHostStationAddress <address>`

The address of the Treasury Host Station contract deployed on the host chain.

- **Type**: `0x${string}` (Ethereum address)
- **Required**: Yes (or will prompt)
- **Usage**: `./evvm setUpCrossChainTreasuries --treasuryHostStationAddress 0x...`

### `--treasuryExternalStationAddress <address>`

The address of the Treasury External Station contract deployed on the external chain.

- **Type**: `0x${string}` (Ethereum address)
- **Required**: Yes (or will prompt)
- **Usage**: `./evvm setUpCrossChainTreasuries --treasuryExternalStationAddress 0x...`

### `--walletNameHost <name>`

Specify which Foundry wallet to use for host chain transactions.

- **Type**: `string`
- **Default**: `defaultKey`
- **Usage**: `./evvm setUpCrossChainTreasuries --walletNameHost hostWallet`

The wallet must be imported and have gas tokens on the host chain.

### `--walletNameExternal <name>`

Specify which Foundry wallet to use for external chain transactions.

- **Type**: `string`
- **Default**: `defaultKey`
- **Usage**: `./evvm setUpCrossChainTreasuries --walletNameExternal externalWallet`

The wallet must be imported and have gas tokens on the external chain.

## Required Environment Variables

```bash
# Host chain RPC (where Treasury Host Station is deployed)
HOST_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# External chain RPC (where Treasury External Station is deployed)
EXTERNAL_RPC_URL="https://sepolia.base.org"
```

If RPC URLs are not found in `.env`, the CLI will prompt you to enter them.

## Setup Flow

### 1. Prerequisites Validation

The CLI validates that all required tools are installed and configured:

- ✅ Foundry installation check
- ✅ Wallet availability verification (both host and external)
- ✅ RPC connectivity test (both chains)

### 2. Address Collection

The CLI prompts for or validates the provided treasury addresses:

```
Enter the Host Station Address: 0x...
Enter the External Station Address: 0x...
```

### 3. Chain Support Verification

The CLI verifies that both host and external chains are supported:

```
Validating host chain support...
Validating external chain support...
```

### 4. Connection Establishment

The CLI calls the connection functions on both treasury stations:

```
Setting connections...
```

This process:
1. Configures the Host Station to recognize the External Station
2. Configures the External Station to recognize the Host Station
3. Enables bidirectional cross-chain treasury operations

### 5. Completion

```
Your Treasury contracts are now connected!
```

## Usage Examples

### Interactive Mode

Prompt for all addresses:

```bash
./evvm setUpCrossChainTreasuries
```

### Non-Interactive Mode

Provide all addresses via flags:

```bash
./evvm setUpCrossChainTreasuries \
  --treasuryHostStationAddress 0x1234... \
  --treasuryExternalStationAddress 0x5678... \
  --walletNameHost hostWallet \
  --walletNameExternal externalWallet
```

### Using Different Wallets

Use different wallets for each chain:

```bash
./evvm setUpCrossChainTreasuries \
  --treasuryHostStationAddress 0x1234... \
  --treasuryExternalStationAddress 0x5678... \
  --walletNameHost arbitrumWallet \
  --walletNameExternal baseWallet
```

## Troubleshooting

### Chain Not Supported

If a chain is not supported:

```
Error: Host Chain ID 12345 is not supported.

Possible solutions:
  • Testnet chains:
    Request support by creating an issue at:
    https://github.com/EVVM-org/evvm-registry-contracts
    
  • Mainnet chains:
    EVVM currently does not support mainnet deployments.
    
  • Local blockchains (Anvil/Hardhat):
    Use an unregistered chain ID.
    Example: Chain ID 31337 is registered, use 1337 instead.
```

**Solution**: Use a supported testnet or local blockchain with an unregistered chain ID.

### Wallet Not Found

```
Error: Wallet 'myWallet' is not available.

Please import your wallet using:
   cast wallet import myWallet --interactive

   You'll be prompted to enter your private key securely.
```

**Solution**: Import the wallet using Foundry's `cast wallet import` command.

### Insufficient Gas

If transactions fail due to insufficient gas:

**Solution**: 
1. Ensure both wallets have sufficient native tokens on their respective chains
2. Get testnet tokens from faucets:
   - Arbitrum Sepolia: [bridge.arbitrum.io](https://bridge.arbitrum.io/)
   - Base Sepolia: [portal.base.org](https://portal.base.org/)

### RPC URL Issues

If RPC connection fails:

**Solution**:
1. Verify RPC URLs in `.env` are correct and accessible
2. Try using alternative RPC providers
3. Check network connectivity

## Next Steps

After setting up cross-chain treasuries:

1. **Register your EVVM**: Use `./evvm register --crossChain` to register in the EVVM Registry
2. **Test the connection**: Verify cross-chain operations work correctly
3. **Monitor transactions**: Check both chains for transaction confirmations

## Related Commands

- [`deploy --crossChain`](./02-Deploy.md) - Deploy cross-chain EVVM instance
- [`register --crossChain`](./03-Register.md) - Register cross-chain EVVM
- [`help`](./04-HelpAndVersion.md) - Display all CLI commands
