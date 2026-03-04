import { Container } from '@/components/ui';
import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/corporate/Badge';
import { ProductCard } from '@/components/corporate/ProductCard';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate.products' });

  return {
    title: t('meta.title') || 'Productos | MADFAM',
    description:
      t('meta.description') ||
      'Plataformas y herramientas desarrolladas por nuestras unidades especializadas.',
    openGraph: {
      title: t('meta.title') || 'Productos | MADFAM',
      description:
        t('meta.description') ||
        'Plataformas y herramientas desarrolladas por nuestras unidades especializadas.',
      type: 'website',
    },
  };
}

export default async function ProductsPage({ params }: Props) {
  const { locale } = await params;
  const commonT = await getTranslations({ locale, namespace: 'common' });

  // All products with ownership badges
  const products = [
    // Aureo Labs Products - Infrastructure
    {
      name: 'Enclii',
      description:
        "Sovereign cloud PaaS powering MADFAM's entire infrastructure. GitOps-native, Kubernetes-based, built for teams that need deployment sovereignty. Zero-config deploys, preview environments, built-in observability.",
      audience: 'Development teams and organizations requiring sovereign cloud',
      badge: 'by Aureo Labs, a MADFAM Company',
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
      category: 'Platform',
      arm: 'aureo-labs',
      sdgs: ['SDG9', 'SDG12'],
    },
    {
      name: 'Janua',
      description:
        'Self-hosted identity platform with enterprise SSO, SCIM provisioning, MFA, and Passkeys. The authentication layer for every MADFAM product. Open source (AGPL-3.0).',
      audience: 'Organizations requiring sovereign authentication',
      badge: 'by Aureo Labs, a MADFAM Company',
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
      category: 'Platform',
      arm: 'aureo-labs',
      sdgs: ['SDG9', 'SDG16'],
    },
    // Aureo Labs Products - Business
    {
      name: 'Forge Sight',
      description:
        'Enterprise-grade pricing intelligence platform for the global digital fabrication industry. Continuously harvests, normalizes, and benchmarks prices from 3D printing to CNC machining.',
      audience: 'Digital fabrication companies, 3D printing services, and procurement teams',
      badge: 'by Aureo Labs, a MADFAM Company',
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
      category: 'Platform',
      arm: 'aureo-labs',
      sdgs: ['SDG7', 'SDG9', 'SDG12'],
    },
    {
      name: 'Dhanam',
      description:
        'Wealth and finance platform purpose-built for LATAM founders. Unifies personal and business budgeting with ESG insight.',
      audience: 'LATAM founders and financial advisors',
      badge: 'by Aureo Labs, a MADFAM Company',
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
      category: 'Platform',
      arm: 'aureo-labs',
      sdgs: ['SDG8', 'SDG9', 'SDG10'],
    },
    // Primavera3D Products
    {
      name: 'Yantra4D',
      description:
        'Web platform for parametric OpenSCAD models. Upload designs, get instant 3D previews, export STL files. Powers 40+ open-source parametric designs in the commons.',
      audience: 'Designers, makers, and digital fabrication teams',
      badge: 'by Primavera3D, a MADFAM Company',
      primaryCta: {
        label: 'View on GitHub',
        url: 'https://github.com/madfam-org/yantra4d',
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
      category: 'Platform',
      arm: 'primavera3d',
      sdgs: ['SDG9', 'SDG12'],
    },
    // Coming Soon
    {
      name: 'AVALA',
      comingSoon: true,
      description:
        'SaaS platform for designing, delivering, and verifying competency-based training aligned with Mexican EC/CONOCER standards. Generates DC-3 certificates and ensures regulatory compliance.',
      audience: 'Training organizations and enterprises in LATAM',
      badge: 'by Aureo Labs, a MADFAM Company',
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
      category: 'Platform',
      arm: 'aureo-labs',
      sdgs: ['SDG4', 'SDG8', 'SDG9'],
    },
    {
      name: 'PENNY',
      comingSoon: true,
      description:
        'AI assistant that will learn, adapt, and continuously improve your workflow processes. Currently in development.',
      audience: 'Consumers and enterprises',
      badge: 'by Aureo Labs, a MADFAM Company',
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
      category: 'Platform',
      arm: 'aureo-labs',
      sdgs: ['SDG8', 'SDG9'],
    },
  ];

  // Filter to show only ready products on the main products page
  const readyProducts = products.filter(p => !p.comingSoon);

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              Nuestros productos
            </h1>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Plataformas y herramientas desarrolladas por nuestras unidades especializadas para
              resolver problemas reales.
            </p>

            {/* Product Categories */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="program">Plataformas</Badge>
              <Badge variant="program">Workspaces</Badge>
              <Badge variant="program">Datos abiertos</Badge>
            </div>
          </div>
        </Container>
      </section>

      {/* All Products */}
      <section className="py-16">
        <Container>
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4 text-center">
              Nuestro catálogo
            </h2>
            <p className="text-xl text-neutral-600 text-center max-w-3xl mx-auto">
              Plataformas y herramientas desarrolladas por nuestras unidades especializadas.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {readyProducts.map(product => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              ¿Interesado en nuestros productos?
            </h2>
            <p className="text-xl text-white/80 mb-12">
              Contacta con la unidad responsable o agenda una demostración personalizada.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <button className="px-8 py-3 bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors font-medium">
                  Contactar ahora
                </button>
              </Link>
              <Link href="/arms">
                <button className="px-8 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors font-medium">
                  Ver unidades
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
