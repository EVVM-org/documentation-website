---
title: "NameService"
description: "Documentation for the NameService in evvm-js."
sidebar_position: 2
---

# NameService

The `NameService` class helps with identity creation and management.

## Methods

### `makeOffer`

Creates and signs a `makeOffer` action for a username.

- **Parameters:**
  - `username` (string): The username for which the offer is being made.
  - `expirationDate` (bigint): Offer expiration timestamp.
  - `amount` (bigint): Offer amount.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IMakeOfferData>>`

> Note: the action is signed by the provided `signer` — there is no `user` parameter; the `user` field in the resulting `SignedAction` will be the signer's address.

### `withdrawOffer`

Creates and signs a `withdrawOffer` action.

- **Parameters:**
  - `username` (string): The username associated with the offer.
  - `offerID` (bigint): The ID of the offer to withdraw.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IWithdrawOfferData>>`

### `acceptOffer`

Creates and signs an `acceptOffer` action.

- **Parameters:**
  - `username` (string): The username for which to accept an offer.
  - `offerID` (bigint): The ID of the offer to accept.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IAcceptOfferData>>`

### `preRegistrationUsername`

Creates and signs a `preRegistrationUsername` action with a hashed username.

- **Parameters:**
  - `hashPreRegisteredUsername` (string): The hashed username to pre-register.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IPreRegistrationUsernameData>>`

### `registrationUsername`

Creates and signs a `registrationUsername` action.

- **Parameters:**
  - `username` (string): The username to register.
  - `lockNumber` (bigint): A random lock number used for the pre-registration hash (named `lockNumber` in the API).
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IRegistrationUsernameData>>`

### `addCustomMetadata`

Creates and signs an `addCustomMetadata` action for an identity.

- **Parameters:**
  - `identity` (string): The identity to which metadata will be added.
  - `value` (string): The metadata value.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IAddCustomMetadataData>>`

### `removeCustomMetadata`

Creates and signs a `removeCustomMetadata` action.

- **Parameters:**
  - `identity` (string): The identity from which to remove metadata.
  - `key` (bigint): The key of the metadata to remove.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IRemoveCustomMetadataData>>`

### `flushCustomMetadata`

Creates and signs a `flushCustomMetadata` action.

- **Parameters:**
  - `identity` (string): The identity whose metadata will be flushed.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IFlushCustomMetadataData>>`

### `flushUsername`

Creates and signs a `flushUsername` action.

- **Parameters:**
  - `username` (string): The username to flush.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IFlushUsernameData>>`

### `renewUsername`

Creates and signs a `renewUsername` action.

- **Parameters:**
  - `username` (string): The username to renew.
  - `nonce` (bigint): NameService nonce.
  - `originExecutor` (HexString, optional): Optional executor address included in the signed message (defaults to zero address).
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): Optional EVVM `pay` signed action used to pay fees.
- **Returns:** `Promise<SignedAction<IRenewUsernameData>>`
