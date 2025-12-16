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
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
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
        title: 'EVVM',
        description: 'Infraless EVM Virtualization solving Scalability and Chain Fragmentation',
        includeOrder: [
          'intro',
          '02-QuickStart',
          '03-ProcessOfATransaction',
          '04-Contracts/**/*',
          '05-SignatureStructures/**/*',
          '06-HowToMakeAEVVMService',
          '07-Libraries/**/*',
          '08-RegistryEvvm/**/*',
          '09-evvmCli/**/*'
        ]
      }
    ],
    require.resolve('docusaurus-lunr-search')
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/backgroundBanner.jpg",
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
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
