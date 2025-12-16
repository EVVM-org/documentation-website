---
sidebar_position: 6
---

# Getter Functions

This section details all available getter functions in the contract, providing comprehensive information about the contract's state and configuration.

---

## Contract State Retrieval Functions

### getAddressHistory

**Function Type**: `view`  
**Function Signature**: `getAddressHistory(address _account)`

Retrieves the complete transaction history for a specified user address.

#### Input Parameters

| Parameter  | Type    | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| `_account` | address | Address of the user to retrieve history for   |

#### Return Value

Returns an array of `HistoryMetadata` structs containing the user's transaction history:

```solidity
struct HistoryMetadata {
    bytes32 transactionType;  // 0x01 for staking, 0x02 for unstaking
    uint256 amount;            // Amount of staking tokens staked/unstaked
    uint256 timestamp;         // Transaction timestamp
    uint256 totalStaked;       // User's total staked tokens after transaction
}
```

---

### getSizeOfAddressHistory

**Function Type**: `view`  
**Function Signature**: `getSizeOfAddressHistory(address _account)`

Returns the total number of transactions in a user's history.

#### Input Parameters

| Parameter  | Type    | Description                                          |
| ---------- | ------- | ---------------------------------------------------- |
| `_account` | address | Address of the user to query                         |

#### Return Value

| Type    | Description                                    |
| ------- | ---------------------------------------------- |
| uint256 | Number of transactions in user's history       |

---

### getAddressHistoryByIndex

**Function Type**: `view`  
**Function Signature**: `getAddressHistoryByIndex(address _account, uint256 _index)`

Retrieves a specific transaction from a user's history based on its index.

#### Input Parameters

| Parameter  | Type    | Description                                   |
| ---------- | ------- | --------------------------------------------- |
| `_account` | address | Address of the user to query                  |
| `_index`   | uint256 | Index of the transaction to retrieve          |

#### Return Value

Returns a single `HistoryMetadata` struct:

```solidity
struct HistoryMetadata {
    bytes32 transactionType;  // 0x01 for staking, 0x02 for unstaking
    uint256 amount;            // Amount of staking tokens staked/unstaked
    uint256 timestamp;         // Transaction timestamp
    uint256 totalStaked;       // User's total staked tokens after transaction
}
```

---

## Price and Token Functions

### priceOfStaking

**Function Type**: `view`  
**Function Signature**: `priceOfStaking()`

Calculates the current exchange rate between staking tokens and MATE tokens.

#### Return Value

| Type    | Description                             |
| ------- | --------------------------------------- |
| uint256 | Current exchange rate (staking tokens to MATE)   |

---

## User Time Lock Functions

### getTimeToUserUnlockFullUnstakingTime

**Function Type**: `view`  
**Function Signature**: `getTimeToUserUnlockFullUnstakingTime(address _account)`

Calculates when a user can perform full unstaking (withdraw all tokens) based on their transaction history. Full unstaking requires waiting after the last time their balance reached 0.

#### Input Parameters

| Parameter  | Type    | Description                                |
| ---------- | ------- | ------------------------------------------ |
| `_account` | address | Address of the user to query               |

#### Return Value

| Type    | Description                                         |
| ------- | --------------------------------------------------- |
| uint256 | Timestamp when user can perform full unstaking      |

#### Execution Flow

1. **Backward History Search**: Iterates through user's history from most recent to oldest transaction
2. **Zero Balance Detection**: Searches for the last transaction where `totalStaked == 0`
3. **Cooldown Calculation**: If found, returns `timestamp + secondsToUnlockFullUnstaking.actual`
4. **Fallback Logic**: If no zero balance found in history, uses first transaction timestamp `userHistory[_account][0].timestamp + secondsToUnlockFullUnstaking.actual`

---

### getTimeToUserUnlockStakingTime

**Function Type**: `view`  
**Function Signature**: `getTimeToUserUnlockStakingTime(address _account)`

Calculates when a user becomes eligible to stake again after their last full unstaking. Users must wait a configurable period after their balance reaches zero.

#### Input Parameters

| Parameter  | Type    | Description                               |
| ---------- | ------- | ----------------------------------------- |
| `_account` | address | Address of the user to query              |

#### Return Value

| Type    | Description                                      |
| ------- | ------------------------------------------------ |
| uint256 | Timestamp when user can stake again (0 if already allowed) |

#### Execution Flow

1. **History Check**: If no history exists (`length == 0`), returns `0` (user can stake immediately)
2. **Recent Transaction Analysis**: Examines the most recent transaction in user's history
3. **Zero Balance Cooldown**: If last transaction resulted in `totalStaked == 0`, returns `timestamp + secondsToUnlockStaking.actual`
4. **No Cooldown**: If current balance > 0, returns `0` (user can stake immediately)

---

## System Configuration Functions

### getSecondsToUnlockFullUnstaking

**Function Type**: `view`  
**Function Signature**: `getSecondsToUnlockFullUnstaking()`

Retrieves the current full unstaking unlock period in seconds.

#### Return Value

| Type    | Description                                    |
| ------- | ---------------------------------------------- |
| uint256 | Current full unstaking time lock period        |

---

### getSecondsToUnlockStaking

**Function Type**: `view`  
**Function Signature**: `getSecondsToUnlockStaking()`

Retrieves the current staking unlock period in seconds.

#### Return Value

| Type    | Description                                |
| ------- | ------------------------------------------ |
| uint256 | Current staking time lock period           |

---

## User Asset Functions

### getUserAmountStaked

**Function Type**: `view`  
**Function Signature**: `getUserAmountStaked(address _account)`

Retrieves the total amount of staking tokens currently staked by a user.

#### Input Parameters

| Parameter  | Type    | Description                               |
| ---------- | ------- | ----------------------------------------- |
| `_account` | address | Address of the user to query              |

#### Return Value

| Type    | Description                                |
| ------- | ------------------------------------------ |
| uint256 | Total amount of staking tokens staked by the user   |

---

## Security and Validation Functions

### checkIfStakeNonceUsed

**Function Type**: `view`  
**Function Signature**: `checkIfStakeNonceUsed(address,uint256)`

Checks if a specific staking nonce has already been used by a user.

#### Input Parameters

| Parameter  | Type    | Description                               |
| ---------- | ------- | ----------------------------------------- |
| `_account` | address | Address of the user to check the nonce for |
| `_nonce`   | uint256 | The nonce to check for prior usage        |

#### Return Value

| Type | Description                                         |
| ---- | --------------------------------------------------- |
| bool | `true` if nonce has been used, `false` otherwise    |

---

## Contract Reference Functions

### getGoldenFisher

**Function Type**: `view`  
**Function Signature**: `getGoldenFisher()`

Retrieves the address of the Golden Fisher contract.

#### Return Value

| Type    | Description                               |
| ------- | ----------------------------------------- |
| address | Address of the Golden Fisher contract     |

---

### getGoldenFisherProposal

**Function Type**: `view`  
**Function Signature**: `getGoldenFisherProposal()`

Retrieves the address of the Golden Fisher contract proposal.

#### Return Value

| Type    | Description                                      |
| ------- | ------------------------------------------------ |
| address | Address of the Golden Fisher contract proposal   |

---

### getEstimatorAddress

**Function Type**: `view`  
**Function Signature**: `getEstimatorAddress()`

Retrieves the address of the current Estimator contract.

#### Return Value

| Type    | Description                               |
| ------- | ----------------------------------------- |
| address | Address of the current Estimator contract |

---

### getEstimatorProposal

**Function Type**: `view`  
**Function Signature**: `getEstimatorProposal()`

Retrieves the address of the proposed new Estimator contract.

#### Return Value

| Type    | Description                                      |
| ------- | ------------------------------------------------ |
| address | Address of the proposed Estimator contract (zero address if none) |

---

### getEvvmAddress

**Function Type**: `view`  
**Function Signature**: `getEvvmAddress()`

Retrieves the address of the EVVM contract.

#### Return Value

| Type    | Description                               |
| ------- | ----------------------------------------- |
| address | Address of the EVVM contract              |

---

### getMateAddress

**Function Type**: `view`  
**Function Signature**: `getMateAddress()`

Retrieves the address of the staking token contract.

#### Return Value

| Type    | Description                                |
| ------- | ------------------------------------------ |
| address | Address of the staking token contract        |

---

### getOwner

**Function Type**: `view`  
**Function Signature**: `getOwner()`

Retrieves the address of the contract owner.

#### Return Value

| Type    | Description                               |
| ------- | ----------------------------------------- |
| address | Address of the contract owner             |

---

## Presale Staker Information

### getPresaleStaker

**Function Type**: `view`  
**Function Signature**: `getPresaleStaker(address _account)`

Determines if a user is a presale staker and retrieves their staked amount.

#### Input Parameters

| Parameter  | Type    | Description                               |
| ---------- | ------- | ----------------------------------------- |
| `_account` | address | Address of the user to query              |

#### Return Value

| Type    | Description                                              |
| ------- | -------------------------------------------------------- |
| bool    | `true` if user is a presale staker, `false` otherwise    |
| uint256 | Amount of staking tokens staked by the user during presale        |

---

### getPresaleStakerCount

**Function Type**: `view`  
**Function Signature**: `getPresaleStakerCount()`

Retrieves the total number of presale stakers in the contract.

#### Return Value

| Type    | Description                                |
| ------- | ------------------------------------------ |
| uint256 | Number of presale stakers in the contract  |

---

## Contract Status Functions

### getAllDataOfAllowPublicStaking

**Function Type**: `view`  
**Function Signature**: `getAllDataOfAllowPublicStaking()`

Retrieves the value of the `allowPublicStaking` variable in `BoolTypeProposal` struct.

#### Return Value

| Type             | Description                                                         |
| ---------------- | ------------------------------------------------------------------- |
| BoolTypeProposal | Value of `allowPublicStaking` variable in `BoolTypeProposal` struct |

The struct contains the following fields:

```solidity
struct BoolTypeProposal {
    bool flag;           // Current value of the allowPublicStaking variable
    uint256 timeToAccept; // Timestamp when the change should be accepted
}
```

---

### getAllowPresaleStaking

**Function Type**: `view`  
**Function Signature**: `getAllowPresaleStaking()`

Retrieves the value of the `allowPresaleStaking` variable in `BoolTypeProposal` struct.

#### Return Value

| Type             | Description                                                          |
| ---------------- | -------------------------------------------------------------------- |
| BoolTypeProposal | Value of `allowPresaleStaking` variable in `BoolTypeProposal` struct |

The struct contains the following fields:

```solidity
struct BoolTypeProposal {
    bool flag;           // Current value of the allowPresaleStaking variable
    uint256 timeToAccept; // Timestamp when the change should be accepted
}
```

---