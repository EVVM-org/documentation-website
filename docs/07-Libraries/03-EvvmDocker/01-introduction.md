---
title: "Overview"
description: "Containerized environment for deploying and managing EVVM Testnet Contracts without installing dependencies locally."
sidebar_position: 1
---

# EVVM Docker

**EVVM Docker** is an official containerized environment that lets you deploy and manage [EVVM Testnet Contracts](https://github.com/EVVM-org/Testnet-Contracts) without installing any tooling on your machine. Everything — Foundry, Bun, the EVVM CLI, and all dependencies — is pre-built inside a Docker image.

## Why use EVVM Docker?

The standard EVVM deployment flow requires installing Foundry, Bun, and managing submodule dependencies. EVVM Docker removes that friction entirely:

| Scenario | Benefit |
|---|---|
| Windows users | Run Foundry tools without WSL or native installation |
| CI/CD pipelines | Reproducible, versioned deployment environment |
| Team development | Everyone uses the exact same toolchain |
| Quick evaluations | Go from zero to deployed EVVM with a single command |
| Isolated environments | No conflicts with existing local tooling |

## Docker Image

A pre-built image is published automatically to the **GitHub Container Registry** on every release:

```
ghcr.io/evvm-org/evvm-docker
```

Available tags:

| Tag | When updated |
|---|---|
| `latest` | Every push to `main` |
| `3`, `3.0`, `3.0.2` | On versioned releases (`v*.*.*`) |

The image supports both `linux/amd64` and `linux/arm64` (Apple Silicon included).

You can pull it directly without cloning or building:

```bash
docker pull ghcr.io/evvm-org/evvm-docker:latest
```

## What's Included

The image is built on `debian:bookworm-slim` and ships with:

- **Foundry** — `forge`, `cast`, `anvil`, `chisel` pre-installed and on `PATH`
- **Bun** — JavaScript/TypeScript runtime for the EVVM CLI
- **EVVM Testnet Contracts** — the full repository cloned and dependencies installed at build time
- **EVVM CLI** — ready to run via `bun run cli/index.ts`
- **Make targets** — optional convenience wrappers for all common operations

## Prerequisites

### Using the pre-built image

No build step needed — just Docker and Docker Compose:

- [Docker](https://docs.docker.com/get-docker/) **20.10+**
- [Docker Compose](https://docs.docker.com/compose/install/) **2.0+**

### Building locally

Same requirements, plus ~4 GB of free disk space for the build layer cache.

## Project Structure

```
evvm-docker/
├── Dockerfile              # Image definition (Foundry + Bun + EVVM CLI)
├── docker-compose.yml      # Service configuration and volume mounts
├── .env.example            # Environment variables template
├── Makefile                # Optional convenience commands
├── QUICKSTART.md           # Condensed quick reference
├── README.md               # Full documentation
└── output/                 # Deployment results (mounted volume)
    └── deployments/
        ├── evvmDeployment.json
        └── evvmRegistration.json
```

## Environment Variables

All configuration is provided through a `.env` file mounted into the container at runtime — no credentials are baked into the image.

Copy `.env.example` to `.env` and fill in your values:

```bash
# ── Single-chain deployment ─────────────────────────────────────
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# ── Cross-chain deployment ──────────────────────────────────────
EXTERNAL_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
HOST_RPC_URL="https://0xrpc.io/sep"

# ── EVVM Registry (always Ethereum Sepolia) ─────────────────────
EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"

# ── Contract verification (optional) ───────────────────────────
ETHERSCAN_API="YOUR_ETHERSCAN_API_KEY"
```

:::tip[Public RPC endpoints]
You can find free public RPC URLs for any testnet at [chainlist.org](https://chainlist.org/).
:::

:::warning[Never store private keys in `.env`]
The `.env` file is for RPC URLs and API keys only. Private keys are managed securely through Foundry's encrypted keystore (see Wallet Management below).
:::

## Wallet Management

Private keys are handled entirely through Foundry's encrypted keystore — they are **never** written to `.env` or any other plain-text file.

### Docker volume (default)

By default, wallets are stored in a named Docker volume called `foundry-keystores`. This volume persists across all container runs, so you only need to import your key once:

```bash
# 1. Open an interactive shell inside the container
docker compose run --rm --entrypoint /bin/bash evvm-cli

# 2. Import your private key (you will be prompted)
cast wallet import defaultKey --interactive

# 3. Exit — the wallet is now stored in the volume
exit
```

### Sharing with the host machine (alternative)

If you already manage wallets locally with Foundry, you can mount your host keystore instead. Edit `docker-compose.yml` and swap the volume entry:

```yaml
volumes:
  # Comment out the Docker volume mount
  # - foundry-keystores:/root/.foundry/keystores

  # Uncomment to use your host keystore (read-only)
  - ~/.foundry/keystores:/root/.foundry/keystores:ro
```

## Data Persistence

| Data | Storage | Persists after `docker compose down`? |
|---|---|---|
| Wallets / keystores | Named volume `foundry-keystores` | Yes |
| Deployment outputs | `./output/` (host bind mount) | Yes |
| Container filesystem | Ephemeral (`--rm`) | No |

Deployment results written to `output/deployments/` are immediately accessible on your host machine after each run.

## Available Commands

### Docker Compose

```bash
docker compose run --rm evvm-cli help                        # Show CLI help
docker compose run --rm evvm-cli version                     # Display version
docker compose run --rm evvm-cli deploy                      # Deploy EVVM
docker compose run --rm evvm-cli register                    # Register in the EVVM Registry
docker compose run --rm evvm-cli setUpCrossChainTreasuries   # Set up cross-chain treasuries
docker compose run --rm evvm-cli install                     # Reinstall dependencies
docker compose run --rm evvm-cli dev                         # Developer utilities
docker compose run --rm --entrypoint /bin/bash evvm-cli      # Interactive shell
```

### Make (optional wrapper)

```bash
make help            # List all available targets
make build           # Build the Docker image
make deploy          # Deploy EVVM (interactive)
make register        # Register EVVM in the registry
make shell           # Open interactive bash shell
make version         # Show CLI version
make stop            # Stop containers (data preserved)
make clean-image     # Remove the image only (volumes intact)
make clean-wallets   # Remove only the keystore volume
make clean           # Remove everything (image + volumes + data)
make rebuild         # Force rebuild without Docker layer cache
make logs            # Tail container logs
```
