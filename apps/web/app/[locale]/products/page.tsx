import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import { Container } from '@/components/ui';
import { Badge } from '@/components/corporate/Badge';
import { ProductCard } from '@/components/corporate/ProductCard';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate.products' });

  return {
    title: t('meta.title') || 'Platforms | MADFAM',
    description: t('meta.description') || 'Open platforms for creators, makers, and entrepreneurs.',
    openGraph: {
      title: t('meta.title') || 'Platforms | MADFAM',
      description:
        t('meta.description') || 'Open platforms for creators, makers, and entrepreneurs.',
      type: 'website',
    },
  };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const productsT = await getTranslations({ locale, namespace: 'products.page' });

  // All products grouped by use case with ecosystem tiers
  const products = [
    // Creation
    {
      name: 'Yantra4D',
      description:
        'Web platform for parametric OpenSCAD models. Upload designs, get instant 3D previews, export STL files. Powers 40+ open-source parametric designs in the commons.',
      audience: 'Designers, makers, and digital fabrication enthusiasts',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'Visit Platform',
        url: 'https://4d.madfam.io',
        external: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'Parametric OpenSCAD model hosting',
        'Instant 3D preview and STL export',
        '40+ open-source designs in the commons',
      ],
      category: 'Creation',
      sdgs: ['SDG9', 'SDG12'],
    },
    {
      name: 'Cotiza Studio',
      description:
        'Automated quoting and estimation platform for digital fabrication services. Instant price calculations for 3D printing, CNC machining, and more.',
      audience: 'Makers, fabrication shops, and design engineers',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'Visit Platform',
        url: 'https://cotiza.studio',
        external: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'Instant price calculations for fabrication services',
        'Multi-process and multi-material support',
        'Integration with Forge Sight pricing intelligence',
      ],
      category: 'Creation',
      sdgs: ['SDG9', 'SDG12'],
    },
    // Infrastructure
    {
      name: 'Enclii',
      description:
        "Sovereign cloud PaaS powering MADFAM's entire infrastructure. GitOps-native, Kubernetes-based, built for teams that need deployment sovereignty.",
      audience: 'Developers and teams who want full control of their infrastructure',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'View on GitHub',
        url: 'https://github.com/madfam-org/enclii',
        external: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'Zero-config deploys with preview environments',
        'GitOps-native Kubernetes orchestration',
        'Built-in observability and monitoring',
      ],
      category: 'Infrastructure',
      sdgs: ['SDG9', 'SDG12'],
    },
    {
      name: 'Janua',
      description:
        'Self-hosted identity platform with enterprise SSO, SCIM provisioning, MFA, and Passkeys. Open source (AGPL-3.0).',
      audience: 'Developers and organizations who value data sovereignty',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'View on GitHub',
        url: 'https://github.com/madfam-org/janua',
        external: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'Enterprise SSO and SCIM provisioning',
        'MFA and Passkey support',
        'Self-hosted with full data sovereignty',
      ],
      category: 'Infrastructure',
      sdgs: ['SDG9', 'SDG16'],
    },
    // Intelligence
    {
      name: 'Forge Sight',
      description:
        'Pricing intelligence platform for the global digital fabrication industry. Continuously harvests, normalizes, and benchmarks prices across vendors.',
      audience: 'Fabrication businesses and procurement teams',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'Visit Platform',
        url: 'https://www.forgesight.quest',
        external: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'AI-powered price discovery from 1000+ vendors',
        'Real-time benchmarking with statistical analysis',
        'Enterprise security and compliance',
      ],
      category: 'Intelligence',
      sdgs: ['SDG7', 'SDG9', 'SDG12'],
    },
    {
      name: 'Dhanam',
      description:
        'Wealth and finance platform purpose-built for LATAM founders. Unifies personal and business budgeting with ESG insight.',
      audience: 'Founders, freelancers, and financial advisors in LATAM',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'Visit Dhanam',
        url: 'https://www.dhan.am',
        external: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'Unified personal and business budgeting',
        'ESG insight and tracking',
        'Purpose-built for LATAM founders',
      ],
      category: 'Intelligence',
      sdgs: ['SDG8', 'SDG9', 'SDG10'],
    },
    // Fabrication
    {
      name: 'Pravara-MES',
      description:
        'Manufacturing Execution System for digital fabrication workflows. Track jobs, manage queues, and monitor production in real-time.',
      audience: 'Makers, fabrication shops, and manufacturing teams',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'Visit Platform',
        url: 'https://mes.madfam.io',
        external: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'Real-time production monitoring and job tracking',
        'Queue management and scheduling',
        'Integration with Yantra4D and Cotiza Studio',
      ],
      category: 'Fabrication',
      sdgs: ['SDG9', 'SDG12'],
    },
    // Learning
    {
      name: 'AVALA',
      comingSoon: true,
      description:
        'Platform for designing, delivering, and verifying competency-based training. Generates DC-3 certificates and ensures regulatory compliance.',
      audience: 'Educators, training organizations, and learners',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'Coming Soon',
        url: '#',
        comingSoon: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'EC/CONOCER aligned training',
        'DC-3 certificate generation',
        'Verifiable credentials (Open Badges 3.0)',
      ],
      category: 'Learning',
      sdgs: ['SDG4', 'SDG8', 'SDG9'],
    },
    // Assistant
    {
      name: 'PENNY',
      comingSoon: true,
      description:
        'AI assistant that learns, adapts, and continuously improves your workflows. Currently in development.',
      audience: 'Creators, entrepreneurs, and teams of all sizes',
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      primaryCta: {
        label: 'In Development',
        url: '#',
        comingSoon: true,
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: '/contact',
      },
      features: [
        'Intelligent chat interface',
        'Personal and business automation',
        'Enterprise-grade security',
      ],
      category: 'Assistant',
      sdgs: ['SDG8', 'SDG9'],
    },
  ];

  const readyProducts = products.filter(p => !p.comingSoon);
  const comingSoonProducts = products.filter(p => p.comingSoon);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Ecosystem Banner */}
      <section className="bg-gradient-to-r from-leaf/10 via-lavender/10 to-sun/10 border-b border-leaf/20">
        <Container>
          <div className="py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-lg" aria-hidden="true">
                🌱
              </span>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Unlock Pro on every platform with one membership
              </p>
            </div>
            <Link
              href={getLocalizedUrl('ecosystem', validLocale)}
              className="text-sm font-semibold text-leaf hover:text-leaf/80 transition-colors flex items-center gap-1"
            >
              Learn about Ecosystem Membership
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </Container>
      </section>

      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
              Open platforms for creators, makers, and entrepreneurs
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {productsT('heroSubtitle')}
            </p>

            {/* Category badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="program">Creation</Badge>
              <Badge variant="program">Infrastructure</Badge>
              <Badge variant="program">Intelligence</Badge>
              <Badge variant="program">Fabrication</Badge>
              <Badge variant="program">Learning</Badge>
              <Badge variant="program">Assistant</Badge>
            </div>
          </div>
        </Container>
      </section>

      {/* All Products */}
      <section className="py-16">
        <Container>
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4 text-center">
              {productsT('catalogTitle')}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 text-center max-w-3xl mx-auto">
              {productsT('catalogSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {readyProducts.map(product => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>

          {/* Coming Soon Products */}
          {comingSoonProducts.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-8 text-center">
                {commonT('comingSoon')}
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto opacity-75">
                {comingSoonProducts.map(product => (
                  <ProductCard key={product.name} product={product} />
                ))}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {productsT('ctaTitle')}
            </h2>
            <p className="text-xl text-white/80 mb-12">{productsT('ctaSubtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={getLocalizedUrl('ecosystem', validLocale)}>
                <button className="px-8 py-3 bg-gradient-to-r from-leaf to-lavender text-white rounded-lg hover:from-leaf/90 hover:to-lavender/90 transition-colors font-medium">
                  Join the Ecosystem
                </button>
              </Link>
              <Link href={getLocalizedUrl('contact', validLocale)}>
                <button className="px-8 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors font-medium">
                  {commonT('nav.contact')}
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
