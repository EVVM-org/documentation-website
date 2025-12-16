---
sidebar_position: 3
---

# Dispatch Order Signature Structure

To authorize order fulfillment operations, users must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard using the Ethereum Signed Message format.

The signature verification process uses the `SignatureUtil` library which implements the standard Ethereum message signing protocol. This signature is used for both `dispatchOrder_fillPropotionalFee` and `dispatchOrder_fillFixedFee` functions.

## Signed Message Format

The signature verification uses the `SignatureUtil.verifySignature` function with the following structure:

```solidity
SignatureUtil.verifySignature(
    evvmID,                          // EVVM ID as uint256
    "dispatchOrder",                 // Action type
    string.concat(                   // Concatenated parameters
        AdvancedStrings.uintToString(_nonce),
        ",",
        AdvancedStrings.addressToString(_tokenA),
        ",",
        AdvancedStrings.addressToString(_tokenB),
        ",",
        AdvancedStrings.uintToString(_orderId)
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
"{evvmID},dispatchOrder,{nonce},{tokenA},{tokenB},{orderId}"
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

This creates the final hash that the user must sign with their private key.

## Message Components

The signature verification takes three main parameters:

**1. EVVM ID (uint256):**
- Direct uint256 value (converted to string internally)
- *Purpose*: Identifies the specific EVVM instance

**2. Action Type (String):**
- Fixed value: `"dispatchOrder"`
- *Purpose*: Identifies this as an order fulfillment operation

**3. Concatenated Parameters (String):**
The parameters are concatenated with comma separators:

**3.1. Nonce (String):**
- The result of `AdvancedStrings.uintToString(_nonce)`
- *Purpose*: Provides replay protection for the P2P Swap transaction

**3.2. Token A Address (String):**
- The result of `AdvancedStrings.addressToString(_tokenA)`
- *Purpose*: Identifies the token offered in the target order

**3.3. Token B Address (String):**
- The result of `AdvancedStrings.addressToString(_tokenB)`
- *Purpose*: Identifies the token requested in the target order

**3.4. Order ID (String):**
- The result of `AdvancedStrings.uintToString(_orderId)`
- *Purpose*: Specifies the unique ID of the order to be fulfilled

## Example

Here's a practical example of constructing a signature message for fulfilling a swap order:

**Scenario:** User wants to fulfill order #3 in the USDC/ETH market (buying 100 USDC for 0.05 ETH)

**Parameters:**
- `evvmID`: `1` (EVVM instance ID)
- `_nonce`: `33`
- `_tokenA`: `0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000` (USDC - token being offered by seller)
- `_tokenB`: `0x0000000000000000000000000000000000000000` (ETH - token being requested by seller)
- `_orderId`: `3`

**Signature verification call:**
```solidity
SignatureUtil.verifySignature(
    1,  // evvmID as uint256
    "dispatchOrder", // action type
    "33,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,3",
    signature,
    signer
);
```

**Final message to be signed (after internal concatenation):**
```
1,dispatchOrder,33,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,3
```

**EIP-191 formatted message hash:**
```
keccak256(abi.encodePacked(
    "\x19Ethereum Signed Message:\n136",
    "1,dispatchOrder,33,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,0x0000000000000000000000000000000000000000,3"
))
```

**Concatenated parameters breakdown:**
1. `33` - P2P Swap nonce for replay protection
2. `0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000` - USDC token address (tokenA from target order)
3. `0x0000000000000000000000000000000000000000` - ETH address (tokenB from target order)
4. `3` - Order ID to be fulfilled

## Example with Reverse Token Pair

**Scenario:** User wants to fulfill order #12 in the ETH/USDC market (buying ETH with USDC)

**Parameters:**
- `evvmID`: `1`
- `_nonce`: `55`
- `_tokenA`: `0x0000000000000000000000000000000000000000` (ETH - offered by seller)
- `_tokenB`: `0xA0b86a33E6441e6e80D0c4C6C7527d72E1d00000` (USDC - requested by seller)
- `_orderId`: `12`

**Final message to be signed:**
```
1,dispatchOrder,55,0x0000000000000000000000000000000000000000,0xa0b86a33e6441e6e80d0c4c6c7527d72e1d00000,12
```

**Transaction Flow:**
- Buyer provides USDC (tokenB) + fees
- Buyer receives ETH (tokenA) from the order
- Seller receives USDC payment + fee bonus

## Usage in Both Dispatch Functions

This signature structure is used by both dispatch functions:

### dispatchOrder_fillPropotionalFee
- Uses the same signature verification
- Applies percentage-based fee calculation
- Distributes fees according to configured percentages

### dispatchOrder_fillFixedFee
- Uses identical signature verification
- Applies capped fee calculation with maximum limits
- Provides fee protection for large orders

## Signature Implementation Details

The `SignatureRecover` library performs signature verification in the following steps:

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

## Security Considerations

### Order Validation

The signature authorizes the dispatch attempt, but the contract performs additional validation:

1. **Signature Verification**: Confirms the user signed the dispatch request
2. **Order Existence**: Verifies the order exists and is active
3. **Market Validation**: Confirms the token pair matches an existing market
4. **Nonce Validation**: Ensures the nonce hasn't been used before
5. **Payment Sufficiency**: Validates the user provided enough tokens to cover order + fees

### Token Direction Understanding

The signature includes tokenA and tokenB from the **seller's perspective**:
- **tokenA**: What the seller is offering (buyer will receive)
- **tokenB**: What the seller wants (buyer must provide)
- **Order ID**: Identifies the specific order within the market

### Fee Model Independence

The same signature works for both fee models:
- **Proportional Fee**: Percentage-based calculation
- **Fixed Fee**: Capped fee with maximum limits
- **Fee Choice**: Determined by which function is called, not the signature

:::tip Technical Details

- **Message Format**: The final message follows the pattern `"{evvmID},{functionName},{parameters}"`
- **EIP-191 Compliance**: Uses `"\x19Ethereum Signed Message:\n"` prefix with message length
- **Hash Function**: `keccak256` is used for the final message hash before signing
- **Signature Recovery**: Uses `ecrecover` to verify the signature against the expected signer
- **String Conversion**: 
  - `AdvancedStrings.addressToString` converts addresses to lowercase hex with "0x" prefix
  - `Strings.toString` converts numbers to decimal strings
- **Universal Signature**: Same signature structure works for both proportional and fixed fee dispatch functions
- **Order Identification**: Token pair and order ID uniquely identify the target order
- **Buyer Authorization**: Signature proves the buyer authorizes the specific order fulfillment

:::