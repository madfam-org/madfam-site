import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/corporate/Badge';
import { ProgramCard } from '@/components/corporate/ProgramCard';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate.programs' });

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

export default async function ProgramsPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'corporate.programs' });
  const commonT = await getTranslations({ locale, namespace: 'common' });
  const badgesT = await getTranslations({ locale, namespace: 'corporate.badges' });

  // Programs
  const programs = [
    {
      id: 'design-fabrication',
      name: t('designFabrication.name'),
      description: t('designFabrication.description'),
      provider: 'MADFAM',
      badge: badgesT('byMadfam'),
      icon: 'cube',
      timeline: t('designFabrication.timeline'),
      targetMarket: t('designFabrication.targetMarket'),
      deliverables: [
        t('designFabrication.deliverables.0'),
        t('designFabrication.deliverables.1'),
        t('designFabrication.deliverables.2'),
        t('designFabrication.deliverables.3'),
      ],
      investment: t('designFabrication.investment'),
      color: 'green' as const,
    },
    {
      id: 'launch-program',
      name: t('strategyEnablement.name'),
      description: t('strategyEnablement.description'),
      provider: 'MADFAM',
      badge: badgesT('byMadfam'),
      icon: 'cog',
      timeline: t('strategyEnablement.timeline'),
      targetMarket: t('strategyEnablement.targetMarket'),
      deliverables: [
        t('strategyEnablement.deliverables.0'),
        t('strategyEnablement.deliverables.1'),
        t('strategyEnablement.deliverables.2'),
        t('strategyEnablement.deliverables.3'),
      ],
      investment: t('strategyEnablement.investment'),
      color: 'amber' as const,
    },
    {
      id: 'scale-program',
      name: t('platformPilots.name'),
      description: t('platformPilots.description'),
      provider: 'MADFAM',
      badge: badgesT('byMadfam'),
      icon: 'rocket',
      timeline: t('platformPilots.timeline'),
      targetMarket: t('platformPilots.targetMarket'),
      deliverables: [
        t('platformPilots.deliverables.0'),
        t('platformPilots.deliverables.1'),
        t('platformPilots.deliverables.2'),
        t('platformPilots.deliverables.3'),
      ],
      investment: t('platformPilots.investment'),
      color: 'blue' as const,
      platforms: ['Selva', 'Dhanam'],
    },
    {
      id: 'partner-program',
      name: t('strategicPartnerships.name'),
      description: t('strategicPartnerships.description'),
      provider: 'MADFAM',
      badge: badgesT('byMadfam'),
      icon: 'building',
      timeline: t('strategicPartnerships.timeline'),
      targetMarket: t('strategicPartnerships.targetMarket'),
      deliverables: [
        t('strategicPartnerships.deliverables.0'),
        t('strategicPartnerships.deliverables.1'),
        t('strategicPartnerships.deliverables.2'),
        t('strategicPartnerships.deliverables.3'),
      ],
      investment: t('strategicPartnerships.investment'),
      color: 'purple' as const,
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center px-8 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium"
              >
                {commonT('nav.contact')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {programs.map(program => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        </div>
      </section>

      {/* Program Journey */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-neutral-900 mb-12 text-center">
              {t('journey.title')}
            </h2>

            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-8 top-8 bottom-8 w-px bg-gradient-to-b from-green-400 via-amber-400 via-blue-400 to-purple-400" />

              <div className="space-y-12">
                {/* Strategy Phase */}
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      {t('journey.strategy.title')}
                    </h3>
                    <p className="text-neutral-600 mb-4">{t('journey.strategy.description')}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="program">{t('strategyEnablement.name')}</Badge>
                      <span className="text-sm text-neutral-500">
                        {t('strategyEnablement.timeline')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pilot Phase */}
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      {t('journey.pilot.title')}
                    </h3>
                    <p className="text-neutral-600 mb-4">{t('journey.pilot.description')}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="program">{t('platformPilots.name')}</Badge>
                      <span className="text-sm text-neutral-500">
                        {t('platformPilots.timeline')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scale Phase */}
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      {t('journey.scale.title')}
                    </h3>
                    <p className="text-neutral-600 mb-4">{t('journey.scale.description')}</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="program">{t('strategicPartnerships.name')}</Badge>
                      <span className="text-sm text-neutral-500">
                        {t('strategicPartnerships.timeline')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
