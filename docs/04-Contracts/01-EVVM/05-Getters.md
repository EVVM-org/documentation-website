---
title: "Getter Functions"
description: "Comprehensive documentation of all getter functions available in the EVVM Core Contract for retrieving system state and configuration."
sidebar_position: 5
---

# Getter Functions

This section details all available getter functions in the EVVM contract, providing comprehensive information about the contract's state, configuration, and user data.

## System Configuration Functions

### getEvvmMetadata

**Function Type**: `view`  
**Function Signature**: `getEvvmMetadata()`

Returns the complete EVVM metadata configuration containing system-wide parameters and economic settings.

#### Return Value

Returns an `EvvmMetadata` struct containing:

| Field                     | Type      | Description                                           |
| ------------------------- | --------- | ----------------------------------------------------- |
| `principalTokenAddress`   | `address` | Address of the principal token (MATE token)          |
| `reward`                  | `uint256` | Current reward amount per transaction                 |
| `totalSupply`             | `uint256` | Total supply tracking for era transitions            |
| `eraTokens`               | `uint256` | Era tokens threshold for reward transitions          |

---

### getEvvmID

**Function Type**: `view`  
**Function Signature**: `getEvvmID()`

Gets the unique identifier for this EVVM instance used for signature verification and distinguishing between different EVVM deployments.

#### Return Value

| Type      | Description                                      |
| --------- | ------------------------------------------------ |
| `uint256` | Unique identifier for this EVVM instance         |

---

### getNameServiceAddress

**Function Type**: `view`  
**Function Signature**: `getNameServiceAddress()`

Gets the current NameService contract address used for identity resolution in payments.

#### Return Value

| Type      | Description                                    |
| --------- | ---------------------------------------------- |
| `address` | Address of the integrated NameService contract |

---

### getStakingContractAddress

**Function Type**: `view`  
**Function Signature**: `getStakingContractAddress()`

Gets the authorized staking contract address that can modify staker status and receive rewards.

#### Return Value

| Type      | Description                                   |
| --------- | --------------------------------------------- |
| `address` | Address of the integrated staking contract    |

---



## Nonce Management Functions

### getNextCurrentSyncNonce

**Function Type**: `view`  
**Function Signature**: `getNextCurrentSyncNonce(address)`

Returns the expected nonce for the next synchronous payment transaction for a specific user.

#### Input Parameters

| Parameter | Type      | Description                           |
| --------- | --------- | ------------------------------------- |
| `user`    | `address` | Address to check sync nonce for       |

#### Return Value

| Type      | Description                  |
| --------- | ---------------------------- |
| `uint256` | Next synchronous nonce value |

---

### getIfUsedAsyncNonce

**Function Type**: `view`  
**Function Signature**: `getIfUsedAsyncNonce(address,uint256)`

Checks if a specific asynchronous nonce has been used by a user to prevent replay attacks.

#### Input Parameters

| Parameter | Type      | Description                               |
| --------- | --------- | ----------------------------------------- |
| `user`    | `address` | Address to check nonce usage for          |
| `nonce`   | `uint256` | Specific nonce value to verify            |

#### Return Value

| Type   | Description                                          |
| ------ | ---------------------------------------------------- |
| `bool` | True if the nonce has been used, false if available |

---



### getNextFisherDepositNonce

**Function Type**: `view`  
**Function Signature**: `getNextFisherDepositNonce(address)`

Returns the expected nonce for the next Fisher Bridge cross-chain deposit.

#### Input Parameters

| Parameter | Type      | Description                               |
| --------- | --------- | ----------------------------------------- |
| `user`    | `address` | Address to check deposit nonce for        |

#### Return Value

| Type      | Description                         |
| --------- | ----------------------------------- |
| `uint256` | Next Fisher Bridge deposit nonce    |

---

## Balance and Staking Functions

### getBalance

**Function Type**: `view`  
**Function Signature**: `getBalance(address,address)`

Gets the balance of a specific token for a user stored in the EVVM system.

#### Input Parameters

| Parameter | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| `user`    | `address` | Address to check balance for         |
| `token`   | `address` | Token contract address to check      |

#### Return Value

| Type   | Description                       |
| ------ | --------------------------------- |
| `uint` | Current token balance for the user |

---

### isAddressStaker

**Function Type**: `view`  
**Function Signature**: `isAddressStaker(address)`

Checks if an address is registered as a staker with transaction processing privileges and reward eligibility.

#### Input Parameters

| Parameter | Type      | Description                              |
| --------- | --------- | ---------------------------------------- |
| `user`    | `address` | Address to check staker status for       |

#### Return Value

| Type   | Description                                        |
| ------ | -------------------------------------------------- |
| `bool` | True if the address is a registered staker        |

---

## Economic System Functions

### getEraPrincipalToken

**Function Type**: `view`  
**Function Signature**: `getEraPrincipalToken()`

Gets the current era token threshold that triggers the next reward halving in the deflationary tokenomics system.

#### Return Value

| Type      | Description                      |
| --------- | -------------------------------- |
| `uint256` | Current era tokens threshold     |

---

### getRewardAmount

**Function Type**: `view`  
**Function Signature**: `getRewardAmount()`

Gets the current MATE token reward amount distributed to stakers for transaction processing.

#### Return Value

| Type      | Description                                |
| --------- | ------------------------------------------ |
| `uint256` | Current reward amount in MATE tokens       |

---

### getPrincipalTokenTotalSupply

**Function Type**: `view`  
**Function Signature**: `getPrincipalTokenTotalSupply()`

Gets the total supply of the principal token (MATE) used for era transition calculations.

#### Return Value

| Type      | Description                    |
| --------- | ------------------------------ |
| `uint256` | Total supply of MATE tokens    |

---

## Token Management Functions

### getWhitelistTokenToBeAdded

**Function Type**: `view`  
**Function Signature**: `getWhitelistTokenToBeAdded()`

Gets the address of the token that is pending whitelist approval after the time delay.

#### Return Value

| Type      | Description                                               |
| --------- | --------------------------------------------------------- |
| `address` | Address of the token prepared for whitelisting (zero if none) |

---

### getWhitelistTokenToBeAddedDateToSet

**Function Type**: `view`  
**Function Signature**: `getWhitelistTokenToBeAddedDateToSet()`

Gets the acceptance deadline for pending token whitelist proposals.

#### Return Value

| Type      | Description                                                           |
| --------- | --------------------------------------------------------------------- |
| `uint256` | Timestamp when pending token can be whitelisted (0 if no pending proposal) |

---

## Proxy and Governance Functions

### getCurrentImplementation

**Function Type**: `view`  
**Function Signature**: `getCurrentImplementation()`

Gets the current active implementation contract address used by the proxy for delegatecalls.

#### Return Value

| Type      | Description                                      |
| --------- | ------------------------------------------------ |
| `address` | Address of the current implementation contract   |

---

### getProposalImplementation

**Function Type**: `view`  
**Function Signature**: `getProposalImplementation()`

Gets the proposed implementation contract address pending approval for proxy upgrade.

#### Return Value

| Type      | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `address` | Address of the proposed implementation contract (zero if none) |

---

### getTimeToAcceptImplementation

**Function Type**: `view`  
**Function Signature**: `getTimeToAcceptImplementation()`

Gets the acceptance deadline for the pending implementation upgrade.

#### Return Value

| Type      | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `uint256` | Timestamp when implementation upgrade can be executed (0 if no pending proposal) |

---

## Administrative Functions

### getCurrentAdmin

**Function Type**: `view`  
**Function Signature**: `getCurrentAdmin()`

Gets the current admin address with administrative privileges over the contract.

#### Return Value

| Type      | Description                    |
| --------- | ------------------------------ |
| `address` | Address of the current admin   |

---

### getProposalAdmin

**Function Type**: `view`  
**Function Signature**: `getProposalAdmin()`

Gets the proposed admin address pending approval for admin privileges.

#### Return Value

| Type      | Description                                          |
| --------- | ---------------------------------------------------- |
| `address` | Address of the proposed admin (zero if no pending proposal) |

---

### getTimeToAcceptAdmin

**Function Type**: `view`  
**Function Signature**: `getTimeToAcceptAdmin()`

Gets the acceptance deadline for the pending admin change.

#### Return Value

| Type      | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `uint256` | Timestamp when admin change can be executed (0 if no pending proposal) |

---

## Usage Examples

### Checking User Balance

```solidity
// Check MATE token balance for a user
uint256 mateBalance = evvm.getBalance(userAddress, mateTokenAddress);

// Check if user is a staker
bool isStaker = evvm.isAddressStaker(userAddress);
```

### Nonce Management

```solidity
// Get next sync nonce for a user
uint256 nextNonce = evvm.getNextCurrentSyncNonce(userAddress);

// Check if async nonce is used
bool nonceUsed = evvm.getIfUsedAsyncNonce(userAddress, customNonce);
```

### Token Management Verification

```solidity
// Check if token is pending whitelist
address pendingToken = evvm.getWhitelistTokenToBeAdded();

// Get deadline for whitelist proposal
uint256 deadline = evvm.getWhitelistTokenToBeAddedDateToSet();
```
