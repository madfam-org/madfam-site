import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import { Container } from '@/components/ui';
import { Badge } from '@/components/corporate/Badge';
import { PLATFORMS, LAYERS, isComingSoon } from '@/lib/data/platforms';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'platforms.index' });

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

export default async function PlatformsPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'platforms.index' });
  const platformsT = await getTranslations({ locale, namespace: 'platforms' });

  function slugToKey(slug: string): string {
    const map: Record<string, string> = {
      'cotiza-studio': 'cotizaStudio',
      'forge-sight': 'forgeSight',
      'pravara-mes': 'pravaraMes',
    };
    return map[slug] || slug;
  }

  const productionPlatforms = PLATFORMS.filter(p => !isComingSoon(p));
  const comingSoonPlatforms = PLATFORMS.filter(p => isComingSoon(p));

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* Hero Section */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
              {t('heroTitle')}
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {t('heroSubtitle')}
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

      {/* Platforms by Layer */}
      <section className="py-16">
        <Container>
          <div className="max-w-6xl mx-auto">
            {LAYERS.map(layer => {
              const layerPlatforms = productionPlatforms.filter(p => p.layer === layer.key);
              if (layerPlatforms.length === 0) return null;
              return (
                <div key={layer.key} className="mb-12">
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
                    <span aria-hidden="true">{layer.icon}</span>
                    {platformsT(`shared.layers.${layer.key}`)}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {layerPlatforms.map(platform => {
                      const key = slugToKey(platform.slug);
                      return (
                        <Link
                          key={platform.slug}
                          href={`/${locale}/platforms/${platform.slug}`}
                          className="group flex flex-col p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 hover:border-leaf/50 dark:hover:border-leaf/50 hover:shadow-md transition-all duration-300"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${platform.accentColor.bg}`}
                              aria-hidden="true"
                            >
                              {platform.icon}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {platform.name}
                              </h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {platformsT('shared.byMadfam')}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                            {platformsT(`${key}.tagline`)}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                              {platformsT('shared.freePlusPro')}
                            </span>
                            <Badge variant="program" className="text-[10px]">
                              {platformsT(
                                `shared.status.${platform.status === 'production' ? 'production' : 'productionBeta'}`
                              )}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Coming Soon */}
          {comingSoonPlatforms.length > 0 && (
            <div className="mt-16 max-w-6xl mx-auto">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-6 text-center">
                {platformsT('shared.status.comingSoon')}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {comingSoonPlatforms.map(platform => {
                  const key = slugToKey(platform.slug);
                  return (
                    <div
                      key={platform.slug}
                      className="flex flex-col p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${platform.accentColor.bg}`}
                          aria-hidden="true"
                        >
                          {platform.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {platform.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {platformsT('shared.byMadfam')}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4 flex-1">
                        {platformsT(`${key}.tagline`)}
                      </p>
                      <Badge variant="program" className="text-[10px] w-fit">
                        {platformsT(
                          `shared.status.${platform.status === 'coming-soon' ? 'comingSoon' : 'inDevelopment'}`
                        )}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">{t('ctaTitle')}</h2>
            <p className="text-xl text-white/80 mb-12">{t('ctaSubtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={getLocalizedUrl('ecosystem', validLocale)}>
                <button className="px-8 py-3 bg-gradient-to-r from-leaf to-lavender text-white rounded-lg hover:from-leaf/90 hover:to-lavender/90 transition-colors font-medium">
                  {t('ctaButton')}
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
