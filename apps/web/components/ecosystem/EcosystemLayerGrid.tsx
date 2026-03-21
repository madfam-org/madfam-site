'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { LAYERS, getPlatformsByLayer, isComingSoon, type Platform } from '@/lib/data/platforms';

// Slug-to-i18nKey mapping for platform translation lookups
const SLUG_TO_I18N_KEY: Record<string, string> = {
  enclii: 'enclii',
  janua: 'janua',
  'forge-sight': 'forgeSight',
  dhanam: 'dhanam',
  tezca: 'tezca',
  avala: 'avala',
  yantra4d: 'yantra4d',
  'cotiza-studio': 'cotizaStudio',
  'pravara-mes': 'pravaraMes',
  penny: 'penny',
};

function PlatformCard({
  platform,
  locale,
  tagline,
}: {
  platform: Platform;
  locale: string;
  tagline: string;
}): React.ReactElement {
  const comingSoon = isComingSoon(platform);

  const cardContent = (
    <div
      className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 ${
        comingSoon
          ? 'border-dashed border-gray-300 dark:border-gray-700 opacity-60 bg-gray-50 dark:bg-gray-900/50'
          : `${platform.accentColor.border} bg-white dark:bg-gray-900 hover:shadow-md hover:-translate-y-0.5`
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${
          comingSoon ? 'bg-gray-100 dark:bg-gray-800' : platform.accentColor.bg
        }`}
        aria-hidden="true"
      >
        {platform.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3
            className={`font-semibold text-sm ${
              comingSoon ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
            }`}
          >
            {platform.name}
          </h3>
          {comingSoon && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {platform.status === 'coming-soon' ? 'Coming Soon' : 'In Development'}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
          {tagline}
        </p>
      </div>
    </div>
  );

  if (comingSoon) {
    return <div>{cardContent}</div>;
  }

  return (
    <Link
      href={`/${locale}/platforms/${platform.slug}`}
      className="block min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-leaf focus-visible:ring-offset-2 rounded-xl"
    >
      {cardContent}
    </Link>
  );
}

export function EcosystemLayerGrid({ locale }: { locale: string }): React.ReactElement {
  const t = useTranslations('platforms');

  return (
    <section
      className="py-16 md:py-24 bg-white dark:bg-gray-950"
      aria-labelledby="layer-grid-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {LAYERS.map(layer => {
            const platforms = getPlatformsByLayer(layer.key);

            return (
              <div key={layer.key} role="region" aria-label={t(layer.labelKey)}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl" aria-hidden="true">
                    {layer.icon}
                  </span>
                  <h3
                    id={`layer-${layer.key}`}
                    className="text-lg font-bold text-gray-900 dark:text-white"
                  >
                    {t(layer.labelKey)}
                  </h3>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" aria-hidden="true" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {platforms.map(platform => {
                    const i18nKey = SLUG_TO_I18N_KEY[platform.slug] ?? platform.slug;
                    const tagline = t(`${i18nKey}.tagline`);

                    return (
                      <PlatformCard
                        key={platform.slug}
                        platform={platform}
                        locale={locale}
                        tagline={tagline}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
