---
sidebar_position: 5
---

# makePay

**Function Type**: `internal`

The `makePay` function facilitates payment processing through the EVVM contract, directing transactions to either synchronous or asynchronous processing paths based on specified parameters.

## Parameters

| Parameter      | Type    | Description                                          |
| -------------- | ------- | ---------------------------------------------------- |
| `user`         | address | User address for the payment transaction             |
| `amount`       | uint256 | Amount of tokens involved in the transaction         |
| `priorityFee`  | uint256 | EVVM priority fee for transaction processing         |
| `priorityFlag` | bool    | EVVM execution mode (`true` = async, `false` = sync) |
| `nonce`        | uint256 | EVVM payment operation nonce for replay protection   |
| `signature`    | bytes   | EVVM payment authorization signature                 |

## Workflow

1. **Payment Processing**: Uses the unified `pay` function for both synchronous and asynchronous processing
2. **Payment Execution**: Forwards parameters to the EVVM contract's `pay` function for payment processing and automatic staker detection
   - The `pay` function receives: user address, contract address, empty string, PRINCIPAL_TOKEN_ADDRESS, amount, priorityFee, nonce, priorityFlag, contract address, and signature

## Description

This internal function serves as a standardized interface for EVVM payment operations, utilizing the unified `pay` function which automatically handles staker detection and reward distribution. It simplifies the interface between the staking contract and the EVVM payment system.

:::note
The EVVM payment signature follows the [Single Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).
:::
