---
title: "Identity Resolution Functions"
description: "Detailed documentation of the EVVM Core Contract's identity resolution system and NameService integration."
sidebar_position: 7
---

# Identity Resolution Functions

The EVVM contract integrates with the NameService to provide identity-based payment functionality, allowing users to send payments to human-readable usernames instead of complex addresses. This section covers the identity resolution system and NameService integration.

## NameService Integration

The EVVM contract uses the NameService to resolve usernames to wallet addresses, enabling user-friendly payment experiences while maintaining the security of blockchain addresses.

### Identity Resolution Process

When a payment includes a `to_identity` parameter, the EVVM contract performs the following resolution process:

1. **Identity Validation**: Checks if the provided identity exists in the NameService
2. **Strict Verification**: Ensures the identity is properly registered and active  
3. **Address Resolution**: Retrieves the wallet address associated with the identity
4. **Payment Processing**: Executes the payment to the resolved address

### NameService Functions Used

The EVVM contract utilizes several NameService functions for identity resolution:

#### verifyStrictAndGetOwnerOfIdentity

**Function Purpose**: Strict identity verification with address resolution  
**Usage Context**: Primary method for secure identity-to-address conversion

```solidity
address recipient = NameService(nameServiceAddress)
    .verifyStrictAndGetOwnerOfIdentity(to_identity);
```

**Security Features**:
- Performs comprehensive validation of identity status
- Ensures identity is not expired or suspended  
- Returns the current owner address
- Reverts if identity is invalid or inactive

#### strictVerifyIfIdentityExist

**Function Purpose**: Checks identity existence without address resolution  
**Usage Context**: Used in batch operations for efficiency

```solidity
bool exists = NameService(nameServiceAddress)
    .strictVerifyIfIdentityExist(to_identity);
```

**Use Cases**:
- Batch payment validation before processing
- Efficient existence checks in `dispersePay` operations
- Pre-validation in multi-recipient transactions

#### getOwnerOfIdentity

**Function Purpose**: Retrieves address associated with an identity  
**Usage Context**: Used after existence verification

```solidity
address owner = NameService(nameServiceAddress)
    .getOwnerOfIdentity(to_identity);
```

**Security Note**: Should only be used after confirming identity existence with `strictVerifyIfIdentityExist`.

## Identity Resolution in Payment Functions

### Single Payment Functions

In the unified `pay` function, identity resolution follows this pattern:

```solidity
address to = !Strings.equal(to_identity, "")
    ? NameService(nameServiceAddress).verifyStrictAndGetOwnerOfIdentity(to_identity)
    : to_address;
```

**Logic Flow**:
1. Check if `to_identity` is provided (not empty string)
2. If identity provided: Use `verifyStrictAndGetOwnerOfIdentity` for secure resolution
3. If identity empty: Use the provided `to_address` directly
4. Proceed with payment to the resolved address

### Batch Payment Functions

In `payMultiple`, each payment in the batch undergoes individual identity resolution:

```solidity
to_aux = !Strings.equal(payData[iteration].to_identity, "")
    ? NameService(nameServiceAddress).verifyStrictAndGetOwnerOfIdentity(
        payData[iteration].to_identity
    )
    : payData[iteration].to_address;
```

**Benefits**:
- Each payment can use different resolution methods (identity or address)
- Failed identity resolution only affects individual payments in the batch
- Maintains security across all payments in the batch

### Disperse Payment Functions

In `dispersePay`, the resolution process is optimized for efficiency:

```solidity
if (!Strings.equal(toData[i].to_identity, "")) {
    if (NameService(nameServiceAddress).strictVerifyIfIdentityExist(
        toData[i].to_identity
    )) {
        to_aux = NameService(nameServiceAddress).getOwnerOfIdentity(
            toData[i].to_identity
        );
    }
} else {
    to_aux = toData[i].to_address;
}
```

**Optimization Features**:
- Two-step verification for better error handling
- Continues processing even if some identities are invalid
- Efficient batch processing of multiple recipients

## NameService Configuration

### Setup Process

The NameService integration is configured during contract deployment and setup:

#### Initial Setup

```solidity
function _setupNameServiceAddress(address _nameServiceAddress) external {
    if (breakerSetupNameServiceAddress == 0x00) {
        revert();
    }
    nameServiceAddress = _nameServiceAddress;
    balances[nameServiceAddress][evvmMetadata.principalTokenAddress] = 
        10000 * 10 ** 18;
    stakerList[nameServiceAddress] = FLAG_IS_STAKER;
}
```

**Setup Features**:
- One-time configuration with breaker flag protection
- Provides initial MATE token balance (10,000 MATE) to NameService
- Registers NameService as a privileged staker
- Prevents multiple setup calls for security

#### Administrative Updates

```solidity
function setNameServiceAddress(address _nameServiceAddress) external onlyAdmin {
    nameServiceAddress = _nameServiceAddress;
}
```

**Administrative Control**:
- Admin can update NameService address if needed
- Immediate effect for operational flexibility
- Used for upgrades or integration changes

## Security Considerations

### Identity Validation

1. **Strict Verification**: Always use `verifyStrictAndGetOwnerOfIdentity` for secure resolution
2. **Existence Checks**: Verify identity exists before attempting resolution
3. **Error Handling**: Proper handling of invalid or expired identities
4. **Fallback Mechanism**: Support both identity and direct address payments

### Attack Vectors

#### Identity Spoofing
- **Protection**: NameService handles identity uniqueness and ownership
- **Validation**: Strict verification prevents unauthorized identity use
- **Resolution**: Only valid, active identities can be resolved

#### Identity Expiration
- **Handling**: Expired identities fail strict verification
- **Fallback**: Users can always use direct addresses
- **Notification**: Clear error messages for resolution failures

#### Service Disruption
- **Resilience**: Direct address payments remain available
- **Isolation**: NameService issues don't affect address-based payments
- **Recovery**: Admin can update NameService address if needed

## Best Practices

### For Users

1. **Verify Identity**: Ensure the identity you're paying to is correct and active
2. **Fallback Option**: Keep recipient addresses as backup for critical payments
3. **Recent Validation**: Verify identity ownership before large payments

### For Developers

1. **Error Handling**: Implement proper error handling for identity resolution failures
2. **Validation**: Always validate identity format before attempting resolution
3. **Caching**: Consider caching resolved addresses for frequently used identities
4. **User Experience**: Provide clear feedback for identity resolution status

### For Integrators

1. **Dual Support**: Support both identity and address-based payments
2. **Validation UI**: Provide real-time identity validation in user interfaces
3. **Error Messages**: Display helpful error messages for resolution failures
4. **Address Display**: Show resolved addresses to users for confirmation

## Usage Examples

### Identity-Based Payment

```solidity
// Payment using identity
evvm.pay(
    senderAddress,
    address(0),          // Empty address
    "alice.mate",        // Identity to resolve
    tokenAddress,
    amount,
    priorityFee,
    nonce,
    priorityFlag,        // async/sync flag
    executor,
    signature
);
```

### Address-Based Payment

```solidity
// Payment using direct address
evvm.pay(
    senderAddress,
    recipientAddress,    // Direct address
    "",                  // Empty identity
    tokenAddress,
    amount,
    priorityFee,
    executor,
    signature
);
```

### Mixed Batch Payment

```solidity
PayData[] memory payments = new PayData[](2);

// Payment 1: Using identity
payments[0] = PayData({
    from: sender,
    to_address: address(0),
    to_identity: "alice.mate",
    token: tokenAddress,
    amount: amount1,
    // ... other fields
});

// Payment 2: Using direct address  
payments[1] = PayData({
    from: sender,
    to_address: recipientAddress,
    to_identity: "",
    token: tokenAddress,
    amount: amount2,
    // ... other fields
});

evvm.payMultiple(payments);
```

## Integration Benefits

### User Experience
- **Human-Readable**: Users can send payments to memorable usernames
- **Error Reduction**: Reduces address copy-paste errors
- **Social Integration**: Enables social payment features

### Developer Benefits
- **Abstraction**: Simplifies address management in applications
- **Flexibility**: Supports both traditional and identity-based payments  
- **Future-Proof**: Easy integration with identity evolution

### Ecosystem Benefits
- **Adoption**: Lowers barriers to blockchain payment adoption
- **Integration**: Enables rich social and identity features
- **Standardization**: Provides consistent identity resolution across services
