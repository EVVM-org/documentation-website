---
sidebar_position: 6
---

# Developer Command

Developer utilities and helpers for EVVM contract development.

## Command

```bash
./evvm developer [options]
```

## Description

The `developer` command provides utilities for EVVM developers working with smart contracts. It includes tools for generating interfaces, running tests, and other development workflows.

:::info
This command is primarily intended for EVVM core developers and advanced users who need to work with contract interfaces or modify EVVM contracts.
:::

## Options

### `--makeInterface`, `-i`

Generate Solidity interfaces for EVVM contracts.

- **Type**: `boolean`
- **Default**: `false`
- **Usage**: `./evvm developer --makeInterface`

This option:
1. Analyzes compiled EVVM contracts
2. Extracts public/external functions
3. Generates `.sol` interface files
4. Useful for integration and testing

## Usage Examples

### Generate Contract Interfaces

```bash
./evvm developer --makeInterface
```

This command will:
- Read compiled contract artifacts
- Generate interface files for all EVVM contracts
- Save interfaces to the appropriate directory

**Output:**
```
Generating contract interfaces...
✓ IEvvm.sol
✓ INameService.sol
✓ IStaking.sol
✓ IEstimator.sol
✓ ITreasury.sol
✓ IP2PSwap.sol

Interfaces generated successfully!
```

## Use Cases

### For Integration Developers

Generate interfaces to:
- Build external contracts that interact with EVVM
- Create mock contracts for testing
- Ensure type-safe contract interactions

### For Core Developers

Generate interfaces to:
- Update contract interfaces after modifications
- Maintain consistency across contracts
- Document public contract APIs

## Future Commands

The `developer` command will be expanded with additional utilities:

- **Run full test suite** - Execute all contract tests
- **Run specific service tests** - Test individual components
- **Run unit tests** - Execute unit test suites
- **Run fuzz tests** - Execute fuzz testing

:::tip[Coming Soon]
More developer utilities are being added. Check `./evvm help` for the latest available commands.
:::

## Related Commands

- [`deploy`](./02-Deploy.md) - Deploy EVVM contracts
- [`help`](./04-HelpAndVersion.md) - Display all CLI commands

## Examples

### Complete Development Workflow

1. Generate interfaces:
   ```bash
   ./evvm developer --makeInterface
   ```

2. Deploy to local testnet:
   ```bash
   ./evvm deploy --skipInputConfig
   ```

3. Test integration:
   ```bash
   # Use generated interfaces in your test contracts
   ```

## Prerequisites

Before using developer commands:

- **Foundry** - Required for contract compilation
- **Bun** - Required for CLI execution
- **Compiled contracts** - Run `forge build` before generating interfaces

## Troubleshooting

### Contracts Not Compiled

If interface generation fails:

```
Error: No compiled contracts found
```

**Solution**: Compile contracts first:
```bash
forge build
```

### Permission Issues

If file writing fails:

**Solution**: Ensure you have write permissions in the project directory.

## Best Practices

1. **Regenerate after changes**: Always regenerate interfaces after modifying contracts
2. **Version control**: Commit generated interfaces to version control
3. **Testing**: Use generated interfaces in test contracts for type safety
4. **Documentation**: Interfaces serve as contract API documentation
