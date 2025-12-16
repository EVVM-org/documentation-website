---
title: "Administrative Functions"
description: "Comprehensive documentation of P2P Swap Contract's administrative and governance functions."
sidebar_position: 4
---

# Administrative Functions

The P2P Swap Contract implements a comprehensive administrative system with time-delayed governance, secure owner management, and flexible configuration options. All administrative changes follow a proposal-acceptance pattern with mandatory waiting periods for security.

## Owner Management

### proposeOwner

**Function Signature**: `proposeOwner(address _owner)`

Proposes a new contract owner with a 1-day acceptance window.

**Access**: Current owner only  
**Parameters:**
- `_owner` (address): Address of the proposed new owner

**Process:**
1. Sets `owner_proposal` to the new address
2. Sets `owner_timeToAccept` to `block.timestamp + 1 days`
3. Proposed owner has 24 hours to accept

### acceptOwner

**Function Signature**: `acceptOwner()`

Accepts the owner proposal and transfers ownership.

**Access**: Proposed owner only, within acceptance window  
**Requirements:**
- Must be called by the proposed owner
- Must be within the 1-day acceptance window

**Process:**
1. Transfers ownership to the proposed owner
2. Clears the proposal state

### rejectProposeOwner

**Function Signature**: `rejectProposeOwner()`

Rejects the owner proposal.

**Access**: Proposed owner only, within acceptance window  
**Process:**
1. Clears the owner proposal
2. Cancels the ownership transfer

## Fee Configuration Management

### Proportional Fee Management

#### proposeFillPropotionalPercentage

**Function Signature**: `proposeFillPropotionalPercentage(uint256 _seller, uint256 _service, uint256 _mateStaker)`

Proposes new fee distribution percentages for proportional fee model.

**Access**: Owner only  
**Parameters:**
- `_seller` (uint256): Percentage for sellers (basis points)
- `_service` (uint256): Percentage for service treasury (basis points)
- `_mateStaker` (uint256): Percentage for MATE stakers (basis points)

**Requirements:**
- Total must equal 10,000 (100%)
- 1-day waiting period before acceptance

#### acceptFillPropotionalPercentage

**Function Signature**: `acceptFillPropotionalPercentage()`

Accepts the proposed proportional fee distribution.

**Access**: Owner only, within acceptance window

#### rejectProposeFillPropotionalPercentage

**Function Signature**: `rejectProposeFillPropotionalPercentage()`

Rejects the proposed proportional fee distribution.

**Access**: Owner only, within acceptance window

### Fixed Fee Management

#### proposeFillFixedPercentage

**Function Signature**: `proposeFillFixedPercentage(uint256 _seller, uint256 _service, uint256 _mateStaker)`

Proposes new fee distribution percentages for fixed fee model.

**Access**: Owner only  
**Parameters:** Same as proportional fee management  
**Requirements:** Same validation rules apply

#### acceptFillFixedPercentage / rejectProposeFillFixedPercentage

Similar pattern to proportional fee management functions.

### Base Fee Rate Management

#### proposePercentageFee

**Function Signature**: `proposePercentageFee(uint256 _percentageFee)`

Proposes a new base percentage fee rate.

**Access**: Owner only  
**Parameters:**
- `_percentageFee` (uint256): New fee percentage in basis points (e.g., 500 = 5%)

#### acceptPercentageFee / rejectProposePercentageFee

Standard proposal-acceptance pattern with 1-day delay.

### Fixed Fee Limit Management

#### proposeMaxLimitFillFixedFee

**Function Signature**: `proposeMaxLimitFillFixedFee(uint256 _maxLimitFillFixedFee)`

Proposes a new maximum limit for fixed fees.

**Access**: Owner only  
**Parameters:**
- `_maxLimitFillFixedFee` (uint256): New maximum fee limit in token units

#### acceptMaxLimitFillFixedFee / rejectProposeMaxLimitFillFixedFee

Standard proposal-acceptance pattern with 1-day delay.

## Treasury Management

### proposeWithdrawal

**Function Signature**: `proposeWithdrawal(address _tokenToWithdraw, uint256 _amountToWithdraw, address _to)`

Proposes withdrawal of accumulated fees from the contract treasury.

**Access**: Owner only  
**Parameters:**
- `_tokenToWithdraw` (address): Token to withdraw
- `_amountToWithdraw` (uint256): Amount to withdraw
- `_to` (address): Recipient address

**Requirements:**
- Amount must not exceed contract balance for the token
- 1-day waiting period before execution

### acceptWithdrawal

**Function Signature**: `acceptWithdrawal()`

Executes the proposed withdrawal.

**Access**: Owner only, within acceptance window  
**Process:**
1. Transfers tokens to the specified recipient
2. Updates contract balance tracking
3. Clears withdrawal proposal state

### rejectProposeWithdrawal

**Function Signature**: `rejectProposeWithdrawal()`

Cancels the proposed withdrawal.

**Access**: Owner only, within acceptance window

## Staking Management

### stake

**Function Signature**: `stake(uint256 amount)`

Stakes MATE tokens on behalf of the contract.

**Access**: Owner only  
**Parameters:**
- `amount` (uint256): Number of staking tokens to purchase

**Requirements:**
- Contract must have sufficient MATE token balance
- Uses current staking price from Staking contract

**Process:**
1. Calculates required MATE tokens (amount × staking price)
2. Calls internal `_makeStakeService` function
3. Contract becomes a service staker

### unstake

**Function Signature**: `unstake(uint256 amount)`

Unstakes MATE tokens from the contract's staking position.

**Access**: Owner only  
**Parameters:**
- `amount` (uint256): Number of staking tokens to unstake

**Process:**
1. Calls internal `_makeUnstakeService` function
2. Follows standard unstaking procedures and timelock

## Balance Management

### addBalance

**Function Signature**: `addBalance(address _token, uint256 _amount)`

Manually adjusts contract balance tracking for a specific token.

**Access**: Owner only  
**Parameters:**
- `_token` (address): Token address
- `_amount` (uint256): Amount to add to balance tracking

**Use Cases:**
- Correcting balance discrepancies
- Accounting for direct token transfers
- Administrative balance adjustments

## Security Features

### Time-Delayed Execution

All administrative changes follow a mandatory 1-day delay pattern:

1. **Proposal Phase**: Owner proposes changes
2. **Waiting Period**: 24-hour delay for transparency
3. **Execution Window**: Limited time to accept or reject
4. **Automatic Expiry**: Proposals expire if not acted upon

### Access Control

- **Owner-Only Functions**: Most administrative functions restricted to contract owner
- **Proposal-Specific Access**: Some functions require being the proposed party
- **Time Window Validation**: All time-sensitive functions validate execution windows

### Validation Checks

- **Balance Verification**: Withdrawal amounts validated against actual balances
- **Percentage Validation**: Fee percentages must sum to exactly 100%
- **Address Validation**: Non-zero address requirements where applicable

## Administrative Workflow Examples

### Changing Fee Structure

```solidity
// 1. Owner proposes new fee distribution (60% seller, 30% service, 10% stakers)
p2pSwap.proposeFillPropotionalPercentage(6000, 3000, 1000);

// 2. Wait 24 hours

// 3. Owner accepts the change
p2pSwap.acceptFillPropotionalPercentage();
```

### Treasury Withdrawal

```solidity
// 1. Owner proposes withdrawal of 100 USDC to treasury address
p2pSwap.proposeWithdrawal(usdcAddress, 100000000, treasuryAddress);

// 2. Wait 24 hours

// 3. Owner executes withdrawal
p2pSwap.acceptWithdrawal();
```

### Owner Transfer

```solidity
// 1. Current owner proposes new owner
p2pSwap.proposeOwner(newOwnerAddress);

// 2. New owner accepts within 24 hours
// (called by newOwnerAddress)
p2pSwap.acceptOwner();
```

## Emergency Procedures

### Proposal Cancellation

Any pending proposal can be cancelled by the appropriate party:
- Owner proposals: Can be rejected by proposed owner
- Administrative proposals: Can be rejected by current owner

### Time Window Management

- All proposals have exactly 24-hour acceptance windows
- Expired proposals must be re-proposed
- No emergency override mechanisms (by design)

The administrative system balances operational flexibility with security through mandatory delays, ensuring all stakeholders have visibility into proposed changes before they take effect.
