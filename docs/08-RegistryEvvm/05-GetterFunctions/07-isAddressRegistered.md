---
sidebar_position: 7
---

# isAddressRegistered

**Function Type**: `view`  
**Function Signature**: `isAddressRegistered(uint256 chainId, address evvmAddress) returns (bool)`

Checks if a specific EVVM address is already registered on a given chain, preventing duplicate registrations and verifying existing registrations.

## Parameters

| Parameter     | Type      | Description                                              |
| ------------- | --------- | -------------------------------------------------------- |
| `chainId`     | `uint256` | The chain ID to check for the address registration      |
| `evvmAddress` | `address` | The EVVM address to check for existing registration     |

## Return Value

| Type   | Description                                                           |
| ------ | --------------------------------------------------------------------- |
| `bool` | `true` if the address is already registered on this chain, `false` otherwise |

## Description

This function provides duplicate prevention and registration verification by checking if a specific EVVM address has already been registered on a particular blockchain. It's essential for maintaining registry integrity and preventing multiple registrations of the same address.

## Usage Examples

### Basic Registration Check
```solidity
// Check if address is already registered on Sepolia
bool isRegistered = registryContract.isAddressRegistered(
    11155111, // Sepolia chain ID
    0x1234567890123456789012345678901234567890
);

if (isRegistered) {
    console.log("EVVM address is already registered on Sepolia");
} else {
    console.log("EVVM address is available for registration");
}
```

### Pre-Registration Validation
```javascript
// Complete validation before registration attempt
const validateRegistration = async (chainId, evvmAddress) => {
    const validation = {
        isValid: true,
        errors: []
    };
    
    try {
        // Check if chain is supported
        const isChainSupported = await registryContract.isChainIdRegistered(chainId);
        if (!isChainSupported) {
            validation.isValid = false;
            validation.errors.push(`Chain ID ${chainId} is not whitelisted`);
        }
        
        // Check if address is already registered
        const isAlreadyRegistered = await registryContract.isAddressRegistered(
            chainId, 
            evvmAddress
        );
        if (isAlreadyRegistered) {
            validation.isValid = false;
            validation.errors.push('EVVM address is already registered on this chain');
        }
        
        // Additional validations
        if (!evvmAddress || evvmAddress === "0x0000000000000000000000000000000000000000") {
            validation.isValid = false;
            validation.errors.push('Invalid EVVM address');
        }
        
    } catch (error) {
        validation.isValid = false;
        validation.errors.push(`Validation failed: ${error.message}`);
    }
    
    return validation;
};
```

### Registration Status Dashboard
```javascript
// Check registration status across multiple chains
const checkMultiChainRegistration = async (evvmAddress, chainIds) => {
    const registrationStatus = {};
    
    for (const chainId of chainIds) {
        try {
            const isRegistered = await registryContract.isAddressRegistered(
                chainId, 
                evvmAddress
            );
            
            registrationStatus[chainId] = {
                chainId,
                isRegistered,
                networkName: await getNetworkName(chainId)
            };
            
        } catch (error) {
            registrationStatus[chainId] = {
                chainId,
                isRegistered: false,
                error: error.message
            };
        }
    }
    
    return registrationStatus;
};
```

## Integration Patterns

### Registration Conflict Detection
```javascript
// Service to detect and handle registration conflicts
class RegistrationConflictDetector {
    constructor(registryContract) {
        this.registry = registryContract;
    }
    
    async checkForConflicts(chainId, evvmAddress) {
        const conflicts = {
            hasConflict: false,
            conflictType: null,
            details: {}
        };
        
        try {
            // Check current chain
            const isRegistered = await this.registry.isAddressRegistered(chainId, evvmAddress);
            
            if (isRegistered) {
                conflicts.hasConflict = true;
                conflicts.conflictType = 'SAME_CHAIN_DUPLICATE';
                conflicts.details.chainId = chainId;
                conflicts.details.address = evvmAddress;
            }
            
            return conflicts;
            
        } catch (error) {
            return {
                hasConflict: true,
                conflictType: 'VALIDATION_ERROR',
                details: { error: error.message }
            };
        }
    }
    
    async suggestAlternatives(chainId, evvmAddress) {
        const suggestions = {
            canRegisterOnOtherChains: [],
            isAlreadyRegistered: await this.registry.isAddressRegistered(chainId, evvmAddress)
        };
        
        // Check other supported chains
        const supportedChains = await this.getSupportedChains();
        
        for (const otherChainId of supportedChains) {
            if (otherChainId !== chainId) {
                const isRegisteredElsewhere = await this.registry.isAddressRegistered(
                    otherChainId, 
                    evvmAddress
                );
                
                suggestions.canRegisterOnOtherChains.push({
                    chainId: otherChainId,
                    isAvailable: !isRegisteredElsewhere,
                    networkName: await getNetworkName(otherChainId)
                });
            }
        }
        
        return suggestions;
    }
    
    async getSupportedChains() {
        // This would need to be implemented based on known chains
        const knownChains = [11155111, 421614, 11155420, 80001, 84532];
        const supported = [];
        
        for (const chainId of knownChains) {
            const isSupported = await this.registry.isChainIdRegistered(chainId);
            if (isSupported) {
                supported.push(chainId);
            }
        }
        
        return supported;
    }
}
```

### Address Registry Scanner
```javascript
// Scan for existing registrations of an address
const scanAddressRegistrations = async (evvmAddress) => {
    const knownChains = [
        { id: 11155111, name: 'Sepolia' },
        { id: 421614, name: 'Arbitrum Sepolia' },
        { id: 11155420, name: 'Optimism Sepolia' },
        { id: 80001, name: 'Polygon Mumbai' },
        { id: 84532, name: 'Base Sepolia' }
    ];
    
    const registrations = [];
    
    for (const chain of knownChains) {
        try {
            // First check if chain is supported
            const isChainSupported = await registryContract.isChainIdRegistered(chain.id);
            
            if (isChainSupported) {
                const isRegistered = await registryContract.isAddressRegistered(
                    chain.id, 
                    evvmAddress
                );
                
                registrations.push({
                    chainId: chain.id,
                    chainName: chain.name,
                    isRegistered,
                    isSupported: true
                });
            } else {
                registrations.push({
                    chainId: chain.id,
                    chainName: chain.name,
                    isRegistered: false,
                    isSupported: false
                });
            }
            
        } catch (error) {
            registrations.push({
                chainId: chain.id,
                chainName: chain.name,
                isRegistered: false,
                isSupported: false,
                error: error.message
            });
        }
    }
    
    return {
        address: evvmAddress,
        totalRegistrations: registrations.filter(r => r.isRegistered).length,
        availableChains: registrations.filter(r => r.isSupported && !r.isRegistered).length,
        registrations
    };
};
```

### Smart Registration Form
```javascript
// Real-time registration form with conflict detection
const createSmartRegistrationForm = () => {
    return {
        async validateInput(chainId, evvmAddress) {
            const validation = {
                chainId: { isValid: true, message: '' },
                evvmAddress: { isValid: true, message: '' },
                overall: { isValid: true, canProceed: false }
            };
            
            // Validate chain ID
            if (!chainId || chainId <= 0) {
                validation.chainId.isValid = false;
                validation.chainId.message = 'Chain ID is required';
            } else {
                const isChainSupported = await registryContract.isChainIdRegistered(chainId);
                if (!isChainSupported) {
                    validation.chainId.isValid = false;
                    validation.chainId.message = 'Chain ID is not whitelisted';
                }
            }
            
            // Validate EVVM address
            if (!evvmAddress || evvmAddress === "0x0000000000000000000000000000000000000000") {
                validation.evvmAddress.isValid = false;
                validation.evvmAddress.message = 'EVVM address is required';
            } else if (!/^0x[a-fA-F0-9]{40}$/.test(evvmAddress)) {
                validation.evvmAddress.isValid = false;
                validation.evvmAddress.message = 'Invalid address format';
            } else if (validation.chainId.isValid) {
                // Check for duplicate registration
                const isAlreadyRegistered = await registryContract.isAddressRegistered(
                    chainId, 
                    evvmAddress
                );
                
                if (isAlreadyRegistered) {
                    validation.evvmAddress.isValid = false;
                    validation.evvmAddress.message = 'Address already registered on this chain';
                }
            }
            
            validation.overall.isValid = validation.chainId.isValid && validation.evvmAddress.isValid;
            validation.overall.canProceed = validation.overall.isValid;
            
            return validation;
        },
        
        async getRegistrationSuggestions(evvmAddress) {
            const suggestions = await scanAddressRegistrations(evvmAddress);
            
            return {
                availableChains: suggestions.registrations
                    .filter(r => r.isSupported && !r.isRegistered)
                    .map(r => ({ chainId: r.chainId, name: r.chainName })),
                    
                alreadyRegistered: suggestions.registrations
                    .filter(r => r.isRegistered)
                    .map(r => ({ chainId: r.chainId, name: r.chainName }))
            };
        }
    };
};
```

## Performance Optimization

### Batch Address Checking
```javascript
// Check multiple addresses efficiently
const batchCheckAddresses = async (chainId, addresses) => {
    const promises = addresses.map(async (address) => {
        try {
            const isRegistered = await registryContract.isAddressRegistered(chainId, address);
            return { address, isRegistered, error: null };
        } catch (error) {
            return { address, isRegistered: false, error: error.message };
        }
    });
    
    const results = await Promise.all(promises);
    
    return {
        chainId,
        total: addresses.length,
        registered: results.filter(r => r.isRegistered).length,
        available: results.filter(r => !r.isRegistered && !r.error).length,
        errors: results.filter(r => r.error).length,
        details: results
    };
};
```

### Cached Registration Status
```javascript
// Cache registration status to reduce contract calls
class RegistrationStatusCache {
    constructor(registryContract, ttl = 60000) { // 1 minute cache
        this.registry = registryContract;
        this.ttl = ttl;
        this.cache = new Map();
    }
    
    getCacheKey(chainId, address) {
        return `${chainId}_${address.toLowerCase()}`;
    }
    
    async isAddressRegistered(chainId, address) {
        const cacheKey = this.getCacheKey(chainId, address);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            return cached.isRegistered;
        }
        
        try {
            const isRegistered = await this.registry.isAddressRegistered(chainId, address);
            
            this.cache.set(cacheKey, {
                isRegistered,
                timestamp: Date.now()
            });
            
            return isRegistered;
            
        } catch (error) {
            console.error(`Failed to check registration for ${address} on chain ${chainId}:`, error);
            throw error;
        }
    }
    
    invalidateCache(chainId = null, address = null) {
        if (chainId && address) {
            const cacheKey = this.getCacheKey(chainId, address);
            this.cache.delete(cacheKey);
        } else {
            this.cache.clear();
        }
    }
    
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}
```

## Error Handling

### Robust Address Checking
```javascript
// Handle various error conditions gracefully
const safeCheckAddressRegistration = async (chainId, evvmAddress, options = {}) => {
    const { retries = 3, timeout = 10000 } = options;
    
    // Input validation
    if (!chainId || chainId <= 0) {
        return { success: false, error: 'Invalid chain ID' };
    }
    
    if (!evvmAddress || evvmAddress === "0x0000000000000000000000000000000000000000") {
        return { success: false, error: 'Invalid EVVM address' };
    }
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const promise = registryContract.isAddressRegistered(chainId, evvmAddress);
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeout)
            );
            
            const isRegistered = await Promise.race([promise, timeoutPromise]);
            
            return {
                success: true,
                isRegistered,
                chainId,
                evvmAddress
            };
            
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            
            if (attempt === retries) {
                return {
                    success: false,
                    error: `Failed after ${retries} attempts: ${error.message}`,
                    chainId,
                    evvmAddress
                };
            }
            
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
};
```

## Security Considerations

### Input Sanitization
```javascript
// Sanitize and validate inputs
const sanitizeAddressCheck = (chainId, evvmAddress) => {
    // Sanitize chain ID
    const numericChainId = typeof chainId === 'string' ? parseInt(chainId, 10) : chainId;
    
    if (!Number.isInteger(numericChainId) || numericChainId <= 0) {
        throw new Error('Chain ID must be a positive integer');
    }
    
    // Sanitize address
    if (typeof evvmAddress !== 'string') {
        throw new Error('EVVM address must be a string');
    }
    
    const cleanAddress = evvmAddress.trim().toLowerCase();
    
    if (!/^0x[a-f0-9]{40}$/.test(cleanAddress)) {
        throw new Error('Invalid EVVM address format');
    }
    
    return {
        chainId: numericChainId,
        evvmAddress: cleanAddress
    };
};
```

## Integration Examples

### API Endpoint
```javascript
// Express.js endpoint for registration checking
app.get('/api/registry/check/:chainId/:address', async (req, res) => {
    try {
        const { chainId, address } = req.params;
        
        // Sanitize inputs
        const sanitized = sanitizeAddressCheck(parseInt(chainId), address);
        
        // Check registration
        const result = await safeCheckAddressRegistration(
            sanitized.chainId, 
            sanitized.evvmAddress
        );
        
        if (result.success) {
            res.json({
                success: true,
                data: {
                    chainId: sanitized.chainId,
                    evvmAddress: sanitized.evvmAddress,
                    isRegistered: result.isRegistered,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to check registration status',
            details: error.message
        });
    }
});
```

## Use Cases

### Registration Validation
- **Duplicate Prevention**: Prevent multiple registrations of the same address
- **Pre-Registration Checks**: Validate before attempting registration
- **Form Validation**: Real-time validation in registration interfaces

### Address Discovery
- **Registration Scanning**: Find where an address is already registered
- **Availability Checking**: Identify available chains for new registrations
- **Cross-Chain Analysis**: Analyze address registration patterns

### Integration Services
- **API Validation**: Validate registration requests in backend services
- **Multi-Chain dApps**: Check registration status across networks
- **Registry Management**: Monitor and manage address registrations

## Related Functions

### Validation Functions
- [`isChainIdRegistered()`](./06-isChainIdRegistered.md) - Check chain support
- [`getEvvmIdMetadata()`](./01-getEvvmIdMetadata.md) - Get registration details

### Registration Functions
- [`registerEvvm()`](../02-RegistrationFunctions/01-registerEvvm.md) - Uses this for duplicate prevention
- [`sudoRegisterEvvm()`](../02-RegistrationFunctions/02-sudoRegisterEvvm.md) - Also uses this for validation

This function provides essential duplicate prevention and registration verification capabilities, ensuring the integrity of the Registry EVVM system while enabling efficient address management across multiple blockchain networks.