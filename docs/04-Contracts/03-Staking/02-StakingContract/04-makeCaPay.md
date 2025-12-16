---
sidebar_position: 4
---

# makeCaPay

**Function Type**: `internal`

The `makeCaPay` function provides a streamlined interface for contract-to-contract payment operations through the EVVM contract's `caPay` function.

## Parameters

| Parameter      | Type    | Description                                     |
| -------------- | ------- | ----------------------------------------------- |
| `tokenAddress` | address | Address of the token contract to be transferred |
| `user`         | address | Recipient address for the payment               |
| `amount`       | uint256 | Amount of tokens to transfer                    |

## Workflow

1. **Direct Payment Execution**: Calls the EVVM contract's `caPay` function with the provided parameters in the order: user, tokenAddress, amount

## Description

This internal function serves as a simple wrapper around the EVVM contract's `caPay` function, providing a consistent interface for contract-to-contract token transfers. It is commonly used for:

- Priority fee distributions to transaction executors
- Reward distributions to stakers
- Token withdrawals during unstaking operations
- Service fee payments

:::info
This function uses the EVVM contract's direct payment mechanism, which does not require signatures since it's executed directly by the staking contract itself.
:::
