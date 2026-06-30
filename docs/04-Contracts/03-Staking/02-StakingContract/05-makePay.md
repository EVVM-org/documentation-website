---
title: "requestPay"
description: "Internal function facilitating payment processing through EVVM with automatic routing to synchronous or asynchronous execution paths"
sidebar_position: 5
---

# requestPay

**Function Type**: `internal`

The `requestPay` function facilitates payment processing through the EVVM contract, directing transactions to either synchronous or asynchronous processing paths based on specified parameters.

## Parameters

| Parameter        | Type    | Description                                          |
| ---------------- | ------- | ---------------------------------------------------- |
| `user`           | address | User address for the payment transaction             |
| `amount`         | uint256 | Amount of tokens involved in the transaction         |
| `priorityFee`    | uint256 | EVVM priority fee for transaction processing         |
| `originExecutor` | address | EOA that will execute the transaction (verified with tx.origin) |
| `nonce`          | uint256 | EVVM payment operation nonce for replay protection   |
| `isAsyncExec`    | bool    | EVVM execution mode (`true` = async, `false` = sync) |
| `signature`      | bytes   | EVVM payment authorization signature                 |

## Workflow

1. **Payment Processing**: Uses the unified `pay` function for both synchronous and asynchronous processing
2. **Payment Execution**: Forwards parameters to the EVVM contract's `pay` function for payment processing and automatic staker detection
   - The `pay` function receives: user address, contract address, empty string, PRINCIPAL_TOKEN_ADDRESS, amount, priorityFee, contract address, originExecutor, nonce, isAsyncExec, and signature

## Description

This internal function serves as a standardized interface for EVVM payment operations, utilizing the unified `pay` function which automatically handles staker detection and reward distribution. It simplifies the interface between the staking contract and the EVVM payment system.

:::note
The EVVM payment signature follows the [Single Payment Signature Structure](../../../05-SignatureStructures/01-EVVM/01-SinglePaymentSignatureStructure.md).
:::
