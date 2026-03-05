'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedUrl } from '@madfam/i18n';
import type { Locale } from '@madfam/i18n';
import { Container, Button, BrandParticles } from '@/components/ui';
import { Badge } from '@/components/corporate/Badge';
import { PlatformGrid } from '@/components/ecosystem/PlatformGrid';
import { PricingCards } from '@/components/ecosystem/PricingCards';

// ─── Comparison Data ──────────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  'platformAccess',
  'proFeatures',
  'makerNodeDiscount',
  'prioritySupport',
  'earlyAccess',
  'communityAccess',
] as const;

type ComparisonRow = (typeof COMPARISON_ROWS)[number];

const COMPARISON_VALUES: Record<ComparisonRow, { free: string; pro: string; member: string }> = {
  platformAccess: { free: 'free', pro: 'individual', member: 'all' },
  proFeatures: { free: 'none', pro: 'single', member: 'all' },
  makerNodeDiscount: { free: 'none', pro: 'none', member: 'discount' },
  prioritySupport: { free: 'none', pro: 'standard', member: 'priority' },
  earlyAccess: { free: 'none', pro: 'none', member: 'yes' },
  communityAccess: { free: 'none', pro: 'none', member: 'yes' },
};

// ─── FAQ Data ─────────────────────────────────────────────────────────────────

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function DashIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EcosystemPage() {
  const t = useTranslations('ecosystem');
  const locale = useLocale() as Locale;

  const [openFaq, setOpenFaq] = useState<string | null>(null);

  function toggleFaq(key: string) {
    setOpenFaq(prev => (prev === key ? null : key));
  }

  // Render a value cell for the comparison matrix
  function renderComparisonCell(valueKey: string, isHighlighted: boolean) {
    const isNone = valueKey === 'none';
    const baseText = t(`comparison.values.${valueKey}`);

    if (isNone) {
      return (
        <td
          className={`px-4 py-3.5 text-center ${isHighlighted ? 'bg-leaf/5 dark:bg-leaf/10' : ''}`}
        >
          <DashIcon className="w-5 h-5 text-gray-300 dark:text-gray-700 mx-auto" />
        </td>
      );
    }

    return (
      <td className={`px-4 py-3.5 text-center ${isHighlighted ? 'bg-leaf/5 dark:bg-leaf/10' : ''}`}>
        <span
          className={`inline-flex items-center justify-center gap-1.5 ${isHighlighted ? 'text-leaf font-medium' : 'text-gray-600 dark:text-gray-400'} text-sm`}
        >
          {isHighlighted && <CheckIcon className="w-4 h-4 text-leaf flex-shrink-0" />}
          {baseText}
        </span>
      </td>
    );
  }

  return (
    <main className="min-h-screen" aria-label="MADFAM Ecosystem Membership">
      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section
        data-section="hero"
        aria-labelledby="ecosystem-hero-heading"
        className="relative min-h-[70vh] flex items-center justify-center overflow-hidden bg-obsidian"
      >
        {/* Particle background */}
        <BrandParticles
          density="high"
          colorScheme="auto"
          movement="dynamic"
          interactive
          className="z-0"
        />

        {/* Gradient overlays */}
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

        {/* Content */}
        <Container className="relative z-20 py-24">
          <div className="flex flex-col items-center text-center space-y-6 max-w-3xl mx-auto">
            {/* Badge */}
            <Badge
              variant="program"
              className="bg-leaf/20 text-leaf border-leaf/30 text-sm px-4 py-1"
            >
              {t('hero.badge')}
            </Badge>

            {/* Headline */}
            <h1
              id="ecosystem-hero-heading"
              className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-leaf via-lavender to-sun bg-clip-text text-transparent leading-tight"
            >
              {t('hero.title')}
            </h1>

            <p className="text-lg md:text-xl text-white/70 max-w-2xl">{t('hero.subtitle')}</p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center pt-2">
              <Link href={getLocalizedUrl('contact', locale)}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-leaf to-lavender hover:from-leaf/90 hover:to-lavender/90 text-white font-semibold px-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  {t('hero.ctaPrimary')}
                </Button>
              </Link>
              <Link href={getLocalizedUrl('contact', locale)}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-8 transition-all duration-300"
                >
                  {t('hero.ctaSecondary')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>

        {/* Scroll cue */}
        <div
          aria-hidden="true"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-white/40"
        >
          <ChevronDownIcon className="w-6 h-6" />
        </div>
      </section>

      {/* ── 2. Platform Grid ──────────────────────────────────────────────── */}
      <section
        data-section="platform-grid"
        aria-labelledby="platform-grid-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <h2 id="platform-grid-heading" className="sr-only">
            {t('platformGrid.title')}
          </h2>
          <PlatformGrid title={t('platformGrid.title')} />
        </Container>
      </section>

      {/* ── 3. Comparison Matrix ──────────────────────────────────────────── */}
      <section
        data-section="comparison"
        aria-labelledby="comparison-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="comparison-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('comparison.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('comparison.subtitle')}
            </p>
          </div>

          {/* Table */}
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
              <thead>
                <tr>
                  {/* Feature label column */}
                  <th
                    scope="col"
                    className="px-4 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 w-1/3 md:w-2/5"
                  >
                    {t('comparison.featureLabel')}
                  </th>

                  {/* Free */}
                  <th scope="col" className="px-4 py-4 text-center bg-gray-50 dark:bg-gray-900">
                    <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      {t('comparison.tiers.free')}
                    </span>
                    <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {t('comparison.tiers.freeNote')}
                    </span>
                  </th>

                  {/* Individual Pro */}
                  <th scope="col" className="px-4 py-4 text-center bg-gray-50 dark:bg-gray-900">
                    <span className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                      {t('comparison.tiers.pro')}
                    </span>
                    <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {t('comparison.tiers.proNote')}
                    </span>
                  </th>

                  {/* Ecosystem Member — highlighted column with gradient top border */}
                  <th
                    scope="col"
                    className="px-4 py-4 text-center bg-leaf/5 dark:bg-leaf/10 relative"
                  >
                    {/* Gradient top border accent */}
                    <div
                      aria-hidden="true"
                      className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-leaf via-lavender to-sun rounded-t"
                    />
                    <span className="block text-sm font-bold text-leaf">
                      {t('comparison.tiers.member')}
                    </span>
                    <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sun/20 text-sun border border-sun/30">
                      {t('comparison.bestValue')}
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {COMPARISON_ROWS.map((rowKey, index) => (
                  <tr
                    key={rowKey}
                    className={
                      index % 2 === 0
                        ? 'bg-white dark:bg-gray-950'
                        : 'bg-gray-50/50 dark:bg-gray-900/50'
                    }
                  >
                    {/* Feature name */}
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t(`comparison.features.${rowKey}`)}
                    </td>

                    {/* Free column */}
                    {renderComparisonCell(COMPARISON_VALUES[rowKey].free, false)}

                    {/* Pro column */}
                    {renderComparisonCell(COMPARISON_VALUES[rowKey].pro, false)}

                    {/* Member column */}
                    {renderComparisonCell(COMPARISON_VALUES[rowKey].member, true)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* ── 4. Pricing Cards ──────────────────────────────────────────────── */}
      <section
        data-section="pricing"
        aria-labelledby="pricing-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="pricing-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('pricing.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          <PricingCards />
        </Container>
      </section>

      {/* ── 5. Maker Node Spotlight ───────────────────────────────────────── */}
      <section
        data-section="maker-node"
        aria-labelledby="maker-node-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: text content */}
            <div>
              <div className="mb-4">
                <Badge variant="program" className="bg-leaf/10 text-leaf border-leaf/20">
                  {t('makerNode.badge')}
                </Badge>
              </div>

              <h2
                id="maker-node-heading"
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              >
                {t('makerNode.title')}
              </h2>

              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                {t('makerNode.description')}
              </p>

              <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
                {t('makerNode.description2')}
              </p>

              {/* Discount callout */}
              <div
                className="flex items-start gap-4 bg-leaf/10 border border-leaf/30 rounded-xl px-5 py-4 mb-8"
                role="note"
                aria-label={t('makerNode.discountCalloutLabel')}
              >
                <span className="text-2xl flex-shrink-0" aria-hidden="true">
                  🌱
                </span>
                <div>
                  <p className="text-sm font-bold text-leaf mb-0.5">
                    {t('makerNode.discountHeadline')}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('makerNode.discountBody')}
                  </p>
                </div>
              </div>

              <Link href={getLocalizedUrl('solutions.maker-node', locale)}>
                <Button size="lg" className="bg-leaf hover:bg-leaf/90 text-white font-semibold">
                  {t('makerNode.cta')}
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

            {/* Right: services grid */}
            <div className="grid grid-cols-1 gap-4" aria-label={t('makerNode.servicesLabel')}>
              {[
                { icon: '🖨️', key: 'printing' },
                { icon: '⚙️', key: 'cnc' },
                { icon: '✂️', key: 'laser' },
                { icon: '🔩', key: 'assembly' },
              ].map(({ icon, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-4 p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-leaf/50 dark:hover:border-leaf/50 hover:shadow-sm transition-all duration-300"
                >
                  <div
                    className="w-11 h-11 rounded-xl bg-leaf/10 flex items-center justify-center text-xl flex-shrink-0"
                    aria-hidden="true"
                  >
                    {icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {t(`makerNode.services.${key}.name`)}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t(`makerNode.services.${key}.detail`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 6. FAQ ────────────────────────────────────────────────────────── */}
      <section
        data-section="faq"
        aria-labelledby="faq-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="faq-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('faq.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('faq.subtitle')}
            </p>
          </div>

          <div
            className="max-w-2xl mx-auto divide-y divide-gray-200 dark:divide-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-950 shadow-sm"
            role="list"
            aria-label={t('faq.title')}
          >
            {FAQ_KEYS.map(key => {
              const isOpen = openFaq === key;
              const itemId = `faq-item-${key}`;
              const panelId = `faq-panel-${key}`;

              return (
                <div key={key} role="listitem">
                  <button
                    id={itemId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleFaq(key)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-inset"
                  >
                    <span className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                      {t(`faq.items.${key}.question`)}
                    </span>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-leaf' : ''
                      }`}
                    />
                  </button>

                  {/* Answer panel — visible when open */}
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={itemId}
                    hidden={!isOpen}
                    className="px-6 pb-5"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      {t(`faq.items.${key}.answer`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* More questions nudge */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
            {t('faq.moreQuestions')}{' '}
            <Link
              href={getLocalizedUrl('contact', locale)}
              className="text-leaf font-medium hover:underline"
            >
              {t('faq.contactLink')}
            </Link>
          </p>
        </Container>
      </section>

      {/* ── 7. Final CTA ──────────────────────────────────────────────────── */}
      <section
        data-section="final-cta"
        aria-labelledby="final-cta-heading"
        className="py-24 bg-obsidian relative overflow-hidden"
      >
        {/* Background decoration */}
        <div aria-hidden="true" className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-leaf rounded-full filter blur-3xl" />
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-lavender rounded-full filter blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-sun rounded-full filter blur-3xl" />
        </div>

        <Container className="relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              id="final-cta-heading"
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            >
              {t('cta.title')}
            </h2>
            <p className="text-lg text-white/70 mb-10">{t('cta.subtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={getLocalizedUrl('contact', locale)}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-leaf to-lavender hover:from-leaf/90 hover:to-lavender/90 text-white font-semibold px-10 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                >
                  {t('cta.primaryButton')}
                </Button>
              </Link>

              <Link href={getLocalizedUrl('contact', locale)}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 text-white hover:bg-white/10 px-10 transition-all duration-300"
                >
                  {t('cta.secondaryButton')}
                </Button>
              </Link>
            </div>

            <p className="mt-6 text-sm text-white/40">{t('cta.disclaimer')}</p>
          </div>
        </Container>
      </section>
    </main>
  );
}
