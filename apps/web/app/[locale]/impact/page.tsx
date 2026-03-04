import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading } from '@/components/ui';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'impact' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

interface SDGMapping {
  product: string;
  summary: string;
  sdgs: string[];
  icon?: string;
}

export default async function ImpactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('impact');
  const corporateT = await getTranslations('corporate');

  // SDG mappings with translations
  const sdgMappings: SDGMapping[] = [
    {
      product: 'Penny',
      summary: t('sdgMap.penny.summary'),
      sdgs: t.raw('sdgMap.penny.sdgs') as string[],
      icon: '💰',
    },
    {
      product: 'Dhanam',
      summary: t('sdgMap.dhanam.summary'),
      sdgs: t.raw('sdgMap.dhanam.sdgs') as string[],
      icon: '🏦',
    },
    {
      product: 'Cotiza Studio',
      summary: t('sdgMap.cotizaStudio.summary'),
      sdgs: t.raw('sdgMap.cotizaStudio.sdgs') as string[],
      icon: '📊',
    },
    {
      product: 'Forge Sight',
      summary: t('sdgMap.forgeSight.summary'),
      sdgs: t.raw('sdgMap.forgeSight.sdgs') as string[],
      icon: '🔍',
    },
    {
      product: t('sdgMap.platforms.name'),
      summary: t('sdgMap.platforms.summary'),
      sdgs: t.raw('sdgMap.platforms.sdgs') as string[],
      icon: '🧪',
    },
    {
      product: t('sdgMap.manufacturing.name'),
      summary: t('sdgMap.manufacturing.summary'),
      sdgs: t.raw('sdgMap.manufacturing.sdgs') as string[],
      icon: '🏭',
    },
    {
      product: t('sdgMap.programs.name'),
      summary: t('sdgMap.programs.summary'),
      sdgs: t.raw('sdgMap.programs.sdgs') as string[],
      icon: '📚',
    },
  ];

  const getSDGNumber = (sdg: string): string => {
    const match = sdg.match(/\d+/);
    return match ? match[0] : '';
  };

  const getSDGColor = (sdgNumber: string): string => {
    const colors: { [key: string]: string } = {
      '1': '#E5243B',
      '2': '#DDA63A',
      '3': '#4C9F38',
      '4': '#C5192D',
      '5': '#FF3A21',
      '6': '#26BDE2',
      '7': '#FCC30B',
      '8': '#A21942',
      '9': '#FD6925',
      '10': '#DD1367',
      '11': '#FD9D24',
      '12': '#BF8B2E',
      '13': '#3F7E44',
      '14': '#0A97D9',
      '15': '#56C02B',
      '16': '#00689D',
      '17': '#19486A',
    };
    return colors[sdgNumber] || '#666666';
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-brand-green/5 to-brand-purple/5">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <Heading level={1} className="text-4xl lg:text-6xl font-bold text-neutral-900 mb-6">
              {t('hero.title')}
            </Heading>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">{corporateT('purpose')}</p>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-green/10 rounded-full text-sm text-brand-green">
              <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
              {t('hero.badge')}
            </div>
          </div>
        </Container>
      </section>

      {/* SDG Alignment Section */}
      <section className="py-16">
        <Container>
          <div className="mb-12 text-center">
            <Heading level={2} className="text-3xl font-bold text-neutral-900 mb-4">
              {t('sdgAlignment.title')}
            </Heading>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              {t('sdgAlignment.description')}
            </p>
          </div>

          {/* SDG Grid */}
          <div className="space-y-8 max-w-6xl mx-auto">
            {sdgMappings.map(mapping => (
              <div
                key={mapping.product}
                className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{mapping.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      {mapping.product}
                    </h3>
                    <p className="text-neutral-600 mb-4">{mapping.summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {mapping.sdgs.map(sdg => {
                        const sdgNumber = getSDGNumber(sdg);
                        return (
                          <div
                            key={sdg}
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white transition-transform hover:scale-105"
                            style={{ backgroundColor: getSDGColor(sdgNumber) }}
                          >
                            <span className="font-bold">{sdgNumber}</span>
                            <span className="hidden sm:inline">
                              {sdg.replace(/SDG\d+\s*|ODS\d+\s*/, '')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div className="mt-12 p-4 bg-amber-50 border border-amber-200 rounded-lg max-w-4xl mx-auto">
            <p className="text-sm text-amber-800 text-center">{t('sdgAlignment.disclaimer')}</p>
          </div>
        </Container>
      </section>

      {/* Pillars Section */}
      <section className="py-16 bg-neutral-50">
        <Container>
          <div className="mb-12 text-center">
            <Heading level={2} className="text-3xl font-bold text-neutral-900 mb-4">
              {t('pillars.title')}
            </Heading>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">{t('pillars.description')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <div className="text-3xl mb-3">♾️</div>
              <h3 className="font-semibold text-lg mb-2">
                {corporateT('pillars.circularity.title')}
              </h3>
              <p className="text-sm text-neutral-600">{corporateT('pillars.circularity.body')}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="font-semibold text-lg mb-2">
                {corporateT('pillars.traceability.title')}
              </h3>
              <p className="text-sm text-neutral-600">{corporateT('pillars.traceability.body')}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <div className="text-3xl mb-3">🔐</div>
              <h3 className="font-semibold text-lg mb-2">
                {corporateT('pillars.ethicalData.title')}
              </h3>
              <p className="text-sm text-neutral-600">{corporateT('pillars.ethicalData.body')}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-neutral-200">
              <div className="text-3xl mb-3">🌎</div>
              <h3 className="font-semibold text-lg mb-2">
                {corporateT('pillars.latamTalent.title')}
              </h3>
              <p className="text-sm text-neutral-600">{corporateT('pillars.latamTalent.body')}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <Heading level={2} className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {t('cta.title')}
            </Heading>
            <p className="text-xl text-white/80 mb-12">{t('cta.subtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/contact`}>
                <button className="px-8 py-3 bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors font-medium">
                  {t('cta.contact')}
                </button>
              </Link>
              <Link href={`/${locale}/programs`}>
                <button className="px-8 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors font-medium">
                  {t('cta.programs')}
                </button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
