import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import Heading from "@theme/Heading";

import styles from "./index.module.css";

function CustomHeader() {
  return (
    <header className={styles.customHeader}>
      <div className={styles.headerContainer}>
          <img
            src="/img/evvm-logo.svg"
            alt="EVVM Logo"
            className={styles.logoImage}
          />
        <div className={styles.headerButtons}>
          <Link
            className={styles.headerButton}
            to="/docs/QuickStart"
          >
            QuickStart
          </Link>
          <Link
            className={styles.headerButton}
            to="/docs/intro"
          >
            Docs
          </Link>
          <a
            className={styles.headerButton}
            href="https://github.com/EVVM-org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github
          </a>
          <a
            className={styles.headerButton}
            href="https://evvm.info/llms-full.txt"
            target="_blank"
            rel="noopener noreferrer"
          >
            llms-full.txt
            
          </a>
          <a
            className={styles.headerButton}
            href="https://evvm.dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tooling
          </a>
          <a
            className={styles.headerButton}
            href="https://evvm.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website
          </a>
          
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const [currentVideoUrl, setCurrentVideoUrl] = useState("https://www.youtube-nocookie.com/embed/uBjvoH5tpJk?si=hKAAqEABL7INATFx");

  const videoButtons = [
    {
      thumbnail: "https://img.youtube.com/vi/uBjvoH5tpJk/mqdefault.jpg",
      alt: "EVVM for Beginners",
      videoUrl: "https://www.youtube-nocookie.com/embed/uBjvoH5tpJk?si=hKAAqEABL7INATFx",
    },
    {
      thumbnail: "https://img.youtube.com/vi/b40vNFatHgg/mqdefault.jpg",
      alt: "EVVM from Scratch",
      videoUrl: "https://www.youtube-nocookie.com/embed/b40vNFatHgg",
    },
    
  ];

  return (
    <section className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <h1 className={styles.heroTitle}>
          Deploy a <span className={styles.highlight}>Virtual Blockchain</span> or <br />
          build on top of one!
        </h1>
        <div className={styles.heroButtons}>
          <Link className={styles.heroButton} to="/docs/QuickStart">
            QuickStart
          </Link>
          <Link className={styles.heroButton} to="/docs/intro">
            Full Docs
          </Link>
          <a 
            className={styles.heroButton} 
            href="https://evvm.dev" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Dev Tooling
          </a>
          <a 
            className={styles.heroButton} 
            href="https://github.com/EVVM-org" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            GitHub Repo
          </a>
          <a 
            className={styles.heroButton} 
            href="https://evvm.info/llms-full.txt" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            llms-full.txt
          </a>
        </div>

        <div className={styles.videoCard}>
          <div className={styles.videoThumbnail}>
            <iframe
              width="100%"
              height="100%"
              src={currentVideoUrl}
              title="Virtual Blockchains: EVVM Transactions and Functions for Beginners"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>

        <div className={styles.videoSidebar}>
          {videoButtons.map((button, index) => (
            <>
            <button
              key={index}
              className={`${styles.videoSidebarButton} ${currentVideoUrl === button.videoUrl ? styles.activeVideo : ''}`}
              onClick={() => setCurrentVideoUrl(button.videoUrl)}
              aria-label={button.alt}
            >
              <img src={button.thumbnail} alt={button.alt} />
            </button>
            </>
          ))}
          
        </div>
        <div className={styles.videoLabels}>
          {videoButtons.map((button, index) => (
            <p 
              key={index}
              className={`${styles.videoLabel} ${currentVideoUrl === button.videoUrl ? styles.activeLabel : ''}`}
            >
              {button.alt}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function KeyConceptsSection() {
  const concepts = [
    {
      icon: "🌐",
      title: "Virtual Blockchain Infrastructure",
      description:
        "Deploy your own blockchain without managing validators or nodes - inherit security from host chains",
    },
    {
      icon: "⚡",
      title: "Gasless Communication",
      description:
        "Use fishing spots (APIs, mempools, radio waves) to transmit transactions with zero gas fees",
    },
    {
      icon: "🪙",
      title: "Token Abstractions",
      description:
        "Internal token system using EIP-191 signatures instead of traditional ERC-20 contracts",
    },
    {
      icon: "🎣",
      title: "Fisher Network & Staking",
      description:
        "Fishers execute transactions and earn MATE rewards through the decentralized staking system",
    },
  ];

  return (
    <section className={styles.developerSection}>
      <div className={styles.sectionContainer}>
        <div className={styles.featuresGrid}>
          {concepts.map((concept, index) => (
            <div key={index} className={styles.featureCard}>
              <div className={styles.featureIcon}>{concept.icon}</div>
              <h3>{concept.title}</h3>
              <p>{concept.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestSection() {
  return (
    <section className={styles.testSection}>
      <div className={styles.sectionContainer}>
        <h1 className={styles.sectionTitle}>Test in Minutes</h1>
        <p className={styles.testSubtitle}>
          Get started with our simple deployment tools
        </p>
        <div className={styles.testButtons}>
          <Link className={styles.deployButton} to="/docs/QuickStart">
            One command deployment →
          </Link>
          <Link className={styles.toolingButton} to="/docs/Libraries/EVVMFrontendTooling">
            Use the Tooling →
          </Link>
        </div>
      </div>
    </section>
  );
}

function CustomFooter() {
  return (
    <footer className={styles.customFooter}>
      <div className={styles.footerContainer}>
        <Link className={styles.footerLogo} to="/">
          <img
            src="/img/evvm-logo.svg"
            alt="EVVM Logo"
            className={styles.footerLogoImage}
          />
        </Link>
        <div className={styles.footerLinks}>
          <a
            href="https://x.com/RollAMate"
            target="_blank"
            rel="noopener noreferrer"
          >
            𝕏
          </a>
          <Link to="/docs/intro">Documentation</Link>
        </div>
        <p className={styles.copyright}>
          © 2025 EVVM. Built with ❤️ for Ethereum
        </p>
      </div>
    </footer>
  );
}

export default function Home(): ReactNode {
  useEffect(() => {
    // Hide navbar only on homepage
    const navbar = document.querySelector(".navbar") as HTMLElement;
    const mainWrapper = document.querySelector(".main-wrapper") as HTMLElement;

    if (navbar) {
      navbar.style.display = "none";
    }
    if (mainWrapper) {
      mainWrapper.style.paddingTop = "0";
    }

    // Cleanup function to restore navbar when leaving the page
    return () => {
      if (navbar) {
        navbar.style.display = "";
      }
      if (mainWrapper) {
        mainWrapper.style.paddingTop = "";
      }
    };
  }, []);

  return (
    <Layout
      title="EVVM - Virtual Blockchain Infrastructure"
      description="Deploy virtual blockchains on any chain. Infraless EVM Virtualization solving Scalability and Chain Fragmentation."
      noFooter={true}
    >
      <div className={styles.pageWrapper}>
        <CustomHeader />
        <main>
          <HeroSection />
          <KeyConceptsSection />
          <TestSection />
        </main>
        <CustomFooter />
      </div>
    </Layout>
  );
}
