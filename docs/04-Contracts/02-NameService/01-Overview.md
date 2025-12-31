---
title: "Name Service Overview"
sidebar_position: 1
---

# Name Service Overview

The Name Service is a decentralized username management system providing human-readable identities across the EVVM ecosystem with built-in marketplace functionality.

## Core Features

### Username Registration
- **Pre-registration Protection**: Commit-reveal scheme prevents front-running
- **Dynamic Pricing**: Costs scale with network activity (100x current EVVM reward)
- **Expiration Management**: Renewable usernames with expiration dates

### Custom Metadata
- **Schema-Based Storage**: Structured metadata for social links, contacts, and custom fields
- **Flexible Management**: Add, remove, or flush metadata entries independently

### Username Marketplace
- **Offer System**: Time-based offers on existing usernames
- **Direct Trading**: Owner-controlled transfers with 0.5% marketplace fee

### Security & Governance
- **EIP-191 Signatures**: Cryptographic authorization for all operations
- **Replay Protection**: Async nonce system (`verifyAsyncNonce` / `markAsyncNonceAsUsed`) prevents duplicate operations by the same address
- **Time-Delayed Admin**: 1-day waiting period for administrative changes

## Registration Process

Three-step process preventing front-running:

1. **Pre-Registration**: Submit username hash (30-minute window)
2. **Registration**: Reveal username and salt within time limit
3. **Management**: Add metadata, accept offers, renew ownership

### Time-Lock Security
Administrative functions use time-delayed execution:
- **Proposal Period**: 1-day waiting period for all administrative changes
- **Transparency**: All changes are visible before execution
- **Emergency Controls**: Proposals can be cancelled during the waiting period

## Economic Model

### Registration Costs
- **Standard Rate**: 100x current EVVM reward amount for new usernames
- **Market-Based Pricing**: Uses renewal pricing logic if username has existing offers
- **Dynamic Adjustment**: Registration costs adapt to market demand and activity
- **Offer-Driven Economics**: Higher demand usernames cost more to register

### Metadata Operations
- **Add Metadata**: 10x current EVVM reward amount per entry
- **Remove Metadata**: 10x current EVVM reward amount per entry
- **Flush All Metadata**: 10x reward amount per existing entry

### Renewal Pricing
- **Time-Based**: Earlier renewals cost less than last-minute renewals
- **Market Demand**: Pricing adapts based on network activity
- **Expiration Protection**: Grace periods and renewal incentives

### Marketplace Economics
- **Trading Fee**: 0.5% of transaction value
- **Offer Management**: Small fees for offer creation and withdrawal
- **Revenue Sharing**: Executors receive portions of fees as rewards

## Integration with EVVM

### Payment Processing
- **Unified Token System**: All payments use principal tokens through EVVM
- **Staker Rewards**: sMATE stakers receive priority and reward distributions
- **Fee Collection**: Automatic routing of fees to appropriate recipients

### Reward Distribution
- **Executor Incentives**: Transaction processors receive reward payments
- **Proportional Rewards**: Rewards scale with work performed
- **Priority Processing**: Higher fees enable faster transaction execution

### Cross-Contract Security
- **Shared Nonce System**: Prevents replay attacks across the ecosystem
- **Address Validation**: Ensures compatibility with EVVM address formats
- **State Synchronization**: Maintains consistency with core EVVM operations

## Use Cases

### Individual Users
- **Digital Identity**: Establish a recognizable username across the platform
- **Profile Management**: Add social media links, contact info, and credentials
- **Asset Trading**: Buy, sell, or trade valuable usernames

### Organizations
- **Brand Protection**: Register and protect organizational usernames
- **Team Management**: Assign usernames to team members or departments
- **Public Presence**: Maintain verified organizational identity

### Developers
- **Integration APIs**: Build applications using Name Service identities
- **Metadata Standards**: Implement standardized user profile systems
- **Marketplace Tools**: Create trading interfaces and analytical tools

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