---
sidebar_position: 7
---

# History and Time Lock System

The staking contract maintains a comprehensive history system and implements time-based restrictions to ensure fair and secure staking operations. This system prevents rapid staking/unstaking cycles and provides complete transaction traceability.

## HistoryMetadata Structure

Every staking and unstaking operation is recorded in the user's history using the `HistoryMetadata` struct:

```solidity
struct HistoryMetadata {
    bytes32 transactionType;  // Transaction identifier
    uint256 amount;           // Amount of staking tokens involved
    uint256 timestamp;        // When the transaction occurred
    uint256 totalStaked;      // User's total staked balance after transaction
}
```

### Transaction Types

The `transactionType` field identifies the operation performed:

| Value | Type | Description |
|-------|------|-------------|
| `bytes32(uint256(1))` | **Staking** | Tokens added to user's stake |
| `bytes32(uint256(2))` | **Unstaking** | Tokens removed from user's stake |

### Record Details

Each history entry captures:

- **`amount`**: Specific tokens staked/unstaked in this transaction
- **`timestamp`**: Exact time when the operation occurred (block.timestamp)
- **`totalStaked`**: User's cumulative staked balance after this transaction

## Time Lock Mechanisms

The contract enforces two types of cooldown periods to maintain system stability and prevent abuse:

### Re-Staking Cooldown

**Purpose**: Prevents immediate re-staking after complete unstaking

- **Trigger**: Activated when user's `totalStaked` reaches `0` (complete unstaking)
- **Duration**: Configurable via `secondsToUnlockStaking.actual`
- **Logic**: User must wait before staking again after their balance reached zero
- **Function**: `getTimeToUserUnlockStakingTime()`

### Full Unstaking Cooldown

**Purpose**: Prevents frequent complete withdrawals

- **Trigger**: Based on the last time user's `totalStaked` was `0`
- **Duration**: Configurable via `secondsToUnlockFullUnstaking.actual` (typically 21 days)
- **Logic**: User must wait before performing complete unstaking
- **Function**: `getTimeToUserUnlockFullUnstakingTime()`

## Cooldown Calculation Logic

### Re-Staking Time Calculation

**Function**: `getTimeToUserUnlockStakingTime(address _account)`

```solidity
function getTimeToUserUnlockStakingTime(address _account) public view returns (uint256) {
    uint256 lengthOfHistory = userHistory[_account].length;
    
    if (lengthOfHistory == 0) {
        return 0; // No history = can stake immediately
    }
    
    if (userHistory[_account][lengthOfHistory - 1].totalStaked == 0) {
        return userHistory[_account][lengthOfHistory - 1].timestamp + 
               secondsToUnlockStaking.actual;
    } else {
        return 0; // Current balance > 0 = no cooldown
    }
}
```

**Logic Flow**:
1. **No History**: User can stake immediately (`return 0`)
2. **Last Transaction Check**: Examines most recent transaction
3. **Zero Balance Cooldown**: If `totalStaked == 0`, apply cooldown
4. **Already Allowed**: If current balance > 0, no cooldown (`return 0`)

### Full Unstaking Time Calculation

**Function**: `getTimeToUserUnlockFullUnstakingTime(address _account)`

```solidity
function getTimeToUserUnlockFullUnstakingTime(address _account) public view returns (uint256) {
    for (uint256 i = userHistory[_account].length; i > 0; i--) {
        if (userHistory[_account][i - 1].totalStaked == 0) {
            return userHistory[_account][i - 1].timestamp + 
                   secondsToUnlockFullUnstaking.actual;
        }
    }
    
    return userHistory[_account][0].timestamp + 
           secondsToUnlockFullUnstaking.actual;
}
```

**Logic Flow**:
1. **Backward History Search**: Iterates from most recent to oldest transaction
2. **Zero Balance Detection**: Finds last time `totalStaked == 0`
3. **Cooldown Applied**: `lastZeroTimestamp + secondsToUnlockFullUnstaking.actual`
4. **Fallback**: If no zero balance found, uses first transaction timestamp

## Practical Examples

### Example 1: First-Time User

```solidity
// User stakes for the first time
History: []
getTimeToUserUnlockStakingTime() → 0 (can stake immediately)
getTimeToUserUnlockFullUnstakingTime() → 0 (no history)

// After staking 5 tokens
History: [
    {
        transactionType: bytes32(uint256(1)),
        amount: 5,
        timestamp: 1625097600,
        totalStaked: 5
    }
]
```

### Example 2: Complete Unstaking Cycle

```solidity
// User completely unstakes (totalStaked becomes 0)
History: [
    {
        transactionType: bytes32(uint256(2)),
        amount: 5,
        timestamp: 1625184000,
        totalStaked: 0  // ← This triggers cooldowns
    }
]

getTimeToUserUnlockStakingTime() → 1625184000 + secondsToUnlockStaking.actual
getTimeToUserUnlockFullUnstakingTime() → 1625184000 + secondsToUnlockFullUnstaking.actual
```

### Example 3: Partial Unstaking

```solidity
// User partially unstakes (totalStaked > 0)
History: [
    {
        transactionType: bytes32(uint256(2)),
        amount: 2,
        timestamp: 1625270400,
        totalStaked: 3  // ← Still has stake, no cooldown
    }
]

getTimeToUserUnlockStakingTime() → 0 (can stake immediately)
getTimeToUserUnlockFullUnstakingTime() → searches for last totalStaked == 0
```

## Integration with Staking Functions

### stakingBaseProcess Integration

The history system is automatically updated in `stakingBaseProcess`:

```solidity
// History entry creation for both staking and unstaking
userHistory[stakingAccount].push(
    HistoryMetadata({
        transactionType: isStaking ? bytes32(uint256(1)) : bytes32(uint256(2)),
        amount: amountOfStaking,
        timestamp: block.timestamp,
        totalStaked: auxSMsteBalance
    })
);
```

### Cooldown Validation

Before allowing operations, functions check time locks:

```solidity
// Staking cooldown check
if (getTimeToUserUnlockStakingTime(stakingAccount) > block.timestamp) {
    revert ErrorsLib.UserMustWaitToStakeAgain();
}

// Full unstaking cooldown check  
if (getTimeToUserUnlockFullUnstakingTime(stakingAccount) > block.timestamp) {
    revert ErrorsLib.UserMustWaitToFullUnstake();
}
```

## Administrative Configuration

Both time lock periods (`secondsToUnlockStaking.actual` and `secondsToUnlockFullUnstaking.actual`) are configurable by the contract administrator through a secure proposal system.

For detailed information about configuring these time lock periods, including the proposal system, time delays, and all available administrative functions, see [Administrative Functions](./03-AdminFunctions.md).
