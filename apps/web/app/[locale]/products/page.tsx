import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import { Container } from '@/components/ui';
import { Badge } from '@/components/corporate/Badge';
import { ProductCard } from '@/components/corporate/ProductCard';
import { PLATFORMS, LAYERS, isComingSoon } from '@/lib/data/platforms';

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
  const platformsT = await getTranslations({ locale, namespace: 'platforms' });

  function slugToKey(slug: string): string {
    const map: Record<string, string> = {
      'cotiza-studio': 'cotizaStudio',
      'forge-sight': 'forgeSight',
      'pravara-mes': 'pravaraMes',
    };
    return map[slug] || slug;
  }

  // Derive products from platform registry (single source of truth)
  const products = PLATFORMS.map(p => {
    const key = slugToKey(p.slug);
    return {
      name: p.name,
      description: platformsT(`${key}.valueProp`),
      audience: platformsT(`${key}.tagline`),
      badge: 'by MADFAM',
      tiers: 'Free + Pro',
      comingSoon: isComingSoon(p),
      primaryCta: {
        label: platformsT(`${key}.cta.primary`),
        url: isComingSoon(p) ? '#' : p.externalUrl || `/${locale}/platforms/${p.slug}`,
        external: !isComingSoon(p) && !!p.externalUrl,
        comingSoon: isComingSoon(p),
      },
      secondaryCta: {
        label: commonT('nav.contact'),
        url: `/${locale}/platforms/${p.slug}`,
      },
      features: Array.from({ length: Math.min(p.featureCount, 3) }, (_, i) =>
        platformsT(`${key}.features.${i}`)
      ),
      category: p.category,
      layer: p.layer,
      slug: p.slug,
    };
  });

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
                {platformsT('shared.cta.membership')}
              </p>
            </div>
            <Link
              href={getLocalizedUrl('ecosystem', validLocale)}
              className="text-sm font-semibold text-leaf hover:text-leaf/80 transition-colors flex items-center gap-1"
            >
              {platformsT('shared.cta.membershipLink')}
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
              {productsT('heroTitle')}
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {productsT('heroSubtitle')}
            </p>

            {/* Layer badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {LAYERS.map(layer => (
                <Badge key={layer.key} variant="program">
                  <span aria-hidden="true">{layer.icon}</span>{' '}
                  {platformsT(`shared.layers.${layer.key}`)}
                </Badge>
              ))}
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

          {/* Products grouped by layer */}
          <div className="max-w-6xl mx-auto">
            {LAYERS.map(layer => {
              const layerProducts = readyProducts.filter(p => p.layer === layer.key);
              if (layerProducts.length === 0) return null;
              return (
                <div key={layer.key} className="mb-12">
                  <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                    <span aria-hidden="true">{layer.icon}</span>
                    {platformsT(`shared.layers.${layer.key}`)}
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {layerProducts.map(product => (
                      <ProductCard key={product.name} product={product} />
                    ))}
                  </div>
                </div>
              );
            })}
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
                  {productsT('ctaButton')}
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
