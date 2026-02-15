---
sidebar_position: 1
---

# Standard Staking/Unstaking Signature Structure

:::info[Signature Verification]
Staking operations use **Core.sol's centralized signature verification** via `validateAndConsumeNonce()`. The signature format follows the universal EVVM pattern with `StakingHashUtils` for hash generation.
:::

To authorize standard staking operations like `presaleStaking` or `publicStaking`, or their corresponding unstaking actions, the user must generate a cryptographic signature compliant with the [EIP-191](https://eips.ethereum.org/EIPS/eip-191) standard.

## Signature Format

### Complete Message Structure

```
{evvmId},{stakingAddress},{hashPayload},{originExecutor},{nonce},true
```

**Components:**
- `evvmId`: Chain ID (e.g., `1` for Ethereum mainnet)
- `stakingAddress`: Staking contract address (hexadecimal)
- `hashPayload`: Operation hash from StakingHashUtils (hexadecimal)
- `originExecutor`: EOA that will execute (verified with tx.origin), hexadecimal
- `nonce`: User's Core nonce for this signature
- `true`: Always async execution

### Hash Payload Generation

**Presale Staking:**
```solidity
bytes32 hashPayload = StakingHashUtils.hashDataForPresaleStake(
    isStaking,      // true = stake, false = unstake
    1               // Fixed amount: 1 token
);
// Hash: keccak256(abi.encode("presaleStaking", isStaking, 1))
```

**Public Staking:**
```solidity
bytes32 hashPayload = StakingHashUtils.hashDataForPublicStake(
    isStaking,          // true = stake, false = unstake
    amountOfStaking     // Variable amount
);
// Hash: keccak256(abi.encode("publicStaking", isStaking, amountOfStaking))
```

## Examples

### Public Staking Example (Stake 1000 tokens)

**Scenario:** User wants to stake 1000 tokens in public staking

**Parameters:**
- `evvmId`: `11155111` (Sepolia testnet)
- `stakingAddress`: `0x1234567890123456789012345678901234567890`
- `isStaking`: `true`
- `amountOfStaking`: `1000`
- `originExecutor`: `0xABCDEF1234567890ABCDEF1234567890ABCDEF12`
- `nonce`: `42`

**Step 1: Generate hash payload**
```solidity
bytes32 hashPayload = StakingHashUtils.hashDataForPublicStake(true, 1000);
// Result: 0x7a8b9c...def (example hash)
```

**Step 2: Construct message**
```
11155111,0x1234567890123456789012345678901234567890,0x7a8b9c...def,0xABCDEF1234567890ABCDEF1234567890ABCDEF12,42,true
```

**Step 3: Sign with EIP-191**
```javascript
const message = "11155111,0x1234567890123456789012345678901234567890,0x7a8b9c...def,0xABCDEF1234567890ABCDEF1234567890ABCDEF12,42,true";
const signature = await signer.signMessage(message);
```

### Presale Staking Example (Stake 1 token)

**Scenario:** Presale user wants to stake 1 token (fixed amount)

**Parameters:**
- `evvmId`: `11155111` (Sepolia testnet)
- `stakingAddress`: `0x1234567890123456789012345678901234567890`
- `isStaking`: `true`
- `amountOfStaking`: `1` (always 1 for presale)
- `originExecutor`: `0xABCDEF1234567890ABCDEF1234567890ABCDEF12`
- `nonce`: `7`

**Step 1: Generate hash payload**
```solidity
bytes32 hashPayload = StakingHashUtils.hashDataForPresaleStake(true, 1);
// Result: 0x3c4d5e...abc (example hash)
```

**Step 2: Construct message**
```
11155111,0x1234567890123456789012345678901234567890,0x3c4d5e...abc,0xABCDEF1234567890ABCDEF1234567890ABCDEF12,7,true
```

**Step 3: Sign with EIP-191**
```javascript
const message = "11155111,0x1234567890123456789012345678901234567890,0x3c4d5e...abc,0xABCDEF1234567890ABCDEF1234567890ABCDEF12,7,true";
const signature = await signer.signMessage(message);
```

### Public Unstaking Example (Unstake 500 tokens)

**Scenario:** User wants to unstake 500 tokens

**Parameters:**
- `evvmId`: `11155111`
- `stakingAddress`: `0x1234567890123456789012345678901234567890`
- `isStaking`: `false` (unstaking)
- `amountOfStaking`: `500`
- `originExecutor`: `0xABCDEF1234567890ABCDEF1234567890ABCDEF12`
- `nonce`: `43`

**Step 1: Generate hash payload**
```solidity
bytes32 hashPayload = StakingHashUtils.hashDataForPublicStake(false, 500);
// Result: 0x9e8f7a...123 (example hash)
```

**Step 2: Construct message**
```
11155111,0x1234567890123456789012345678901234567890,0x9e8f7a...123,0xABCDEF1234567890ABCDEF1234567890ABCDEF12,43,true
```

**Step 3: Sign with EIP-191**
```javascript
const message = "11155111,0x1234567890123456789012345678901234567890,0x9e8f7a...123,0xABCDEF1234567890ABCDEF1234567890ABCDEF12,43,true";
const signature = await signer.signMessage(message);
```

## Verification Process

### Core.validateAndConsumeNonce()

All staking operations use Core.sol's centralized verification:

```solidity
core.validateAndConsumeNonce(
    user,               // Signer address
    hashPayload,        // From StakingHashUtils
    originExecutor,     // EOA executor (verified with tx.origin)
    nonce,              // User's Core nonce
    true,               // Always async execution
    signature           // EIP-191 signature
);
```

**Validation Steps:**
1. **Message Construction**: Concatenates all components with commas
2. **EIP-191 Formatting**: Prepends `"\x19Ethereum Signed Message:\n"` + length
3. **Hashing**: Applies `keccak256` to formatted message
4. **Signature Recovery**: Uses `ecrecover` to recover signer address
5. **Verification**: Compares recovered address with `user`
6. **Nonce Check**: Ensures nonce hasn't been used
7. **Executor Check**: Verifies `tx.origin == originExecutor`
8. **Consume Nonce**: Marks nonce as used to prevent replay

**On Failure:**
- `Core__InvalidSignature()` - Invalid signature
- `Core__NonceAlreadyUsed()` - Nonce already consumed
- `Core__InvalidExecutor()` - Executing EOA doesn't match originExecutor

:::tip Technical Details

- **Universal Format**: All EVVM services now use the same signature format
- **Centralized Nonces**: Core.sol manages all nonces across services
- **Hash Security**: StakingHashUtils generates collision-resistant hashes
- **EOA Verification**: originExecutor ensures only specific EOA can execute
- **Always Async**: Staking operations always use async execution mode
- **Replay Protection**: Core.sol's nonce system prevents replay attacks
- **Operation Types**: `presaleStaking` (1 token fixed) vs `publicStaking` (variable)

:::
