---
sidebar_position: 3
---

# Administrative Functions

This section details all administrative functions in the contract, which implement a secure time-delayed governance system to ensure safe management of critical contract parameters and roles.

:::info Time-Delayed Governance
All administrative changes follow a secure two-step process with a mandatory 24-hour waiting period to prevent immediate modifications to critical parameters.
:::

---

## Presale Staker Management

### addPresaleStaker

**Function Type**: `external`  
**Function Signature**: `addPresaleStaker(address)`  

Allows the admin to add a single new presale staker to the contract.

#### Parameters

| Parameter | Type    | Description                       |
| --------- | ------- | --------------------------------- |
| `_staker` | address | Address of the new presale staker |

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges using `onlyOwner` modifier
2. **Limit Validation**: Ensures adding this staker won't exceed the 800 staker limit (`LIMIT_PRESALE_STAKER`)
3. **Staker Registration**: Sets `userPresaleStaker[_staker].isAllow = true`
4. **Counter Update**: Increments `presaleStakerCount`

---

### addPresaleStakers

**Function Type**: `external`  
**Function Signature**: `addPresaleStakers(address[])`  

Allows the admin to add multiple presale stakers in a single transaction for efficient batch processing.

#### Parameters

| Parameter  | Type      | Description                               |
| ---------- | --------- | ----------------------------------------- |
| `_stakers` | address[] | Array of addresses of new presale stakers |

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges using `onlyOwner` modifier
2. **Batch Processing**: Iterates through the array of staker addresses
3. **Individual Limit Check**: For each address, verifies the 800 staker limit (`LIMIT_PRESALE_STAKER`)
4. **Staker Registration**: Sets `userPresaleStaker[_stakers[i]].isAllow = true` for each valid address
5. **Counter Update**: Increments `presaleStakerCount` for each successfully added staker

---

## Admin Role Management

### proposeAdmin

**Function Type**: `external`  
**Function Signature**: `proposeAdmin(address)`  

Initiates the admin role transfer process by proposing a new admin address.

#### Parameters

| Parameter   | Type    | Description                       |
| ----------- | ------- | --------------------------------- |
| `_newAdmin` | address | Address of the proposed new admin |

#### Workflow

1. **Admin Verification**: Validates caller has current admin privileges
2. **Proposal Setup**: Sets `admin.proposal = _newAdmin`
3. **Time Lock Activation**: Sets `admin.timeToAccept = block.timestamp + 1 days`

---

### rejectProposalAdmin

**Function Type**: `external`  
**Function Signature**: `rejectProposalAdmin()`  

Allows the current admin to cancel a pending admin change proposal.

#### Workflow

1. **Admin Verification**: Validates caller has current admin privileges
2. **Proposal Cancellation**: Resets `admin.proposal = address(0)`
3. **Time Lock Reset**: Resets `admin.timeToAccept = 0`

---

### acceptNewAdmin

**Function Type**: `external`  
**Function Signature**: `acceptNewAdmin()`  

Allows the proposed admin to accept the role after the mandatory waiting period.

#### Workflow

1. **Proposal Validation**: Verifies `msg.sender == admin.proposal`
2. **Time Lock Validation**: Confirms `admin.timeToAccept <= block.timestamp`
3. **Role Transfer**: Updates `admin.actual = admin.proposal`
4. **Cleanup**: Resets `admin.proposal = address(0)` and `admin.timeToAccept = 0`

---

## Golden Fisher Role Management

### proposeGoldenFisher

**Function Type**: `external`  
**Function Signature**: `proposeGoldenFisher(address)`  

Initiates the golden fisher role assignment process.

#### Parameters

| Parameter        | Type    | Description                               |
| ---------------- | ------- | ----------------------------------------- |
| `_goldenFisher` | address | Address of the proposed new golden fisher |

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Proposal Setup**: Sets `goldenFisher.proposal = _goldenFisher`
3. **Time Lock Activation**: Sets `goldenFisher.timeToAccept = block.timestamp + 1 days`

---

### rejectProposalGoldenFisher

**Function Type**: `external`  
**Function Signature**: `rejectProposalGoldenFisher()`  

Allows the current admin to cancel a pending golden fisher change proposal.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Proposal Cancellation**: Resets `goldenFisher.proposal = address(0)`
3. **Time Lock Reset**: Resets `goldenFisher.timeToAccept = 0`

---

### acceptNewGoldenFisher

**Function Type**: `external`  
**Function Signature**: `acceptNewGoldenFisher()`  

Allows the admin to confirm the new golden fisher role assignment after the waiting period.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Validation**: Confirms `goldenFisher.timeToAccept <= block.timestamp`
3. **Role Assignment**: Updates `goldenFisher.actual = goldenFisher.proposal`
4. **Cleanup**: Resets `goldenFisher.proposal = address(0)` and `goldenFisher.timeToAccept = 0`

---

## Staking Time Lock Configuration

### proposeSetSecondsToUnlockStaking

**Function Type**: `external`  
**Function Signature**: `proposeSetSecondsToUnlockStaking(uint256)`  

Initiates the process to change the re-staking cooldown period.

#### Parameters

| Parameter                 | Type    | Description                          |
| ------------------------- | ------- | ------------------------------------ |
| `_secondsToUnlockStaking` | uint256 | New staking unlock period in seconds |

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Proposal Setup**: Sets `secondsToUnlockStaking.proposal = _secondsToUnlockStaking`
3. **Time Lock Activation**: Sets `secondsToUnlockStaking.timeToAccept = block.timestamp + 1 days`

---

### rejectProposalSetSecondsToUnlockStaking

**Function Type**: `external`  
**Function Signature**: `rejectProposalSetSecondsToUnlockStaking()`  

Allows the current admin to cancel a pending staking unlock period change proposal.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Proposal Cancellation**: Resets `secondsToUnlockStaking.proposal = 0`
3. **Time Lock Reset**: Resets `secondsToUnlockStaking.timeToAccept = 0`

---

### acceptSetSecondsToUnlockStaking

**Function Type**: `external`  
**Function Signature**: `acceptSetSecondsToUnlockStaking()`  

Allows the admin to confirm the new staking unlock period after the waiting period.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Validation**: Confirms `secondsToUnlockStaking.timeToAccept <= block.timestamp`
3. **Configuration Update**: Updates `secondsToUnlockStaking.actual = secondsToUnlockStaking.proposal`
4. **Cleanup**: Resets `secondsToUnlockStaking.proposal = 0` and `secondsToUnlockStaking.timeToAccept = 0`

---

## Full Unstaking Time Lock Configuration

### prepareSetSecondsToUnlockFullUnstaking

**Function Type**: `external`  
**Function Signature**: `prepareSetSecondsToUnllockFullUnstaking(uint256)`  

Initiates the process to change the full unstaking cooldown period.

#### Parameters

| Parameter                         | Type    | Description                                 |
| --------------------------------- | ------- | ------------------------------------------- |
| `_secondsToUnllockFullUnstaking` | uint256 | New full unstaking unlock period in seconds |

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Proposal Setup**: Sets `secondsToUnllockFullUnstaking.proposal = _secondsToUnllockFullUnstaking`
3. **Time Lock Activation**: Sets `secondsToUnllockFullUnstaking.timeToAccept = block.timestamp + 1 days`

---

### cancelSetSecondsToUnlockFullUnstaking

**Function Type**: `external`  
**Function Signature**: `cancelSetSecondsToUnllockFullUnstaking()`  

Allows the current admin to cancel a pending full unstaking unlock period change proposal.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Proposal Cancellation**: Resets `secondsToUnllockFullUnstaking.proposal = 0`
3. **Time Lock Reset**: Resets `secondsToUnllockFullUnstaking.timeToAccept = 0`

---

### confirmSetSecondsToUnlockFullUnstaking

**Function Type**: `external`  
**Function Signature**: `confirmSetSecondsToUnllockFullUnstaking()`  

Allows the admin to confirm the new full unstaking unlock period after the waiting period.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Validation**: Confirms `secondsToUnllockFullUnstaking.timeToAccept <= block.timestamp`
3. **Configuration Update**: Updates `secondsToUnllockFullUnstaking.actual = secondsToUnllockFullUnstaking.proposal`
4. **Cleanup**: Resets `secondsToUnllockFullUnstaking.proposal = 0` and `secondsToUnllockFullUnstaking.timeToAccept = 0`

---

## Public Staking Flag Management

### prepareChangeAllowPublicStaking

**Function Type**: `external`  
**Function Signature**: `prepareChangeAllowPublicStaking()`  

Initiates the process to toggle the public staking availability flag.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Activation**: Sets `allowPublicStaking.timeToAccept = block.timestamp + 1 days`

---

### cancelChangeAllowPublicStaking

**Function Type**: `external`  
**Function Signature**: `cancelChangeAllowPublicStaking()`  

Allows the current admin to cancel a pending public staking flag change proposal.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Reset**: Resets `allowPublicStaking.timeToAccept = 0`

---

### confirmChangeAllowPublicStaking

**Function Type**: `external`  
**Function Signature**: `confirmChangeAllowPublicStaking()`  

Allows the admin to confirm the public staking flag toggle after the waiting period.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Validation**: Confirms `allowPublicStaking.timeToAccept <= block.timestamp`
3. **Flag Toggle**: Creates new `BoolTypeProposal` with `flag: !allowPublicStaking.flag`
4. **Cleanup**: Sets `timeToAccept: 0`

---

## Presale Staking Flag Management

### prepareChangeAllowPresaleStaking

**Function Type**: `external`  
**Function Signature**: `prepareChangeAllowPresaleStaking()`  

Initiates the process to toggle the presale staking availability flag.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Activation**: Sets `allowPresaleStaking.timeToAccept = block.timestamp + 1 days`

---

### cancelChangeAllowPresaleStaking

**Function Type**: `external`  
**Function Signature**: `cancelChangeAllowPresaleStaking()`  

Allows the current admin to cancel a pending presale staking flag change proposal.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Reset**: Resets `allowPresaleStaking.timeToAccept = 0`

---

### confirmChangeAllowPresaleStaking

**Function Type**: `external`  
**Function Signature**: `confirmChangeAllowPresaleStaking()`  

Allows the admin to confirm the presale staking flag toggle after the waiting period.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Validation**: Confirms `allowPresaleStaking.timeToAccept <= block.timestamp`
3. **Flag Toggle**: Creates new `BoolTypeProposal` with `flag: !allowPresaleStaking.flag`
4. **Cleanup**: Sets `timeToAccept: 0`

---

## Estimator Contract Management

### proposeEstimator

**Function Type**: `external`  
**Function Signature**: `proposeEstimator(address)`  

Initiates the process to change the estimator contract address.

#### Parameters

| Parameter    | Type    | Description                            |
| ------------ | ------- | -------------------------------------- |
| `_estimator` | address | Address of the proposed new estimator |

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Proposal Setup**: Sets `estimator.proposal = _estimator`
3. **Time Lock Activation**: Sets `estimator.timeToAccept = block.timestamp + 1 days`

---

### rejectProposalEstimator

**Function Type**: `external`  
**Function Signature**: `rejectProposalEstimator()`  

Allows the current admin to cancel a pending estimator change proposal.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Proposal Cancellation**: Resets `estimator.proposal = address(0)`
3. **Time Lock Reset**: Resets `estimator.timeToAccept = 0`

---

### acceptNewEstimator

**Function Type**: `external`  
**Function Signature**: `acceptNewEstimator()`  

Allows the admin to confirm the new estimator address after the waiting period.

#### Workflow

1. **Admin Verification**: Validates caller has admin privileges
2. **Time Lock Validation**: Confirms `estimator.timeToAccept <= block.timestamp`
3. **Contract Update**: Updates `estimator.actual = estimator.proposal`
4. **Cleanup**: Resets `estimator.proposal = address(0)` and `estimator.timeToAccept = 0`

---

## Data Structures

### AddressTypeProposal

```solidity
struct AddressTypeProposal {
    address actual;      // Current active address
    address proposal;    // Proposed new address
    uint256 timeToAccept; // Timestamp when proposal can be accepted
}
```

Used for managing: `admin`, `goldenFisher`, `estimator`

### UintTypeProposal

```solidity
struct UintTypeProposal {
    uint256 actual;      // Current active value
    uint256 proposal;    // Proposed new value
    uint256 timeToAccept; // Timestamp when proposal can be accepted
}
```

Used for managing: `secondsToUnlockStaking`, `secondsToUnllockFullUnstaking`

### BoolTypeProposal

```solidity
struct BoolTypeProposal {
    bool flag;           // Current boolean state
    uint256 timeToAccept; // Timestamp when flag change can be executed
}
```

Used for managing: `allowPresaleStaking`, `allowPublicStaking`

### presaleStakerMetadata

```solidity
struct presaleStakerMetadata {
    bool isAllow;        // Whether address can participate in presale staking
    uint256 stakingAmount; // Current staking tokens staked (max 2 for presale)
}
```

Used for tracking presale staker status and limits.