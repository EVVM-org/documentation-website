import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "EVVM",
  tagline:
    "Infraless EVM Virtualization solving Scalability and Chain Fragmentation",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://evvm.info",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "EVVM", // Usually your GitHub org/user name.
  projectName: "EVVM-Docs", // Usually your repo name.

  onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
  stylesheets: [
    {
      href: 'https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM',
      crossorigin: 'anonymous',
    },
  ],
  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/EVVM-org/documentation-website/tree/main/",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            "https://github.com/EVVM-org/tree/main/packages/create-docusaurus/templates/shared/",
          // Useful options to enforce blogging best practices
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        docsDir: 'docs',
        excludeImports: true,
        removeDuplicateHeadings: true,
        title: 'EVVM Documentation',
        description: 'Complete technical documentation for EVVM (Ethereum Virtual Virtual Machine) - Infraless EVM Virtualization solving Scalability and Chain Fragmentation',
        version: '1.0.0',
        rootContent: `EVVM enables virtual blockchains on top of host blockchains without physical infrastructure management.

Key concepts:
- Virtual Blockchain Infrastructure: Deploy blockchains without managing validators or nodes
- Gasless Transactions: Users sign messages, Fishers execute on-chain
- Fisher Network: Operators who execute transactions and earn MATE token rewards
- EIP-191 Signatures: All operations use cryptographic signatures for authorization

Production URL: https://www.evvm.info
Full documentation for AI agents: https://www.evvm.info/llms-full.txt`,
        fullRootContent: `This document contains the complete EVVM technical documentation optimized for AI agents and LLMs.

EVVM (Ethereum Virtual Virtual Machine) enables virtual blockchains on top of host blockchains without physical infrastructure management.

## Key Concepts

- **Virtual Blockchain**: Blockchain logic decoupled from physical infrastructure
- **Fishers**: Network operators who execute signed transactions and earn MATE rewards
- **Gasless UX**: Users never pay gas fees - they sign messages, Fishers execute on-chain
- **EIP-191 Signatures**: All operations are authorized via cryptographic signatures
- **MATE Token**: Native principal token for payments and staking rewards
- **Staking System**: Era-based rewards with golden, presale, public, and service staking tiers

## Documentation Structure

1. **QuickStart** - Deploy your own EVVM in minutes
2. **Transaction Process** - How transactions flow through EVVM
3. **Contracts** - Core smart contract documentation (EVVM, NameService, Staking, Treasury, P2PSwap)
4. **Signature Structures** - EIP-191 signature formats for all operations
5. **Libraries** - TypeScript and Solidity libraries for EVVM development
6. **Registry** - EVVM registration and governance
7. **CLI** - Command-line deployment tools

Production URL: https://www.evvm.info`,
        includeOrder: [
          '01-intro',
          '02-QuickStart',
          '03-ProcessOfATransaction',
          '04-Contracts/**',
          '05-SignatureStructures/**',
          '06-HowToMakeAEVVMService',
          '07-Libraries/**',
          '08-RegistryEvvm/**',
          '09-evvmCli/**',
          '99-EVVMNoncommercialLicense'
        ],
        includeUnmatchedLast: true,
        keepFrontMatter: ['title', 'description', 'sidebar_position']
      }
    ],
    require.resolve('docusaurus-lunr-search')
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/backgroundBanner.jpg",
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: "EVVM",
      logo: {
        alt: "EVVM logo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "docsSidebar",
          position: "left",
          label: "Docs",
        },
        /*
          { to: "/blog", label: "Blog", position: "left" },
        */
        {
          href: "https://github.com/EVVM-org",
          label: "GitHub",
          position: "right",
        },
        {
          label: "llms-full.txt",
          to: "https://evvm.info/llms-full.txt",
          position: "right",
        }
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Docs",
              to: "/docs/intro",
            },
          ],
        },
        {
          title: "Community",
          items: [
            {
              label: "X",
              href: "https://x.com/RollAMate",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Website",
              href: "https://evvm.info/",
            },
            {
              label: "GitHub",
              href: "https://github.com/EVVM-org",
            },
          ],
        },
      ],
      copyright: `© 2025 EVVM. Built with ❤️ for Ethereum`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
