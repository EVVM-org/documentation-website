# EVVM Documentation

> Official documentation for EVVM (Ethereum Virtual Virtual Machine) - Infraless EVM Virtualization solving Scalability and Chain Fragmentation

[![Deployment Status](https://img.shields.io/badge/deployment-active-success)](https://evvm.info)
[![Built with Docusaurus](https://img.shields.io/badge/Built%20with-Docusaurus-blue)](https://docusaurus.io/)
[![License](https://img.shields.io/badge/license-EVVM%20Noncommercial-orange)](https://evvm.info/docs/EVVMNoncommercialLicense)

**Live Documentation:** [https://evvm.info](https://evvm.info)

## About EVVM

EVVM enables "virtual blockchains" to operate on top of host blockchains without requiring physical infrastructure management. Think of it as having your own blockchain without the operational overhead of validators, nodes, and infrastructure.

### Key Features

- **Infrastructure Decoupling**: Separate blockchain logic from physical infrastructure
- **Gasless Transactions**: Revolutionary communication methods eliminating gas fees
- **Vertical Scalability**: Multiple virtual blockchains on single host networks
- **EIP Innovation Lab**: Testing ground for Ethereum Improvement Proposals

## Documentation Features

This documentation site provides comprehensive coverage of:

- **Core Concepts**: Virtual blockchain architecture and transaction processing
- **Smart Contracts**: Complete API reference for all EVVM contracts
- **Developer Guides**: Tutorials for building EVVM services and integrations
- **Signature Structures**: EIP-191 signature formats for all operations
- **NPM Libraries**: TypeScript and Solidity libraries for EVVM development
- **LLM-Friendly Format**: AI-optimized documentation following [llmstxt.org](https://llmstxt.org) standard

## Getting Started

### Prerequisites

- **Node.js**: >= 18.0
- **npm**: Latest version

### Installation

```bash
npm install
```

### Local Development

Start the local development server with live reload:

```bash
npm start
```

This opens a browser window at `http://localhost:3000`. Most changes are reflected instantly without restarting the server.

### Building

Generate static content for production:

```bash
npm run build
```

Static files are generated in the `build/` directory. The build process includes:
- Optimized production bundles
- LLM-friendly documentation generation (`llms.txt` and `llms-full.txt`)
- Search index creation
- Math equation rendering (KaTeX)

### Testing Production Build Locally

Serve the production build locally:

```bash
npm run serve
```

Access the site at `http://localhost:3000` to verify production behavior.

## Project Structure

```
mate-docs/
├── docs/                      # Documentation content (Markdown)
│   ├── intro.md              # Introduction page
│   ├── 02-QuickStart.md      # Quick start guide
│   ├── 04-Contracts/01-EVVM/              # EVVM Core Contract docs
│   ├── 04-Contracts/03-Staking/           # Staking system docs
│   ├── 04-Contracts/02-NameService/       # Name service docs
│   ├── 04-Contracts/04-Treasury/          # Treasury and bridge docs
│   ├── 05-SignatureStructures/ # Signature format docs
│   ├── 08-RegistryEvvm/      # Registry contract docs
│   └── 07-Libraries/01-npmLibraries/      # Library documentation
├── src/                       # Custom React components
│   ├── components/           # Reusable components
│   ├── css/                  # Custom styling
│   └── pages/                # Custom pages
├── static/                    # Static assets (images, files)
├── docusaurus.config.ts      # Docusaurus configuration
├── sidebars.ts               # Sidebar structure
└── package.json              # Dependencies and scripts
```

## Documentation Guidelines

### Adding New Documentation

1. Create Markdown files in the appropriate `docs/` subdirectory
2. Use frontmatter for metadata:
   ```yaml
   ---
   sidebar_position: 1
   title: "Page Title"
   description: "SEO description"
   ---
   ```
3. Files are auto-sorted by numeric prefixes (e.g., `01-`, `02-`)
4. Sidebar structure is defined in `sidebars.ts`

### Writing Style

- Use clear, concise language
- Include code examples where applicable
- Add diagrams or images to `static/img/`
- Follow existing documentation patterns
- Use proper Markdown formatting

### Math Equations

The site supports KaTeX for mathematical notation:
- Inline math: `$equation$`
- Display math: `$$equation$$`

## LLM-Friendly Documentation

This repository automatically generates LLM-optimized documentation:

- **`/llms.txt`**: Index with links to all documentation sections (131 lines)
- **`/llms-full.txt`**: Complete documentation in single file (19,825 lines)

These files follow the [llmstxt.org](https://llmstxt.org) standard and are accessible at:
- https://evvm.info/llms.txt
- https://evvm.info/llms-full.txt

Files are automatically generated during `npm run build` via the `docusaurus-plugin-llms` plugin.

## Development Workflow

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and test locally:
   ```bash
   npm start
   ```

3. Build and verify production output:
   ```bash
   npm run build
   npm run serve
   ```

4. Commit with descriptive messages following [conventional commits](https://github.com/joelparkerhenderson/git-commit-message):
   ```bash
   git commit -m "Add documentation for new feature"
   ```

5. Push and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start development server with hot reload |
| `npm run build` | Build production static site |
| `npm run serve` | Serve production build locally |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run clear` | Clear Docusaurus cache |

## Deployment

The documentation is automatically deployed to [evvm.info](https://evvm.info) via Vercel when changes are merged to the `main` branch.

### Manual Deployment

For GitHub Pages deployment:

```bash
# Using SSH
USE_SSH=true npm run deploy

# Using HTTPS
GIT_USER=<username> npm run deploy
```

## Technology Stack

- **[Docusaurus 3.7.0](https://docusaurus.io/)**: Modern static site generator
- **[React 19](https://react.dev/)**: UI framework
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe development
- **[KaTeX](https://katex.org/)**: Math equation rendering
- **[Lunr](https://lunrjs.com/)**: Client-side search
- **[docusaurus-plugin-llms](https://github.com/rachfop/docusaurus-plugin-llms)**: LLM-friendly documentation generation

## Contributing

We welcome contributions to improve the documentation! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (both dev and production builds)
5. Submit a pull request with clear description

### Contribution Guidelines

- Follow existing documentation style and structure
- Test all changes locally before submitting
- Include screenshots for visual changes
- Update the sidebar configuration if adding new sections
- Ensure build succeeds without errors

## Resources

### EVVM Links

- **Documentation**: https://evvm.info
- **Website**: https://evvm.org
- **GitHub Organization**: https://github.com/EVVM-org
- **Twitter**: https://x.com/RollAMate

### Documentation Tools

- **Docusaurus Docs**: https://docusaurus.io/docs
- **Markdown Guide**: https://www.markdownguide.org/
- **KaTeX Docs**: https://katex.org/docs/supported.html

## License

The EVVM protocol is licensed under the EVVM Noncommercial License v1.0. See [documentation](https://evvm.info/docs/EVVMNoncommercialLicense) for details.

This documentation repository is open source and contributions are welcome.

## Support

For questions, issues, or contributions:

- **Documentation Issues**: [Create an issue](https://github.com/jistro/mate-docs/issues)
- **EVVM Protocol**: Visit [evvm.org](https://evvm.org)
- **Community**: Follow us on [Twitter](https://x.com/RollAMate)

---

Built with ❤️ for Ethereum
