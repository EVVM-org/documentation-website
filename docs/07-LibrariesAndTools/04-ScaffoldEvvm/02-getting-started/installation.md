---
sidebar_position: 1
title: Installation
description: Prerequisites (Node, Foundry, Git), the one-time npm install, and how to verify a working scaffold-evvm install.
---

# Installation

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org) | `>= 18` | Wizard, CLI, and frontend |
| npm | `>= 9` | Bundled with Node.js |
| [Git](https://git-scm.com/) | any | Cloning sources |
| [Foundry](https://book.getfoundry.sh/getting-started/installation) | latest | Compiling Solidity (required even when you choose the Hardhat framework, because Hardhat delegates compilation to forge) |

> **Why Foundry is always required:** scaffold-evvm uses a hybrid approach where
> Foundry is the source of truth for compilation. The Hardhat package wraps
> `forge build --via-ir` for tasks that need Hardhat's runtime semantics.

## Install scaffold-evvm

```bash
git clone https://github.com/EVVM-org/scaffold-evvm.git
cd scaffold-evvm
npm install
```

The first `npm install` installs every workspace under `packages/*`.

## Verify the install

```bash
node --version  # >= v18
forge --version
npm run cli help
```

`npm run cli help` should print the list of CLI commands without errors.

## Next: run the wizard

You're done. Head to **[Quickstart](./quickstart.md)** to spin up the full
stack in one command.
