'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import { Container, Button, AnimatedLogo, BrandParticles } from '@/components/ui';
import { Badge } from '@/components/corporate/Badge';

// ─── Pipeline Stage Data ──────────────────────────────────────────────────────

const PIPELINE_STAGES = [
  { icon: '☁️', key: 'cloud' },
  { icon: '🔐', key: 'identity' },
  { icon: '📐', key: 'design' },
  { icon: '🏭', key: 'manufacturing' },
  { icon: '💰', key: 'intelligence' },
] as const;

// ─── Platform Showcase Data ────────────────────────────────────────────────────

const FEATURED_PLATFORMS = [
  {
    name: 'Enclii',
    tagline: 'Sovereign Cloud Platform',
    icon: '☁️',
    color: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-200 dark:border-blue-800',
    accent: 'text-blue-600 dark:text-blue-400',
  },
  {
    name: 'Yantra4D',
    tagline: 'Parametric Design Platform',
    icon: '📐',
    color: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-200 dark:border-purple-800',
    accent: 'text-purple-600 dark:text-purple-400',
  },
  {
    name: 'Dhanam',
    tagline: 'Financial Wellness Platform',
    icon: '💰',
    color: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-200 dark:border-emerald-800',
    accent: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    name: 'Forge Sight',
    tagline: 'Pricing Intelligence Platform',
    icon: '🔍',
    color: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-200 dark:border-amber-800',
    accent: 'text-amber-600 dark:text-amber-400',
  },
] as const;

// ─── Membership Benefits Data ─────────────────────────────────────────────────

const MEMBERSHIP_BENEFITS = [
  'Pro access on all 9 platforms',
  'Up to 20% off Maker Node fabrication',
  'Priority support across all products',
  'Early access to new platform launches',
  'Members-only community access',
] as const;

// ─── Why MADFAM Data ──────────────────────────────────────────────────────────

const WHY_ITEMS = [
  {
    icon: '🌐',
    key: 'openSource',
    border: 'border-leaf/30',
    bg: 'bg-leaf/5',
    iconBg: 'bg-leaf/10',
  },
  {
    icon: '🌎',
    key: 'latam',
    border: 'border-lavender/30',
    bg: 'bg-lavender/5',
    iconBg: 'bg-lavender/10',
  },
  {
    icon: '🔒',
    key: 'privacy',
    border: 'border-sun/30',
    bg: 'bg-sun/5',
    iconBg: 'bg-sun/10',
  },
  {
    icon: '🌱',
    key: 'solarpunk',
    border: 'border-leaf/30',
    bg: 'bg-leaf/5',
    iconBg: 'bg-leaf/10',
  },
] as const;

// ─── Three Paths Data ─────────────────────────────────────────────────────────

const THREE_PATHS = [
  {
    icon: '💻',
    key: 'platforms' as const,
    route: 'products' as const,
    border: 'border-blue-200 dark:border-blue-800 hover:border-leaf',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    accentText: 'text-leaf',
  },
  {
    icon: '🔧',
    key: 'maker' as const,
    route: 'solutions.maker-node' as const,
    border: 'border-amber-200 dark:border-amber-800 hover:border-leaf',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    accentText: 'text-leaf',
  },
  {
    icon: '🌱',
    key: 'membership' as const,
    route: 'ecosystem' as const,
    border: 'border-emerald-200 dark:border-emerald-800 hover:border-leaf',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    accentText: 'text-leaf',
  },
] as const;

// ─── Maker Node Services ──────────────────────────────────────────────────────

const MAKER_SERVICES = [
  { icon: '🖨️', labelKey: 'printing' },
  { icon: '⚙️', labelKey: 'cnc' },
  { icon: '✂️', labelKey: 'laser' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export function EcosystemHomePage() {
  const t = useTranslations('ecosystem.homepage');
  const tCorporate = useTranslations('corporate');
  const locale = useLocale() as Locale;
  const pathsSectionRef = useRef<HTMLElement>(null);

  function scrollToPaths() {
    pathsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <main className="min-h-screen" aria-label="MADFAM Ecosystem Homepage">
      {/* ── 1. Solarpunk Hero ─────────────────────────────────────────────── */}
      <section
        data-section="hero"
        aria-labelledby="hero-heading"
        className="relative min-h-screen flex items-center justify-center overflow-hidden bg-obsidian"
      >
        {/* Particle background */}
        <BrandParticles
          density="high"
          colorScheme="auto"
          movement="dynamic"
          interactive
          className="z-0"
        />

        {/* Gradient overlay for depth */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-leaf/10 via-transparent to-lavender/10 z-10"
        />

        {/* Decorative blobs */}
        <div
          aria-hidden="true"
          className="absolute top-0 left-0 w-96 h-96 bg-leaf/20 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 right-0 w-96 h-96 bg-lavender/20 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2"
        />

        {/* Content */}
        <Container className="relative z-20">
          <div className="flex flex-col items-center text-center space-y-10">
            {/* Logo */}
            <div className="relative" aria-hidden="true">
              <div className="absolute -inset-8 bg-gradient-to-r from-leaf via-lavender to-sun opacity-30 blur-3xl animate-pulse" />
              <AnimatedLogo size="xl" colorMode="color" />
            </div>

            {/* Headline */}
            <div className="space-y-4 max-w-3xl">
              <h1
                id="hero-heading"
                className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-leaf via-lavender to-sun bg-clip-text text-transparent leading-tight"
              >
                {t('hero.title')}
              </h1>
              <p className="text-xl md:text-2xl text-white/70">{t('hero.subtitle')}</p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Button
                size="lg"
                onClick={scrollToPaths}
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

        {/* Scroll indicator */}
        <button
          onClick={scrollToPaths}
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

      {/* ── 2. Three Paths ────────────────────────────────────────────────── */}
      <section
        ref={pathsSectionRef}
        data-section="three-paths"
        aria-labelledby="three-paths-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="three-paths-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('threePaths.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {THREE_PATHS.map(({ icon, key, route, border, iconBg, accentText }) => (
              <Link
                key={key}
                href={getLocalizedUrl(route, locale)}
                className={`group flex flex-col p-8 rounded-2xl border-2 bg-white dark:bg-gray-900 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${border}`}
                aria-label={t(`threePaths.${key}.title`)}
              >
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-5 transition-transform duration-300 group-hover:scale-110 ${iconBg}`}
                  aria-hidden="true"
                >
                  {icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  {t(`threePaths.${key}.title`)}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 flex-1">
                  {t(`threePaths.${key}.description`)}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-sm font-semibold ${accentText} group-hover:gap-2 transition-all duration-200`}
                >
                  {t(`threePaths.${key}.cta`)}
                  <svg
                    className="w-4 h-4"
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
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 3. Ecosystem Pipeline ("From Bits to Atoms") ──────────────────── */}
      <section
        data-section="bits-to-atoms"
        aria-labelledby="pipeline-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="pipeline-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {tCorporate('bitsToAtoms.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {tCorporate('bitsToAtoms.subtitle')}
            </p>
          </div>

          {/* Pipeline visualization */}
          <div className="max-w-5xl mx-auto">
            <div
              className="flex flex-col md:flex-row items-center gap-4 md:gap-0"
              role="list"
              aria-label="Pipeline stages"
            >
              {PIPELINE_STAGES.map(({ icon, key }, index) => (
                <React.Fragment key={key}>
                  {/* Stage card */}
                  <div
                    role="listitem"
                    className="flex-1 flex flex-col items-center text-center p-5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-leaf/50 dark:hover:border-leaf/50 transition-all duration-300"
                  >
                    <div
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-leaf/20 to-lavender/20 flex items-center justify-center text-2xl mb-3"
                      aria-hidden="true"
                    >
                      {icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">
                      {tCorporate(`bitsToAtoms.stages.${key}`)}
                    </span>
                  </div>

                  {/* Arrow connector — hidden after last item */}
                  {index < PIPELINE_STAGES.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="hidden md:flex items-center justify-center px-2 text-gray-400 dark:text-gray-600 flex-shrink-0"
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
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 4. Platform Showcase ──────────────────────────────────────────── */}
      <section
        data-section="platforms"
        aria-labelledby="platforms-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="platforms-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
            >
              {t('platformShowcase.title')}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('platformShowcase.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto mb-10">
            {FEATURED_PLATFORMS.map(({ name, tagline, icon, color, border, accent }) => (
              <div
                key={name}
                className={`group relative flex flex-col p-6 rounded-2xl bg-gradient-to-br ${color} border ${border} hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="text-3xl mb-4" aria-hidden="true">
                  {icon}
                </div>
                <h3 className={`text-lg font-bold mb-1 ${accent}`}>{name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 mb-4">{tagline}</p>
                <Badge variant="program" className="self-start text-xs">
                  Free + Pro
                </Badge>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href={getLocalizedUrl('products', locale)}>
              <Button variant="outline" size="lg" className="border-leaf text-leaf hover:bg-leaf/5">
                View All Platforms
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
        </Container>
      </section>

      {/* ── 5. Primavera Maker Node Highlight ────────────────────────────── */}
      <section
        data-section="maker-node"
        aria-labelledby="maker-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            {/* Left: Description */}
            <div>
              <div className="mb-4">
                <Badge variant="program" className="bg-leaf/10 text-leaf border-leaf/20">
                  Primavera Maker Node
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

              {/* Member discount callout */}
              <div className="inline-flex items-center gap-3 bg-leaf/10 border border-leaf/30 rounded-xl px-5 py-3">
                <span className="text-xl" aria-hidden="true">
                  🌱
                </span>
                <div>
                  <Badge
                    variant="program"
                    className="bg-leaf text-white border-transparent text-xs mb-1"
                  >
                    Member Benefit
                  </Badge>
                  <p className="text-sm font-semibold text-leaf">
                    {t('makerHighlight.memberDiscount')}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <Link href={getLocalizedUrl('solutions.maker-node', locale)}>
                  <Button size="lg" className="bg-leaf hover:bg-leaf/90 text-white">
                    Explore Maker Node
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

            {/* Right: Services list */}
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
                      {/* Using ecosystem translation namespace for maker services */}
                      {labelKey === 'printing' && '3D Printing'}
                      {labelKey === 'cnc' && 'CNC Machining'}
                      {labelKey === 'laser' && 'Laser Cutting'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {labelKey === 'printing' && 'FDM, SLA, SLS — PLA, PETG, ABS, Resin'}
                      {labelKey === 'cnc' && 'Aluminum, Steel, Wood, Acrylic'}
                      {labelKey === 'laser' && 'Wood, Acrylic, Leather, Fabric'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 6. Membership Value Prop ──────────────────────────────────────── */}
      <section
        data-section="membership"
        aria-labelledby="membership-heading"
        className="py-24 bg-white dark:bg-gray-950"
      >
        <Container>
          <div className="max-w-2xl mx-auto">
            {/* Gradient border card */}
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

                {/* Benefits list */}
                <ul className="text-left space-y-3 mb-8" aria-label="Membership benefits">
                  {MEMBERSHIP_BENEFITS.map(benefit => (
                    <li key={benefit} className="flex items-start gap-3">
                      <span
                        className="w-5 h-5 rounded-full bg-leaf/20 flex items-center justify-center flex-shrink-0 mt-0.5"
                        aria-hidden="true"
                      >
                        <svg className="w-3 h-3 text-leaf" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <span className="text-gray-700 dark:text-gray-300 text-sm">{benefit}</span>
                    </li>
                  ))}
                </ul>

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

      {/* ── 7. Why MADFAM ────────────────────────────────────────────────── */}
      <section
        data-section="why-madfam"
        aria-labelledby="why-heading"
        className="py-24 bg-gray-50 dark:bg-gray-900"
      >
        <Container>
          <div className="text-center mb-14">
            <h2
              id="why-heading"
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white"
            >
              {t('whyMadfam.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {WHY_ITEMS.map(({ icon, key, border, bg, iconBg }) => (
              <div
                key={key}
                className={`p-6 rounded-2xl border ${border} ${bg} transition-shadow duration-300 hover:shadow-md`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-2xl mb-4`}
                  aria-hidden="true"
                >
                  {icon}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">
                  {t(`whyMadfam.${key}.title`)}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t(`whyMadfam.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ── 8. Final CTA ─────────────────────────────────────────────────── */}
      <section
        data-section="final-cta"
        aria-labelledby="final-cta-heading"
        className="py-24 bg-obsidian relative overflow-hidden"
      >
        {/* Subtle background decoration */}
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

            {/* Three path buttons repeated */}
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
