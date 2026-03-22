'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { isComingSoon, type Platform } from '@/lib/data/platforms';
import { PlatformHero } from './PlatformHero';
import { PlatformProblemSolution } from './PlatformProblemSolution';
import { PlatformComparison } from './PlatformComparison';
import { PlatformEcosystem } from './PlatformEcosystem';
import { PlatformTechSpecs } from './PlatformTechSpecs';
import { PlatformCTA } from './PlatformCTA';

// Lazy-load taste components per platform
const TASTE_COMPONENTS: Record<string, ReturnType<typeof dynamic>> = {
  enclii: dynamic(() => import('./tastes/EncliiTaste').then(m => ({ default: m.EncliiTaste })), {
    ssr: false,
  }),
  janua: dynamic(() => import('./tastes/JanuaTaste').then(m => ({ default: m.JanuaTaste })), {
    ssr: false,
  }),
  dhanam: dynamic(() => import('./tastes/DhanamTaste').then(m => ({ default: m.DhanamTaste })), {
    ssr: false,
  }),
  'forge-sight': dynamic(
    () => import('./tastes/ForgeSightTaste').then(m => ({ default: m.ForgeSightTaste })),
    { ssr: false }
  ),
  yantra4d: dynamic(
    () => import('./tastes/Yantra4DTaste').then(m => ({ default: m.Yantra4DTaste })),
    { ssr: false }
  ),
  'cotiza-studio': dynamic(
    () => import('./tastes/CotizaTaste').then(m => ({ default: m.CotizaTaste })),
    { ssr: false }
  ),
  'pravara-mes': dynamic(
    () => import('./tastes/PravaraTaste').then(m => ({ default: m.PravaraTaste })),
    { ssr: false }
  ),
  tezca: dynamic(() => import('./tastes/TezcaTaste').then(m => ({ default: m.TezcaTaste })), {
    ssr: false,
  }),
  avala: dynamic(() => import('./tastes/AvalaTaste').then(m => ({ default: m.AvalaTaste })), {
    ssr: false,
  }),
  penny: dynamic(() => import('./tastes/PennyTaste').then(m => ({ default: m.PennyTaste })), {
    ssr: false,
  }),
};

// Map slugs to i18n keys (camelCase)
function getI18nKey(slug: string): string {
  const map: Record<string, string> = {
    'cotiza-studio': 'cotizaStudio',
    'forge-sight': 'forgeSight',
    'pravara-mes': 'pravaraMes',
  };
  return map[slug] || slug;
}

interface PlatformShowcaseProps {
  platform: Platform;
  locale: string;
}

export function PlatformShowcase({ platform, locale }: PlatformShowcaseProps) {
  const t = useTranslations('platforms');
  const key = getI18nKey(platform.slug);
  const comingSoon = isComingSoon(platform);
  const TasteComponent = TASTE_COMPONENTS[platform.slug];

  return (
    <main className="min-h-screen" aria-label={`${platform.name} platform page`}>
      {/* 1. Hero */}
      <PlatformHero platform={platform} i18nKey={key} locale={locale} />

      {/* 2. Problem / Solution */}
      <PlatformProblemSolution i18nKey={key} />

      {/* 3. Platform Taste (interactive preview) */}
      {TasteComponent && (
        <section
          data-section="taste"
          className="py-20 bg-white dark:bg-gray-950"
          aria-labelledby="taste-heading"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2
              id="taste-heading"
              className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center"
            >
              {t('shared.sections.taste')}
            </h2>
            <div className="mt-10">
              <TasteComponent />
            </div>
          </div>
        </section>
      )}

      {/* 4. Key Features */}
      <section
        data-section="features"
        className="py-20 bg-gray-50 dark:bg-gray-900"
        aria-labelledby="features-heading"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            id="features-heading"
            className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center"
          >
            {t('shared.sections.features')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: platform.featureCount }, (_, i) => (
              <div
                key={i}
                className={`p-6 rounded-xl border bg-white dark:bg-gray-800 ${platform.accentColor.border} hover:shadow-md transition-shadow`}
              >
                <div
                  className={`w-10 h-10 rounded-lg ${platform.accentColor.bg} flex items-center justify-center text-lg mb-4`}
                  aria-hidden="true"
                >
                  {platform.icon}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {t(`${key}.features.${i}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Comparison Table (optional) */}
      {platform.hasComparison && !comingSoon && (
        <PlatformComparison platform={platform} i18nKey={key} />
      )}

      {/* 6. Ecosystem Integration */}
      <PlatformEcosystem platform={platform} i18nKey={key} locale={locale} />

      {/* 7. Technical Specs (optional) */}
      {platform.hasTechSpecs && !comingSoon && <PlatformTechSpecs i18nKey={key} />}

      {/* 8. Final CTA */}
      <PlatformCTA platform={platform} i18nKey={key} locale={locale} comingSoon={comingSoon} />
    </main>
  );
}
