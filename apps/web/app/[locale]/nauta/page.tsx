import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getLocalizedUrl, type Locale } from '@madfam-site/i18n';
import { Container } from '@/components/ui';
import {
  NAUTA_RUNGS,
  NAUTA_PILLARS,
  getNautaCatalogRegistrySlices,
  getNautaCatalogExtraSlices,
  nautaErpCheckoutUrl,
  KALYA_DISCOVERY_CALL_URL,
  type NautaRung,
  type TierPricing,
} from '@/lib/data/nauta-product';

type Props = {
  params: Promise<{ locale: string }>;
};

const PRODUCT_ANCHOR = 'product';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'nauta' });
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

export default async function NautaPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'nauta' });

  // Render a price the REGISTRY states. A tier the registry has not priced
  // renders the pending sentence — never a number, never «TBD» (ruling R9).
  const formatPrice = (pricing: TierPricing): string => {
    if (pricing.state === 'pending') return t('product.pricePending');
    const amount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: pricing.currency,
      maximumFractionDigits: 0,
    }).format(pricing.amount);
    return `${amount} ${t(`product.unit.${pricing.unit}`)}`;
  };

  const registrySlices = getNautaCatalogRegistrySlices();
  const extraSlices = getNautaCatalogExtraSlices();

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
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
                href={nautaErpCheckoutUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-gradient-to-r from-leaf to-lavender text-white rounded-lg hover:from-leaf/90 hover:to-lavender/90 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              >
                {t('hero.ctaSelfServe')}
              </a>
              <a
                href={`#${PRODUCT_ANCHOR}`}
                className="px-8 py-3 border border-neutral-300 dark:border-gray-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              >
                {t('hero.ctaExplore')}
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
        </Container>
      </section>

      {/* ── The two rungs: ERP + vCTO ───────────────────────────────────────── */}
      <section id={PRODUCT_ANCHOR} className="py-16 scroll-mt-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4 text-balance">
              {t('product.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {t('product.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {NAUTA_RUNGS.map((rung: NautaRung) => (
              <div
                key={rung.id}
                className="rounded-2xl border border-neutral-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden"
              >
                {/* Rung header */}
                <div className="p-6 border-b border-neutral-100 dark:border-gray-800 bg-neutral-50/60 dark:bg-gray-800/30">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl" aria-hidden="true">
                      {rung.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                          {t(`product.rungs.${rung.id}.name`)}
                        </h3>
                        <span className="text-sm font-medium text-lavender">
                          {t(`product.rungs.${rung.id}.tagline`)}
                        </span>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        {t(`product.rungs.${rung.id}.oneLine`)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-neutral-700 dark:text-neutral-300 bg-lavender/5 border border-lavender/10 rounded-lg p-3">
                    {t(`product.rungs.${rung.id}.valueVs`)}
                  </p>
                </div>

                {/* Rung tiers */}
                <div className="p-6">
                  <div className="grid sm:grid-cols-2 gap-4">
                    {rung.tiers.map(tier => {
                      const selfServe = rung.motion === 'self-serve';
                      return (
                        <div
                          key={tier.id}
                          className="rounded-xl border border-neutral-200 dark:border-gray-800 p-5 flex flex-col"
                        >
                          <h4 className="font-bold text-neutral-900 dark:text-white mb-1">
                            {tier.label}
                          </h4>
                          <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                            {formatPrice(tier.pricing)}
                          </p>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 flex-1">
                            {t(`product.rungs.${rung.id}.oneLine`)}
                          </p>
                          {selfServe ? (
                            <a
                              href={nautaErpCheckoutUrl()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
                            >
                              {t('cta.selfServe')}
                            </a>
                          ) : (
                            <a
                              href={KALYA_DISCOVERY_CALL_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
                            >
                              {t('cta.discoveryCall')}
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── The catalog Nauta unifies ───────────────────────────────────────── */}
      <section className="py-16 bg-white dark:bg-gray-900/50">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3 text-balance">
              {t('catalog.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {t('catalog.subtitle')}
            </p>
          </div>
          <div className="max-w-3xl mx-auto flex flex-wrap gap-2 justify-center">
            {registrySlices.map(p => (
              <span
                key={p.slug}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-gray-700 text-sm text-neutral-800 dark:text-neutral-200"
              >
                <span aria-hidden="true">{p.icon}</span>
                {p.name}
              </span>
            ))}
            {extraSlices.map(s => (
              <span
                key={s.slug}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-gray-700 text-sm text-neutral-800 dark:text-neutral-200"
              >
                <span aria-hidden="true">{s.icon}</span>
                {s.name}
              </span>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto">
            {t('catalog.note')}
          </p>
        </Container>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-neutral-900">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6 text-balance">
              {t('closing.title')}
            </h2>
            <p className="text-xl text-white/80 mb-12">{t('closing.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={nautaErpCheckoutUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-gradient-to-r from-leaf to-lavender text-white rounded-lg hover:from-leaf/90 hover:to-lavender/90 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              >
                {t('cta.selfServe')}
              </a>
              <a
                href={KALYA_DISCOVERY_CALL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 border border-white text-white rounded-lg hover:bg-white/10 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t('cta.discoveryCall')}
              </a>
            </div>
            <p className="mt-8 text-sm text-white/70">
              <a
                href="https://nauta.quest"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-white transition-colors"
              >
                {t('closing.visitSite')}
              </a>
            </p>
            <p className="mt-3 text-sm text-white/50">
              <Link
                href={getLocalizedUrl('value-ladder', validLocale)}
                className="underline hover:text-white/80 transition-colors"
              >
                {t('closing.exploreLadder')}
              </Link>
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
