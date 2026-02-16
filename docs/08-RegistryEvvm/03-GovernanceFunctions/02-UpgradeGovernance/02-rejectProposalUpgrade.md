---
description: "Cancels pending upgrade proposals at any time during the governance period"
sidebar_position: 2
---

# rejectProposalUpgrade

**Function Type**: `external`  
**Access Control**: `isSuperUser`  
**Function Signature**: `rejectProposalUpgrade()`

Cancels a pending upgrade proposal, resetting the upgrade governance state to allow for new proposals.

## Description

This function allows the current superUser to cancel any pending upgrade proposal at any time during the 7-day waiting period. It provides a critical safety mechanism to reject upgrades that may have security issues, compatibility problems, or are no longer desired.

## Access Control

**Modifier**: `isSuperUser`

Only the current superUser can reject pending upgrade proposals, ensuring that only the current governance authority can cancel proposed changes.

## Security Features

### Immediate Cancellation
- No time delay required for rejection
- Immediate effect upon successful execution
- Allows for rapid response to discovered issues

### Clean State Reset
- Completely clears the pending upgrade proposal
- Resets the acceptance timestamp
- Allows for immediate new proposals with different implementations

### Workflow

1. **Access Control**: Validates that the caller is the current superUser using the `isSuperUser` modifier. Reverts with `InvalidUser` if not authorized.
2. **Proposal Reset**: Clears the proposed implementation address immediately.
3. **State Cleanup**: Resets the timeToAccept timestamp to 0.
4. **Security Measure**: Prevents unwanted contract upgrades and maintains current implementation.

```javascript
// Governance interface for upgrade management
const renderUpgradeManagement = async () => {
    const proposalData = await registryContract.getUpgradeProposalData();
    
    if (proposalData.proposal !== "0x0000000000000000000000000000000000000000") {
        return `
            <div class="upgrade-proposal">
                <h3>Pending Upgrade Proposal</h3>
                <p>Implementation: ${proposalData.proposal}</p>
                <p>Can execute after: ${new Date(proposalData.timeToAccept * 1000)}</p>
                
                <button onclick="rejectUpgrade()" class="reject-btn">
                    Reject Proposal
                </button>
                
                <div class="proposal-analysis">
                    <h4>Security Analysis</h4>
                    <div id="security-analysis">Loading...</div>
                </div>
            </div>
        `;
    }
};

const rejectUpgrade = async () => {
    if (confirm("Are you sure you want to reject this upgrade proposal?")) {
        try {
            await registryContract.rejectProposalUpgrade();
            console.log("Upgrade proposal rejected successfully");
            // Refresh interface
            location.reload();
        } catch (error) {
            console.error("Failed to reject upgrade proposal:", error);
        }
    }
};
```

## Workflow Integration

### Standard Rejection Workflow
1. **Issue Identification**: Discover problems with proposed implementation
2. **Impact Assessment**: Evaluate severity of issues
3. **Stakeholder Communication**: Inform community of rejection
4. **Execute Rejection**: Call `rejectProposalUpgrade()`
5. **Plan Resolution**: Determine next steps for addressing issues

## Related Functions

### Upgrade Lifecycle
- [`proposeUpgrade()`](./01-proposeUpgrade.md) - Create new upgrade proposals
- [`acceptProposalUpgrade()`](./03-acceptProposalUpgrade.md) - Execute pending upgrades

### State Management
- [`getUpgradeProposalData()`](../../05-GetterFunctions/08-getUpgradeProposalData.md) - Query current proposal state
- [`getVersion()`](../../05-GetterFunctions/09-getVersion.md) - Verify current implementation version

The `rejectProposalUpgrade` function serves as a critical safety valve in the upgrade governance system, ensuring that problematic upgrades can be quickly canceled while maintaining the integrity of the time-delayed governance process.