---
title: "Overview"
description: "Containerized environment for deploying and managing EVVM Testnet Contracts without installing dependencies locally."
sidebar_position: 1
---

# EVVM Docker

**EVVM Docker** is a containerized environment for deploying [EVVM Testnet Contracts](https://github.com/EVVM-org/Testnet-Contracts) without installing Foundry, Bun, or any other tooling locally. Everything is pre-built inside a Docker image.

## Why use EVVM Docker?

| Scenario | Benefit |
|---|---|
| Windows users | Run Foundry tools without WSL or native installation |
| CI/CD pipelines | Reproducible, versioned deployment environment |
| Team development | Everyone uses the exact same toolchain |
| Quick evaluations | Go from zero to deployed EVVM with a single command |
| Isolated environments | No conflicts with existing local tooling |

## Docker Image

The image is published to the **GitHub Container Registry** on every release:

```bash
docker pull ghcr.io/evvm-org/evvm-docker:latest
```

| Tag | When updated |
|---|---|
| `latest` | Every push to `main` |
| `3`, `3.0`, `3.0.2` | On versioned releases (`v*.*.*`) |

Supports `linux/amd64` and `linux/arm64` (Apple Silicon included).

## What's Included

Built on `debian:bookworm-slim`:

- **Foundry** — `forge`, `cast`, `anvil`, `chisel`
- **Bun** — JavaScript/TypeScript runtime for the EVVM CLI
- **EVVM Testnet Contracts** — cloned and dependencies installed at build time
- **EVVM CLI** — ready to run
- **Makefile** — optional convenience wrappers

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) **20.10+**
- [Docker Compose](https://docs.docker.com/compose/install/) **2.0+**
- ~4 GB free disk space (only if building locally)

## Project Structure

```
evvm-docker/
├── Dockerfile              # Image definition
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

All configuration is passed through a `.env` file mounted at runtime — no credentials are baked into the image.

```bash
# Single-chain deployment
RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"

# Cross-chain deployment
EXTERNAL_RPC_URL="https://sepolia-rollup.arbitrum.io/rpc"
HOST_RPC_URL="https://0xrpc.io/sep"

# EVVM Registry (always Ethereum Sepolia)
EVVM_REGISTRATION_RPC_URL="https://gateway.tenderly.co/public/sepolia"

# Contract verification (optional)
ETHERSCAN_API="YOUR_ETHERSCAN_API_KEY"
```

:::tip[Public RPC endpoints]
Find free public RPC URLs at [chainlist.org](https://chainlist.org/).
:::

:::warning[Never store private keys in `.env`]
Use Foundry's encrypted keystore instead (see Wallet Management below).
:::

## Wallet Management

### Docker volume (default)

Wallets are stored in a named Docker volume `foundry-keystores` and persist across all container runs. Import once:

```bash
docker compose run --rm --entrypoint /bin/bash evvm-cli
cast wallet import defaultKey --interactive
exit
```

### Host keystore (alternative)

To share wallets with your host machine, edit `docker-compose.yml`:

```yaml
volumes:
  # - foundry-keystores:/root/.foundry/keystores   # comment out
  - ~/.foundry/keystores:/root/.foundry/keystores:ro  # uncomment
```

## Data Persistence

| Data | Storage | Persists after `docker compose down`? |
|---|---|---|
| Wallets / keystores | Named volume `foundry-keystores` | Yes |
| Deployment outputs | `./output/` (host bind mount) | Yes |
| Container filesystem | Ephemeral (`--rm`) | No |

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
