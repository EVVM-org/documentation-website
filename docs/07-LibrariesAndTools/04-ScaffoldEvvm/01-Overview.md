---
sidebar_position: 1
title: Overview
description: Local development environment for battle-testing EVVM services before paying testnet or mainnet gas — drop a Solidity file, run one command, get a full EVVM stack with auto-generated UI and block explorer.
---

# Scaffold-EVVM

**Battle-test EVVM services locally before you spend a wei of testnet or mainnet gas.**

Scaffold-EVVM is the iteration loop for anyone shipping an EVVM service. Drop your `.sol` file, run one command, and you get:

- A **local EVVM stack** — all six protocol contracts (Core, Staking, Estimator, NameService, Treasury, P2PSwap) deployed on Anvil or Hardhat Network.
- Your service **auto-deployed and wired in** — addresses written to the frontend `.env`, ABI persisted, no manual plumbing.
- A **fully generated UI** at `/services/<your-service>` — read panel, write panel with the right form per function role (admin / publicAction / publicPay), live event tail, EVVM dual-signature signing handled for you.
- A **block explorer** at `/evvmscan` that decodes your service's calls and events as first-class citizens alongside the protocol contracts.
- **23+ signature constructors** for every EVVM operation so you can stress-test how your service interacts with payments, staking, names, and P2P swaps.

> 🛡️ **Why this matters:** every signature you generate against a service ABI you wrote yesterday is one fewer testnet deploy, one fewer testnet faucet round-trip, one fewer "wait, did I send the right struct?" thirty minutes after pushing. Failing fast locally is the whole point.

## When to use Scaffold-EVVM

You're a good fit if you want to:

- **Iterate on a new EVVM service** — write the contract, drop it in `services/`, hit the auto-UI, see what breaks. Edit, rerun the wizard, repeat.
- **Demo a contract** to a non-technical audience — the auto-UI is legible enough that they can drive it.
- **Test a contract end-to-end** through a real UI before investing in a bespoke frontend.
- **Learn EVVM hands-on** — send pays, register names, stake MATE, swap tokens, all from a UI built specifically to teach the protocol.
- **Contribute to EVVM core** — run the full stack locally, modify any contract, redeploy in seconds.

## What this section covers

- **[Getting Started](./02-getting-started/quickstart.md)** — Install, run the wizard, troubleshoot common issues
- **[Custom Services](./03-custom-services/overview.md)** — The drop-a-file workflow, manifest, auto-UI, examples
- **[Frontend Pages](./04-frontend/overview.md)** — Walkthrough of every interaction page
- **[CLI Reference](./05-cli/commands.md)** — Every command the wizard exposes
- **[EVVMScan Explorer](./06-explorer/overview.md)** — How to read the in-browser explorer
- **[Architecture](./07-architecture/overview.md)** — How the monorepo is organized and how the pieces fit together

For EVVM protocol-level concepts (signatures, contracts, nonces) see the rest of [evvm.info/docs](/docs/intro). The canonical service-authoring guide lives at **[How to make an EVVM service](/docs/HowToMakeAEVVMService)** — this section is the scaffold-evvm shorthand for that workflow.

## Quick links

- 🌐 [evvm.org](https://evvm.org) · The EVVM website
- 🛠️ [github.com/EVVM-org/scaffold-evvm](https://github.com/EVVM-org/scaffold-evvm) · The repo
