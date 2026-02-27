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
  - `tokenA` (HexString): Address of Token A.
  - `tokenB` (HexString): Address of Token B.
  - `amountA` (bigint): Amount of Token A to be swapped.
  - `amountB` (bigint): Amount of Token B to be received.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`): The underlying EVVM `pay` signed action (used to pay fees).
- **Returns:** ``Promise<SignedAction<IMakeOrderData>>``

## `cancelOrder`

Creates and signs a `cancelOrder` action.

- **Parameters:**
  - `nonce` (bigint): Order nonce.
  - `tokenA` (HexString): Address of Token A.
  - `tokenB` (HexString): Address of Token B.
  - `orderId` (bigint): The ID of the order to be cancelled.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): An optional EVVM `pay` signed action.
- **Returns:** ``Promise<SignedAction<ICancelOrderData>>``

## `dispatchOrder_fillPropotionalFee`

Creates and signs a `dispatchOrder` action with a proportional fee.

- **Parameters:**
  - `nonce` (bigint): Order nonce.
  - `tokenA` (HexString): Address of Token A.
  - `tokenB` (HexString): Address of Token B.
  - `orderId` (bigint): The ID of the order to be dispatched.
  - `amountOfTokenBToFill` (bigint): The amount of Token B to fill.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`): The underlying EVVM `pay` signed action.
- **Returns:** ``Promise<SignedAction<IDispatchOrderData>>``

## `dispatchOrder_fillFixedFee`

Creates and signs a `dispatchOrder` action with a fixed fee.

- **Parameters:**
  - `nonce` (bigint): Order nonce.
  - `tokenA` (HexString): Address of Token A.
  - `tokenB` (HexString): Address of Token B.
  - `orderId` (bigint): The ID of the order to be dispatched.
  - `amountOfTokenBToFill` (bigint): The amount of Token B to fill.
  - `maxFillFixedFee` (bigint): The maximum fixed fee for filling the order.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`): The underlying EVVM `pay` signed action.
- **Returns:** ``Promise<SignedAction<IDispatchOrderFixedFeeData>>``
