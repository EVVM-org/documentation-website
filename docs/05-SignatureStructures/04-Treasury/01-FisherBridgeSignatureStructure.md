---
sidebar_position: 1
---

# Fisher Bridge Signature Structure

To authorize cross-chain treasury operations through the Fisher Bridge system, users must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. The signature authorizes fisher executors to process cross-chain deposits and withdrawals on behalf of users, enabling gasless transactions and seamless multi-chain asset management.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                                             // EVVM ID as uint256
    "fisherBridge",                                     // Action type
    string.concat(                                      // Concatenated parameters
        AdvancedStrings.addressToString(addressToReceive),
        ",",
        AdvancedStrings.uintToString(nonce),
        ",",
        AdvancedStrings.addressToString(tokenAddress),
        ",",
        AdvancedStrings.uintToString(priorityFee),
        ",",
        AdvancedStrings.uintToString(amount)
    ),
    signature,
    signer
);
```

### Internal Message Construction

Internally, the `SignatureUtil.verifySignature` function constructs the final message by concatenating:

```solidity
string.concat(AdvancedStrings.uintToString(evvmID), ",", functionName, ",", inputs)
```

This results in a message format:
```
"{evvmID},fisherBridge,{addressToReceive},{nonce},{tokenAddress},{priorityFee},{amount}"
```

### EIP-191 Message Hashing

The message is then hashed according to EIP-191 standard:

```solidity
bytes32 messageHash = keccak256(
    abi.encodePacked(
        "\x19Ethereum Signed Message:\n",
        AdvancedStrings.uintToString(bytes(message).length),
        message
    )
);
```

## Message Components

The signature verification takes three main parameters:

**1. EVVM ID (uint256):**
- Direct uint256 value (converted to string internally)
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"fisherBridge"`
- *Purpose*: Identifies this as a Fisher Bridge cross-chain operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Recipient Address (String):**
- The result of `AdvancedStrings.addressToString(addressToReceive)`
- *Purpose*: Specifies the address that will receive the assets or EVVM balance credit
- *Note*: This can be different from the signer address, allowing flexible recipient designation

**3.2. Nonce (String):**
- The result of `AdvancedStrings.uintToString(nonce)`
- *Purpose*: Provides replay protection for the transaction
- *Source*: Current value from `nextFisherExecutionNonce[signer]` mapping

**3.3. Token Address (String):**
- The result of `AdvancedStrings.addressToString(tokenAddress)`
- *Purpose*: Identifies the token being transferred
- *Special Case*: `address(0)` represents native blockchain coins (ETH, MATIC, BNB, etc.)

**3.4. Priority Fee (String):**
- The result of `AdvancedStrings.uintToString(priorityFee)`
- *Purpose*: Specifies the fee paid to the fisher executor for processing the transaction
- *Note*: Can be `0` if no priority fee is offered

**3.5. Amount (String):**
- The result of `AdvancedStrings.uintToString(amount)`
- *Purpose*: Specifies the quantity of tokens/coins to be transferred

## Usage Scenarios

### External Chain to EVVM Deposit
Users on external chains sign messages to authorize fisher executors to deposit their assets into EVVM.

### EVVM to External Chain Withdrawal
Users sign messages to authorize fisher executors to withdraw assets from EVVM to external chains.

## Example Scenarios

### Example 1: USDC Deposit from Ethereum to EVVM

**Scenario:** User wants to deposit 100 USDC from Ethereum to EVVM with 1 USDC priority fee

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `addressToReceive`: `0x742d35Cc6634C0532925a3b8D43C1C16bE8c9123` (recipient in EVVM)
- `nonce`: `5` (current fisher execution nonce for user)
- `tokenAddress`: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` (USDC contract)
- `priorityFee`: `1000000` (1 USDC with 6 decimals)
- `amount`: `100000000` (100 USDC with 6 decimals)

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,              // evvmID as uint256
    "fisherBridge", // action type
    "0x742d35cc6634c0532925a3b8d43c1c16be8c9123,5,0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48,1000000,100000000",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,fisherBridge,0x742d35cc6634c0532925a3b8d43c1c16be8c9123,5,0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48,1000000,100000000
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n119",
    "1,fisherBridge,0x742d35cc6634c0532925a3b8d43c1c16be8c9123,5,0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48,1000000,100000000"
))
```

**Concatenated parameters breakdown:**
1. `0x742d35cc6634c0532925a3b8d43c1c16be8c9123` - Recipient address (lowercase with 0x prefix)
2. `5` - Current nonce
3. `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48` - USDC token address (lowercase with 0x prefix)
4. `1000000` - Priority fee (1 USDC)
5. `100000000` - Amount (100 USDC)

### Example 2: ETH Withdrawal from EVVM to Ethereum

**Scenario:** User wants to withdraw 0.5 ETH from EVVM to Ethereum with 0.01 ETH priority fee

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `addressToReceive`: `0x9876543210987654321098765432109876543210` (recipient on Ethereum)
- `nonce`: `12` (current fisher execution nonce for user)
- `tokenAddress`: `0x0000000000000000000000000000000000000000` (native ETH)
- `priorityFee`: `10000000000000000` (0.01 ETH in wei)
- `amount`: `500000000000000000` (0.5 ETH in wei)

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,              // evvmID as uint256
    "fisherBridge", // action type
    "0x9876543210987654321098765432109876543210,12,0x0000000000000000000000000000000000000000,10000000000000000,500000000000000000",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,fisherBridge,0x9876543210987654321098765432109876543210,12,0x0000000000000000000000000000000000000000,10000000000000000,500000000000000000
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n129",
    "1,fisherBridge,0x9876543210987654321098765432109876543210,12,0x0000000000000000000000000000000000000000,10000000000000000,500000000000000000"
))
```

**Concatenated parameters breakdown:**
1. `0x9876543210987654321098765432109876543210` - Recipient address (lowercase with 0x prefix)
2. `12` - Current nonce
3. `0x0000000000000000000000000000000000000000` - Native coin representation (address(0))
4. `10000000000000000` - Priority fee (0.01 ETH)
5. `500000000000000000` - Amount (0.5 ETH)

## Security Considerations

### Nonce Management
- **Sequential Processing**: Nonces must be used in sequential order
- **Cross-Chain Synchronization**: Both host and external chain stations track the same nonce sequence
- **Replay Protection**: Each nonce can only be used once per user

### Signature Binding
- **Parameter Integrity**: All transaction parameters are included in the signed message
- **Address Verification**: Signer address is cryptographically verified during signature validation
- **Message Format**: Exact message format must be maintained for successful verification

### Priority Fee Security
- **Optional Fee**: Priority fee can be set to `0` if no incentive is offered
- **Fisher Incentive**: Higher priority fees may result in faster processing
- **Fee Distribution**: Priority fees are typically credited to fisher executor's balance

## Implementation Notes

### Address Formatting
- Uses `AdvancedStrings.addressToString()` for consistent address representation
- Addresses are converted to lowercase hex strings **with** `0x` prefix (lowercased)
- Ensures compatibility across different blockchain environments

### Nonce Tracking
- Each user has an independent nonce sequence tracked in `nextFisherExecutionNonce` mapping
- Nonces increment after each successful fisher bridge operation
- Both host and external chain stations must maintain synchronized nonce values

### Cross-Chain Coordination
- Same signature format used on both host and external chains
- Enables verification on both sides of the cross-chain transaction
- Supports multiple interoperability protocols (Hyperlane, LayerZero, Axelar)

## Verification Function

The signature verification is performed using the `SignatureUtils.verifyMessageSignedForFisherBridge()` function:

```solidity
function verifyMessageSignedForFisherBridge(
    uint256 evvmID,
    address signer,
    address addressToReceive,
    uint256 nonce,
    address tokenAddress,
    uint256 priorityFee,
    uint256 amount,
    bytes memory signature
) internal pure returns (bool)
```

This function uses the higher-level `SignatureUtil.verifySignature()` (which internally uses `SignatureRecover` primitives) to reconstruct the message string using the provided parameters and verifies that the signature was created by the specified signer address using EIP-191 standard verification.

## Signature Implementation Details

The lower-level `SignatureRecover` primitives (used internally by `SignatureUtil`) perform signature recovery in the following steps:

1. **Message Construction**: Concatenates `evvmID`, `functionName`, and `inputs` with commas
2. **EIP-191 Formatting**: Prepends `"\x19Ethereum Signed Message:\n"` + message length
3. **Hashing**: Applies `keccak256` to the formatted message
4. **Signature Parsing**: Splits the 65-byte signature into `r`, `s`, and `v` components
5. **Recovery**: Uses `ecrecover` to recover the signer's address
6. **Verification**: Compares recovered address with expected signer

### Signature Format Requirements

- **Length**: Exactly 65 bytes
- **Structure**: `[r (32 bytes)][s (32 bytes)][v (1 byte)]`
- **V Value**: Must be 27 or 28 (automatically adjusted if < 27)

:::tip Technical Details

- **Message Format**: The final message follows the pattern `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Hash Function**: `keccak256` is used for the final message hash before signing
- **Signature Recovery**: Uses `ecrecover` to verify the signature against the expected signer
- **Address Format**: `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
- **Cross-Chain Compatibility**: Same signature format used on both host and external chains
- **Fisher Incentives**: Higher priority fees may result in faster processing by fisher executors
- **Flexible Recipients**: `addressToReceive` can differ from signer for flexible asset management
- **Native Token Support**: `address(0)` represents native blockchain coins (ETH, MATIC, BNB, etc.)
- **Nonce Management**: Sequential nonce processing prevents replay attacks across chains
- **EVVM ID**: Identifies the specific EVVM instance for signature verification

:::

:::info[EIP-191 Compliance]
All Fisher Bridge signatures follow the EIP-191 "Signed Data Standard" ensuring compatibility with standard Ethereum wallets and signing tools. The message is prefixed with `"\x19Ethereum Signed Message:\n"` during the signing process.
:::

:::warning[Exact Format Required]
The message format must be followed exactly for signature verification to succeed. Any deviation in parameter ordering, formatting, or separators will cause verification failures and transaction rejection.
:::