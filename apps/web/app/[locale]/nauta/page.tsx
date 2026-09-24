import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Container } from '@/components/ui';
import {
  NAUTA_FRONT_DOOR_URL,
  NAUTA_PILLARS,
  KALYA_DISCOVERY_CALL_URL,
} from '@/lib/data/nauta-product';

// Corporate "about Nauta" summary (ruling R30). No prices, no tiers, no
// checkout: the canonical page for Nauta is nauta.quest.

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nauta' });
  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: { canonical: NAUTA_FRONT_DOOR_URL },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      type: 'website',
      url: NAUTA_FRONT_DOOR_URL,
    },
  };
}

const primaryCta =
  'px-8 py-3 bg-gradient-to-r from-leaf to-lavender text-white rounded-lg hover:from-leaf/90 hover:to-lavender/90 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender';
const secondaryCta =
  'px-8 py-3 border border-neutral-300 dark:border-gray-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender';

export default async function NautaPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nauta' });

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* ── Summary ─────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-wide text-leaf mb-4">
              {t('hero.eyebrow')}
            </p>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6 text-balance">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={NAUTA_FRONT_DOOR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={primaryCta}
              >
                {t('closing.visitSite')}
              </a>
              <a
                href={KALYA_DISCOVERY_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={secondaryCta}
              >
                {t('cta.discoveryCall')}
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* ── Value pillars ───────────────────────────────────────────────────── */}
      <section className="py-16 bg-white dark:bg-gray-900/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3 text-balance">
              {t('pillars.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {t('pillars.subtitle')}
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
            {NAUTA_PILLARS.map(key => (
              <div
                key={key}
                className="rounded-xl border border-neutral-200 dark:border-gray-800 p-6 bg-neutral-50/60 dark:bg-gray-800/30"
              >
                <h3 className="font-bold text-neutral-900 dark:text-white mb-2">
                  {t(`pillars.${key}.title`)}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {t(`pillars.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-neutral-600 dark:text-neutral-400">
            {t('closing.subtitle')}
          </p>
        </Container>
      </section>
    </main>
  );
}
