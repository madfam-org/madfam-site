import { getLocalizedUrl, type Locale } from '@madfam-site/i18n';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading, Button } from '@/components/ui';
import { routeMetadata } from '@/lib/page-metadata';

// The /about server render failed in production (finding C-022): the team grid
// passed an `onError` handler to next/image from this Server Component, which
// React refuses to serialise, so every render ended in an error digest and an
// empty page. The grid also showed four people with invented bios and photos
// that do not exist. Per the signed-off copy deck (§6.5: real profiles only,
// with consent) the grid is replaced by the team paragraph, and the timeline
// goes too: its founding year contradicts the entity record (ruling R37,
// foundedYear: null) and none of its dates were sourced.

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return routeMetadata(locale, 'about', '/about');
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('about');
  const corporateT = await getTranslations('corporate');
  const currentLocale = locale as Locale;

  const pillars = [
    {
      icon: '♾️',
      key: 'circularity',
      title: corporateT('pillars.circularity.title'),
      description: corporateT('pillars.circularity.body'),
    },
    {
      icon: '📍',
      key: 'traceability',
      title: corporateT('pillars.traceability.title'),
      description: corporateT('pillars.traceability.body'),
    },
    {
      icon: '🔐',
      key: 'ethicalData',
      title: corporateT('pillars.ethicalData.title'),
      description: corporateT('pillars.ethicalData.body'),
    },
    {
      icon: '🌎',
      key: 'latamTalent',
      title: corporateT('pillars.latamTalent.title'),
      description: corporateT('pillars.latamTalent.body'),
    },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-20 pb-16 bg-gradient-to-br from-obsidian to-obsidian/90 text-white overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-96 h-96 bg-lavender rounded-full filter blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-sun rounded-full filter blur-3xl animate-float animation-delay-400" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Heading level={1} className="text-white mb-6 animate-fade-up">
              {t('title').split('MADFAM')[0]}
              <span className="gradient-text">MADFAM</span>
              {t('title').split('MADFAM')[1]}
            </Heading>
            <p className="text-xl text-white/90 mb-8 animate-fade-up animation-delay-200">
              {t('subtitle')}
            </p>
            <div className="flex flex-wrap gap-4 justify-center animate-fade-up animation-delay-400">
              <Link href={getLocalizedUrl('platforms', currentLocale)}>
                <Button variant="secondary" size="lg">
                  {t('cta.seeWork')}
                </Button>
              </Link>
              <Link href={getLocalizedUrl('careers', currentLocale)}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-obsidian"
                >
                  {t('cta.joinTeam')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Mission & Vision */}
      <section className="section">
        <Container>
          <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-lavender/10 mb-6">
                <span className="text-3xl">🎯</span>
              </div>
              <Heading level={3} className="mb-4">
                {t('mission.title')}
              </Heading>
              <p className="text-lg text-obsidian/70">{corporateT('mission')}</p>
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-sun/10 mb-6">
                <span className="text-3xl">👁️</span>
              </div>
              <Heading level={3} className="mb-4">
                {t('vision.title')}
              </Heading>
              <p className="text-lg text-obsidian/70">{corporateT('vision')}</p>
            </div>
          </div>
        </Container>
      </section>

      {/* Pillars */}
      <section className="section bg-pearl">
        <Container>
          <div className="text-center mb-12">
            <Heading level={2} className="mb-4">
              {t('values.title')}
            </Heading>
            <p className="text-lg text-obsidian/70 max-w-3xl mx-auto">{t('values.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pillars.map(pillar => (
              <div
                key={pillar.key}
                className="text-center p-6 rounded-2xl bg-white shadow-sm hover:shadow-lg transition-shadow"
              >
                <div className="text-5xl mb-4">{pillar.icon}</div>
                <h3 className="font-heading text-lg font-semibold mb-3">{pillar.title}</h3>
                <p className="text-obsidian/70">{pillar.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="section">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <Heading level={2} className="mb-4">
              {t('team.title')}
            </Heading>
            <p className="text-lg text-obsidian/70 mb-8">{t('team.subtitle')}</p>
            <Link href={getLocalizedUrl('careers', currentLocale)}>
              <Button variant="outline" size="lg">
                {t('cta.joinTeam')}
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="section">
        <Container>
          <div className="bg-gradient-to-br from-lavender to-sun rounded-3xl p-12 text-center text-white">
            <Heading level={2} className="text-white mb-4">
              {t('cta.title')}
            </Heading>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">{t('cta.subtitle')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href={getLocalizedUrl('contact', currentLocale)}>
                <Button variant="secondary" size="lg">
                  {t('cta.scheduleCall')}
                </Button>
              </Link>
              <Link href={getLocalizedUrl('careers', currentLocale)}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-lavender"
                >
                  {t('cta.viewOpportunities')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
