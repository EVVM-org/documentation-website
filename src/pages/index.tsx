/**
 * EVVM Landing Page - Modern Professional Design
 * 
 * Estructura:
 * - Hero: CTA principal claro con jerarquía visual
 * - Quick Access: Grid de recursos técnicos
 * - Resources: Tutoriales y workshops
 * - Features: Características técnicas destacadas
 */

import type { ReactNode } from "react";
import { useState } from "react";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";
import styles from "./index.module.css";

/**
 * Hero Section
 * Prioridad visual: Deploy Now (primario) > Docs/Tooling (secundario)
 */
function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          Build the Next Generation of <span className={styles.accent}>Blockchain Infrastructure</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Deploy virtual blockchains without validators or nodes. Inherit security from any EVM chain and scale infinitely.
        </p>
        
        {/* CTA Group - Jerarquía clara: 1 primario + 2 secundarios */}
        <div className={styles.ctaGroup}>
          <Link className={styles.btnPrimary} to="/docs/QuickStart">
            Get Started
          </Link>
          <Link className={styles.btnSecondary} to="/docs/intro">
            Documentation
          </Link>
          <a 
            className={styles.btnSecondary} 
            href="https://evvm.dev" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Dev Tooling
          </a>
        </div>

        {/* Trust indicators */}
        <div className={styles.trustBadges}>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>⚡</span>
            <span>Gasless Transactions</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>🔒</span>
            <span>EVM Compatible</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeIcon}>🌐</span>
            <span>Multi-Chain</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Quick Access Bar
 * Grid de 4 cards con acceso rápido a recursos principales
 */
function QuickAccessSection() {
  const quickLinks = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Quick Start",
      description: "Deploy in one command",
      link: "/docs/QuickStart",
      internal: true,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "Documentation",
      description: "Complete technical docs",
      link: "/docs/intro",
      internal: true,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="9" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      title: "Dev Tools",
      description: "Frontend SDK & CLI",
      link: "https://evvm.dev",
      internal: false,
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      title: "GitHub",
      description: "Source code & examples",
      link: "https://github.com/EVVM-org",
      internal: false,
    },
  ];

  return (
    <section className={styles.quickAccess}>
      <div className={styles.quickAccessGrid}>
        {quickLinks.map((item, index) => (
          item.internal ? (
            <Link key={index} to={item.link} className={styles.quickCard}>
              <div className={styles.quickCardIcon}>{item.icon}</div>
              <h3 className={styles.quickCardTitle}>{item.title}</h3>
              <p className={styles.quickCardDescription}>{item.description}</p>
            </Link>
          ) : (
            <a 
              key={index} 
              href={item.link} 
              className={styles.quickCard}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.quickCardIcon}>{item.icon}</div>
              <h3 className={styles.quickCardTitle}>{item.title}</h3>
              <p className={styles.quickCardDescription}>{item.description}</p>
            </a>
          )
        ))}
      </div>
    </section>
  );
}

/**
 * Resources Section
 * Tutoriales y videos con thumbnails
 */
function ResourcesSection() {
  const [currentVideo, setCurrentVideo] = useState("uBjvoH5tpJk");

  const videos = [
    {
      id: "uBjvoH5tpJk",
      title: "EVVM for Beginners",
      duration: "15 min",
      level: "Beginner",
      thumbnail: "https://img.youtube.com/vi/uBjvoH5tpJk/mqdefault.jpg",
    },
    {
      id: "b40vNFatHgg",
      title: "Deploy from Scratch",
      duration: "22 min",
      level: "Intermediate",
      thumbnail: "https://img.youtube.com/vi/b40vNFatHgg/mqdefault.jpg",
    },
  ];

  return (
    <section className={styles.resources}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Learn & Build</h2>
        <p className={styles.sectionSubtitle}>
          Video tutorials and hands-on workshops to get you started
        </p>
      </div>

      {/* Featured Video */}
      <div className={styles.featuredVideo}>
        <div className={styles.videoPlayer}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube-nocookie.com/embed/${currentVideo}`}
            title="EVVM Tutorial"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>

      {/* Video Grid */}
      <div className={styles.resourcesGrid}>
        {videos.map((video) => (
          <button
            key={video.id}
            className={`${styles.resourceCard} ${currentVideo === video.id ? styles.resourceCardActive : ''}`}
            onClick={() => setCurrentVideo(video.id)}
          >
            <div className={styles.resourceThumbnail}>
              <img src={video.thumbnail} alt={video.title} />
              <div className={styles.playIcon}>
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="24" fill="rgba(0, 255, 136, 0.9)"/>
                  <path d="M18 14l14 10-14 10V14z" fill="#0A0A0A"/>
                </svg>
              </div>
            </div>
            <div className={styles.resourceContent}>
              <h3 className={styles.resourceTitle}>{video.title}</h3>
              <div className={styles.resourceMeta}>
                <span className={styles.resourceDuration}>{video.duration}</span>
                <span className={styles.resourceLevel}>{video.level}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/**
 * Features Section
 * Características técnicas en grid de 3 columnas
 */
function FeaturesSection() {
  const features = [
    {
      icon: "🌐",
      title: "Virtual Blockchain Infrastructure",
      description: "Deploy your own blockchain without managing validators or nodes. Inherit security from host chains.",
    },
    {
      icon: "⚡",
      title: "Gasless Communication",
      description: "Use fishing spots (APIs, mempools, radio waves) to transmit transactions with zero gas fees.",
    },
    {
      icon: "🪙",
      title: "Token Abstractions",
      description: "Internal token system using EIP-191 signatures instead of traditional ERC-20 contracts.",
    },
    {
      icon: "🎣",
      title: "Fisher Network & Staking",
      description: "Fishers execute transactions and earn MATE rewards through the decentralized staking system.",
    },
    {
      icon: "🔗",
      title: "Multi-Chain Support",
      description: "Deploy on any EVM-compatible chain: Ethereum, Base, Optimism, Arbitrum, and more.",
    },
    {
      icon: "🛠️",
      title: "Developer-First Tooling",
      description: "Complete SDK, CLI tools, and frontend libraries for rapid development and integration.",
    },
  ];

  return (
    <section className={styles.features}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Why EVVM?</h2>
        <p className={styles.sectionSubtitle}>
          The most advanced virtual blockchain infrastructure
        </p>
      </div>

      <div className={styles.featuresGrid}>
        {features.map((feature, index) => (
          <div key={index} className={styles.featureCard}>
            <div className={styles.featureIcon}>{feature.icon}</div>
            <h3 className={styles.featureTitle}>{feature.title}</h3>
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Main Component
 */
export default function Home(): ReactNode {
  return (
    <Layout
      title="EVVM - Virtual Blockchain Infrastructure"
      description="Deploy virtual blockchains on any EVM chain. Infraless virtualization solving scalability and chain fragmentation."
    >
      <main className={styles.landing}>
        <HeroSection />
        <QuickAccessSection />
        <ResourcesSection />
        <FeaturesSection />
      </main>
    </Layout>
  );
}
