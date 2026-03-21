'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import { Container, Button, AnimatedLogo, BrandParticles } from '@/components/ui';
import { Badge } from '@/components/corporate/Badge';
import { EcosystemLayerGrid } from '@/components/ecosystem/EcosystemLayerGrid';
import { EcosystemFlowDiagram } from '@/components/ecosystem/EcosystemFlowDiagram';
import { PersonaCards } from '@/components/ecosystem/PersonaCards';
import { MetricsBar } from '@/components/ecosystem/MetricsBar';

// ─── Maker Node Services ──────────────────────────────────────────────────────

const MAKER_SERVICES = [
  { icon: '🖨️', labelKey: 'printing' },
  { icon: '⚙️', labelKey: 'cnc' },
  { icon: '✂️', labelKey: 'laser' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function EcosystemHomePage() {
  const t = useTranslations('ecosystem.homepage');
  const tEco = useTranslations('ecosystem');
  const locale = useLocale() as Locale;
  const layerGridRef = useRef<HTMLElement>(null);

  function scrollToLayerGrid() {
    layerGridRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen" aria-label="MADFAM Ecosystem Homepage">
      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <section
        data-section="hero"
        aria-labelledby="hero-heading"
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-obsidian"
      >
        <BrandParticles
          density="high"
          colorScheme="auto"
          movement="dynamic"
          interactive
          className="z-0"
        />

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-leaf/10 via-transparent to-lavender/10 z-10"
        />
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 w-96 h-96 bg-leaf/20 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-96 h-96 bg-lavender/20 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"
        />

        <Container className="relative z-20">
          <div className="flex flex-col items-center text-center space-y-10">
            <div className="relative" aria-hidden="true">
              <div className="absolute -inset-8 bg-gradient-to-r from-leaf via-lavender to-sun opacity-30 blur-3xl animate-pulse" />
              <AnimatedLogo size="xl" colorMode="color" />
            </div>

            <div className="space-y-4 max-w-3xl">
              <h1
                id="hero-heading"
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-leaf via-lavender to-sun bg-clip-text text-transparent leading-tight"
              >
                {t('hero.title')}
              </h1>
              <p className="text-xl md:text-2xl text-white/70">{t('hero.subtitle')}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                size="lg"
                onClick={scrollToLayerGrid}
                aria-label={t('hero.exploreCta')}
                className="bg-gradient-to-r from-leaf to-lavender hover:from-leaf/90 hover:to-lavender/90 text-white font-semibold px-8 py-3 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                {t('hero.exploreCta')}
              </Button>

              <Link href={getLocalizedUrl('ecosystem', locale)}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-lavender text-white hover:bg-lavender/10 px-8 py-3 text-lg font-semibold transition-all duration-300"
                >
                  {t('hero.memberCta')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>

        <button
          onClick={scrollToLayerGrid}
          aria-label="Scroll to next section"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/50 hover:text-white/80 transition-colors cursor-pointer"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </section>

      {/* ── 2. Ecosystem Layer Grid (all 10 platforms) ───────────────────── */}
      <section
        ref={layerGridRef}
        data-section="layer-grid"
        aria-labelledby="layer-grid-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="layer-grid-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('platformShowcase.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('platformShowcase.subtitle')}
            </p>
          </div>
          <EcosystemLayerGrid locale={locale} />
        </Container>
      </section>

      {/* ── 3. Integration Flow Diagram ──────────────────────────────────── */}
      <section
        data-section="integration-flow"
        aria-labelledby="flow-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="flow-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('threePaths.title')}
            </h2>
          </div>
          <EcosystemFlowDiagram variant="full" />
        </Container>
      </section>

      {/* ── 4. Persona Cards ─────────────────────────────────────────────── */}
      <PersonaCards locale={locale} />

      {/* ── 5. Primavera Maker Node Highlight ────────────────────────────── */}
      <section
        data-section="maker-node"
        aria-labelledby="maker-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <div className="mb-4">
                <Badge variant="program" className="bg-leaf/10 text-leaf border-leaf/20">
                  {tEco('makerNode.title')}
                </Badge>
              </div>
              <h2
                id="maker-heading"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              >
                {t('makerHighlight.title')}
              </h2>
              <p className="text-xl text-leaf font-medium mb-4">{t('makerHighlight.subtitle')}</p>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                {t('makerHighlight.description')}
              </p>

              <div className="inline-flex items-center gap-3 bg-leaf/10 border border-leaf/30 rounded-xl px-5 py-3">
                <span className="text-xl" aria-hidden="true">
                  🌱
                </span>
                <div>
                  <Badge
                    variant="program"
                    className="bg-leaf text-white border-transparent text-xs mb-1"
                  >
                    {tEco('makerNode.discountHeadline')}
                  </Badge>
                  <p className="text-sm font-semibold text-leaf">
                    {t('makerHighlight.memberDiscount')}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Link href={getLocalizedUrl('solutions.maker-node', locale)}>
                  <Button size="lg" className="bg-leaf hover:bg-leaf/90 text-white">
                    {tEco('makerNode.cta')}
                    <svg
                      className="w-4 h-4 ml-2"
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
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {MAKER_SERVICES.map(({ icon, labelKey }) => (
                <div
                  key={labelKey}
                  className="flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-leaf/50 dark:hover:border-leaf/50 hover:shadow-md transition-all duration-300"
                >
                  <div
                    className="w-12 h-12 rounded-xl bg-leaf/10 flex items-center justify-center text-2xl flex-shrink-0"
                    aria-hidden="true"
                  >
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {tEco(`makerNode.services.${labelKey}.name`)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tEco(`makerNode.services.${labelKey}.detail`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 6. Membership Value Prop (streamlined) ───────────────────────── */}
      <section
        data-section="membership"
        aria-labelledby="membership-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="max-w-2xl mx-auto">
            <div className="relative p-px rounded-3xl bg-gradient-to-br from-leaf via-lavender to-sun">
              <div className="bg-white dark:bg-gray-950 rounded-3xl p-10 text-center">
                <h2
                  id="membership-heading"
                  className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3"
                >
                  {t('membershipValue.title')}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                  {t('membershipValue.subtitle')}
                </p>

                <Link href={getLocalizedUrl('ecosystem', locale)}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-leaf to-lavender hover:from-leaf/90 hover:to-lavender/90 text-white font-semibold px-8 w-full sm:w-auto"
                  >
                    {t('membershipValue.cta')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 7. Metrics Bar (proof points) ────────────────────────────────── */}
      <MetricsBar />

      {/* ── 8. Final CTA ─────────────────────────────────────────────────── */}
      <section
        data-section="final-cta"
        aria-labelledby="final-cta-heading"
        className="py-24 bg-obsidian relative overflow-hidden"
      >
        <div aria-hidden="true" className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-leaf rounded-full filter blur-3xl" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-lavender rounded-full filter blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-sun rounded-full filter blur-3xl" />
        </div>

        <Container className="relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h2
              id="final-cta-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              {t('finalCta.title')}
            </h2>
            <p className="text-xl text-white/70 mb-12">{t('finalCta.subtitle')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Link href={getLocalizedUrl('products', locale)}>
                <Button
                  size="lg"
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
                >
                  <span className="mr-2" aria-hidden="true">
                    💻
                  </span>
                  {t('threePaths.platforms.cta')}
                </Button>
              </Link>

              <Link href={getLocalizedUrl('solutions.maker-node', locale)}>
                <Button
                  size="lg"
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 backdrop-blur-sm transition-all duration-300"
                >
                  <span className="mr-2" aria-hidden="true">
                    🔧
                  </span>
                  {t('threePaths.maker.cta')}
                </Button>
              </Link>

              <Link href={getLocalizedUrl('ecosystem', locale)}>
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-leaf to-lavender hover:from-leaf/90 hover:to-lavender/90 text-white font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                >
                  <span className="mr-2" aria-hidden="true">
                    🌱
                  </span>
                  {t('threePaths.membership.cta')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
