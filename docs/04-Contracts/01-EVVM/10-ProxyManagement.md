---
title: "Proxy Management Functions"
description: "Detailed documentation of the EVVM Core Contract's proxy management functions for implementation upgrades and proxy operations."
sidebar_position: 10
---

# Proxy Management Functions

The EVVM contract uses a sophisticated proxy pattern with time-delayed upgrades to ensure security and allow for community review of critical system changes. This section covers all proxy-related functions for implementation management.

## Proxy Pattern Overview

The EVVM contract implements an upgradeable proxy pattern with the following security features:

- **Time-Delayed Upgrades**: 30-day delay for implementation changes
- **Community Review**: Extended time for security audits and community validation
- **Admin Control**: Only authorized admin can propose and execute upgrades
- **Cancellation Mechanism**: Ability to reject proposed upgrades before execution
- **Fallback Delegation**: Automatic delegation to current implementation

## Implementation Management Functions

### proposeImplementation

**Function Type**: `external onlyAdmin`  
**Function Signature**: `proposeImplementation(address)`

Proposes a new implementation contract for the proxy with a mandatory 30-day time delay for security.

#### Input Parameters

| Parameter   | Type      | Description                                    |
| ----------- | --------- | ---------------------------------------------- |
| `_newImpl`  | `address` | Address of the new implementation contract     |

#### Security Features

- **30-day time delay**: Allows comprehensive community review and validation
- **Admin-only access**: Only current admin can propose upgrades
- **Single proposal**: Only one implementation proposal can be pending at a time
- **Cancellable**: Can be rejected using `rejectUpgrade()` before deadline

#### Workflow

1. **Admin Proposal**: Admin calls `proposeImplementation()` with new implementation address
2. **Deadline Setting**: System sets acceptance deadline (current timestamp + 30 days)
3. **Community Review**: 30-day period for security audits and community validation
4. **Optional Cancellation**: Admin can cancel using `rejectUpgrade()` if issues are found
5. **Execution**: After 30 days, admin can execute upgrade using `acceptImplementation()`

#### Implementation

```solidity
function proposeImplementation(address _newImpl) external onlyAdmin {
    proposalImplementation = _newImpl;
    timeToAcceptImplementation = block.timestamp + 30 days;
}
```

---

### rejectUpgrade

**Function Type**: `external onlyAdmin`  
**Function Signature**: `rejectUpgrade()`

Cancels a pending implementation upgrade proposal before the time delay expires.

#### Security Features

- **Admin-only access**: Only current admin can reject upgrades
- **Immediate effect**: Cancellation takes effect immediately
- **Complete reset**: Clears both proposal address and acceptance deadline
- **Emergency mechanism**: Allows quick response to discovered security issues

#### Use Cases

- **Security Issues**: Community or auditors identify problems in proposed implementation
- **Better Alternative**: Superior implementation becomes available during review period
- **Administrative Decision**: Admin decides to withdraw the upgrade proposal
- **Emergency Response**: Quick cancellation of problematic proposals

#### Implementation

```solidity
function rejectUpgrade() external onlyAdmin {
    proposalImplementation = address(0);
    timeToAcceptImplementation = 0;
}
```

---

### acceptImplementation

**Function Type**: `external onlyAdmin`  
**Function Signature**: `acceptImplementation()`

Executes a pending implementation upgrade after the mandatory 30-day time delay has passed.

#### Security Features

- **Time delay enforcement**: Cannot be called before the acceptance deadline
- **Admin-only access**: Only current admin can execute upgrades
- **Automatic cleanup**: Clears proposal data after successful upgrade
- **Atomic execution**: Implementation change happens atomically

#### Execution Requirements

1. **Valid Proposal**: Must have a pending implementation proposal
2. **Time Elapsed**: Current timestamp must exceed the acceptance deadline
3. **Admin Authorization**: Must be called by the current admin
4. **Clean State**: Proposal state is cleared after execution

#### Workflow

1. **Deadline Verification**: Confirms that 30 days have passed since proposal
2. **Implementation Update**: Sets current implementation to proposed implementation
3. **State Cleanup**: Clears proposal implementation and acceptance deadline
4. **Proxy Activation**: New implementation becomes active for all delegatecalls

#### Implementation

```solidity
function acceptImplementation() external onlyAdmin {
    if (block.timestamp < timeToAcceptImplementation) revert();
    currentImplementation = proposalImplementation;
    proposalImplementation = address(0);
    timeToAcceptImplementation = 0;
}
```

---

## Proxy Query Functions

### getCurrentImplementation

**Function Type**: `view`  
**Function Signature**: `getCurrentImplementation()`

Gets the current active implementation contract address used by the proxy for delegatecalls.

#### Return Value

| Type      | Description                                      |
| --------- | ------------------------------------------------ |
| `address` | Address of the current implementation contract   |

#### Use Cases

- **Integration Verification**: Confirm which implementation is currently active
- **Debugging**: Identify implementation during troubleshooting
- **Monitoring**: Track implementation changes over time
- **Interface Detection**: Determine available functions in current implementation

---

### getProposalImplementation

**Function Type**: `view`  
**Function Signature**: `getProposalImplementation()`

Gets the proposed implementation contract address that is pending approval for proxy upgrade.

#### Return Value

| Type      | Description                                                    |
| --------- | -------------------------------------------------------------- |
| `address` | Address of the proposed implementation contract (zero if none) |

#### Use Cases

- **Proposal Monitoring**: Track pending implementation upgrades
- **Community Review**: Allow community to examine proposed implementations
- **Security Analysis**: Enable security audits of pending upgrades
- **Decision Making**: Provide information for upgrade approval decisions

---

### getTimeToAcceptImplementation

**Function Type**: `view`  
**Function Signature**: `getTimeToAcceptImplementation()`

Gets the acceptance deadline for the pending implementation upgrade.

#### Return Value

| Type      | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| `uint256` | Timestamp when implementation upgrade can be executed (0 if no pending proposal) |

#### Use Cases

- **Timing Information**: Know when upgrade can be executed
- **Countdown Tracking**: Monitor time remaining in review period
- **Automation**: Enable automated execution after deadline
- **Planning**: Schedule upgrade execution and related activities

---

## Fallback Mechanism

### Delegatecall Fallback

The EVVM contract implements a sophisticated fallback function that automatically delegates calls to the current implementation:

```solidity
fallback() external {
    if (currentImplementation == address(0)) revert();

    assembly {
        // Copy the entire calldata
        calldatacopy(0, 0, calldatasize())

        // Delegatecall to implementation
        let result := delegatecall(
            gas(), 
            sload(currentImplementation.slot), 
            0, 
            calldatasize(), 
            0, 
            0
        )

        // Copy the return data
        returndatacopy(0, 0, returndatasize())

        // Handle the result
        switch result
        case 0 {
            revert(0, returndatasize()) // Forward revert
        }
        default {
            return(0, returndatasize()) // Forward return
        }
    }
}
```

#### Fallback Features

- **Automatic Delegation**: Routes unknown function calls to current implementation
- **Gas Forwarding**: Passes all available gas to implementation
- **Data Preservation**: Maintains exact calldata and return data
- **Error Forwarding**: Properly forwards reverts and error messages
- **Security Check**: Reverts if no implementation is set

## Security Considerations

### Upgrade Security

#### Time Delay Benefits

- **Community Review**: 30 days allows thorough security analysis
- **Vulnerability Discovery**: Extended time for finding implementation bugs
- **Social Consensus**: Time for community discussion and consensus building
- **Emergency Response**: Ability to cancel upgrades if issues are found

#### Access Control

- **Admin-Only Operations**: All proxy management restricted to admin
- **Single Point of Control**: Centralized but time-delayed upgrade authority
- **Proposal Validation**: Admin can review proposals before execution
- **Emergency Cancellation**: Quick response capability for security issues

### Attack Vectors

#### Malicious Implementation

- **Protection**: 30-day review period allows security analysis
- **Mitigation**: Community can identify malicious code before execution
- **Response**: Admin can cancel malicious proposals using `rejectUpgrade()`

#### Admin Compromise

- **Risk**: Compromised admin could propose malicious implementations
- **Mitigation**: 30-day delay provides time to detect compromise
- **Response**: Community alert systems and emergency procedures

#### Implementation Bugs

- **Risk**: New implementations may contain bugs or vulnerabilities
- **Mitigation**: Extended review period and testing requirements
- **Response**: Cancel upgrade and deploy fixed implementation

## Integration Guidelines

### For Developers

#### Monitoring Upgrades

```solidity
// Check for pending upgrades
address pendingImpl = evvm.getProposalImplementation();
uint256 deadline = evvm.getTimeToAcceptImplementation();

if (pendingImpl != address(0)) {
    // Upgrade is pending - analyze and prepare
    uint256 timeRemaining = deadline - block.timestamp;
    // Implement monitoring and preparation logic
}
```

#### Implementation Development

1. **Security First**: Prioritize security in implementation development
2. **Comprehensive Testing**: Extensive testing before proposal
3. **Community Engagement**: Engage community during development
4. **Documentation**: Provide detailed upgrade documentation

### For Community

#### Review Process

1. **Code Analysis**: Examine proposed implementation code
2. **Security Audit**: Conduct or review security audits
3. **Testing**: Participate in testnet validation
4. **Feedback**: Provide feedback during review period

#### Monitoring Tools

- **Implementation Tracking**: Monitor current and proposed implementations
- **Deadline Alerts**: Set up notifications for upgrade deadlines
- **Change Analysis**: Analyze differences between implementations
- **Community Discussion**: Participate in upgrade discussions

## Best Practices

### Upgrade Planning

1. **Thorough Testing**: Comprehensive testing on testnets
2. **Security Audits**: Professional security audits before proposal
3. **Community Engagement**: Early community involvement and feedback
4. **Documentation**: Complete documentation of changes and rationale
5. **Emergency Procedures**: Clear procedures for upgrade cancellation

### Operational Security

1. **Admin Key Security**: Secure storage and management of admin keys
2. **Monitoring Systems**: Automated monitoring of upgrade proposals
3. **Response Procedures**: Defined procedures for security issues
4. **Community Coordination**: Clear communication channels with community

### Development Lifecycle

1. **Design Phase**: Community input on upgrade requirements
2. **Development Phase**: Transparent development with regular updates
3. **Testing Phase**: Comprehensive testing including security testing
4. **Review Phase**: Community review and feedback incorporation
5. **Deployment Phase**: Careful execution with monitoring
