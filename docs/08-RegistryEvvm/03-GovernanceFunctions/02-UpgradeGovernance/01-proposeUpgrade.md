---
sidebar_position: 1
---

# proposeUpgrade

**Function Type**: `external`  
**Access Control**: `isSuperUser`  
**Function Signature**: `proposeUpgrade(address _newImplementation)`

Proposes a new implementation address for contract upgrade with a mandatory 7-day time delay before the upgrade can be executed.

## Parameters

| Parameter             | Type      | Description                                    |
| --------------------- | --------- | ---------------------------------------------- |
| `_newImplementation`  | `address` | Address of the proposed new implementation     |

## Description

This function initiates the first step of the time-delayed governance process for upgrading the contract implementation. It follows the UUPS (Universal Upgradeable Proxy Standard) pattern with additional security through time delays.

## Access Control

**Modifier**: `isSuperUser`

Only the current superUser can propose contract upgrades, ensuring that only authorized governance can initiate system changes.

## Security Features

### Time Delay Protection
- **7-day waiting period**: Provides time for community review and security audits
- **Proposal transparency**: The proposed implementation address is publicly visible
- **Cancellation capability**: SuperUser can reject the proposal at any time

### Implementation Validation
The function validates that:
- The proposed implementation address is not the zero address
- Basic input validation prevents obvious errors

## Upgrade Workflow

### 1. Implementation Preparation
Before proposing an upgrade:
- New implementation contract must be deployed
- Security audits should be completed
- Compatibility testing should be performed

### 2. Proposal Submission
```solidity
// SuperUser proposes new implementation
address newImplementation = 0x1234567890123456789012345678901234567890;
registryContract.proposeUpgrade(newImplementation);
```

### 3. Waiting Period (7 Days)
- Community can review the proposed implementation
- Security researchers can audit the new code
- SuperUser can cancel if issues are discovered

### 4. Upgrade Execution
After 7 days, superUser can execute the upgrade:
```solidity
registryContract.acceptProposalUpgrade();
```

### Workflow

1. **Access Control**: Validates that the caller is the current superUser using the `isSuperUser` modifier. Reverts with `InvalidUser` if not authorized.
2. **Input Validation**: Checks that `_implementation` is not the zero address and is different from the current implementation. Reverts on validation failure.
3. **Proposal Creation**: Sets the `upgradeProposal.implementation` to the new address and `upgradeProposal.timeToAccept` to current timestamp plus 7 days.
4. **State Update**: Updates the upgrade proposal state to allow for later acceptance or rejection.

## Implementation Requirements

### UUPS Compatibility
The new implementation must:
- Inherit from `UUPSUpgradeable`
- Implement required upgrade authorization
- Maintain storage layout compatibility
- Include proper initialization functions

### Security Considerations
- Storage layout must be compatible with current version
- New functions should not break existing functionality
- Proper access controls must be maintained

## Usage Example

```solidity
// Deploy new implementation
RegistryEvvmV2 newImplementation = new RegistryEvvmV2();

// Propose the upgrade (superUser only)
registryContract.proposeUpgrade(address(newImplementation));

// Query proposal status
AddressTypeProposal memory proposal = registryContract.getUpgradeProposalData();
console.log("Proposed Implementation:", proposal.proposal);
console.log("Can execute after:", proposal.timeToAccept);
```

## Integration Examples

### Governance Dashboard
```javascript
// Monitor upgrade proposals
const monitorUpgradeProposals = async () => {
    const proposalData = await registryContract.getUpgradeProposalData();
    
    if (proposalData.proposal !== "0x0000000000000000000000000000000000000000") {
        const timeToAccept = new Date(proposalData.timeToAccept * 1000);
        const now = new Date();
        
        if (now >= timeToAccept) {
            console.log("Upgrade proposal ready for execution");
        } else {
            const remainingTime = timeToAccept - now;
            console.log(`Upgrade proposal pending: ${formatTime(remainingTime)} remaining`);
        }
    }
};
```

### Automated Testing Pipeline
```javascript
// Automated testing of proposed implementations
const testProposedImplementation = async (implementationAddress) => {
    // Deploy test proxy with new implementation
    const testProxy = await deployTestProxy(implementationAddress);
    
    // Run compatibility tests
    const compatibilityResults = await runCompatibilityTests(testProxy);
    
    // Run functional tests
    const functionalResults = await runFunctionalTests(testProxy);
    
    // Generate test report
    const report = {
        implementation: implementationAddress,
        compatibility: compatibilityResults,
        functionality: functionalResults,
        recommendation: determineRecommendation(compatibilityResults, functionalResults)
    };
    
    return report;
};
```

## Pre-Upgrade Checklist

### Technical Validation
- [ ] New implementation deployed and verified
- [ ] Storage layout compatibility confirmed
- [ ] All existing functions maintain compatibility
- [ ] New functionality properly tested
- [ ] Security audit completed

### Governance Process
- [ ] Community notification sent
- [ ] Proposal rationale documented
- [ ] Timeline communicated
- [ ] Feedback collection period established

### Risk Assessment
- [ ] Rollback plan prepared
- [ ] Impact analysis completed
- [ ] Communication plan ready
- [ ] Monitoring systems prepared

## Security Considerations

### Implementation Security
- New implementation should be thoroughly audited
- Storage layout changes must be carefully managed
- Access control patterns must be preserved

### Proposal Security
- Validate implementation address before proposing
- Ensure implementation source code is available
- Verify implementation deployment was successful

### Community Security
- Allow sufficient time for community review
- Provide clear documentation of changes
- Enable feedback and concern reporting

## Related Functions

### Upgrade Lifecycle
- [`rejectProposalUpgrade()`](./02-rejectProposalUpgrade.md) - Cancel pending upgrade proposals
- [`acceptProposalUpgrade()`](./03-acceptProposalUpgrade.md) - Execute pending upgrades

### State Queries
- [`getUpgradeProposalData()`](../../05-GetterFunctions/08-getUpgradeProposalData.md) - Query upgrade proposal status
- [`getVersion()`](../../05-GetterFunctions/09-getVersion.md) - Check current contract version

## Best Practices

### Proposal Timing
- Coordinate with other governance activities
- Avoid conflicts with superUser transitions
- Consider community engagement schedules

### Communication
- Announce upgrade proposals publicly
- Provide detailed change documentation
- Maintain transparency throughout process

### Testing
- Comprehensive testing on testnets
- Load testing for performance impact
- Integration testing with dependent systems