---
title: "Nonce Types in EVVM"
description: "Detailed explanation of the centralized sync and async nonce mechanisms managed by Core.sol for the entire EVVM ecosystem."
sidebar_position: 2
---

# Nonce Types in EVVM

Core.sol manages all nonces centrally for the entire EVVM ecosystem, implementing two distinct nonce mechanisms: `sync` and `async`. This centralized approach prevents replay attacks across multi-service transactions, as all services (Core, NameService, Staking, P2PSwap, Treasury) use the same unified nonce system.

## Centralized Nonce Management

**Why centralized nonces?**

EVVM fundamentally restructured nonce management. Previously, each service maintained its own nonce system, which created potential security vulnerabilities in cross-service transactions. Now, Core.sol serves as the single source of truth for all nonce validation:

- **Unified Tracking**: All nonces are tracked and validated by Core.sol
- **Cross-Service Security**: Prevents replay attacks when transactions span multiple services
- **Simplified Architecture**: Services no longer need individual nonce management logic
- **Consistent Behavior**: All ecosystem transactions follow the same nonce rules

Understanding these nonce types is essential for developers interfacing with any EVVM service, as they serve different purposes and behave in significantly different ways.

## Sync Nonce

### Definition and Behavior

The sync nonce is a consecutive counter that increments sequentially by one each time a payment transaction is executed. This mechanism closely resembles the standard nonce implementation used in Ethereum transactions.

### Key Characteristics:

- **Sequential Incrementing**: Each successful transaction increases the nonce value by exactly one unit.
- **Transaction Ordering**: Ensures transactions are processed in the order they were issued.
- **Replay Protection**: Prevents transaction replay attacks by requiring each transaction to have a unique nonce value.
- **Predictability**: The next valid nonce is always the current nonce value plus one.

### Use Cases:

- Standard payment operations where transaction order matters
- Operations that require deterministic processing sequence
- Situations where transaction dependencies exist
- Services that rely on deterministic payment processing

---

## Async Nonce

### Definition and Behavior

The async nonce is a non-consecutive number that is user-generated and transaction-specific. Unlike the sync nonce, async nonces do not follow a predetermined sequence and can be any valid number chosen by the user.

### Key Characteristics:

- **Non-sequential**: Numbers don't need to follow any particular order or sequence.
- **Uniqueness Per Address**: Each async nonce can only be used once per address.
- **User-defined**: Users can generate their own nonce values, providing flexibility in transaction preparation.
- **Parallelism**: Multiple transactions can be prepared independently without knowledge of other pending transactions.

### Use Cases:

- Parallel transaction processing
- Delayed execution scenarios
- Batch transaction preparation without dependency on execution order
- Systems where transaction preparation and submission might happen on different timelines

---

## Service Integration with Core.sol

All EVVM services rely on Core.sol for nonce management and validation:

### How Services Use Core Nonces

**NameService**, **Staking**, **P2PSwap**, and **Treasury** all follow this pattern:

1. **Signature Construction**: Service-specific hash functions create payload hashes (e.g., `NameServiceHashUtils.hashDataForRegister()`)
2. **Core Validation**: Services call Core.sol to verify signatures and validate nonces
3. **Unified Format**: All signatures follow the format: `{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}`
4. **Nonce Tracking**: Core.sol marks nonces as used after validation

### Benefits of Centralized Nonces

**Security:**
- **No Replay Across Services**: A signature used in NameService cannot be replayed in Staking or other services
- **Single Validation Point**: All nonce checks happen in Core.sol, reducing attack surface
- **Consistent Rules**: Same nonce behavior across all ecosystem components

**Developer Experience:**
- **Simplified Integration**: Services don't need to implement nonce logic
- **Predictable Behavior**: Same nonce rules everywhere in the ecosystem
- **Unified API**: All services use Core.sol's nonce getter functions

### Nonce Getter Functions

**Check Sync Nonce:**
```solidity
Core.getNextCurrentSyncNonce(address user)
```
Returns the next expected sequential nonce for the user.

**Check Async Nonce:**
```solidity
Core.getIfUsedAsyncNonce(address user, uint256 nonce)
```
Returns `true` if the nonce has been used, `false` if it's available.

:::tip[Multi-Service Transactions]
When building transactions that interact with multiple EVVM services (e.g., staking and then registering a username), use async nonces to allow flexible execution ordering. The centralized nonce system ensures these operations cannot be replayed across services.
:::
