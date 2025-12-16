---
title: Admin Functions
description: "Detailed documentation of the Name Service Contract's administrative functions for managing admin role transfers, fee withdrawals, and EVVM contract address updates."
sidebar_position: 4
---

# Admin Functions

This section details the administrative functions available in the Name Service contract, which are restricted to the current admin address. These functions facilitate the secure transfer of the admin role, the withdrawal of collected protocol fees, and the updating of core contract dependencies like the EVVM address.

---

## Admin Role Transfer Process

The admin role is transferred using a secure, time-locked, two-step process to prevent immediate or malicious takeovers. This involves a proposal by the current admin and acceptance by the nominated successor after a mandatory waiting period.

### `proposeAdmin`

**Function Type**: `public` (`onlyAdmin`)
**Function Signature**: `proposeAdmin(address _adminToPropose)`

Initiates the admin role transfer process by nominating a new address as the proposed admin. This can only be called by the current admin. The function validates that the proposed admin is not the zero address and is different from the current admin.

#### Parameters

| Parameter        | Type    | Description                                 |
| ---------------- | ------- | ------------------------------------------- |
| `_adminToPropose` | `address` | The address of the nominated new admin.     |

### `cancelProposeAdmin`

**Function Type**: `public` (`onlyAdmin`)
**Function Signature**: `cancelProposeAdmin()`

Allows the **current admin** to cancel a pending admin change proposal before it has been accepted, immediately revoking the nomination.

### `acceptProposeAdmin`

**Function Type**: `public`
**Function Signature**: `acceptProposeAdmin()`

Allows the **proposed admin** to claim the admin role after the mandatory waiting period (1 day) has passed. This function can only be successfully called by the proposed admin address.

### Complete Workflow

1.  **Proposal Initiation**: The current admin calls `proposeAdmin(newAdminAddress)` to nominate a successor. The function validates that the new address is not zero and is different from the current admin. A proposal timestamp is recorded with a 1-day waiting period (`block.timestamp + 1 days`).
2.  **Proposal Cancellation (Optional)**: At any point before the role is accepted, the **current admin** can call `cancelProposeAdmin` to nullify the pending proposal by resetting the proposal address and time.
3.  **Role Acceptance**: The **proposed admin** must wait for the mandatory 1-day period to elapse after the proposal timestamp. After the waiting period is over, the proposed admin calls `acceptProposeAdmin`. The function verifies that the `msg.sender` is the proposed admin and that the waiting period has passed. Upon success, the admin role is transferred to the new address and the proposal data is reset.

---

## Fee Withdrawal Process

The withdrawal of collected protocol fees also follows a secure, time-locked, two-step proposal process to ensure transparency and prevent immediate fund drainage.

### `proposeWithdrawPrincipalTokens`

**Function Type**: `public` (`onlyAdmin`)
**Function Signature**: `proposeWithdrawPrincipalTokens(uint256 _amount)`

Initiates the withdrawal process by proposing an amount of principal tokens to be withdrawn from the contract's collected fees. The function validates that sufficient funds are available after reserving amounts for operations and locked offers.

:::note Withdrawable Amount Calculation
The `_amount` can **only** be from the fees collected by the contract. The calculation ensures sufficient funds remain by subtracting:
- **5083**: Reserved amount for operations
- **Current reward amount**: Buffer for reward payments
- **Locked offer funds**: `principalTokenTokenLockedForWithdrawOffers` reserved for active offers

Formula: `Available = Total Balance - (5083 + Reward Amount + Locked Offers)`
:::

#### Parameters

| Parameter | Type      | Description                                |
| --------- | --------- | ------------------------------------------ |
| `_amount` | `uint256` | The amount of principal tokens to be withdrawn. |

### `cancelWithdrawPrincipalTokens`

**Function Type**: `public` (`onlyAdmin`)
**Function Signature**: `cancelWithdrawPrincipalTokens()`

Allows the current admin to cancel a pending fee withdrawal proposal before it has been claimed.

### `claimWithdrawPrincipalTokens`

**Function Type**: `public` (`onlyAdmin`)
**Function Signature**: `claimWithdrawPrincipalTokens()`

Allows the admin to execute the proposed withdrawal of principal tokens after the mandatory waiting period (1 day) has passed.

### Complete Workflow

1.  **Proposal Initiation**: The current admin calls `proposeWithdrawPrincipalTokens(_amount)`. The function validates that the proposed `_amount` is available after subtracting reserved funds (5083 + reward amount + locked offers) and is greater than zero. A proposal timestamp is recorded with a 1-day waiting period (`block.timestamp + 1 days`).
2.  **Proposal Cancellation (Optional)**: At any point before the withdrawal is claimed, the **current admin** can call `cancelWithdrawPrincipalTokens` to nullify the proposal by resetting the amount and time.
3.  **Withdrawal Confirmation**: The admin must wait for the mandatory 1-day period to elapse after the proposal timestamp. After the waiting period is over, the admin calls `claimWithdrawPrincipalTokens`. The function verifies that the waiting period has passed. Upon success, it transfers the proposed amount of principal tokens to the admin's address using `makeCaPay`, then resets the proposal data.

---

## Change EVVM Contract Address Process

This two-step, time-locked process allows the admin to safely update the address of the core EVVM contract dependency, ensuring the NameService contract can adapt to future infrastructure changes.

### `proposeChangeEVVMContractAddress`

**Function Type**: `public` (`onlyAdmin`)
**Function Signature**: `proposeChangeEvvmAddress(address _newEvvmAddress)`

Initiates the process to change the EVVM contract address by proposing a new address. The function validates that the new address is not the zero address.

#### Parameters
| Parameter                 | Type    | Description                                   |
| ------------------------- | ------- | --------------------------------------------- |
| `_newEvvmAddress` | `address` | The address of the new EVVM contract to be set. |

### `cancelChangeEvvmAddress`

**Function Type**: `public` (`onlyAdmin`)
**Function Signature**: `cancelChangeEvvmAddress()`

Allows the current admin to cancel a pending EVVM contract address change proposal before it has been finalized.

### `acceptChangeEvvmAddress`

**Function Type**: `public` (`onlyAdmin`)
**Function Signature**: `acceptChangeEvvmAddress()`

Allows the **current admin** to finalize the change and set the new EVVM contract address after the mandatory waiting period (1 day) has passed.

### Complete Workflow

1.  **Proposal Initiation**: The current admin calls `proposeChangeEvvmAddress(newEVVMAddress)` to nominate a new EVVM contract address. The function validates that the address is not zero. A proposal timestamp is recorded with a 1-day waiting period (`block.timestamp + 1 days`).
2.  **Proposal Cancellation (Optional)**: At any point before the new address is accepted, the **current admin** can call `cancelChangeEvvmAddress` to nullify the pending proposal by resetting the address and time.
3.  **Address Acceptance**: The **current admin** must wait for the mandatory 1-day period to elapse after the proposal timestamp. After the waiting period is over, the admin calls `acceptChangeEvvmAddress`. The function verifies that the waiting period has passed. Upon success, the EVVM contract address is updated to the new address and the proposal data is reset.

---