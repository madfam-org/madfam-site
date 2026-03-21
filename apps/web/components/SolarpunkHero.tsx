'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import React from 'react';
import {
  AnimatedLogo,
  BrandParticles,
  useBrandTheme,
  ThemeModeSelector,
  Button,
  Container,
} from '@/components/ui';

export const SolarpunkHero: React.FC = () => {
  const t = useTranslations('hero');
  const { brandMode } = useBrandTheme();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Dynamic brand particles background */}
      <BrandParticles
        density={brandMode === 'solarpunk-legacy' ? 'high' : 'medium'}
        colorScheme="auto"
        movement="dynamic"
        interactive
        className="z-0"
      />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-green/10 via-transparent to-brand-purple/10 z-10" />

      {/* Content */}
      <Container className="relative z-20">
        <div className="flex flex-col items-center text-center space-y-12">
          {/* Animated Logo as hero centerpiece */}
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute -inset-8 bg-gradient-to-r from-brand-green via-brand-purple to-brand-yellow opacity-30 blur-3xl animate-pulse" />

            <AnimatedLogo size="xl" colorMode="color" />
          </div>

          {/* Tagline */}
          <div className="space-y-4 max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-brand-green via-brand-purple to-brand-yellow bg-clip-text text-transparent animate-gradient">
              {t('title')}
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground">{t('subtitle')}</p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link href="/assessment">
              <Button
                size="lg"
                className="bg-gradient-to-r from-brand-green to-brand-purple hover:from-brand-green-dark hover:to-brand-purple-dark text-white font-semibold px-8 py-3 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                {t('cta.primary')}
              </Button>
            </Link>

            <Link href="/case-studies">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-brand-purple hover:bg-brand-purple/10 px-8 py-3 text-lg font-semibold"
              >
                {t('cta.secondary')}
              </Button>
            </Link>
          </div>

          {/* Theme Mode Selector */}
          <div className="absolute top-8 right-8">
            <ThemeModeSelector />
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 animate-bounce">
            <svg
              className="w-6 h-6 text-brand-purple"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </Container>

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-green/20 rounded-full filter blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-purple/20 rounded-full filter blur-3xl translate-x-1/2 translate-y-1/2" />
    </section>
  );
};
