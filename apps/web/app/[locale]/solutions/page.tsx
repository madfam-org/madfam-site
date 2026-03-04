import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SolutionCard } from '@/components/corporate/SolutionCard';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate.solutions' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
    },
  };
}

export default async function SolutionsPage({ params }: Props) {
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: 'corporate.solutions' });

  const solutions = [
    {
      id: 'colabs',
      name: 'MADFAM Co-Labs',
      tagline: t('colabs.tagline'),
      description: t('colabs.description'),
      badge: 'a MADFAM Company',
      accent: 'blue' as const,
      capabilities: [
        t('colabs.capabilities.0'),
        t('colabs.capabilities.1'),
        t('colabs.capabilities.2'),
        t('colabs.capabilities.3'),
      ],
      products: [
        { name: 'MADLAB', url: '/solutions/colabs#madlab' },
        { name: 'Workshops', url: '/solutions/colabs#workshops' },
        { name: 'Bootcamps', url: '/solutions/colabs#bootcamps' },
      ],
      internalUrl: '/solutions/colabs',
    },
    {
      id: 'showtech',
      name: 'Showtech',
      tagline: t('showtech.tagline'),
      description: t('showtech.description'),
      badge: 'a MADFAM Company',
      accent: 'purple' as const,
      capabilities: [
        t('showtech.capabilities.0'),
        t('showtech.capabilities.1'),
        t('showtech.capabilities.2'),
        t('showtech.capabilities.3'),
      ],
      products: [],
      comingSoon: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">{t('hero.subtitle')}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 rounded-full text-sm text-neutral-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {t('hero.badge')}
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {solutions.map(solution => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}
          </div>
        </div>
      </section>

      {/* Solution Architecture */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4 text-center max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-neutral-900 mb-8">{t('structure.title')}</h2>
          <div className="flex items-center justify-center gap-4 text-lg text-neutral-600">
            <span className="font-semibold text-neutral-900">MADFAM</span>
            <span>→</span>
            <span>{t('structure.solutionsLabel')}</span>
            <span>→</span>
            <span>{t('structure.productsLabel')}</span>
          </div>
          <p className="mt-6 text-neutral-600 leading-relaxed">{t('structure.description')}</p>
        </div>
      </section>
    </div>
  );
}
