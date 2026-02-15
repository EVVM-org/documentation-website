---
title: "Name Service Overview"
sidebar_position: 1
---

# Name Service Overview

:::info[Integration Architecture]
NameService uses **centralized signature verification** via Core.sol's `validateAndConsumeNonce()`. All operations use async execution mode for optimal throughput.
:::

The Name Service is a decentralized username management system providing human-readable identities across the EVVM ecosystem with built-in marketplace functionality.

## Core Features

### Username Registration
- **Pre-registration Protection**: Commit-reveal scheme prevents front-running (30-minute window)
- **Dynamic Pricing**: Costs scale with network activity (100x current EVVM reward)
- **Expiration Management**: Renewable usernames with 366-day expiration

### Custom Metadata
- **Schema-Based Storage**: Structured metadata for social links, contacts, and custom fields
- **Flexible Management**: Add, remove, or flush metadata entries independently
- **Cost**: 10x EVVM reward per metadata operation

### Username Marketplace
- **Offer System**: Time-based offers on existing usernames
- **Direct Trading**: Owner-controlled transfers with 0.5% marketplace fee
- **Token Locking**: Offers lock Principal Tokens until withdrawal or acceptance

### Security & Governance
- **Centralized Verification**: All signatures verified by Core.sol's `validateAndConsumeNonce()`
- **Async Execution**: All NameService operations use async nonces (`isAsyncExec = true`)
- **Hash-Based Signatures**: Uses NameServiceHashUtils for deterministic payload generation
- **Time-Delayed Admin**: 1-day waiting period for administrative changes

## Architecture

### Signature Verification Flow

```solidity
// All NameService operations follow this pattern
core.validateAndConsumeNonce(
    user,                                    // Signer address
    Hash.hashDataFor...(params),            // Operation-specific hash
    originExecutor,                         // tx.origin restriction
    nonce,                                  // User's Core nonce
    true,                                   // Always async
    signature                               // EIP-191 signature
);
```

**Key Components:**
- **NameServiceHashUtils**: Generates `hashPayload` for each operation
- **Core.validateAndConsumeNonce()**: Centralized signature verification
- **Async Nonces**: All operations use async execution mode
- **originExecutor**: Optional tx.origin restriction for security

### Payment Processing

NameService uses two payment methods:

**1. User Payments (requestPay):**
```solidity
// For registration fees, offer amounts, metadata costs
core.pay(
    user,                                   // Payer
    address(this),                          // NameService receives
    "",                                     // No identity
    principalToken,                         // Payment token
    amount + priorityFee,                   // Total amount
    priorityFee,                            // Executor reward
    address(this),                          // Executor address
    nonceEvvm,                              // Payment nonce
    true,                                   // Async
    signatureEvvm                           // Payment signature
);
```

**2. Staker Rewards (makeCaPay):**
```solidity
// For distributing rewards to stakers/executors
core.caPay(
    msg.sender,                            // Staker address
    principalToken,                        // Reward token
    rewardAmount + priorityFee             // Total reward
);
```

## Registration Process

Three-step process preventing front-running:

### 1. Pre-Registration (Commit Phase)
```solidity
bytes32 hashUsername = keccak256(abi.encodePacked(username, lockNumber));

preRegistrationUsername(
    user,
    hashUsername,           // Commitment hash
    originExecutor,
    nonce,
    signature,
    priorityFeeEvvm,
    nonceEvvm,
    signatureEvvm
);
```
- Stores commitment for 30 minutes
- Hash conceals actual username
- Front-runners cannot see desired username

### 2. Registration (Reveal Phase)
```solidity
registrationUsername(
    user,
    username,               // Revealed username
    lockNumber,             // Revealed secret
    originExecutor,
    nonce,
    signature,
    priorityFeeEvvm,
    nonceEvvm,
    signatureEvvm
);
```
- Validates commitment matches reveal
- Must occur within 30-minute window
- Grants 366 days of ownership

### 3. Management
- Add custom metadata
- Accept marketplace offers
- Renew before expiration
- Participate in marketplace

## Economic Model

### Registration Costs
- **Standard Rate**: 100x current EVVM reward amount for new usernames
- **Market-Based Pricing**: Uses renewal pricing logic if username has existing offers
- **Dynamic Adjustment**: Registration costs adapt to market demand
- **Offer-Driven Economics**: Higher demand usernames cost more to register

### Metadata Operations
- **Add Metadata**: 10x current EVVM reward amount per entry
- **Remove Metadata**: 10x current EVVM reward amount per entry
- **Flush All Metadata**: 10x reward amount per existing entry
- **No Metadata Limit**: Unlimited custom metadata entries per username

### Renewal Pricing
- **Time-Based**: Calculated using `seePriceToRenew()` function
- **Market Demand**: Pricing adapts based on offers
- **Expiration Protection**: Grace periods and renewal incentives
- **Standard Period**: 366 days per renewal

### Marketplace Economics
- **Trading Fee**: 0.5% of transaction value (split between marketplace and executor)
- **Offer Locking**: Full offer amount locked until withdrawal/acceptance
- **Executor Rewards**: Marketplace operations reward stakers
- **Fee Distribution**: 
  - 0.375% to marketplace
  - 0.125% to executor

## Integration with Core.sol

### Centralized Verification
```solidity
// Every NameService operation validates signature via Core
core.validateAndConsumeNonce(
    user,                                  // Signer
    hashPayload,                           // From NameServiceHashUtils
    originExecutor,                        // tx.origin check
    nonce,                                 // Core nonce
    true,                                  // Async mode
    signature                              // EIP-191 signature
);
```

**Benefits:**
- ✅ Single verification point reduces attack surface
- ✅ Unified nonce system prevents replay attacks
- ✅ Gas-efficient signature checking
- ✅ Consistent error handling

### Payment Integration
- **Unified Token System**: All payments use Principal Tokens through Core
- **Staker Rewards**: Rewards distributed via `core.caPay()`
- **Fee Collection**: Automatic routing to NameService contract
- **Priority Processing**: Higher fees enable faster execution

### Reward Distribution System

**Staker Rewards (if `msg.sender` is staker):**
- **Pre-registration**: 1x reward + priorityFee
- **Registration**: 50x reward + priorityFee
- **Make Offer**: 1x reward + 0.125% offer amount + priorityFee
- **Withdraw Offer**: 1x reward + priorityFee
- **Accept Offer**: Calculated based on offer amount + priorityFee
- **Renew Username**: 1x reward + priorityFee
- **Metadata Operations**: 1x reward + priorityFee each
- **Flush Username**: 10x reward + priorityFee

## NameServiceHashUtils Functions

All operations use dedicated hash generation:

```solidity
import {NameServiceHashUtils as Hash} from "...";

// Registration
Hash.hashDataForPreRegistrationUsername(hashUsername)
Hash.hashDataForRegistrationUsername(username, lockNumber)

// Marketplace
Hash.hashDataForMakeOffer(username, amount, expirationDate)
Hash.hashDataForWithdrawOffer(username, offerID)
Hash.hashDataForAcceptOffer(username, offerID)

// Username Management
Hash.hashDataForRenewUsername(username)

// Metadata
Hash.hashDataForAddCustomMetadata(identity, value)
Hash.hashDataForRemoveCustomMetadata(identity, key)
Hash.hashDataForFlushCustomMetadata(identity)

// Cleanup
Hash.hashDataForFlushUsername(username)
```

## Use Cases

### Individual Users
- **Digital Identity**: Establish recognizable username across platform
- **Profile Management**: Add social media links, contact info, credentials
- **Asset Trading**: Buy, sell, or trade valuable usernames
- **Metadata Storage**: Store custom structured data on-chain

### Organizations
- **Brand Protection**: Register and protect organizational usernames
- **Team Management**: Assign usernames to team members or departments
- **Public Presence**: Maintain verified organizational identity
- **Custom Schemas**: Implement organization-specific metadata

### Developers
- **Identity Resolution**: Resolve addresses to human-readable names
- **Metadata Standards**: Implement standardized user profile systems
- **Marketplace Tools**: Create trading interfaces and analytical tools
- **Integration APIs**: Build applications using NameService identities

## Best Practices

### Security
- **Use Random Lock Numbers**: Generate cryptographically random values for commit-reveal
- **Never Reuse Nonces**: Each operation needs unique nonce from Core
- **Validate Usernames**: Check format before committing
- **Set Executor Restrictions**: Use `originExecutor` for sensitive operations

### Gas Optimization
- **Batch Metadata**: Add multiple entries in sequence if needed
- **Time Renewals**: Renew before expiration for better pricing
- **Monitor Marketplace**: Withdraw expired offers to reclaim locked tokens
- **Plan Offers**: Calculate marketplace fees before submitting

### Development
- **Use HashUtils**: Always use NameServiceHashUtils for payload generation
- **Test Commit-Reveal**: Verify 30-minute window handling
- **Handle Expirations**: Implement expiration monitoring
- **Track Nonces**: Query Core.sol for available nonces

---

**License**: EVVM-NONCOMMERCIAL-1.0  
**Contract**: NameService.sol  
**Verification**: Centralized via Core.sol

## Technical Architecture

### Smart Contract Design
- **Modular Functions**: Separate contracts for different functionality areas
- **Upgrade Safety**: Time-locked governance prevents immediate changes
- **Gas Optimization**: Efficient operations for common use cases
- **Comprehensive API**: Over 30 getter functions for complete system state access

### Data Storage
- **On-Chain Metadata**: All usernames and metadata stored on blockchain
- **Efficient Indexing**: Optimized data structures for quick lookups
- **Scalable Design**: Architecture supports growing user base
- **State Verification**: Built-in functions for verifying data integrity and ownership

### Query Infrastructure
- **Real-Time Pricing**: Dynamic pricing functions based on current network conditions
- **Ownership Verification**: Multiple verification methods from basic checks to strict validation
- **Metadata Management**: Complete CRUD operations with efficient retrieval functions
- **Administrative Monitoring**: Full transparency of admin proposals and system status

### Data Validation Layer
- **Format Enforcement**: Strict validation rules for usernames, emails, and phone numbers
- **Security Checks**: Input sanitization prevents malformed data storage
- **Standard Compliance**: Email validation follows RFC standards for maximum compatibility
- **Character Set Control**: Username validation ensures consistent identifier formats

### Event System
- **Comprehensive Logging**: All operations emit detailed events
- **Integration Support**: Events enable external system integration
- **Audit Trail**: Complete history of all username operations

The Name Service represents a foundational layer for decentralized identity within the EVVM ecosystem, providing the infrastructure for human-readable addresses, rich profile information, and secure username trading.