---
title: "Quick Start"
description: "Deploy EVVM using Docker in four steps — no local Foundry or Bun installation required."
sidebar_position: 2
---

# Quick Start with EVVM Docker

:::info[Heads up before you start]
This guide deploys a standard EVVM with default parameters. If you need to customize contracts or deployment settings, or prefer to install tools locally, follow the **[local QuickStart guide](../../02-QuickStart.md)** instead.
:::

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) 2.0+
- ~4 GB free disk space (only if building locally)

---

## Step 1 — Get the files

```bash
git clone https://github.com/EVVM-org/evvm-docker.git
cd evvm-docker
```

Or download and extract from the [releases page](https://github.com/EVVM-org/evvm-docker/releases).

---

## Step 2 — Configure your environment

```bash
cp .env.example .env
```

Edit `.env` with your RPC URLs:

```bash
# Single-chain deployment
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Optional: registry (always Ethereum Sepolia)
EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"

# Optional: contract verification
ETHERSCAN_API="YOUR_ETHERSCAN_API_KEY"
```

:::tip[Cross-chain deployment?]
Use `HOST_RPC_URL` and `EXTERNAL_RPC_URL` instead of `RPC_URL`. See the [cross-chain example](#cross-chain-deploy-sepolia--arbitrum-sepolia) below.
:::

---

## Step 3 — Get the Docker image

### Option A — Pull the pre-built image (recommended)

```bash
docker pull ghcr.io/evvm-org/evvm-docker:latest
```

Open `docker-compose.yml` and replace the `build` block:

```yaml
services:
  evvm-cli:
    # build:
    #   context: .
    #   dockerfile: Dockerfile
    image: ghcr.io/evvm-org/evvm-docker:latest
```

Supports `linux/amd64` and `linux/arm64` (Apple Silicon).

### Option B — Build locally

```bash
docker compose build
# or
make build
```

:::note[First build time]
The initial build takes a few minutes. Subsequent builds use Docker's layer cache.
:::

---

## Step 4 — Import your wallet

Only needed once — the keystore persists in a Docker volume.

```bash
docker compose run --rm --entrypoint /bin/bash evvm-cli
cast wallet import defaultKey --interactive
exit
```

:::warning[Keep your private key safe]
Never paste your private key into `.env`. The `cast wallet import` command encrypts it with a password.
:::

---

## Step 5 — Deploy EVVM

```bash
docker compose run --rm evvm-cli deploy
# or
make deploy
```

Results are saved to `./output/deployments/evvmDeployment.json`.

---

## Usage Examples

### Single-chain deploy on Arbitrum Sepolia

```bash
echo 'RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"' > .env
docker compose run --rm evvm-cli deploy
```

### Cross-chain deploy (Sepolia + Arbitrum Sepolia)

```bash
cat > .env << 'EOF'
HOST_RPC_URL="https://0xrpc.io/sep"
EXTERNAL_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
EOF
docker compose run --rm evvm-cli deploy
```

### Register EVVM in the registry

```bash
echo 'EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"' >> .env
docker compose run --rm evvm-cli register
```

### Run Foundry commands directly

```bash
docker compose run --rm --entrypoint /bin/bash evvm-cli
forge build
cast call <CONTRACT_ADDRESS> "symbol()(string)" --rpc-url $RPC_URL
exit
```

---

## Updating the image

**Option A — Pre-built image:**

```bash
docker pull ghcr.io/evvm-org/evvm-docker:latest
```

**Option B — Built locally:**

```bash
docker compose build --no-cache
# or
make rebuild
```

---

## Cleanup

| Command | What it removes |
|---|---|
| `make stop` | Stops containers, data preserved |
| `make clean-image` | Removes the image, wallets intact |
| `make clean-wallets` | Removes only the keystore volume |
| `make clean` | Removes everything |

:::warning[`make clean` removes your wallets]
Use `make clean-image` if you only want to refresh the image.
:::

---

## Troubleshooting

**`.env` not found**
Make sure `.env` is in the same directory as `docker-compose.yml`.

**`cast wallet import` asks for password every run**
Expected — keystores are password-protected. For CI, set `FOUNDRY_ETH_KEYSTORE_ACCOUNT` and `FOUNDRY_ETH_KEYSTORE_PASSWORD` as environment variables.

**Build fails with network errors**
Check your connection and Docker proxy settings.

**Container exits immediately**
```bash
docker compose run --rm evvm-cli help
```

