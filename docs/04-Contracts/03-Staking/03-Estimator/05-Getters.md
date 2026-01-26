---
title: "Getters"
description: "Documentation of all getter functions in the EVVM Estimator Contract for retrieving epoch and administrative metadata."
sidebar_position: 5
---

# Getter Functions

The Estimator contract provides several view functions to retrieve epoch information and administrative proposal metadata.

## Epoch Getters

### `getEpochMetadata`

**Function Signature**: `getEpochMetadata()`  
**Returns**: `EpochMetadata memory`

Returns the complete epoch metadata structure containing all current epoch information.

**Return Structure:**
```solidity
struct EpochMetadata {
    address tokenPool;   // Token address for rewards
    uint256 totalPool;   // Total reward pool amount
    uint256 totalStaked; // Total staked amount in epoch
    uint256 tStart;      // Epoch start timestamp
    uint256 tFinal;      // Epoch end timestamp
}
```

---

### `getActualEpochInUint`

**Function Signature**: `getActualEpochInUint()`  
**Returns**: `uint256`

Returns the current epoch identifier as an unsigned integer.

---

### `getActualEpochInFormat`

**Function Signature**: `getActualEpochInFormat()`  
**Returns**: `bytes32`

Returns the current epoch identifier in bytes32 format, which is the format used for history tracking and verification.

---

## Administrative Metadata Getters

All administrative getters return a `ProposalMetadata` structure:

```solidity
struct ProposalMetadata {
    address actual;       // Current active address
    address proposal;     // Proposed new address
    uint256 acceptedTime; // Timestamp when proposal can be accepted
}
```

---

### `getActivatorMetadata`

**Function Signature**: `getActivatorMetadata()`  
**Returns**: `ProposalMetadata memory`

Returns the activator address metadata, including the current activator, any pending proposal, and the acceptance timestamp.

---

### `getEvvmAddressMetadata`

**Function Signature**: `getEvvmAddressMetadata()`  
**Returns**: `ProposalMetadata memory`

Returns the EVVM contract address metadata, including the current address, any pending proposal, and the acceptance timestamp.

---

### `getAddressStakingMetadata`

**Function Signature**: `getAddressStakingMetadata()`  
**Returns**: `ProposalMetadata memory`

Returns the Staking contract address metadata, including the current address, any pending proposal, and the acceptance timestamp.

---

### `getAdminMetadata`

**Function Signature**: `getAdminMetadata()`  
**Returns**: `ProposalMetadata memory`

Returns the admin address metadata, including the current admin, any pending proposal, and the acceptance timestamp.

---

## Usage Examples

### Checking Epoch Status

```javascript
const epochData = await estimator.getEpochMetadata();
console.log("Epoch Start:", epochData.tStart);
console.log("Epoch End:", epochData.tFinal);
console.log("Total Pool:", epochData.totalPool);
```

### Verifying Pending Proposals

```javascript
const adminMeta = await estimator.getAdminMetadata();
if (adminMeta.proposal !== ethers.ZeroAddress) {
    console.log("Pending admin change to:", adminMeta.proposal);
    console.log("Can accept after:", new Date(adminMeta.acceptedTime * 1000));
}
```
