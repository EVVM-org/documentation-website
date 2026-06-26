---
title: "Administrative Functions"
description: "Time-delayed governance functions for P2P Swap contract administration"
sidebar_position: 4
---

# Administrative Functions

:::info[Implementation Note]
Administrative functions do **not** use Core.sol's `validateAndConsumeNonce()` pattern. They are directly protected by `onlyAdmin` modifier and execute through standard transaction authentication via `msg.sender`.
:::

The P2P Swap Contract implements a comprehensive administrative system with time-delayed governance, secure admin management, and flexible configuration options. All administrative changes follow a proposal-acceptance pattern with mandatory waiting periods for security.

## Admin Management

### proposeAdmin

**Function Signature**: `proposeAdmin(address _newOwner)`

Proposes a new administrator with a 1-day acceptance window.

**Access**: Current admin only

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `_newOwner` | `address` | Address of the proposed new admin |

**Process:**
1. Validates `_newOwner` is not address(0) and not the current admin
2. Sets `admin.proposal` to the new address
3. Sets `admin.timeToAccept` to `block.timestamp + 1 days`

**Errors:**
- `IncorrectAddressInput()` - If `_newOwner` is address(0) or current admin
- `SenderIsNotAdmin()` - If caller is not the current admin

---

### acceptAdmin

**Function Signature**: `acceptAdmin()`

Accepts the admin proposal and transfers administration.

**Access**: Proposed admin only, within acceptance window

**Requirements:**
- Must be called by the proposed admin (`admin.proposal`)
- Must be within the 1-day acceptance window (`block.timestamp >= admin.timeToAccept`)

**Process:**
1. Transfers admin role to the proposed admin
2. Clears the proposal state

**Errors:**
- `ProposalNotReadyToAccept()` - If called before timelock expires
- `SenderIsNotTheProposedAdmin()` - If caller is not the proposed admin

---

### rejectProposalAdmin

**Function Signature**: `rejectProposalAdmin()`

Cancels the pending admin change proposal.

**Access**: Current admin only

**Process:**
1. Clears the admin proposal (sets proposal to address(0), timeToAccept to 0)

## Fee Configuration Management

### proposeBasisPercentageFee

**Function Signature**: `proposeBasisPercentageFee(uint256 _newFee)`

Proposes a new proportional fee rate in basis points.

**Access**: Admin only

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `_newFee` | `uint256` | New fee rate in basis points (max 10_000 = 100%) |

**Requirements:**
- `_newFee` must not exceed 10_000
- 1-day waiting period before acceptance

**Errors:**
- `IncorrectAddressInput()` - If `_newFee > 10_000`
- `SenderIsNotAdmin()` - If caller is not admin

---

### acceptBasisPercentageFee

**Function Signature**: `acceptBasisPercentageFee()`

Finalizes the fee rate change after the time delay.

**Access**: Admin only, within acceptance window

**Errors:**
- `ProposalNotReadyToAccept()` - If called before timelock expires

---

### rejectProposalBasisPercentageFee

**Function Signature**: `rejectProposalBasisPercentageFee()`

Cancels the pending fee rate change proposal.

**Access**: Admin only

## Reward Distribution Management

### proposeBasisPointsForReward

**Function Signature**: `proposeBasisPointsForReward(uint256 _seller, uint256 _service, uint256 _mateStaker)`

Proposes a new fee distribution split among seller, service, and staker.

**Access**: Admin only

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `_seller` | `uint256` | Basis points allocated to the order seller |
| `_service` | `uint256` | Basis points allocated to the service contract |
| `_mateStaker` | `uint256` | Basis points allocated to the MATE staker |

**Requirements:**
- Sum must equal exactly 10_000 basis points
- 1-day waiting period before acceptance

**Errors:**
- `InvalidBasisPoints()` - If sum does not equal 10_000
- `SenderIsNotAdmin()` - If caller is not admin

---

### acceptBasisPointsForReward

**Function Signature**: `acceptBasisPointsForReward()`

Finalizes the fee distribution change after the time delay.

**Access**: Admin only, within acceptance window

**Errors:**
- `ProposalNotReadyToAccept()` - If called before timelock expires

---

### rejectProposalBasisPointsForReward

**Function Signature**: `rejectProposalBasisPointsForReward()`

Cancels the pending fee distribution change proposal.

**Access**: Admin only

## Treasury Management

### proposeWithdrawal

**Function Signature**: `proposeWithdrawal(address tokenToWithdraw, uint256 amountToWithdraw)`

Proposes withdrawal of accumulated service fees.

**Access**: Admin only

**Input Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `tokenToWithdraw` | `address` | Address of the token to withdraw |
| `amountToWithdraw` | `uint256` | Amount of tokens to withdraw |

**Requirements:**
- `amountToWithdraw` must not be zero
- `amountToWithdraw` must not exceed `totalFeesCollected[tokenToWithdraw]`
- 1-day waiting period before execution

**Errors:**
- `IncorrectInput()` - If amountToWithdraw is zero
- `InsufficientAmount()` - If amount exceeds collected fees
- `SenderIsNotAdmin()` - If caller is not admin

---

### acceptWithdrawal

**Function Signature**: `acceptWithdrawal()`

Finalizes the withdrawal of accumulated fees after the time delay.

**Access**: Admin only, within acceptance window

**Process:**
1. Validates timelock has expired
2. Validates sufficient fees still available
3. Deducts amount from `totalFeesCollected`
4. Transfers tokens to admin via `makeCaPay()`
5. Clears withdrawal proposal state

**Errors:**
- `ProposalNotReadyToAccept()` - If called before timelock expires
- `InsufficientPayment()` - If fees no longer available

---

### rejectProposalWithdrawal

**Function Signature**: `rejectProposalWithdrawal()`

Cancels the pending withdrawal proposal.

**Access**: Admin only

## Security Features

### Time-Delayed Execution

All administrative changes follow a mandatory 1-day delay pattern:

1. **Proposal Phase**: Admin proposes changes
2. **Waiting Period**: 24-hour delay for transparency
3. **Execution Window**: Admin can accept once timelock expires
4. **Cancellation**: Admin can reject any pending proposal

### Access Control

- **Admin-Only Functions**: All administrative functions restricted to `admin.current` via `onlyAdmin` modifier
- **Proposal-Specific Access**: `acceptAdmin()` requires being the proposed admin
- **Time Window Validation**: All time-sensitive functions validate execution windows

### Validation Checks

- **Fee Balance**: Withdrawal amounts validated against `totalFeesCollected`
- **Percentage Validation**: Fee percentages must sum to exactly 10_000
- **Address Validation**: Non-zero address requirements where applicable

## Administrative Workflow Examples

### Changing Fee Structure

```solidity
// 1. Admin proposes new fee distribution (60% seller, 30% service, 10% stakers)
p2pSwap.proposeBasisPointsForReward(6000, 3000, 1000);

// 2. Wait 24 hours

// 3. Admin accepts the change
p2pSwap.acceptBasisPointsForReward();
```

### Changing Fee Rate

```solidity
// 1. Admin proposes new fee rate (3%)
p2pSwap.proposeBasisPercentageFee(300);

// 2. Wait 24 hours

// 3. Admin accepts the change
p2pSwap.acceptBasisPercentageFee();
```

### Treasury Withdrawal

```solidity
// 1. Admin proposes withdrawal of 100 USDC
p2pSwap.proposeWithdrawal(usdcAddress, 100000000);

// 2. Wait 24 hours

// 3. Admin executes withdrawal (tokens sent to admin address)
p2pSwap.acceptWithdrawal();
```

### Admin Transfer

```solidity
// 1. Current admin proposes new admin
p2pSwap.proposeAdmin(newAdminAddress);

// 2. New admin accepts within 24 hours
// (called by newAdminAddress)
p2pSwap.acceptAdmin();
```

## Emergency Procedures

### Proposal Cancellation

Any pending proposal can be cancelled by the admin:
- Admin proposals: Can be rejected by current admin via `rejectProposalAdmin()`
- Fee proposals: Can be rejected by admin via `rejectProposalBasisPercentageFee()`
- Reward proposals: Can be rejected by admin via `rejectProposalBasisPointsForReward()`
- Withdrawal proposals: Can be rejected by admin via `rejectProposalWithdrawal()`

### Time Window Management

- All proposals have exactly 24-hour acceptance windows
- Proposals can be cancelled and re-proposed at any time
- No emergency override mechanisms (by design)

The administrative system balances operational flexibility with security through mandatory delays, ensuring all stakeholders have visibility into proposed changes before they take effect.
