---
title: "P2PSwap Service"
description: "Documentation for the P2PSwap service in evvm-js."
sidebar_position: 4
---

# P2PSwap Service

The `P2PSwap` service provides helpers for creating signed actions related to peer-to-peer swaps.

## `makeOrder`

Creates and signs a `makeOrder` action for a peer-to-peer swap.

- **Parameters:**
  - `nonce` (bigint): Order nonce.
  - `tokenA` (HexString): Address of token A (offered by seller).
  - `tokenB` (HexString): Address of token B (requested by seller).
  - `amountA` (bigint): Amount of tokenA to be offered.
  - `amountB` (bigint): Amount of tokenB expected in return.
  - `senderExecutor` (HexString, optional): Optional sender executor address (defaults to zero address).
  - `originExecutor` (HexString, optional): Optional origin executor address (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`): The underlying EVVM `pay` signed action (used to lock tokenA).
- **Returns:** ``Promise<SignedAction<IMakeOrderData>>``

## `cancelOrder`

Creates and signs a `cancelOrder` action.

- **Parameters:**
  - `nonce` (bigint): Order nonce.
  - `tokenA` (HexString): Address of token A (offered by seller).
  - `tokenB` (HexString): Address of token B (requested by seller).
  - `orderId` (bigint): The ID of the order to be cancelled.
  - `senderExecutor` (HexString, optional): Optional sender executor address (defaults to zero address).
  - `originExecutor` (HexString, optional): Optional origin executor address (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): An optional EVVM `pay` signed action (for priority fee).
- **Returns:** ``Promise<SignedAction<ICancelOrderData>>``

## `dispatchOrder`

Creates and signs a `dispatchOrder` action for filling an existing order.

- **Parameters:**
  - `nonce` (bigint): Order nonce.
  - `tokenA` (HexString): Address of token A (offered by seller, buyer receives).
  - `tokenB` (HexString): Address of token B (requested by seller, buyer pays).
  - `orderId` (bigint): The ID of the order to be dispatched.
  - `amountOut` (bigint): Amount of tokenA the buyer wants to receive.
  - `amountInMax` (bigint): Maximum amount of tokenB the buyer is willing to pay (including fee).
  - `senderExecutor` (HexString, optional): Optional sender executor address (defaults to zero address).
  - `originExecutor` (HexString, optional): Optional origin executor address (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`): The underlying EVVM `pay` signed action (to lock tokenB + fee).
- **Returns:** ``Promise<SignedAction<IDispatchOrderData>>``
