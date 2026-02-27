---
description: "Register an existing EVVM instance in the official EVVM Registry to receive a unique EVVM ID"
sidebar_position: 3
---

# Register Command

Register an existing EVVM instance in the official EVVM Registry to receive a unique EVVM ID.

## Command

```bash
./evvm register [options]
```

## Description

The `register` command integrates your deployed EVVM instance with the EVVM Registry contract on Ethereum Sepolia. It supports both single-chain and cross-chain EVVM registrations.

Registration provides:

- **Unique EVVM ID** - Official identification number (≥ 1000)
- **Chain validation** - Verification of host chain support
- **Ecosystem integration** - Visibility in EVVM ecosystem
- **Standardized metadata** - Consistent EVVM instance information

:::warning[Critical Requirements]
**All registrations happen on Ethereum Sepolia**, regardless of where your EVVM is deployed. You need ETH Sepolia for gas fees.

Faucets: [ethglobal.com/faucet](https://ethglobal.com/faucet/), [alchemy.com/faucets](https://www.alchemy.com/faucets/ethereum-sepolia)
:::

## Options

### `--evvmAddress <address>`

The address of your deployed EVVM contract.

- **Type**: `0x${string}` (Ethereum address)
- **Required**: Yes (or will prompt)
- **Usage**: `./evvm register --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2`

If not provided, the CLI will prompt you to enter it interactively.

### `--walletName <name>`, `-n <name>`

Specify which Foundry wallet to use for registration transactions (single-chain only).

- **Type**: `string`
- **Default**: `defaultKey`
- **Usage**: `./evvm register --evvmAddress 0x... --walletName myWallet`

The wallet must be previously imported into Foundry's keystore:

```bash
cast wallet import myWallet --interactive
```

:::important
The wallet address must have sufficient ETH Sepolia for gas fees.
:::

### `--walletNameHost <name>`

Specify which Foundry wallet to use for host chain registration (cross-chain only).

- **Type**: `string`
- **Default**: `defaultKey`
- **Usage**: `./evvm register --crossChain --walletNameHost hostWallet`

### `--walletNameExternal <name>`

Specify which Foundry wallet to use for external chain registration (cross-chain only).

- **Type**: `string`
- **Default**: `defaultKey`
- **Usage**: `./evvm register --crossChain --walletNameExternal externalWallet`

### `--useCustomEthRpc`

Use a custom Ethereum Sepolia RPC endpoint instead of the public default.

- **Type**: `boolean`
- **Default**: `false`
- **Usage**: `./evvm register --evvmAddress 0x... --useCustomEthRpc`

When enabled:
1. CLI reads `EVVM_REGISTRATION_RPC_URL` from `.env`
2. If not found, prompts for RPC URL
3. Uses custom RPC for all Ethereum Sepolia operations

**Default RPC**: `https://gateway.tenderly.co/public/sepolia`

### `--crossChain`, `-c`

Register a cross-chain EVVM instance.

- **Type**: `boolean`
- **Default**: `false`
- **Usage**: `./evvm register --crossChain --evvmAddress 0x...`

When enabled:
- Prompts for Treasury External Station address
- Reads both `HOST_RPC_URL` and `EXTERNAL_RPC_URL` from `.env`
- Validates both host and external chain support
- Registers cross-chain configuration in the registry

:::tip
Cross-chain registration requires additional configuration compared to single-chain registration.
:::

### `--treasuryExternalStationAddress <address>` (Cross-Chain Only)

The address of the Treasury External Station contract (required for cross-chain registration).

- **Type**: `0x${string}` (Ethereum address)
- **Required**: Yes for cross-chain (or will prompt)
- **Usage**: `./evvm register --crossChain --evvmAddress 0x... --treasuryExternalStationAddress 0x...`

## Required Environment Variables

### Single-Chain Registration

```bash
# RPC URL for the blockchain where your EVVM is deployed
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Optional: Custom Ethereum Sepolia RPC (only with --useCustomEthRpc)
EVVM_REGISTRATION_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your-api-key"
```

### Cross-Chain Registration

```bash
# Host chain RPC (where EVVM core contracts are deployed)
HOST_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# External chain RPC (where Treasury External Station is deployed)
EXTERNAL_RPC_URL="https://sepolia.base.org"

# Optional: Custom Ethereum Sepolia RPC (only with --useCustomEthRpc)
EVVM_REGISTRATION_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your-api-key"
```

If RPC URLs are not found in `.env`, the CLI will prompt you to enter them.

## Registration Types

### Single-Chain Registration

Register a standard EVVM instance deployed on a single blockchain.

```bash
./evvm register --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2
```

### Cross-Chain Registration

Register an EVVM instance with cross-chain treasury support.

```bash
./evvm register --crossChain \
  --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2 \
  --treasuryExternalStationAddress 0x1234... \
  --walletName myWallet
```

Or use interactive mode:

```bash
./evvm register --crossChain
```

The CLI will prompt for missing addresses.

## Registration Flow

### 1. Prerequisites Validation

The CLI validates that all required tools are installed and configured:

- ✅ Foundry installation check
- ✅ Wallet availability verification
- ✅ Wallet balance check (ETH Sepolia)

### 2. EVVM Address Validation

The CLI prompts for or validates the provided EVVM address:

```
Enter the EVVM Address: 0x...
```

The address must:
- Be a valid Ethereum address format
- Point to a deployed EVVM contract
- Not be already registered (unless within 24-hour edit window)

### 3. Chain Support Verification

The CLI verifies that your host chain is supported:

```
Validating host chain support...
```

The registry checks:
- Chain ID registration status
- Host chain compatibility
- Network requirements

#### Local Blockchain Detection

If deploying on a local blockchain (Chain ID 31337 or 1337):

```
Local Blockchain Detected
Skipping registry contract registration for local development
```

Local deployments skip registration automatically.

#### Unsupported Chain

If your chain is not supported:

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

### 4. Registry Contract Call

The CLI interacts with the EVVM Registry contract:

**Contract Address**: `0x389dC8fb09211bbDA841D59f4a51160dA2377832`  
**Network**: Ethereum Sepolia  
**Function**: `registerEvvm(uint256 hostChainId, address evvmAddress)`

```
Setting EVVM ID directly on contract...
```

The registry:
1. Validates the host chain ID
2. Checks EVVM contract compatibility
3. Generates a unique EVVM ID (≥ 1000)
4. Records registration metadata

### 5. EVVM ID Assignment

The CLI receives the generated EVVM ID:

```
EVVM ID generated: 1042
Setting EVVM ID on contract...
```

The CLI then calls `setEvvmID(uint256)` on your EVVM contract to store the ID on-chain.

### 6. Registration Complete

After successful registration:

```
═══════════════════════════════════════
        Registration Complete
═══════════════════════════════════════

EVVM ID: 1042
Contract: 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2

Your EVVM instance is now ready to use!
```

## EVVM ID System

### ID Ranges

- **IDs 1-999**: Reserved for official EVVM deployments by the EVVM team
- **IDs ≥ 1000**: Public registrations (your EVVM will receive one of these)

### ID Modification

- **First 24 hours**: EVVM ID can be changed
- **After 24 hours**: EVVM ID becomes permanent and cannot be modified

:::warning
Choose your host chain carefully. While you can change the EVVM ID within 24 hours, the host chain association is permanent after the time window.
:::

## Verification

After registration, verify everything is correct:

### Check EVVM ID on Your Contract

```bash
cast call <evvm_address> "getEvvmID()(uint256)" --rpc-url <your_rpc_url>
```

Expected output: Your assigned EVVM ID (e.g., `1042`)

### Check Registry Metadata

```bash
cast call 0x389dC8fb09211bbDA841D59f4a51160dA2377832 \
  "getEvvmIdMetadata(uint256)" <evvm_id> \
  --rpc-url https://gateway.tenderly.co/public/sepolia
```

Should return:
- Host chain ID
- EVVM contract address
- Registration timestamp
- Other metadata

## Examples

### Basic Registration

Register with interactive prompts:

```bash
./evvm register
```

The CLI will prompt for:
- EVVM address
- Confirmation

### Register with Address

Provide EVVM address directly:

```bash
./evvm register --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2
```

### Register with Custom Wallet

Use a specific wallet:

```bash
./evvm register \
  --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2 \
  --walletName myWallet
```

### Register with Custom Ethereum RPC

Use a custom Ethereum Sepolia endpoint:

```bash
./evvm register \
  --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2 \
  --useCustomEthRpc
```

The CLI will use `ETH_SEPOLIA_RPC` from `.env` or prompt for it.

### Complete Example

Full command with all options:

```bash
./evvm register \
  --evvmAddress 0x3e562a2e932afd6c1630d5f3b8eb3d88a4b058c2 \
  --walletName myWallet \
  --useCustomEthRpc
```

## Troubleshooting

### Insufficient ETH Sepolia

```
Error: Transaction failed - insufficient funds for gas
```

**Solution**: Get ETH Sepolia from faucets:
- [ETH Global Faucet](https://ethglobal.com/faucet/)
- [Alchemy Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)

### Chain Not Supported

```
Error: Host Chain ID 12345 is not supported.
```

**Solution**: Request support by creating an issue at the [EVVM Registry Contracts repository](https://github.com/EVVM-org/evvm-registry-contracts/issues)

### EVVM ID Setting Failed

If the EVVM ID is generated but setting it on your contract fails:

```
Error: EVVM ID setting failed.

You can try manually with:
cast send 0x... \
  --rpc-url <rpc_url> \
  "setEvvmID(uint256)" 1042 \
  --account defaultKey
```

**Solution**: Run the provided `cast send` command manually

### Already Registered

If your EVVM is already registered:

**Within 24 hours**: You can call `setEvvmID()` again to change it  
**After 24 hours**: The EVVM ID is permanent

### RPC Connection Issues

```
Error: Failed to connect to Ethereum Sepolia RPC
```

**Solution**: 
- Check internet connection
- Try using `--useCustomEthRpc` with a reliable RPC endpoint
- Verify Ethereum Sepolia network status

## Registry Contract

### Contract Information

- **Address**: `0x389dC8fb09211bbDA841D59f4a51160dA2377832`
- **Network**: Ethereum Sepolia
- **Etherscan**: [View on Etherscan](https://sepolia.etherscan.io/address/0x389dC8fb09211bbDA841D59f4a51160dA2377832#writeProxyContract)

### Key Functions

**registerEvvm(uint256 hostChainId, address evvmAddress)**
- Registers a new EVVM instance
- Returns: EVVM ID

**getEvvmIdMetadata(uint256 evvmId)**
- Retrieves metadata for an EVVM ID
- Returns: Host chain ID, EVVM address, timestamp

**isChainIdRegistered(uint256 chainId)**
- Checks if a chain ID is supported
- Returns: boolean

## See Also

- **[Deploy Command](./02-Deploy.md)** - Deploy a new EVVM instance
- **[Registry System](../08-RegistryEvvm/01-Overview.md)** - Detailed registry documentation
- **[QuickStart Guide](../02-QuickStart.md)** - Complete deployment and registration tutorial
