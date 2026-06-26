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
  - `offeredToken` (HexString): Address of the token being offered.
  - `requestedToken` (HexString): Address of the token being requested.
  - `offeredAmount` (bigint): Amount of offeredToken to be swapped.
  - `requestedAmount` (bigint): Amount of requestedToken expected in return.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`): The underlying EVVM `pay` signed action (used to lock offeredToken).
- **Returns:** ``Promise<SignedAction<IMakeOrderData>>``

## `cancelOrder`

Creates and signs a `cancelOrder` action.

- **Parameters:**
  - `nonce` (bigint): Order nonce.
  - `offeredToken` (HexString): Address of the token that was offered.
  - `requestedToken` (HexString): Address of the token that was requested.
  - `orderId` (bigint): The ID of the order to be cancelled.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): An optional EVVM `pay` signed action (for priority fee).
- **Returns:** ``Promise<SignedAction<ICancelOrderData>>``

## `dispatchOrder`

Creates and signs a `dispatchOrder` action for filling an existing order.

- **Parameters:**
  - `nonce` (bigint): Order nonce.
  - `offeredToken` (HexString): Address of the token offered by seller (buyer receives).
  - `requestedToken` (HexString): Address of the token requested by seller (buyer pays).
  - `orderId` (bigint): The ID of the order to be dispatched.
  - `amountOut` (bigint): Amount of offeredToken the buyer wants to receive.
  - `amountInMax` (bigint): Maximum amount of requestedToken the buyer is willing to pay (including fee).
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`): The underlying EVVM `pay` signed action (to lock requestedToken + fee).
- **Returns:** ``Promise<SignedAction<IDispatchOrderData>>``
