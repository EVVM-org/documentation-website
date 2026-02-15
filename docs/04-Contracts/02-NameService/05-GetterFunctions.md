---
sidebar_position: 5
---

# Getter Functions

:::info[Implementation Note]
Getter functions are **view functions** that do not modify state. They do NOT use Core.sol's signature verification system. References to "EVVM" in function names (e.g., `getEvvmAddress`) refer to the **Core.sol** contract address.
:::

This section documents the view functions available in the Name Service contract that allow querying system state, user information, pricing details, and administrative data. These functions are read-only and do not modify the blockchain state.

---

## Identity Verification Functions

### `verifyIfIdentityExists`

**Function Type**: `public view`  
**Function Signature**: `verifyIfIdentityExists(string memory _identity) returns (bool)`

Checks if an identity exists in the system, handling both pre-registrations and actual username registrations.

#### Parameters

| Parameter   | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| `_identity` | `string` | The identity/username to check           |

#### Returns

| Type   | Description                                    |
| ------ | ---------------------------------------------- |
| `bool` | `true` if the identity exists and is valid     |

### `strictVerifyIfIdentityExist`

**Function Type**: `public view`  
**Function Signature**: `strictVerifyIfIdentityExist(string memory _username) returns (bool)`

Strictly verifies if an identity exists and reverts if not found. This is a more strict version that reverts instead of returning false.

#### Parameters

| Parameter   | Type     | Description                 |
| ----------- | -------- | --------------------------- |
| `_username` | `string` | The username to verify      |

#### Returns

| Type   | Description                                           |
| ------ | ----------------------------------------------------- |
| `bool` | `true` if username exists (reverts if not found)     |

### `isUsernameAvailable`

**Function Type**: `public view`  
**Function Signature**: `isUsernameAvailable(string memory _username) returns (bool)`

Checks if a username is available for registration. A username is available if it was never registered or has been expired for 60+ days.

#### Parameters

| Parameter   | Type     | Description                                |
| ----------- | -------- | ------------------------------------------ |
| `_username` | `string` | The username to check availability for     |

#### Returns

| Type   | Description                                      |
| ------ | ------------------------------------------------ |
| `bool` | `true` if username is available for registration |

---

## Identity Information Functions

### `getOwnerOfIdentity`

**Function Type**: `public view`  
**Function Signature**: `getOwnerOfIdentity(string memory _username) returns (address)`

Returns the owner address of a registered identity.

#### Parameters

| Parameter   | Type     | Description             |
| ----------- | -------- | ----------------------- |
| `_username` | `string` | The username to query   |

#### Returns

| Type      | Description                      |
| --------- | -------------------------------- |
| `address` | Address of the username owner    |

### `verifyStrictAndGetOwnerOfIdentity`

**Function Type**: `public view`  
**Function Signature**: `verifyStrictAndGetOwnerOfIdentity(string memory _username) returns (address)`

Combines strict verification with owner lookup in one call. Reverts if username doesn't exist.

#### Parameters

| Parameter   | Type     | Description                           |
| ----------- | -------- | ------------------------------------- |
| `_username` | `string` | The username to verify and get owner  |

#### Returns

| Type      | Description                                    |
| --------- | ---------------------------------------------- |
| `address` | Owner address (reverts if username not found) |

### `getIdentityBasicMetadata`

**Function Type**: `public view`  
**Function Signature**: `getIdentityBasicMetadata(string memory _username) returns (address, uint256)`

Returns essential metadata for quick identity verification including owner and expiration date.

#### Parameters

| Parameter   | Type     | Description                        |
| ----------- | -------- | ---------------------------------- |
| `_username` | `string` | The username to get basic info for |

#### Returns

| Type                       | Description                         |
| -------------------------- | ----------------------------------- |
| `(address, uint256)`       | Owner address and expiration timestamp |

### `getExpireDateOfIdentity`

**Function Type**: `public view`  
**Function Signature**: `getExpireDateOfIdentity(string memory _identity) returns (uint256)`

Returns the timestamp when the username registration expires.

#### Parameters

| Parameter   | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `_identity` | `string` | The username to check expiration for |

#### Returns

| Type      | Description                                        |
| --------- | -------------------------------------------------- |
| `uint256` | Expiration timestamp in seconds since Unix epoch   |

---

## Custom Metadata Functions

### `getAmountOfCustomMetadata`

**Function Type**: `public view`  
**Function Signature**: `getAmountOfCustomMetadata(string memory _username) returns (uint256)`

Returns the count of metadata slots currently used by a username.

#### Parameters

| Parameter   | Type     | Description                      |
| ----------- | -------- | -------------------------------- |
| `_username` | `string` | The username to count metadata   |

#### Returns

| Type      | Description                           |
| --------- | ------------------------------------- |
| `uint256` | Number of custom metadata entries     |

### `getFullCustomMetadataOfIdentity`

**Function Type**: `public view`  
**Function Signature**: `getFullCustomMetadataOfIdentity(string memory _username) returns (string[] memory)`

Retrieves all custom metadata entries for a username as an array.

#### Parameters

| Parameter   | Type     | Description                     |
| ----------- | -------- | ------------------------------- |
| `_username` | `string` | The username to get metadata    |

#### Returns

| Type              | Description                            |
| ----------------- | -------------------------------------- |
| `string[] memory` | Array of all custom metadata strings   |

### `getSingleCustomMetadataOfIdentity`

**Function Type**: `public view`  
**Function Signature**: `getSingleCustomMetadataOfIdentity(string memory _username, uint256 _key) returns (string memory)`

Retrieves a specific custom metadata entry by index.

#### Parameters

| Parameter   | Type     | Description                           |
| ----------- | -------- | ------------------------------------- |
| `_username` | `string` | The username to get metadata from     |
| `_key`      | `uint256`| The index of the metadata entry       |

#### Returns

| Type            | Description                                 |
| --------------- | ------------------------------------------- |
| `string memory` | The metadata string at the specified index |

### `getCustomMetadataMaxSlotsOfIdentity`

**Function Type**: `public view`  
**Function Signature**: `getCustomMetadataMaxSlotsOfIdentity(string memory _username) returns (uint256)`

Returns the total capacity for custom metadata entries.

#### Parameters

| Parameter   | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| `_username` | `string` | The username to check metadata capacity  |

#### Returns

| Type      | Description                          |
| --------- | ------------------------------------ |
| `uint256` | Maximum number of metadata slots     |

---

## Marketplace Functions

### `getOffersOfUsername`

**Function Type**: `public view`  
**Function Signature**: `getOffersOfUsername(string memory _username) returns (OfferMetadata[] memory)`

Returns all offers made for a specific username, including both active and expired offers.

#### Parameters

| Parameter   | Type     | Description                     |
| ----------- | -------- | ------------------------------- |
| `_username` | `string` | The username to get offers for  |

#### Returns

| Type                      | Description                              |
| ------------------------- | ---------------------------------------- |
| `OfferMetadata[] memory`  | Array of all offer metadata structures  |

### `getSingleOfferOfUsername`

**Function Type**: `public view`  
**Function Signature**: `getSingleOfferOfUsername(string memory _username, uint256 _offerID) returns (OfferMetadata memory)`

Retrieves detailed information about a particular offer.

#### Parameters

| Parameter   | Type     | Description                      |
| ----------- | -------- | -------------------------------- |
| `_username` | `string` | The username to get offer from   |
| `_offerID`  | `uint256`| The ID/index of specific offer   |

#### Returns

| Type                    | Description                            |
| ----------------------- | -------------------------------------- |
| `OfferMetadata memory`  | The complete offer metadata structure  |

### `getLengthOfOffersUsername`

**Function Type**: `public view`  
**Function Signature**: `getLengthOfOffersUsername(string memory _username) returns (uint256)`

Counts the total number of offers made for a username.

#### Parameters

| Parameter   | Type     | Description                     |
| ----------- | -------- | ------------------------------- |
| `_username` | `string` | The username to count offers    |

#### Returns

| Type      | Description                              |
| --------- | ---------------------------------------- |
| `uint256` | Total number of offers that have been made |

---

## Pricing Functions

### `getPriceOfRegistration`

**Function Type**: `public view`  
**Function Signature**: `getPriceOfRegistration(string memory username) returns (uint256)`

Returns the price to register a specific username. Price is fully dynamic based on existing offers and timing:

- **No Offers**: Price is 100x current EVVM reward amount (standard rate)
- **Has Offers**: Price is calculated using `seePriceToRenew` function logic (market-based pricing)
  - Uses the same complex pricing algorithm as username renewal
  - Factors in active offers, market demand, and timing
  - Results in higher prices for in-demand usernames

#### Parameters

| Parameter  | Type     | Description                           |
| ---------- | -------- | ------------------------------------- |
| `username` | `string` | The username to get registration price for |

#### Returns

| Type      | Description                                     |
| --------- | ----------------------------------------------- |
| `uint256` | Current registration price in Principal Tokens  |

### `seePriceToRenew`

**Function Type**: `public view`  
**Function Signature**: `seePriceToRenew(string memory _identity) returns (uint256)`

Calculates the cost to renew a username registration. Pricing varies based on timing and market demand:

- Free if renewed before expiration (within grace period)
- Variable cost based on highest active offer (minimum 500 Principal Token)
- Fixed 500,000 Principal Token if renewed more than 1 year before expiration

#### Parameters

| Parameter   | Type     | Description                                 |
| ----------- | -------- | ------------------------------------------- |
| `_identity` | `string` | The username to calculate renewal price for |

#### Returns

| Type      | Description                                      |
| --------- | ------------------------------------------------ |
| `uint256` | Cost in Principal Tokens to renew the username  |

### `getPriceToAddCustomMetadata`

**Function Type**: `public view`  
**Function Signature**: `getPriceToAddCustomMetadata() returns (uint256)`

Returns the current price to add custom metadata to a username. Price is dynamic based on current EVVM reward amount (10x reward).

#### Returns

| Type      | Description                                      |
| --------- | ------------------------------------------------ |
| `uint256` | Cost in Principal Tokens (10x current reward)   |

### `getPriceToRemoveCustomMetadata`

**Function Type**: `public view**  
**Function Signature**: `getPriceToRemoveCustomMetadata() returns (uint256)`

Returns the current price to remove a single custom metadata entry.

#### Returns

| Type      | Description                                      |
| --------- | ------------------------------------------------ |
| `uint256` | Cost in Principal Tokens (10x current reward)   |

### `getPriceToFlushCustomMetadata`

**Function Type**: `public view`  
**Function Signature**: `getPriceToFlushCustomMetadata(string memory _identity) returns (uint256)`

Returns the cost to remove all custom metadata entries from a username. Cost scales with the number of metadata entries.

#### Parameters

| Parameter   | Type     | Description                        |
| ----------- | -------- | ---------------------------------- |
| `_identity` | `string` | The username to calculate cost for |

#### Returns

| Type      | Description                                               |
| --------- | --------------------------------------------------------- |
| `uint256` | Total cost (10x reward amount per metadata entry)        |

### `getPriceToFlushUsername`

**Function Type**: `public view`  
**Function Signature**: `getPriceToFlushUsername(string memory _identity) returns (uint256)`

Returns the cost to completely remove a username and all its data. Includes cost for metadata removal plus base deletion fee.

#### Parameters

| Parameter   | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| `_identity` | `string` | The username to calculate cost for   |

#### Returns

| Type      | Description                                                     |
| --------- | --------------------------------------------------------------- |
| `uint256` | Total cost (metadata flush cost + 1x reward amount)            |

---

## Nonce Management Functions

### `checkIfNameServiceNonceIsAvailable`

**Function Type**: `public view**  
**Function Signature**: `checkIfNameServiceNonceIsAvailable(address _user, uint256 _nonce) returns (bool)`

Checks if a nonce has been used by a specific user to prevent replay attacks.

#### Parameters

| Parameter | Type      | Description                    |
| --------- | --------- | ------------------------------ |
| `_user`   | `address` | Address of the user to check   |
| `_nonce`  | `uint256` | Nonce value to verify          |

#### Returns

| Type   | Description                                      |
| ------ | ------------------------------------------------ |
| `bool` | `true` if nonce used, `false` if still available |

---

## Administrative Getter Functions

### `getAdmin`

**Function Type**: `public view`  
**Function Signature**: `getAdmin() returns (address)`

Returns the current admin address with administrative privileges.

#### Returns

| Type      | Description                    |
| --------- | ------------------------------ |
| `address` | The current admin address      |

### `getAdminFullDetails`

**Function Type**: `public view`  
**Function Signature**: `getAdminFullDetails() returns (address, address, uint256)`

Returns complete admin information including pending proposals.

#### Returns

| Type                              | Description                                    |
| --------------------------------- | ---------------------------------------------- |
| `(address, address, uint256)`     | Current admin, proposed admin, acceptance time |

### `getProposedWithdrawAmountFullDetails`

**Function Type**: `public view`  
**Function Signature**: `getProposedWithdrawAmountFullDetails() returns (uint256, uint256)`

Returns information about pending token withdrawal proposals.

#### Returns

| Type                    | Description                                            |
| ----------------------- | ------------------------------------------------------ |
| `(uint256, uint256)`    | Proposed withdrawal amount and acceptance deadline     |

### `getEvvmAddress`

**Function Type**: `public view`  
**Function Signature**: `getEvvmAddress() returns (address)`

Returns the address of the EVVM contract used for payment processing.

#### Returns

| Type      | Description                         |
| --------- | ----------------------------------- |
| `address` | The current EVVM contract address   |

### `getEvvmAddressFullDetails`

**Function Type**: `public view`  
**Function Signature**: `getEvvmAddressFullDetails() returns (address, address, uint256)`

Returns complete EVVM address information including pending proposals.

#### Returns

| Type                              | Description                                           |
| --------------------------------- | ----------------------------------------------------- |
| `(address, address, uint256)`     | Current EVVM address, proposed address, acceptance time |

---

## Utility Functions

### `hashUsername`

**Function Type**: `public pure`  
**Function Signature**: `hashUsername(string memory _username, uint256 _randomNumber) returns (bytes32)`

Creates a hash of username and random number for pre-registration using the commit-reveal scheme to prevent front-running attacks.

#### Parameters

| Parameter       | Type     | Description                      |
| --------------- | -------- | -------------------------------- |
| `_username`     | `string` | The username to hash             |
| `_randomNumber` | `uint256`| Random number to add entropy     |

#### Returns

| Type      | Description                               |
| --------- | ----------------------------------------- |
| `bytes32` | Hash of the username and random number    |

---

## Data Validation Functions

These functions validate input data formats according to system rules and standards.

### Username Validation

**Function**: `isValidUsername(string memory username)` (internal pure)

Validates username format according to system rules:
- Must be at least 4 characters
- Must start with a letter
- Can only contain letters and digits

### Email Validation

**Function**: `isValidEmail(string memory _email)` (internal pure) 

Validates email address format:
- Checks for proper structure: prefix(3+ chars) + @ + domain(3+ chars) + . + TLD(2+ chars)
- Ensures valid characters in each section
- Returns `true` for valid format

### Phone Number Validation

**Function**: `isValidPhoneNumberNumber(string memory _phoneNumber)` (internal pure)

Validates phone number format:
- Must be 6-19 digits only
- No special characters or letters allowed
- Returns `true` for valid format

:::note Internal Functions
The validation functions are marked as `internal` and are used by other contract functions for input validation. They are not directly callable from external contracts or users.
:::