---
title: "Withdrawal Signature Structure"
description: "Planned EIP-191 signature format for withdrawal operations from Core.sol balance to external addresses"
sidebar_position: 3
---

# Withdrawal Signature Structure (Coming Soon)

:::warning[Not Yet Implemented]
**Withdrawal functionality is planned for a future release.**

Withdrawal signatures will follow the centralized verification pattern when implemented, using Core.sol's `validateAndConsumeNonce()` system.
:::

Withdrawal operations will allow users to withdraw funds from their Core.sol balance to external addresses. When implemented, withdrawals will use the same signature architecture as other EVVM operations.

## Expected Signature Format

When implemented, withdrawal signatures will follow the standard format:

```
{evvmId},{serviceAddress},{hashPayload},{executor},{nonce},{isAsyncExec}
```

**Components:**
1. **evvmId**: Network identifier (uint256, typically `1`)
2. **serviceAddress**: Core.sol contract address
3. **hashPayload**: Hash of withdrawal parameters (bytes32, from CoreHashUtils)
4. **executor**: Address authorized to execute (address, `0x0...0` for unrestricted)
5. **nonce**: User's centralized nonce from Core.sol (uint256)
6. **isAsyncExec**: Execution mode - `true` for async, `false` for sync (boolean)

## Expected Hash Payload Generation

A future `CoreHashUtils.hashDataForWithdraw()` function will likely generate the hash payload:

```solidity
// Expected implementation (not yet available)
bytes32 hashPayload = CoreHashUtils.hashDataForWithdraw(
    recipient,      // External address to receive withdrawal
    token,          // ERC20 token address (0x0...0 for ETH)
    amount,         // Amount to withdraw
    priorityFee     // Fee amount
);
```

## Expected Verification

Core.sol will verify withdrawal signatures using the standard `validateAndConsumeNonce()` function:

```solidity
// Expected implementation
Core(coreAddress).validateAndConsumeNonce(
    user,          // Signer's address
    hashPayload,   // From CoreHashUtils
    executor,      // Who can execute
    nonce,         // User's nonce
    isAsyncExec,   // Execution mode
    signature      // EIP-191 signature
);
```

## Implementation Status

**Current Status:** Not yet implemented

**Planned Features:**
- Withdraw from Core.sol balance to external addresses
- Centralized signature verification via Core.sol
- Integration with cross-chain bridges (Axelar, LayerZero)
- Support for both ETH and ERC20 tokens
- Username resolution for withdrawal destinations

## Related Operations

- **[Single Payment Signatures](./01-SinglePaymentSignatureStructure.md)** - Standard payments
- **[Disperse Payment Signatures](./02-DispersePaySignatureStructure.md)** - Multi-recipient payments
- **[Core.sol Payment Functions](../../04-Contracts/01-EVVM/04-PaymentFunctions/01-pay.md)** - Current payment operations

---

:::info[Stay Updated]
This documentation will be updated when withdrawal functionality is implemented in a future EVVM release. The signature format will follow the centralized verification architecture.

**This structure is speculative** and based on the pattern used in the implemented payment functions:

- **Expected Message Format**: `"{evvmID},{functionName},{parameters}"`
- **Expected EIP-191 Compliance**: Would use `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Expected Hash Function**: `keccak256` would be used for the final message hash before signing
- **Expected Signature Recovery**: Would use `ecrecover` to verify the signature against the expected signer
- **String Conversion**:
  - `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Priority Flag**: Would determine execution mode (async=`true`, sync=`false`)
- **EVVM ID**: Would identify the specific EVVM instance for signature verification
- **Bridge Integration**: `addressToReceive` would specify the destination on external network

**Note**: The actual implementation may differ from this expected structure when withdrawal functionality is added to SignatureUtils.sol.

:::
