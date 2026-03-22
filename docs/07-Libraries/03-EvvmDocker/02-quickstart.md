---
title: "Quick Start"
description: "Deploy EVVM using Docker in four steps — no local Foundry or Bun installation required."
sidebar_position: 2
---

# Quick Start with EVVM Docker

Deploy a full EVVM instance in minutes — no Foundry, no Bun, no dependency headaches.

:::info[Standard CLI instead?]
If you prefer to install tools locally, follow the standard **[QuickStart guide](../../02-QuickStart.md)**.
:::

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+
- ~4 GB free disk space

---

## Step 1 — Get the files

**Clone the repository:**

```bash
git clone https://github.com/EVVM-org/evvm-docker.git
cd evvm-docker
```

Or download and extract the files manually from the [releases page](https://github.com/EVVM-org/evvm-docker/releases).

---

## Step 2 — Configure your environment

```bash
cp .env.example .env
```

Open `.env` in your editor and fill in your RPC URLs:

```bash
# Single-chain deployment (e.g. Arbitrum Sepolia)
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Optional: registry operations always use Ethereum Sepolia
EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"

# Optional: Etherscan API key for contract verification
ETHERSCAN_API="YOUR_ETHERSCAN_API_KEY"
```

:::tip[Cross-chain deployment?]
Use `HOST_RPC_URL` and `EXTERNAL_RPC_URL` instead of `RPC_URL`. See the [cross-chain example](#cross-chain-deploy-sepolia--arbitrum-sepolia) below.
:::

---

## Step 3 — Get the Docker image

### Option A — Pull the pre-built image (recommended)

A ready-to-use image is published to the GitHub Container Registry on every release:

```bash
docker pull ghcr.io/evvm-org/evvm-docker:latest
```

Then tell Docker Compose to use it instead of building. Open `docker-compose.yml` and replace the `build` block with the GHCR image reference:

```yaml
services:
  evvm-cli:
    # Remove or comment out the build block:
    # build:
    #   context: .
    #   dockerfile: Dockerfile

    # Use the pre-built image instead:
    image: ghcr.io/evvm-org/evvm-docker:latest
```

The image supports both `linux/amd64` and `linux/arm64` (Apple Silicon).

### Option B — Build locally

If you need a custom image or prefer to build from source:

```bash
docker compose build
```

This downloads the base image, installs Foundry and Bun, clones the EVVM Testnet Contracts repository, and installs all dependencies. Subsequent runs use Docker's layer cache and are much faster.

Using Make:
```bash
make build
```

:::note[First build time]
The initial build can take a few minutes depending on your network speed and machine. Subsequent builds are instant thanks to caching.
:::

---

## Step 4 — Import your wallet

Private keys are stored securely through Foundry's encrypted keystore. You only need to do this once — the keystore persists in a Docker volume across all future runs.

```bash
# Open an interactive shell inside the container
docker compose run --rm --entrypoint /bin/bash evvm-cli

# Inside the container, import your wallet
cast wallet import defaultKey --interactive
# You will be prompted for your private key and a password

exit
```

:::warning[Keep your private key safe]
Never paste your private key into `.env` or share it. The `cast wallet import` command encrypts it with a password before storing it.
:::

---

## Step 5 — Deploy EVVM

```bash
docker compose run --rm evvm-cli deploy
```

The interactive wizard will:
1. Validate prerequisites
2. Let you configure your EVVM (addresses, metadata, network)
3. Deploy all contracts to your target chain
4. Optionally verify contracts on the block explorer

Results are saved to `./output/deployments/evvmDeployment.json` on your host machine.

Using Make:
```bash
make deploy
```

---

## Usage Examples

### Single-chain deploy on Arbitrum Sepolia

```bash
# 1. Configure .env
echo 'RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"' > .env

# 2. Build (first time only)
docker compose build

# 3. Deploy
docker compose run --rm evvm-cli deploy
```

### Cross-chain deploy (Sepolia + Arbitrum Sepolia)

```bash
# 1. Configure .env for cross-chain
cat > .env << 'EOF'
HOST_RPC_URL="https://0xrpc.io/sep"
EXTERNAL_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
EOF

# 2. Deploy
docker compose run --rm evvm-cli deploy
```

### Register EVVM in the registry

After deploying, you can register your instance in the global EVVM Registry on Ethereum Sepolia:

```bash
# Ensure your .env has the registration RPC
echo 'EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"' >> .env

docker compose run --rm evvm-cli register
```

Using Make:
```bash
make register
```

### Run Foundry commands directly

You can use any Foundry tool (`forge`, `cast`, `anvil`) inside the container:

```bash
# Open an interactive shell
docker compose run --rm --entrypoint /bin/bash evvm-cli

# Now inside the container
forge build
cast call <CONTRACT_ADDRESS> "symbol()(string)" --rpc-url $RPC_URL
exit
```

---

## Updating the image

When a new EVVM version is released, rebuild without the cache:

```bash
docker compose build --no-cache
```

Or with Make:
```bash
make rebuild
```

---

## Cleanup

| Command | What it removes |
|---|---|
| `make stop` | Stops running containers, data preserved |
| `make clean-image` | Removes only the Docker image, wallets intact |
| `make clean-wallets` | Removes only the keystore volume |
| `make clean` | Removes everything: image + volumes + data |

```bash
# Full cleanup (Docker Compose)
docker compose down --rmi all --volumes

# Full cleanup (Make)
make clean
```

:::warning[`make clean` removes your wallets]
The `clean` target removes the `foundry-keystores` volume. You will need to re-import your wallet afterwards. Use `make clean-image` if you only want to refresh the image.
:::

---

## Troubleshooting

**`.env` not found when running a command**

Make sure `.env` exists in the same directory as `docker-compose.yml`. The file is mounted into the container at `/workspace/.env`.

**`cast wallet import` asks for a password every run**

That is expected — Foundry keystores are password-protected. If you want passwordless access in CI, set `FOUNDRY_ETH_KEYSTORE_ACCOUNT` and `FOUNDRY_ETH_KEYSTORE_PASSWORD` as environment variables.

**Build fails with network errors**

Check your internet connection and Docker proxy settings. If the Foundry or Bun installer URLs are blocked, you may need to configure a corporate proxy in `Dockerfile`.

**Container exits immediately**

Run with an explicit command to see the output:
```bash
docker compose run --rm evvm-cli help
```
