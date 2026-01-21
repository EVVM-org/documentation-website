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
  - `user` (HexString, optional): User address. Defaults to signer's address.
  - `username` (string): The username for which the offer is being made.
  - `expireDate` (bigint): Offer expiration timestamp.
  - `amount` (bigint): Offer amount.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IMakeOfferData>>`

### `withdrawOffer`

Creates and signs a `withdrawOffer` action.

- **Parameters:**
  - `user` (HexString, optional): User address. Defaults to signer's address.
  - `username` (string): The username associated with the offer.
  - `offerID` (bigint): The ID of the offer to withdraw.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IWithdrawOfferData>>`

### `acceptOffer`

Creates and signs an `acceptOffer` action.

- **Parameters:**
  - `user` (HexString, optional): User address.
  - `username` (string): The username for which to accept an offer.
  - `offerID` (bigint): The ID of the offer to accept.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IAcceptOfferData>>`

### `preRegistrationUsername`

Creates and signs a `preRegistrationUsername` action with a hashed username.

- **Parameters:**
  - `user` (HexString, optional): User address.
  - `hashPreRegisteredUsername` (string): The hashed username to pre-register.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IPreRegistrationUsernameData>>`

### `registrationUsername`

Creates and signs a `registrationUsername` action.

- **Parameters:**
  - `user` (HexString, optional): User address.
  - `username` (string): The username to register.
  - `clowNumber` (bigint): A random number for hash calculation.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IRegistrationUsernameData>>`

### `addCustomMetadata`

Creates and signs an `addCustomMetadata` action for an identity.

- **Parameters:**
  - `user` (HexString, optional): User address.
  - `identity` (string): The identity to which metadata will be added.
  - `value` (string): The metadata value.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IAddCustomMetadataData>>`

### `removeCustomMetadata`

Creates and signs a `removeCustomMetadata` action.

- **Parameters:**
  - `user` (HexString, optional): User address.
  - `identity` (string): The identity from which to remove metadata.
  - `key` (bigint): The key of the metadata to remove.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IRemoveCustomMetadataData>>`

### `flushCustomMetadata`

Creates and signs a `flushCustomMetadata` action.

- **Parameters:**
  - `user` (HexString, optional): User address.
  - `identity` (string): The identity whose metadata will be flushed.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IFlushCustomMetadataData>>`

### `flushUsername`

Creates and signs a `flushUsername` action.

- **Parameters:**
  - `user` (HexString, optional): User address.
  - `username` (string): The username to flush.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IFlushUsernameData>>`

### `renewUsername`

Creates and signs a `renewUsername` action.

- **Parameters:**
  - `user` (HexString, optional): User address.
  - `username` (string): The username to renew.
  - `nonce` (bigint): NameService nonce.
  - `evvmSignedAction` (`SignedAction<IPayData>`, optional): EVVM signed `pay` action.
- **Returns:** `Promise<SignedAction<IRenewUsernameData>>`
