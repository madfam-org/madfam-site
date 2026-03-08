'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import { Container, Button, BrandParticles } from '@/components/ui';
import { Badge } from '@/components/corporate/Badge';

// ─── Static Data ──────────────────────────────────────────────────────────────

const SERVICES = [
  {
    icon: '🖨️',
    key: 'printing',
    accentColor: 'border-lavender/40 hover:border-lavender',
    iconBg: 'bg-lavender/10',
    badgeColor: 'bg-lavender/10 text-purple-700 border-lavender/30',
  },
  {
    icon: '⚙️',
    key: 'cnc',
    accentColor: 'border-sun/40 hover:border-sun',
    iconBg: 'bg-sun/10',
    badgeColor: 'bg-sun/10 text-amber-700 border-sun/30',
  },
  {
    icon: '✂️',
    key: 'laser',
    accentColor: 'border-leaf/40 hover:border-leaf',
    iconBg: 'bg-leaf/10',
    badgeColor: 'bg-leaf/10 text-green-700 border-leaf/30',
  },
] as const;

const WORKFLOW_STEPS = [
  {
    key: 'design',
    icon: '📐',
    platform: 'Yantra4D',
    platformColor: 'from-purple-500/20 to-purple-600/10',
    platformBorder: 'border-lavender/40',
    platformText: 'text-purple-600 dark:text-purple-400',
    stepNumber: '01',
  },
  {
    key: 'quote',
    icon: '💰',
    platform: 'Cotiza Studio',
    platformColor: 'from-amber-500/20 to-amber-600/10',
    platformBorder: 'border-sun/40',
    platformText: 'text-amber-600 dark:text-amber-400',
    stepNumber: '02',
  },
  {
    key: 'fabricate',
    icon: '🏭',
    platform: 'Maker Node',
    platformColor: 'from-leaf/20 to-emerald-600/10',
    platformBorder: 'border-leaf/40',
    platformText: 'text-leaf',
    stepNumber: '03',
  },
  {
    key: 'track',
    icon: '📊',
    platform: 'Pravara-MES',
    platformColor: 'from-blue-500/20 to-blue-600/10',
    platformBorder: 'border-blue-400/40',
    platformText: 'text-blue-600 dark:text-blue-400',
    stepNumber: '04',
  },
] as const;

const ECOSYSTEM_CONNECTIONS = [
  {
    name: 'Yantra4D',
    icon: '📐',
    descriptionKey: 'yantra4d',
    color: 'from-purple-500/20 to-purple-600/10',
    border: 'border-lavender/40',
    accent: 'text-purple-600 dark:text-purple-400',
  },
  {
    name: 'Cotiza Studio',
    icon: '💰',
    descriptionKey: 'cotiza',
    color: 'from-amber-500/20 to-amber-600/10',
    border: 'border-sun/40',
    accent: 'text-amber-600 dark:text-amber-400',
  },
  {
    name: 'Pravara-MES',
    icon: '📊',
    descriptionKey: 'pravara',
    color: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-400/40',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Enclii',
    icon: '☁️',
    descriptionKey: 'enclii',
    color: 'from-leaf/20 to-emerald-600/10',
    border: 'border-leaf/40',
    accent: 'text-leaf',
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function MakerNodePage() {
  const t = useTranslations('ecosystem.makerNodePage');
  const locale = useLocale() as Locale;

  return (
    <main className="min-h-screen" aria-label="Primavera Maker Node">
      {/* ── 1. Hero ───────────────────────────────────────────────────────── */}
      <section
        data-section="hero"
        aria-labelledby="hero-heading"
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-obsidian"
      >
        {/* Particle background */}
        <BrandParticles
          density="medium"
          colorScheme="auto"
          movement="dynamic"
          variant="subtle"
          className="z-0"
        />

        {/* Gradient overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-leaf/10 via-transparent to-lavender/10 z-10"
        />

        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 w-96 h-96 bg-leaf/15 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-96 h-96 bg-lavender/15 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"
        />

        {/* Content */}
        <Container className="relative z-20">
          <div className="flex flex-col items-center text-center space-y-8 py-24">
            {/* Badge */}
            <div>
              <Badge
                variant="program"
                className="bg-leaf/20 text-green-300 border border-leaf/40 text-sm px-4 py-1"
              >
                {t('hero.badge')}
              </Badge>
            </div>

            {/* Title */}
            <div className="space-y-6 max-w-4xl">
              <h1
                id="hero-heading"
                className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-leaf via-lavender to-sun bg-clip-text text-transparent leading-tight"
              >
                {t('hero.title')}
              </h1>
              <p className="text-xl md:text-2xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center pt-4">
              <Link href={getLocalizedUrl('contact', locale)}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-leaf to-lavender hover:from-leaf/90 hover:to-lavender/90 text-white font-semibold px-8 py-3 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 min-w-[180px]"
                  aria-label={t('cta.primary')}
                >
                  {t('cta.primary')}
                </Button>
              </Link>

              <Link href={getLocalizedUrl('contact', locale)}>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 px-8 py-3 text-lg font-semibold transition-all duration-300 min-w-[180px]"
                  aria-label={t('cta.secondary')}
                >
                  {t('cta.secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Services ───────────────────────────────────────────────────── */}
      <section
        data-section="services"
        aria-labelledby="services-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="services-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('services.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {SERVICES.map(({ icon, key, accentColor, iconBg, badgeColor }) => (
              <article
                key={key}
                className={`group flex flex-col p-8 rounded-2xl bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 ${accentColor} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                aria-label={t(`services.${key}.title`)}
              >
                {/* Icon */}
                <div
                  className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center text-3xl mb-6 transition-transform duration-300 group-hover:scale-110`}
                  aria-hidden="true"
                >
                  {icon}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {t(`services.${key}.title`)}
                </h3>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                  {t(`services.${key}.description`)}
                </p>

                {/* Materials badge */}
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-2">
                    Materials
                  </p>
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${badgeColor}`}
                  >
                    {t(`services.${key}.materials`)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 3. Integrated Workflow ────────────────────────────────────────── */}
      <section
        data-section="workflow"
        aria-labelledby="workflow-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="workflow-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('workflow.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('workflow.subtitle')}
            </p>
          </div>

          {/* Pipeline */}
          <div className="max-w-5xl mx-auto" role="list" aria-label="Fabrication workflow pipeline">
            <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0">
              {WORKFLOW_STEPS.map(
                (
                  { key, icon, platform, platformColor, platformBorder, platformText, stepNumber },
                  index
                ) => (
                  <React.Fragment key={key}>
                    {/* Step card */}
                    <div
                      role="listitem"
                      className={`flex-1 flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-br ${platformColor} border-2 ${platformBorder} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
                    >
                      {/* Step number */}
                      <span
                        className={`text-xs font-bold tracking-widest uppercase mb-3 ${platformText} opacity-60`}
                      >
                        {stepNumber}
                      </span>

                      {/* Icon */}
                      <div
                        className="w-14 h-14 rounded-2xl bg-white/50 dark:bg-black/20 flex items-center justify-center text-2xl mb-4 shadow-sm"
                        aria-hidden="true"
                      >
                        {icon}
                      </div>

                      {/* Step title */}
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                        {t(`workflow.steps.${key}.title`)}
                      </h3>

                      {/* Step description */}
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                        {t(`workflow.steps.${key}.description`)}
                      </p>

                      {/* Platform tag */}
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/60 dark:bg-black/30 ${platformText} border ${platformBorder}`}
                      >
                        {platform}
                      </span>
                    </div>

                    {/* Arrow connector — hidden after last item */}
                    {index < WORKFLOW_STEPS.length - 1 && (
                      <div
                        aria-hidden="true"
                        className="hidden md:flex items-center justify-center px-2 flex-shrink-0 text-gray-400 dark:text-gray-600"
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                )
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 4. Ecosystem Integration ──────────────────────────────────────── */}
      <section
        data-section="ecosystem"
        aria-labelledby="ecosystem-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="ecosystem-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('ecosystem.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('ecosystem.subtitle')}
            </p>
          </div>

          {/* Platform connection cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-12">
            {ECOSYSTEM_CONNECTIONS.map(({ name, icon, color, border, accent }) => (
              <div
                key={name}
                className={`group flex flex-col p-6 rounded-2xl bg-gradient-to-br ${color} border-2 ${border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="text-3xl mb-4" aria-hidden="true">
                  {icon}
                </div>
                <h3 className={`text-base font-bold mb-2 ${accent}`}>{name}</h3>
                <div
                  className="w-8 h-0.5 mb-3 rounded-full opacity-40 bg-current"
                  aria-hidden="true"
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Connected via MADFAM ecosystem
                </p>
              </div>
            ))}
          </div>

          {/* Ecosystem member benefit callout */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center gap-5 bg-leaf/5 border-2 border-leaf/30 rounded-2xl px-8 py-6">
              <div
                className="w-14 h-14 rounded-2xl bg-leaf/15 flex items-center justify-center text-2xl flex-shrink-0"
                aria-hidden="true"
              >
                🌱
              </div>
              <div className="text-center sm:text-left flex-1">
                <Badge
                  variant="program"
                  className="bg-leaf text-white border-transparent text-xs mb-2 inline-flex"
                >
                  Ecosystem Member Benefit
                </Badge>
                <p className="text-base font-semibold text-gray-900 dark:text-white leading-snug">
                  {t('ecosystem.memberBenefit')}
                </p>
              </div>
              <Link href={getLocalizedUrl('ecosystem', locale)} className="flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-leaf text-leaf hover:bg-leaf/10 whitespace-nowrap"
                >
                  Join Ecosystem
                  <svg
                    className="w-4 h-4 ml-1.5"
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
        </Container>
      </section>

      {/* ── 5. Final CTA ──────────────────────────────────────────────────── */}
      <section
        data-section="final-cta"
        aria-labelledby="final-cta-heading"
        className="py-24 bg-obsidian relative overflow-hidden"
      >
        {/* Background decoration */}
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
              {t('cta.title')}
            </h2>
            <p className="text-xl text-white/70 mb-12 leading-relaxed">{t('cta.subtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={getLocalizedUrl('contact', locale)}>
                <Button
                  size="xl"
                  className="bg-gradient-to-r from-leaf to-lavender hover:from-leaf/90 hover:to-lavender/90 text-white font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 min-w-[200px]"
                  aria-label={t('cta.primary')}
                >
                  {t('cta.primary')}
                </Button>
              </Link>

              <Link href={getLocalizedUrl('contact', locale)}>
                <Button
                  variant="outline"
                  size="xl"
                  className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 transition-all duration-300 min-w-[200px]"
                  aria-label={t('cta.secondary')}
                >
                  {t('cta.secondary')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
