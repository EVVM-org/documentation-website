---
title: "Registry EVVM Contract Overview"
sidebar_position: 1
---

# Registry EVVM Contract Overview

The Registry EVVM Contract is the central registry for EVVM deployments across testnets, implementing a dual-tier registration system with time-delayed governance.

## Registration System

### Public Registration (IDs 1000+)
- **Open Access**: Anyone can register EVVM instances
- **Auto-Incrementing IDs**: Sequential assignment starting from 1000
- **Chain Whitelisting**: Only whitelisted testnet chain IDs allowed
- **Duplicate Prevention**: Same address can't register twice on same chain

### Whitelisted Registration (IDs 1-999)
- **SuperUser Only**: Reserved for official EVVM deployments
- **Custom ID Assignment**: Specific IDs within reserved range
- **Enhanced Control**: Additional validation for official instances

## Governance

- **7-Day Time Delays**: Critical operations require proposal and acceptance periods
- **SuperUser Changes**: Changing superUser requires time-delayed proposal
- **Contract Upgrades**: Implementation upgrades require proposals
- **Security Layer**: Prevents immediate changes, allows community review

## Key Features

### Registration
- `registerEvvm()`: Public registration with auto-incrementing IDs
- `sudoRegisterEvvm()`: SuperUser registration with custom IDs
- `registerChainId()`: Chain ID whitelisting management

### Governance
- `proposeSuperUser()`: Propose new superUser
- `acceptSuperUser()`: Accept pending proposal
- `proposeUpgrade()`: Propose contract upgrade
- `acceptProposalUpgrade()`: Accept upgrade proposal

### Query Functions
- `getEvvmIdMetadata()`: Retrieve EVVM registration metadata
- `getWhiteListedEvvmIdActive()`: List all active whitelisted registrations
- `getPublicEvvmIdActive()`: List all active public registrations
- `isChainIdRegistered()`: Check if chain ID is whitelisted
- `isAddressRegistered()`: Check if address is already registered

## Security Model

### Access Control
- **SuperUser Privileges**: Reserved functions for administrative control
- **Public Access**: Open registration within defined parameters
- **Time Delays**: 7-day waiting period for critical changes

### Input Validation
- **Address Validation**: Prevents zero addresses in registrations
- **Chain ID Validation**: Ensures only valid chain IDs are used
- **Duplicate Prevention**: Prevents multiple registrations of same address

### Upgrade Safety
- **UUPS Pattern**: Implements OpenZeppelin's upgradeable proxy pattern
- **Initialization Protection**: Prevents direct initialization of implementation
- **Governance Controls**: Time-delayed upgrades with proposal system

## Data Structure

### Metadata Structure
```solidity
struct Metadata {
    uint256 chainId;      // Chain ID where EVVM is deployed
    address evvmAddress;  // Contract address of the EVVM
}
```

### Governance Proposal Structure
```solidity
struct AddressTypeProposal {
    address current;        // Currently active address
    address proposal;       // Proposed new address
    uint256 timeToAccept;   // Timestamp when proposal can be accepted
}
```

## Use Cases

### For dApp Developers
- Discover available EVVM instances across different testnets
- Verify official vs community EVVM deployments
- Query metadata for specific EVVM instances

### For EVVM Operators
- Register new EVVM deployments for community use
- Track and manage multiple EVVM instances
- Participate in decentralized EVVM ecosystem

### For Ecosystem Governance
- Manage official EVVM deployments through reserved IDs
- Control testnet access through chain ID whitelisting
- Implement secure governance changes with time delays

This registry system enables a decentralized yet controlled approach to EVVM deployment management, balancing open access with security and quality control.