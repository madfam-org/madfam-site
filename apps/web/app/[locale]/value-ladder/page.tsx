import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getLocalizedUrl, type Locale } from '@madfam-site/i18n';
import { Container } from '@/components/ui';
import {
  ValueLadderSelector,
  type ValueLadderSelectorStrings,
} from '@/components/ValueLadderSelector';
import {
  BANDS_DESC,
  BUNDLES,
  getBandRungs,
  getExtraSlices,
  getRegistrySlices,
  dhanamCheckoutUrl,
  KALYA_DISCOVERY_CALL_URL,
  type BandId,
  type LadderRung,
  type TierPricing,
} from '@/lib/data/value-ladder';

type Props = {
  params: Promise<{ locale: string }>;
};

const LADDER_ANCHOR = 'ladder';
const SELECTOR_ANCHOR = 'selector';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'valueLadder' });
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

export default async function ValueLadderPage({ params }: Props) {
  const { locale } = await params;
  const validLocale = locale as Locale;
  const t = await getTranslations({ locale, namespace: 'valueLadder' });

  // Render a price the REGISTRY states. A tier the registry has not priced
  // renders the pending sentence — never a number, never «TBD» (ruling R9).
  // The amount, currency and unit all come from the registry; only the wording
  // around them is copy, because the projection deliberately carries no
  // localized strings.
  const formatPrice = (pricing: TierPricing): string => {
    if (pricing.state === 'pending') return t('price.pending');
    const amount = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: pricing.currency,
      maximumFractionDigits: 0,
    }).format(pricing.amount);
    return `${amount} ${t(`price.unit.${pricing.unit}`)}`;
  };

  const registrySlices = getRegistrySlices();

  // Strings handed to the client self-selector (mirrors AssessmentClient's
  // translations prop — the server resolves every key, the client stays static).
  const selectorStrings: ValueLadderSelectorStrings = {
    eyebrow: t('selector.eyebrow'),
    title: t('selector.title'),
    subtitle: t('selector.subtitle'),
    step: t('selector.step'),
    needQuestion: t('selector.needQuestion'),
    sizeQuestion: t('selector.sizeQuestion'),
    needs: {
      invoices: t('selector.needs.invoices'),
      bookings: t('selector.needs.bookings'),
      money: t('selector.needs.money'),
      'design-to-sell': t('selector.needs.design-to-sell'),
      unify: t('selector.needs.unify'),
      'run-for-me': t('selector.needs.run-for-me'),
    },
    sizes: {
      solo: t('selector.sizes.solo'),
      team: t('selector.sizes.team'),
      biz: t('selector.sizes.biz'),
    },
    bands: {
      slice: t('bands.slice.name'),
      bundle: t('bands.bundle.name'),
      erp: t('bands.erp.name'),
      vcto: t('bands.vcto.name'),
    },
    bandTaglines: {
      slice: t('bands.slice.tagline'),
      bundle: t('bands.bundle.tagline'),
      erp: t('bands.erp.tagline'),
      vcto: t('bands.vcto.tagline'),
    },
    pricePending: t('price.pending'),
    resultHeading: t('selector.resultHeading'),
    resultRecommended: t('selector.resultRecommended'),
    grantsLabel: t('selector.grantsLabel'),
    bands_grants: {
      slice: t('bands.slice.grants'),
      bundle: t('bands.bundle.grants'),
      erp: t('bands.erp.grants'),
      vcto: t('bands.vcto.grants'),
    },
    upsellLabel: t('selector.upsellLabel'),
    ctaSelfServe: t('cta.selfServe'),
    ctaDiscoveryCall: t('cta.discoveryCall'),
    ctaExplore: t('selector.ctaExplore'),
    restart: t('selector.restart'),
    back: t('selector.back'),
  };

  const bandRungs: Record<BandId, LadderRung[]> = {
    slice: [],
    bundle: [],
    erp: getBandRungs('erp'),
    vcto: getBandRungs('vcto'),
  };

  const extraSlices = getExtraSlices();

  return (
    <main className="min-h-screen bg-gradient-to-b from-neutral-50 to-white dark:from-gray-950 dark:to-gray-900">
      {/* ── Hero: the reach, told as the ladder ────────────────────────────── */}
      <section className="py-16 lg:py-24">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-wide text-leaf mb-4">
              {t('hero.eyebrow')}
            </p>
            <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`#${SELECTOR_ANCHOR}`}
                className="px-8 py-3 bg-gradient-to-r from-leaf to-lavender text-white rounded-lg hover:from-leaf/90 hover:to-lavender/90 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              >
                {t('hero.ctaFindRung')}
              </a>
              <a
                href={`#${LADDER_ANCHOR}`}
                className="px-8 py-3 border border-neutral-300 dark:border-gray-700 text-neutral-700 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              >
                {t('hero.ctaExplore')}
              </a>
            </div>
          </div>

          {/* The four bands as an ascending map (top rung first) */}
          <div className="mt-16 max-w-3xl mx-auto space-y-3">
            {BANDS_DESC.map(band => (
              <a
                key={band.id}
                href={`#band-${band.id}`}
                className="block rounded-xl border border-neutral-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 hover:border-lavender/50 hover:shadow-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              >
                <div className="flex items-start gap-4">
                  <span className="text-2xl" aria-hidden="true">
                    {band.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                        {t('bands.bandLabel')} {band.order}
                      </span>
                      <span className="font-bold text-neutral-900 dark:text-white">
                        {t(`bands.${band.id}.name`)}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {t(`bands.${band.id}.oneLine`)}
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          {/* Ladder doctrine */}
          <div className="mt-10 max-w-3xl mx-auto grid sm:grid-cols-3 gap-4">
            {(['oneIdentity', 'worthMore', 'nothingLost'] as const).map(key => (
              <div key={key} className="rounded-lg bg-leaf/5 border border-leaf/10 p-4 text-center">
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {t(`hero.doctrine.${key}`)}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── The self-selector ──────────────────────────────────────────────── */}
      <section id={SELECTOR_ANCHOR} className="py-16 bg-white dark:bg-gray-900/50 scroll-mt-20">
        <Container>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-semibold uppercase tracking-wide text-lavender mb-3">
              {t('selector.eyebrow')}
            </p>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-3">
              {t('selector.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              {t('selector.subtitle')}
            </p>
          </div>
          <ValueLadderSelector strings={selectorStrings} ladderAnchor={LADDER_ANCHOR} />
        </Container>
      </section>

      {/* ── The ladder, interactive ────────────────────────────────────────── */}
      <section id={LADDER_ANCHOR} className="py-16 scroll-mt-20">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('ladder.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">{t('ladder.subtitle')}</p>
          </div>

          <div className="max-w-4xl mx-auto space-y-8">
            {BANDS_DESC.map(band => (
              <div
                key={band.id}
                id={`band-${band.id}`}
                className="rounded-2xl border border-neutral-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden scroll-mt-20"
              >
                {/* Band header */}
                <div className="p-6 border-b border-neutral-100 dark:border-gray-800 bg-neutral-50/60 dark:bg-gray-800/30">
                  <div className="flex items-start gap-4">
                    <span className="text-3xl" aria-hidden="true">
                      {band.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:text-neutral-500">
                          {t('bands.bandLabel')} {band.order}
                        </span>
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                          {t(`bands.${band.id}.name`)}
                        </h3>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        {t(`bands.${band.id}.oneLine`)}
                      </p>
                    </div>
                  </div>
                  {/* Value-vs-incumbent line */}
                  <p className="mt-4 text-sm text-neutral-700 dark:text-neutral-300 bg-lavender/5 border border-lavender/10 rounded-lg p-3">
                    <span className="font-semibold">{t('ladder.valueVs')}</span>{' '}
                    {t(`bands.${band.id}.valueVs`)}
                  </p>
                </div>

                {/* Band body */}
                <div className="p-6">
                  {/* Band 1 — slices */}
                  {band.id === 'slice' && (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-4">
                        {t('bands.slice.grants')}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {registrySlices.map(p => (
                          <a
                            key={p.slug}
                            href={dhanamCheckoutUrl(p.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-gray-700 text-sm text-neutral-800 dark:text-neutral-200 hover:border-lavender/50 hover:bg-neutral-50 dark:hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
                          >
                            <span aria-hidden="true">{p.icon}</span>
                            {p.name}
                          </a>
                        ))}
                        {extraSlices.map(s => (
                          <a
                            key={s.slug}
                            href={dhanamCheckoutUrl(s.checkoutSlug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-gray-700 text-sm text-neutral-800 dark:text-neutral-200 hover:border-lavender/50 hover:bg-neutral-50 dark:hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
                          >
                            <span aria-hidden="true">{s.icon}</span>
                            {s.name}
                          </a>
                        ))}
                      </div>
                      <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
                        {t('bands.slice.priceNote')}
                      </p>
                    </div>
                  )}

                  {/* Band 2 — bundles */}
                  {band.id === 'bundle' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {BUNDLES.map(bundle => (
                        <div
                          key={bundle.id}
                          className="rounded-xl border border-neutral-200 dark:border-gray-800 p-5"
                        >
                          <h4 className="font-bold text-neutral-900 dark:text-white mb-1">
                            {t(`bundles.${bundle.id}.name`)}
                          </h4>
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                            {t(`bundles.${bundle.id}.description`)}
                          </p>
                          <p className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                            {formatPrice(bundle.pricing)}
                          </p>
                          <a
                            href={dhanamCheckoutUrl(bundle.checkoutSlug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
                          >
                            {t('cta.selfServe')}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bands 3 & 4 — the registry's Nauta tiers */}
                  {(band.id === 'erp' || band.id === 'vcto') && (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {bandRungs[band.id].map(rung => {
                        const selfServe = rung.motion === 'self-serve' && rung.checkoutSlug;
                        return (
                          <div
                            key={rung.id}
                            className="rounded-xl border border-neutral-200 dark:border-gray-800 p-5 flex flex-col"
                          >
                            <h4 className="font-bold text-neutral-900 dark:text-white mb-1">
                              {rung.label}
                            </h4>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
                              {formatPrice(rung.pricing)}
                            </p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 flex-1">
                              {t(`bands.${band.id}.grants`)}
                            </p>
                            {selfServe && rung.checkoutSlug ? (
                              <a
                                href={dhanamCheckoutUrl(rung.checkoutSlug)}
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
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Proof: the moats ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white dark:bg-gray-900/50">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              {t('proof.title')}
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">{t('proof.subtitle')}</p>
          </div>
          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 gap-6">
            {(['fiscalNative', 'salidaDigna', 'vctoInBox', 'bestOfBreed'] as const).map(key => (
              <div
                key={key}
                className="rounded-xl border border-neutral-200 dark:border-gray-800 p-6"
              >
                <h3 className="font-bold text-neutral-900 dark:text-white mb-2">
                  {t(`proof.moats.${key}.title`)}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {t(`proof.moats.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── Closing CTA ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-neutral-900">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">{t('closing.title')}</h2>
            <p className="text-xl text-white/80 mb-12">{t('closing.subtitle')}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={`#${SELECTOR_ANCHOR}`}
                className="px-8 py-3 bg-gradient-to-r from-leaf to-lavender text-white rounded-lg hover:from-leaf/90 hover:to-lavender/90 transition-colors font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender"
              >
                {t('hero.ctaFindRung')}
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
            <p className="mt-8 text-sm text-white/50">
              <Link
                href={getLocalizedUrl('products', validLocale)}
                className="underline hover:text-white/80 transition-colors"
              >
                {t('closing.exploreProducts')}
              </Link>
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
