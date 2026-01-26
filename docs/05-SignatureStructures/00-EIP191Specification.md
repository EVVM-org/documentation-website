---
title: EIP-191 Signed Data Standard
description: Complete specification of EIP-191 Signed Data Standard used for all EVVM signature operations
sidebar_position: -1
---

# EIP-191 Signed Data Standard

This document provides the complete EIP-191 specification that underpins all EVVM signature operations.

## Abstract

EIP-191 defines a specification for handling signed data in Ethereum contracts. By defining a standard prefix, signed messages become distinguishable from valid Ethereum transactions, preventing signature reuse attacks.

## Motivation

Several multisignature wallet implementations use `ecrecover` to verify signatures. Without a standard format, signed data could be confused with valid Ethereum transactions. EIP-191 solves this by introducing a prefix that makes signed messages distinguishable.

Key issues addressed:

1. **RLP Collision Risk**: Without syntactical constraints, standard Ethereum transactions could be submitted as presigned data, since transaction components follow RLP encoding patterns.

2. **Validator Binding**: Presigned transactions weren't tied to specific validators, enabling attack scenarios where signatures from one multisig wallet could be replayed against another wallet with overlapping signers.

## Specification

### Signed Data Format

```
0x19 <1 byte version> <version specific data> <data to sign>
```

The initial `0x19` byte is chosen because:
- Valid RLP-encoded transactions never start with `0x19`
- This prevents collision between signed messages and valid transactions

### Version Bytes

| Version | EIP | Description |
|---------|-----|-------------|
| `0x00` | [191](https://eips.ethereum.org/EIPS/eip-191) | Data with intended validator |
| `0x01` | [712](https://eips.ethereum.org/EIPS/eip-712) | Structured data (typed data) |
| `0x45` | [191](https://eips.ethereum.org/EIPS/eip-191) | `personal_sign` messages |

### Version 0x00: Data with Intended Validator

```
0x19 <0x00> <intended validator address (20 bytes)> <data to sign>
```

- Used when data should only be valid for a specific contract
- Validator address binds the signature to a specific verifier

### Version 0x01: Structured Data (EIP-712)

```
0x19 <0x01> <domainSeparator (32 bytes)> <hashStruct (32 bytes)>
```

- Provides human-readable signing for complex data structures
- Domain separator includes contract address, chain ID, version
- Enables type-safe, structured signing

### Version 0x45: personal_sign (0x45 = 'E')

```
0x19 <0x45> "thereum Signed Message:\n" <message length> <message>
```

This expands to:
```
"\x19Ethereum Signed Message:\n" + len(message) + message
```

**This is the version used by EVVM** for all signature operations.

## EVVM Implementation

EVVM uses Version 0x45 (`personal_sign`) for all signature operations. The complete signing process:

### 1. Message Construction

Messages follow the format:
```
{evvmId},{functionName},{param1},{param2},...,{paramN}
```

Example for a payment:
```
1,pay,0x742c7b6b472c8f4bd58e6f9f6c82e8e6e7c82d8c,0x0000000000000000000000000000000000000000,50000000000000000,1000000000000000,42,false,0x0000000000000000000000000000000000000000
```

### 2. EIP-191 Prefix Application

The message is prefixed according to EIP-191:
```solidity
keccak256(
    abi.encodePacked(
        "\x19Ethereum Signed Message:\n",
        Strings.toString(bytes(message).length),
        message
    )
)
```

### 3. Signature Generation

The user signs the prefixed hash using their Ethereum wallet (MetaMask, etc.), producing a 65-byte signature:
- `r` (32 bytes): X-coordinate of random elliptic curve point
- `s` (32 bytes): Signature proof
- `v` (1 byte): Recovery ID (27 or 28)

### 4. On-Chain Verification

```solidity
// Reconstruct the hash
bytes32 messageHash = keccak256(
    abi.encodePacked(
        "\x19Ethereum Signed Message:\n",
        Strings.toString(bytes(message).length),
        message
    )
);

// Recover signer using ecrecover precompile
address signer = ecrecover(messageHash, v, r, s);

// Verify signer matches expected address
require(signer == expectedSigner, "Invalid signature");
```

## Security Properties

### Transaction Collision Prevention

The `0x19` prefix ensures that signed messages can never be valid RLP-encoded transactions:
- RLP lists start with `0xc0-0xff` (length prefix)
- RLP strings start with `0x00-0xbf` (length prefix)
- `0x19` indicates an RLP string of length 25, which cannot represent a valid transaction structure

### Signature Domain Separation

EIP-191 provides domain separation through:
1. **Version byte**: Distinguishes different signature schemes
2. **Message prefix**: Creates unique hash domain
3. **Chain/contract binding**: Version 0x01 binds to specific contracts

### Replay Protection

While EIP-191 prevents transaction collision, replay protection requires additional measures (implemented by EVVM through nonces):
- **Nonces**: Each signature includes a unique nonce
- **Chain binding**: EVVM ID included in message

## Code Examples

### Solidity Verification

```solidity
library SignatureRecover {
    function recoverSigner(
        string memory message,
        bytes memory signature
    ) internal pure returns (address) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n",
                Strings.toString(bytes(message).length),
                message
            )
        );

        (bytes32 r, bytes32 s, uint8 v) = splitSignature(signature);
        return ecrecover(messageHash, v, r, s);
    }

    function splitSignature(bytes memory sig)
        internal pure returns (bytes32 r, bytes32 s, uint8 v)
    {
        require(sig.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }

        if (v < 27) v += 27;
        require(v == 27 || v == 28, "Invalid v value");
    }
}
```

### JavaScript/TypeScript Signing

```typescript
import { ethers } from 'ethers';

// Using ethers.js (v5)
async function signEIP191Message(
    signer: ethers.Signer,
    message: string
): Promise<string> {
    // signMessage automatically applies EIP-191 prefix
    return await signer.signMessage(message);
}

// Example: Sign EVVM payment
const message = "1,pay,0x742c...,0x0000...,50000000000000000,1000000000000000,42,false,0x0000...";
const signature = await signEIP191Message(wallet, message);
```

### Viem Signing

```typescript
import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

const account = privateKeyToAccount('0x...');
const client = createWalletClient({
    account,
    chain: mainnet,
    transport: http()
});

// Sign with EIP-191 prefix
const signature = await client.signMessage({
    message: "1,pay,0x742c...,0x0000...,50000000000000000,1000000000000000,42,false,0x0000..."
});
```

### Off-Chain Verification

```typescript
import { ethers } from 'ethers';

function verifyEIP191Signature(
    message: string,
    signature: string,
    expectedAddress: string
): boolean {
    const recovered = ethers.utils.verifyMessage(message, signature);
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
}
```

```typescript
import { verifyMessage } from 'viem';

const valid = await verifyMessage({
    address: '0x...',
    message: "1,pay,0x742c...",
    signature: '0x...'
});
```

## References

- [EIP-191: Signed Data Standard](https://eips.ethereum.org/EIPS/eip-191)
- [EIP-712: Typed Structured Data Hashing and Signing](https://eips.ethereum.org/EIPS/eip-712)
- [Ethereum Yellow Paper - Appendix F (Signing Transactions)](https://ethereum.github.io/yellowpaper/paper.pdf)
