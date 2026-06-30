---
title: "IdentityValidation Library"
description: "Byte-level validation for usernames, phone numbers, and emails in NameService"
sidebar_position: 3
---

# IdentityValidation Library

The `IdentityValidation` library provides gas-optimized byte-level validation for usernames, phone numbers, and emails used by the NameService contract.

## Overview

**Library Type**: Pure functions
**License**: EVVM-NONCOMMERCIAL-1.0
**Import Path**: `@evvm/testnet-contracts/library/nameService/lib/IdentityValidation.sol`
**Solidity Version**: `^0.8.0`

### Key Features

- **Username validation**: 4+ characters, starts with letter, alphanumeric only
- **Phone number validation**: Digit-only format checks
- **Email validation**: Structural prefix@domain.tld validation
- **Gas-optimized**: Byte-level operations with minimal overhead

## Functions

### `isValidUsername`

**Function Type**: `internal pure`
**Function Signature**: `isValidUsername(string memory username) returns (bool)`

Validates a username against EVVM naming rules.

#### Parameters

| Parameter  | Type     | Description          |
| ---------- | -------- | -------------------- |
| `username` | `string` | Username to validate |

#### Return Value

| Type   | Description                          |
| ------ | ------------------------------------ |
| `bool` | `true` if username is valid          |

#### Validation Rules

| Rule | Description | Example |
| ---- | ----------- | ------- |
| Minimum length | 4 characters | `"abc"` ❌, `"abcd"` ✅ |
| Starting character | Must be a letter (A-Z, a-z) | `"1abc"` ❌, `"a1bc"` ✅ |
| Allowed characters | Alphanumeric only (A-Z, a-z, 0-9) | `"alice_bob"` ❌, `"alice123"` ✅ |
| Maximum length | No enforced maximum | Any length ≥ 4 ✅ |

#### Implementation

```solidity
function isValidUsername(string memory username) internal pure returns (bool) {
    bytes memory usernameBytes = bytes(username);

    // Check if username length is at least 4 characters
    if (usernameBytes.length < 4) return false;

    // Check if username begins with a letter
    if (!_isLetter(usernameBytes[0]))
        return false;

    // Iterate through each character in the username
    for (uint256 i = 0; i < usernameBytes.length; i++) {
        // Check if character is not a digit or letter
        if (!_isDigit(usernameBytes[i]) && !_isLetter(usernameBytes[i])) {
            return false;
        }
    }
    return true;
}
```

#### Examples

```solidity
isValidUsername("alice")      // true  - 5 chars, starts with letter
isValidUsername("Alice123")   // true  - uppercase is valid
isValidUsername("user_name")  // false - underscores not allowed
isValidUsername("abc")        // false - too short (< 4 chars)
isValidUsername("123abc")     // false - starts with digit
```

### `isValidPhoneNumberNumber`

**Function Type**: `internal pure`
**Function Signature**: `isValidPhoneNumberNumber(string memory _phoneNumber) returns (bool)`

Validates a phone number string.

#### Parameters

| Parameter     | Type     | Description          |
| ------------- | -------- | -------------------- |
| `_phoneNumber` | `string` | Phone number to validate |

#### Return Value

| Type   | Description                              |
| ------ | ---------------------------------------- |
| `bool` | `true` if phone number format is valid   |

#### Implementation

```solidity
function isValidPhoneNumberNumber(
    string memory _phoneNumber
) internal pure returns (bool) {
    bytes memory _telephoneNumberBytes = bytes(_phoneNumber);
    if (
        _telephoneNumberBytes.length < 20 &&
        _telephoneNumberBytes.length > 5
    ) {
        return false;
    }
    for (uint256 i = 0; i < _telephoneNumberBytes.length; i++) {
        if (!_isDigit(_telephoneNumberBytes[i])) {
            return false;
        }
    }
    return true;
}
```

:::warning[Code Behavior]
The validation logic accepts lengths ≤ 5 or ≥ 20, and rejects lengths 6-19. This may be inverted from the NatSpec comment. Verify the intended behavior before use.
:::

### `isValidEmail`

**Function Type**: `internal pure`
**Function Signature**: `isValidEmail(string memory _email) returns (bool)`

Validates an email address with structural checks.

#### Parameters

| Parameter | Type     | Description        |
| --------- | -------- | ------------------ |
| `_email`  | `string` | Email to validate  |

#### Return Value

| Type   | Description                        |
| ------ | ---------------------------------- |
| `bool` | `true` if email format is valid    |

#### Validation Rules

| Component | Rule | Example |
| --------- | ---- | ------- |
| Prefix | 3+ valid characters | `"ab@domain.com"` ❌ |
| Separator | Must be `@` | `"userdomain.com"` ❌ |
| Domain | 3+ letters | `"user@ab.com"` ❌ |
| Separator | Must be `.` | `"user@domaincom"` ❌ |
| TLD | 2+ letters | `"user@domain.c"` ❌ |

#### Email Prefix Characters

Valid characters for the prefix include:
- Letters (A-Z, a-z)
- Digits (0-9)
- Symbols: `! " # $ % & ' ( ) * + , - . / : ; < = > ? @ [ \ ] ^ _ { | } ~`

#### Implementation

```solidity
function isValidEmail(string memory _email) internal pure returns (bool) {
    bytes memory _emailBytes = bytes(_email);
    uint256 lengthCount = 0;
    bytes1 flagVerify = 0x00;
    for (uint point = 0; point < _emailBytes.length; point++) {
        // step 1: prefix characters
        if (flagVerify == 0x00) {
            if (_isOnlyEmailPrefixCharacters(_emailBytes[point])) {
                lengthCount++;
            } else {
                if (_isAAt(_emailBytes[point])) {
                    flagVerify = 0x01;
                } else {
                    return false;
                }
            }
        }
        // step 2: validate prefix length (>= 3)
        if (flagVerify == 0x01) {
            if (lengthCount < 3) {
                return false;
            } else {
                flagVerify = 0x02;
                lengthCount = 0;
                point++;
            }
        }
        // step 3: domain name
        if (flagVerify == 0x02) {
            if (_isLetter(_emailBytes[point])) {
                lengthCount++;
            } else {
                if (_isAPoint(_emailBytes[point])) {
                    flagVerify = 0x03;
                } else {
                    return false;
                }
            }
        }
        // step 4: validate domain length (>= 3)
        if (flagVerify == 0x03) {
            if (lengthCount < 3) {
                return false;
            } else {
                flagVerify = 0x04;
                lengthCount = 0;
                point++;
            }
        }
        // step 5: TLD
        if (flagVerify == 0x04) {
            if (_isLetter(_emailBytes[point])) {
                lengthCount++;
            } else {
                if (_isAPoint(_emailBytes[point])) {
                    if (lengthCount < 2) {
                        return false;
                    } else {
                        lengthCount = 0;
                    }
                } else {
                    return false;
                }
            }
        }
    }
    if (flagVerify != 0x04) {
        return false;
    }
    return true;
}
```

#### Examples

```solidity
isValidEmail("user@domain.com")    // true
isValidEmail("ab@domain.com")      // false - prefix too short
isValidEmail("user@ab.com")        // false - domain too short
isValidEmail("user@domain.c")      // false - TLD too short
isValidEmail("userdomain.com")     // false - no @ symbol
```

## Internal Helper Functions

| Function | Purpose |
| -------- | ------- |
| `_isDigit(bytes1)` | Checks if byte is 0-9 (ASCII 0x30-0x39) |
| `_isLetter(bytes1)` | Checks if byte is A-Z or a-z (ASCII 0x41-0x5A, 0x61-0x7A) |
| `_isOnlyEmailPrefixCharacters(bytes1)` | Checks if byte is valid for email prefix |
| `_isAPoint(bytes1)` | Checks if byte is `.` (0x2E) |
| `_isAAt(bytes1)` | Checks if byte is `@` (0x40) |

## Gas Costs

| Operation | Approximate Gas | Notes |
| --------- | --------------- | ----- |
| `isValidUsername` | ~500-2000 | Scales with username length |
| `isValidPhoneNumberNumber` | ~300-1500 | Scales with phone number length |
| `isValidEmail` | ~800-3000 | Scales with email length |

## Usage in NameService

The `IdentityValidation` library is used internally by `NameService.sol` for username validation during registration:

```solidity
import {IdentityValidation} from "@evvm/testnet-contracts/library/nameService/lib/IdentityValidation.sol";

// Inside NameService.sol
function registrationUsername(...) external {
    // ...
    if (!IdentityValidation.isValidUsername(_username))
        revert Error.UsernameNotValid();
    // ...
}
```

## Security Considerations

### Character Set Limitations

- **Usernames**: Only ASCII letters and digits. No unicode, no special characters, no underscores.
- **Phone numbers**: Only digits. No country codes, no formatting characters.
- **Emails**: Structural validation only. No deep RFC 5322 compliance.

### Gas Optimization

All functions operate at the byte level to minimize gas costs. The validation loops exit early on first invalid character.

## Related Documentation

- [NameService Registration](../../../04-Contracts/02-NameService/02-UsernameFunctions/02-registrationUsername.md) - Where username validation is applied
- [NameService Overview](../../../04-Contracts/02-NameService/01-Overview.md) - Complete NameService documentation
