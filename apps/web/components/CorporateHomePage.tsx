'use client';

import {
  ArrowRightIcon,
  CogIcon,
  RocketLaunchIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useState } from 'react';
import { Button, Container, Heading } from '@/components/ui';
import { AnimatedText } from '@/components/AnimatedText';
import { Badge } from '@/components/corporate/Badge';
import { ProductCard } from '@/components/corporate/ProductCard';
import { SolutionCard } from '@/components/corporate/SolutionCard';
import { PersonaSelector, usePersonaContent, type Persona } from '@/components/PersonaSelector';
import { ScrollProgress } from '@/components/ScrollProgress';
import { ClientLogos } from '@/components/corporate/ClientLogos';

export function CorporateHomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [selectedPersona, setSelectedPersona] = useState<Persona>('default');
  const personaContent = usePersonaContent(selectedPersona);

  // Featured Solutions
  const featuredSolutions = [
    {
      id: 'colabs',
      name: 'MADFAM Co-Labs',
      tagline: t('corporate.solutions.colabs.tagline'),
      description: t('corporate.solutions.colabs.description'),
      badge: t('corporate.badges.byMadfam'),
      accent: 'blue' as const,
      capabilities: [
        t('corporate.solutions.colabs.capabilities.0'),
        t('corporate.solutions.colabs.capabilities.1'),
        t('corporate.solutions.colabs.capabilities.2'),
        t('corporate.solutions.colabs.capabilities.3'),
      ],
      products: [
        { name: 'MADLAB', url: '/solutions/colabs#madlab' },
        { name: 'Workshops', url: '/solutions/colabs#workshops' },
      ],
      internalUrl: '/solutions/colabs',
    },
  ];

  // Featured Products
  const featuredProducts = [
    {
      name: 'Dhanam',
      description: t('corporate.products.dhanam.description'),
      audience: t('corporate.products.dhanam.audience'),
      badge: t('corporate.badges.byMadfam'),
      primaryCta: {
        label: t('corporate.products.dhanam.cta'),
        url: 'https://www.dhan.am',
        external: true,
      },
      secondaryCta: {
        label: t('common.cta.contact'),
        url: '/contact',
      },
      features: [
        t('corporate.products.dhanam.features.0'),
        t('corporate.products.dhanam.features.1'),
        t('corporate.products.dhanam.features.2'),
      ],
    },
  ];

  // Programs Preview
  const programsPreview = [
    {
      name: t('corporate.programs.strategyEnablement.name'),
      icon: CogIcon,
      description: t('corporate.programs.strategyEnablement.description'),
      color: 'amber',
    },
    {
      name: t('corporate.programs.platformPilots.name'),
      icon: RocketLaunchIcon,
      description: t('corporate.programs.platformPilots.description'),
      color: 'blue',
    },
    {
      name: t('corporate.programs.strategicPartnerships.name'),
      icon: BuildingOffice2Icon,
      description: t('corporate.programs.strategicPartnerships.description'),
      color: 'purple',
    },
  ];

  return (
    <main className="min-h-screen">
      <ScrollProgress />

      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
        {/* Background decoration - Subtle solarpunk accents */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-brand-green rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-brand-purple rounded-full filter blur-3xl animate-pulse animation-delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-yellow rounded-full filter blur-3xl opacity-5" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-5xl">
            {/* Persona Selector */}
            <div className="mb-8 max-w-md animate-fade-up">
              <PersonaSelector onPersonaChange={setSelectedPersona} />
            </div>

            <AnimatedText variant="fadeUp" className="mb-8">
              <div className="mb-4">
                <Badge
                  variant="by-madfam"
                  className="text-white bg-white/10 border-brand-green/20 backdrop-blur-sm"
                >
                  {t('corporate.hero.badge')}
                </Badge>
              </div>
              <Heading level={1} className="text-white mb-6 relative">
                <span className="relative z-10">{personaContent.title}</span>
                <span className="absolute -inset-1 bg-gradient-to-r from-brand-green/10 to-brand-purple/10 blur-lg" />
              </Heading>
              <p className="text-xl text-white/90 mb-8 max-w-4xl leading-relaxed">
                {personaContent.subtitle}
              </p>

              {/* Persona-specific benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {personaContent.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2 text-white/80">
                    <svg
                      className="w-5 h-5 text-brand-green flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm">{benefit}</span>
                  </div>
                ))}
              </div>
            </AnimatedText>

            <div className="flex flex-col sm:flex-row gap-4 mb-12 animate-fade-up animation-delay-400">
              <Link href={`/${locale}${personaContent.recommendedPath}`}>
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-neutral-900 hover:bg-neutral-100"
                >
                  {personaContent.primaryCTA}
                  <ArrowRightIcon className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="#find-solution">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white/10"
                >
                  {personaContent.secondaryCTA}
                </Button>
              </Link>
            </div>

            {/* Corporate Structure Visualization */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 animate-fade-up animation-delay-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-brand-green/5 via-transparent to-brand-purple/5" />
              <div className="flex items-center justify-center gap-8 text-white/80 relative z-10">
                <span className="text-lg font-semibold text-white">MADFAM</span>
                <ArrowRightIcon className="w-5 h-5" />
                <span>{t('corporate.hero.specializedUnits')}</span>
                <ArrowRightIcon className="w-5 h-5" />
                <span>{t('corporate.hero.premiumProducts')}</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Find Your Solution - Decision Tree */}
      <section id="find-solution" className="py-20 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              Find Your Solution
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Choose your path—explore product demos, get strategic guidance, or discover custom
              solutions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Forge Sight */}
            <Link
              href={`/${locale}/demo/forge-sight`}
              className="group p-8 border-2 border-green-200 rounded-2xl hover:border-green-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50/50 to-white"
            >
              <div className="text-5xl mb-6">🏭</div>
              <h3 className="font-bold text-xl mb-3 text-neutral-900">
                Need pricing intelligence?
              </h3>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                For digital fabrication, 3D printing & manufacturing procurement teams
              </p>
              <div className="flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                Try Forge Sight Demo
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </div>
            </Link>

            {/* Dhanam */}
            <Link
              href={`/${locale}/demo/dhanam`}
              className="group p-8 border-2 border-blue-200 rounded-2xl hover:border-blue-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50/50 to-white"
            >
              <div className="text-5xl mb-6">💰</div>
              <h3 className="font-bold text-xl mb-3 text-neutral-900">
                Need financial wellness tools?
              </h3>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                For individuals, families & financial advisors seeking AI-powered insights
              </p>
              <div className="flex items-center text-blue-600 font-semibold group-hover:translate-x-2 transition-transform">
                Try Dhanam Demo
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </div>
            </Link>

            {/* AI Assessment */}
            <Link
              href={`/${locale}/assessment`}
              className="group p-8 border-2 border-purple-200 rounded-2xl hover:border-purple-400 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50/50 to-white"
            >
              <div className="text-5xl mb-6">🤔</div>
              <h3 className="font-bold text-xl mb-3 text-neutral-900">Not sure what you need?</h3>
              <p className="text-sm text-neutral-600 mb-6 leading-relaxed">
                Take our 3-minute AI assessment to discover the right solution for you
              </p>
              <div className="flex items-center text-purple-600 font-semibold group-hover:translate-x-2 transition-transform">
                Start AI Assessment
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </div>
            </Link>
          </div>
        </Container>
      </section>

      {/* Trusted By - Client Logos */}
      <ClientLogos variant="default" />

      {/* Our Solutions Section */}
      <section className="py-20 bg-neutral-50 relative">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-hero-decoration" />
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              {t('corporate.solutions.title')}
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              {t('corporate.solutions.subtitle')}
            </p>
            <Badge variant="by-madfam" className="mt-4">
              {t('corporate.solutions.allByMadfam')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {featuredSolutions.map(solution => (
              <SolutionCard key={solution.id} solution={solution} />
            ))}
          </div>

          <div className="text-center">
            <Link href={`/${locale}/solutions`}>
              <Button variant="outline" size="lg">
                {t('corporate.solutions.viewAll')}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Products Strip */}
      <section className="py-20">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              {t('corporate.products.featuredTitle')}
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              {t('corporate.products.featuredSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto mb-12">
            {featuredProducts.map(product => (
              <ProductCard key={product.name} product={product} />
            ))}
          </div>

          <div className="text-center">
            <Link href={`/${locale}/products`}>
              <Button variant="outline" size="lg">
                {t('corporate.products.viewAll')}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Programs Rail */}
      <section className="py-20 bg-neutral-50">
        <Container>
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              {t('corporate.programs.title')}
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto mb-8">
              {t('corporate.programs.processDescription')}
            </p>

            {/* Migration Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <p className="text-blue-800 text-sm">
                <strong>{t('corporate.programs.updateLabel')}</strong>{' '}
                {t('corporate.programs.migrationNotice')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            {programsPreview.map((program, index) => {
              const IconComponent = program.icon;
              return (
                <div
                  key={program.name}
                  className={`p-6 rounded-xl border-2 ${
                    program.color === 'amber'
                      ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                      : program.color === 'blue'
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                        : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                  }`}
                >
                  <div className="text-center">
                    <div
                      className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center ${
                        program.color === 'amber'
                          ? 'bg-amber-100 text-amber-600'
                          : program.color === 'blue'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div className="text-2xl font-bold text-neutral-600 mb-2">{index + 1}</div>
                    <h3 className="font-semibold text-neutral-900 mb-2">{program.name}</h3>
                    <p className="text-neutral-600 text-sm">{program.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <Link href={`/${locale}/programs`}>
              <Button size="lg">
                {t('corporate.programs.viewAll')}
                <ArrowRightIcon className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      {/* Why MADFAM Section */}
      <section className="py-20">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-8">
              {t('corporate.whyMadfam.title')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="p-6">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="font-bold text-sm">LATAM</span>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {t('corporate.whyMadfam.latamFirst.title')}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {t('corporate.whyMadfam.latamFirst.description')}
                </p>
              </div>

              <div className="p-6">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="font-bold text-sm">🔒</span>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {t('corporate.whyMadfam.privacyFirst.title')}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {t('corporate.whyMadfam.privacyFirst.description')}
                </p>
              </div>

              <div className="p-6">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                  <span className="font-bold text-sm">✨</span>
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">
                  {t('corporate.whyMadfam.designExcellence.title')}
                </h3>
                <p className="text-neutral-600 text-sm">
                  {t('corporate.whyMadfam.designExcellence.description')}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral-900">
        <Container>
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {t('corporate.cta.title')}
            </h2>
            <p className="text-xl text-white/80 mb-12">{t('corporate.cta.subtitle')}</p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${locale}/assessment`}>
                <Button size="lg" variant="secondary">
                  {t('corporate.cta.takeAssessment')}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  {t('corporate.cta.contactNow')}
                </Button>
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
