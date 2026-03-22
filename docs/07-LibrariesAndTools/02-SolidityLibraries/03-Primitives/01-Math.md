---
title: "Math Library"
description: "Standard mathematical operations with overflow protection based on OpenZeppelin"
sidebar_position: 1
---

# Math Library

The `Math` library provides standard mathematical utilities missing in Solidity, based on OpenZeppelin's implementation. It includes safe arithmetic operations, rounding functions, and advanced mathematical operations with overflow protection.

## Overview

**Library Type**: Pure functions  
**License**: MIT (OpenZeppelin)  
**Import Path**: `@evvm/testnet-contracts/library/primitives/Math.sol`  
**Version**: Based on OpenZeppelin v5.0.0

### Key Features

- **Overflow-safe operations** with try* functions
- **Rounding control** for division operations
- **Min/max comparisons**
- **Advanced operations** (sqrt, log, mulDiv)
- **Gas-optimized** implementations

## Enums

### `Rounding`
```solidity
enum Rounding {
    Floor,   // Toward negative infinity
    Ceil,    // Toward positive infinity
    Trunc,   // Toward zero
    Expand   // Away from zero
}
```

Controls rounding behavior for division and advanced operations.

## Basic Arithmetic (Try Functions)

These functions return `(bool success, uint256 result)` to handle overflows gracefully.

### `tryAdd`
```solidity
function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

**Description**: Safe addition with overflow check

**Returns**: 
- `success`: `true` if no overflow, `false` otherwise
- `result`: Sum if successful, `0` if overflow

**Example**:
```solidity
(bool success, uint256 sum) = Math.tryAdd(100, 50);
if (success) {
    // sum = 150
}

(bool overflow, uint256 invalid) = Math.tryAdd(type(uint256).max, 1);
// overflow = false, invalid = 0
```

### `trySub`
```solidity
function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

**Description**: Safe subtraction with underflow check

**Returns**:
- `success`: `true` if `a >= b`, `false` otherwise
- `result`: Difference if successful, `0` if underflow

**Example**:
```solidity
(bool success, uint256 diff) = Math.trySub(100, 50);
// success = true, diff = 50

(bool underflow, uint256 invalid) = Math.trySub(50, 100);
// underflow = false, invalid = 0
```

### `tryMul`
```solidity
function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

**Description**: Safe multiplication with overflow check

**Example**:
```solidity
(bool success, uint256 product) = Math.tryMul(10, 20);
// success = true, product = 200

(bool overflow, ) = Math.tryMul(type(uint256).max, 2);
// overflow = false
```

### `tryDiv`
```solidity
function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

**Description**: Safe division with zero-check

**Returns**:
- `success`: `true` if `b != 0`, `false` if division by zero
- `result`: Quotient if successful, `0` if division by zero

**Example**:
```solidity
(bool success, uint256 quotient) = Math.tryDiv(100, 5);
// success = true, quotient = 20

(bool divByZero, ) = Math.tryDiv(100, 0);
// divByZero = false
```

### `tryMod`
```solidity
function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256)
```

**Description**: Safe modulo with zero-check

**Example**:
```solidity
(bool success, uint256 remainder) = Math.tryMod(100, 30);
// success = true, remainder = 10
```

## Comparison Functions

### `max`
```solidity
function max(uint256 a, uint256 b) internal pure returns (uint256)
```

**Description**: Returns the larger of two numbers

**Example**:
```solidity
uint256 maxValue = Math.max(100, 200);
// maxValue = 200
```

### `min`
```solidity
function min(uint256 a, uint256 b) internal pure returns (uint256)
```

**Description**: Returns the smaller of two numbers

**Example**:
```solidity
uint256 minValue = Math.min(100, 200);
// minValue = 100
```

### `average`
```solidity
function average(uint256 a, uint256 b) internal pure returns (uint256)
```

**Description**: Returns the average of two numbers, rounded towards zero

**Implementation**: `(a & b) + (a ^ b) / 2` (prevents overflow)

**Example**:
```solidity
uint256 avg = Math.average(100, 200);
// avg = 150

uint256 avgOdd = Math.average(100, 201);
// avgOdd = 150 (rounded down)
```

## Advanced Operations

### `sqrt`
```solidity
function sqrt(uint256 a) internal pure returns (uint256)
function sqrt(uint256 a, Rounding rounding) internal pure returns (uint256)
```

**Description**: Calculates the square root with optional rounding

**Example**:
```solidity
uint256 root = Math.sqrt(144);
// root = 12

uint256 rootFloor = Math.sqrt(150, Math.Rounding.Floor);
// rootFloor = 12

uint256 rootCeil = Math.sqrt(150, Math.Rounding.Ceil);
// rootCeil = 13
```

### `log10`
```solidity
function log10(uint256 value) internal pure returns (uint256)
function log10(uint256 value, Rounding rounding) internal pure returns (uint256)
```

**Description**: Calculates log₁₀(value) with optional rounding

**Example**:
```solidity
uint256 log = Math.log10(1000);
// log = 3

uint256 logFloor = Math.log10(1500, Math.Rounding.Floor);
// logFloor = 3

uint256 logCeil = Math.log10(1500, Math.Rounding.Ceil);
// logCeil = 4
```

### `log2`
```solidity
function log2(uint256 value) internal pure returns (uint256)
function log2(uint256 value, Rounding rounding) internal pure returns (uint256)
```

**Description**: Calculates log₂(value) with optional rounding

**Example**:
```solidity
uint256 log = Math.log2(256);
// log = 8

uint256 log = Math.log2(100);
// log = 6 (2^6 = 64, 2^7 = 128)
```

### `log256`
```solidity
function log256(uint256 value) internal pure returns (uint256)
function log256(uint256 value, Rounding rounding) internal pure returns (uint256)
```

**Description**: Calculates log₂₅₆(value) with optional rounding

### `mulDiv`
```solidity
function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256)
function mulDiv(uint256 x, uint256 y, uint256 denominator, Rounding rounding) internal pure returns (uint256)
```

**Description**: Calculates `(x * y) / denominator` with full precision (512-bit intermediate result)

**Reverts**: `MathOverflowedMulDiv()` if result overflows or denominator is zero

**Use Case**: Prevents overflow in `(a * b) / c` calculations

**Example**:
```solidity
// Calculate percentage: (amount * 15) / 100
uint256 result = Math.mulDiv(1000 ether, 15, 100);
// result = 150 ether

// With rounding
uint256 resultCeil = Math.mulDiv(1000 ether, 15, 100, Math.Rounding.Ceil);
```

## Common Use Cases

### Use Case 1: Safe Arithmetic in Services
```solidity
contract Service {
    function calculateReward(uint256 baseReward, uint256 multiplier) public pure returns (uint256) {
        (bool success, uint256 reward) = Math.tryMul(baseReward, multiplier);
        require(success, "Reward overflow");
        return reward;
    }
}
```

### Use Case 2: Percentage Calculations
```solidity
function calculateFee(uint256 amount, uint256 feePercentage) internal pure returns (uint256) {
    // Calculate fee with precision: (amount * feePercentage) / 10000
    // Supports up to 0.01% precision
    return Math.mulDiv(amount, feePercentage, 10000);
}

// Example: 2.5% fee on 1000 tokens
uint256 fee = calculateFee(1000, 250); // 250 = 2.5% * 100
// fee = 25
```

### Use Case 3: Finding Min/Max Values
```solidity
function clampValue(uint256 value, uint256 minVal, uint256 maxVal) internal pure returns (uint256) {
    return Math.min(Math.max(value, minVal), maxVal);
}

uint256 clamped = clampValue(150, 100, 120);
// clamped = 120 (capped at max)
```

### Use Case 4: Logarithmic Scaling
```solidity
function calculateTier(uint256 amount) internal pure returns (uint256) {
    if (amount == 0) return 0;
    
    // Tier increases logarithmically with amount
    return Math.log10(amount, Math.Rounding.Floor);
}

uint256 tier1 = calculateTier(100);    // tier = 2
uint256 tier2 = calculateTier(1000);   // tier = 3
uint256 tier3 = calculateTier(10000);  // tier = 4
```

## Error Handling

### `MathOverflowedMulDiv`
```solidity
error MathOverflowedMulDiv();
```

**Thrown by**: `mulDiv` functions  
**Reason**: Result overflows uint256 or denominator is zero

**Example**:
```solidity
try Math.mulDiv(type(uint256).max, 2, 1) returns (uint256) {
    // Won't reach here
} catch {
    // Catches MathOverflowedMulDiv
}
```

## Best Practices

### 1. Use Try Functions for User Input
```solidity
// Good - handle overflow gracefully
function addUserAmounts(uint256 a, uint256 b) external pure returns (uint256) {
    (bool success, uint256 sum) = Math.tryAdd(a, b);
    require(success, "Amount overflow");
    return sum;
}

// Bad - unchecked addition can overflow
function addUserAmounts(uint256 a, uint256 b) external pure returns (uint256) {
    return a + b; // Can silently overflow
}
```

### 2. Use mulDiv for Precision
```solidity
// Good - maintains precision
uint256 result = Math.mulDiv(largeAmount, percentage, 100);

// Bad - can overflow or lose precision
uint256 result = (largeAmount * percentage) / 100; // Overflow risk
```

### 3. Choose Appropriate Rounding
```solidity
// For user-favorable rounding (fees)
uint256 fee = Math.mulDiv(amount, feeRate, 10000, Math.Rounding.Floor);

// For protocol-favorable rounding (rewards)
uint256 reward = Math.mulDiv(stake, rate, 10000, Math.Rounding.Ceil);
```

## Gas Considerations

- **Try functions**: ~50-100 gas overhead vs unchecked operations
- **mulDiv**: More expensive than simple division but prevents overflow
- **log functions**: ~200-500 gas depending on input size
- **sqrt**: ~150-300 gas depending on input size

## Integration with EVVM

The Math library is used internally by:
- **AdvancedStrings**: `log10` for uint to string conversion
- **Staking**: `mulDiv` for reward calculations
- **Treasury**: Safe arithmetic for fee calculations

---

## See Also

- **[AdvancedStrings](../04-Utils/01-AdvancedStrings.md)** - Uses Math.log10
- **[Staking Contract](../../../04-Contracts/03-Staking/01-Overview.md)** - Uses Math for reward calculations
- [OpenZeppelin Math Documentation](https://docs.openzeppelin.com/contracts/5.x/api/utils#Math)
