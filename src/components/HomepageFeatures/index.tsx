import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Abstract Blockchain Infrastructure',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Decouple blockchain logic from physical infrastructure. Deploy virtual
        blockchains instantly, without managing nodes or validators.
      </>
    ),
  },
  {
    title: 'Gasless Communication',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Transact with zero gas fees using fishing spots: APIs, mempools, or any
        data channel. Enable new UX and integrations.
      </>
    ),
  },
  {
    title: 'Vertical Scalability',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Run multiple EVVMs on a single host blockchain. Scale vertically and
        optimize resource usage for any protocol or organization.
      </>
    ),
  },
  {
    title: 'Staking & Incentives',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Built-in staking system with era-based rewards, priority access, and
        governance. Stakers earn for securing and operating the network.
      </>
    ),
  },
  {
    title: 'Name Service & Identity',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Human-readable usernames, metadata, and decentralized governance. Integrate
        identity and payments across the ecosystem.
      </>
    ),
  },
  {
    title: 'Cross-Chain & Fisher Bridge',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Move assets between blockchains securely. Fisher Bridge enables
        multi-chain withdrawals, operator incentives, and fee integration.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  // Extra: badge color by feature (simple color cycle)
  const badges = [
    'Infra', 'Gasless', 'Scaling', 'Staking', 'Identity', 'Bridge'
  ];
  const badge = badges.find((b) => title.toLowerCase().includes(b.toLowerCase())) || '';
  return (
    <div className={clsx('col col--4', styles.featureCard)} >
      <div className="padding-horiz--md padding-vert--lg">
        <span className={styles.featureTitle}>
          <span className={styles.featureBadge}>{badge || 'Feature'}</span>
          {title}
        </span>
        <p className={styles.featureDescription}>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features} style={{padding: '1.5rem'}}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
