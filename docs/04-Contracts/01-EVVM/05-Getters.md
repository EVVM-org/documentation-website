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

### getNextCurrentSyncNonce {#getnextcurrentsyncnonce}

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

### getIfUsedAsyncNonce {#getifusedasyncnonce}

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

### getAsyncNonceReservation {#getasyncnoncereservation}

**Function Type**: `view`  
**Function Signature**: `getAsyncNonceReservation(address,uint256)`

Gets the service address that has reserved a specific async nonce for a user. Returns `address(0)` if the nonce is not reserved.

#### Input Parameters

| Parameter | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| `user`    | `address` | Address of the user who owns the nonce |
| `nonce`   | `uint256` | Async nonce to check reservation for  |

#### Return Value

| Type      | Description                                                           |
| --------- | --------------------------------------------------------------------- |
| `address` | Service address that reserved the nonce, or `address(0)` if not reserved |

#### Example

```solidity
// Check if nonce 100 is reserved for a user
address reservedService = core.getAsyncNonceReservation(userAddress, 100);

if (reservedService == address(0)) {
    // Nonce is not reserved, any service can use it
} else if (reservedService == nameServiceAddress) {
    // Nonce is reserved for NameService
} else {
    // Nonce is reserved for another service
}
```

---

### asyncNonceStatus {#asyncnoncestatus}

**Function Type**: `view`  
**Function Signature**: `asyncNonceStatus(address,uint256)`

Gets comprehensive status of an async nonce, indicating whether it's available, used, or reserved.

#### Input Parameters

| Parameter | Type      | Description                          |
| --------- | --------- | ------------------------------------ |
| `user`    | `address` | Address of the user who owns the nonce |
| `nonce`   | `uint256` | Async nonce to check status for      |

#### Return Value

| Type     | Description                                                     |
| -------- | --------------------------------------------------------------- |
| `bytes1` | Status code: `0x00` (available), `0x01` (used), `0x02` (reserved) |

#### Status Codes

- **`0x00` (Available)**: Nonce can be used by any service
- **`0x01` (Used)**: Nonce has been consumed and cannot be reused
- **`0x02` (Reserved)**: Nonce is reserved for a specific service

#### Example

```solidity
// Check status of nonce 200
bytes1 status = core.asyncNonceStatus(userAddress, 200);

if (status == 0x00) {
    // Nonce is available
} else if (status == 0x01) {
    // Nonce has been used
} else if (status == 0x02) {
    // Nonce is reserved for a specific service
    address reservedFor = core.getAsyncNonceReservation(userAddress, 200);
}
```

---

### getUserValidatorAddress {#getuservalidatoraddress}

**Function Type**: `view`  
**Function Signature**: `getUserValidatorAddress()`

Gets the current UserValidator contract address used for transaction filtering. Returns `address(0)` if no validator is configured (all users allowed).

#### Return Value

| Type      | Description                                                           |
| --------- | --------------------------------------------------------------------- |
| `address` | Address of the active UserValidator contract, or `address(0)` if none |

#### Example

```solidity
address validator = core.getUserValidatorAddress();

if (validator == address(0)) {
    // No validator configured - all users can execute transactions
} else {
    // Validator is active - check if user can execute
    bool canExecute = IUserValidator(validator).canExecute(userAddress);
}
```

---

## User Validation Functions

### canExecuteUserTransaction {#canexecuteusertransaction}

**Function Type**: `view` (public)  
**Function Signature**: `canExecuteUserTransaction(address)`

Validates if a user is allowed to execute transactions in the EVVM ecosystem. This function is publicly accessible, allowing external services to check user permissions before processing transactions.

#### Input Parameters

| Parameter | Type      | Description                           |
| --------- | --------- | ------------------------------------- |
| `user`    | `address` | Address to check execution permission |

#### Return Value

| Type   | Description                                          |
| ------ | ---------------------------------------------------- |
| `bool` | `true` if user can execute, `false` if blocked       |

#### Behavior

- **No Validator Configured**: Returns `true` (all users allowed)
- **Validator Active**: Delegates to `IUserValidator.canExecute(user)`
- **Used By**: Called internally by `validateAndConsumeNonce` before processing transactions
- **External Use**: Services can call this to pre-validate users before requesting signatures

#### Integration

This function is called during every transaction validation in `validateAndConsumeNonce`. When a UserValidator is configured, it enables:
- Compliance filtering (KYC/AML requirements)
- Whitelist/blacklist management
- Dynamic access control based on external conditions

#### Example

```solidity
// Pre-validate user before requesting signature
if (!core.canExecuteUserTransaction(userAddress)) {
    revert("User is not authorized to execute transactions");
}

// Request signature from user
bytes memory signature = requestUserSignature(userAddress, ...);

// Proceed with transaction
core.validateAndConsumeNonce(userAddress, ...);
```

#### Related Functions

For UserValidator management, see:
- [proposeUserValidator](./03-SignatureAndNonceManagement.md#proposeuservalidator)
- [acceptUserValidatorProposal](./03-SignatureAndNonceManagement.md#acceptuservalidatorproposal)
- [cancelUserValidatorProposal](./03-SignatureAndNonceManagement.md#canceluservalidatorproposal)

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

### getFullDetailImplementation

**Function Type**: `view`  
**Function Signature**: `getFullDetailImplementation()`

Returns the full implementation proposal details including current implementation, proposed implementation, and time-to-accept.

#### Return Value

Returns an `AddressTypeProposal` struct containing:

| Field           | Type      | Description                                        |
| --------------- | --------- | -------------------------------------------------- |
| `current`       | `address` | Current active implementation address              |
| `proposal`      | `address` | Proposed implementation address (zero if none)     |
| `timeToAccept`  | `uint256` | Timestamp when proposal can be accepted            |

---

### getTimeToAcceptImplementation

**Function Type**: `view`  
**Function Signature**: `getTimeToAcceptImplementation()`

Returns the time delay required before a proposed implementation upgrade can be accepted. This is a constant value (30 days).

#### Return Value

| Type      | Description                                          |
| --------- | ---------------------------------------------------- |
| `uint256` | Constant time delay in seconds (30 days) for implementation upgrades |

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

### getFullDetailAdmin

**Function Type**: `view`  
**Function Signature**: `getFullDetailAdmin()`

Returns the full admin proposal details including current admin, proposed admin, and time-to-accept.

#### Return Value

Returns an `AddressTypeProposal` struct containing:

| Field           | Type      | Description                                        |
| --------------- | --------- | -------------------------------------------------- |
| `current`       | `address` | Current active admin address                       |
| `proposal`      | `address` | Proposed admin address (zero if no proposal)       |
| `timeToAccept`  | `uint256` | Timestamp when proposal can be accepted            |

---

## UserValidator Functions

### getUserValidatorAddress {#getuservalidatoraddress}

**Function Type**: `view`  
**Function Signature**: `getUserValidatorAddress()`

Gets the current active UserValidator contract address. Returns `address(0)` if no validator is configured.

#### Return Value

| Type      | Description                                  |
| --------- | -------------------------------------------- |
| `address` | Address of active UserValidator contract or `address(0)` |

:::info[What is UserValidator?]
UserValidator is an optional contract that can filter which users are allowed to execute transactions in the EVVM ecosystem. See [UserValidator System](./03-SignatureAndNonceManagement.md#uservalidator-system) for details.
:::

---

### getFullDetailUserValidator {#getfulldetailuservalidator}

**Function Type**: `view`  
**Function Signature**: `getFullDetailUserValidator()`

Returns the full UserValidator proposal details including current validator, proposed validator, and time-to-accept.

#### Return Value

Returns an `AddressTypeProposal` struct containing:

| Field           | Type      | Description                                        |
| --------------- | --------- | -------------------------------------------------- |
| `current`       | `address` | Current active UserValidator address               |
| `proposal`      | `address` | Proposed validator address (zero if no proposal)   |
| `timeToAccept`  | `uint256` | Timestamp when proposal can be accepted            |

#### Example

```solidity
// Get full validator details
ProposalStructs.AddressTypeProposal memory validatorDetails = 
    core.getFullDetailUserValidator();

if (validatorDetails.proposal != address(0)) {
    // There's a pending proposal
    if (block.timestamp >= validatorDetails.timeToAccept) {
        // Proposal is ready to accept
    } else {
        // Still waiting for time-lock
        uint256 timeRemaining = validatorDetails.timeToAccept - block.timestamp;
    }
}
```

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
