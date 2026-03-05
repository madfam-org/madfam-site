'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/corporate/Badge';

interface Platform {
  name: string;
  icon: string;
  category: string;
  hasFreeTier: boolean;
  hasProTier: boolean;
  comingSoon: boolean;
  externalUrl?: string;
}

const PLATFORMS: Platform[] = [
  {
    name: 'Enclii',
    icon: '☁️',
    category: 'Infrastructure',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: false,
    externalUrl: 'https://enclii.com',
  },
  {
    name: 'Janua',
    icon: '🔐',
    category: 'Infrastructure',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: false,
    externalUrl: 'https://janua.auth',
  },
  {
    name: 'Yantra4D',
    icon: '📐',
    category: 'Creation',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: false,
    externalUrl: 'https://yantra4d.com',
  },
  {
    name: 'Cotiza Studio',
    icon: '📊',
    category: 'Creation',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: false,
    externalUrl: 'https://cotiza.studio',
  },
  {
    name: 'Forge Sight',
    icon: '🏭',
    category: 'Intelligence',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: false,
    externalUrl: 'https://forgesight.quest',
  },
  {
    name: 'Dhanam',
    icon: '💰',
    category: 'Intelligence',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: false,
    externalUrl: 'https://dhan.am',
  },
  {
    name: 'Pravara-MES',
    icon: '⚙️',
    category: 'Fabrication',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: false,
  },
  {
    name: 'PENNY',
    icon: '🤖',
    category: 'Assistant',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: true,
  },
  {
    name: 'AVALA',
    icon: '🎓',
    category: 'Learning',
    hasFreeTier: true,
    hasProTier: true,
    comingSoon: true,
  },
];

interface PlatformGridProps {
  /** Optional heading override — defaults to the `ecosystem.platformGrid.title` translation */
  title?: string;
}

export function PlatformGrid({ title }: PlatformGridProps = {}) {
  const t = useTranslations('ecosystem.platformGrid');

  const heading = title ?? t('title');

  return (
    <div>
      {/* Section heading */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {heading}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map(platform => (
          <div
            key={platform.name}
            className={`relative flex items-start gap-4 p-5 rounded-xl border transition-all duration-300 ${
              platform.comingSoon
                ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-75'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-leaf/50 dark:hover:border-leaf/50 hover:shadow-md'
            }`}
          >
            <div
              className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl flex-shrink-0"
              aria-hidden="true"
            >
              {platform.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {platform.name}
                </h3>
                {platform.comingSoon && (
                  <Badge
                    variant="program"
                    className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-300"
                  >
                    {t('comingSoon')}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{platform.category}</p>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {t('freeTier')}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-leaf/10 text-leaf border border-leaf/20">
                  {t('proTier')}
                </span>
                {platform.comingSoon && (
                  <span className="text-[10px] text-gray-400 italic">{t('includedOnLaunch')}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Maker Node card */}
        <div className="relative flex items-start gap-4 p-5 rounded-xl border border-leaf/30 bg-leaf/5 dark:bg-leaf/10 hover:border-leaf/50 hover:shadow-md transition-all duration-300">
          <div
            className="w-10 h-10 rounded-lg bg-leaf/20 flex items-center justify-center text-xl flex-shrink-0"
            aria-hidden="true"
          >
            🔧
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Primavera Maker Node
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Physical Fabrication</p>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-leaf/10 text-leaf border border-leaf/20">
                Up to 20% off for members
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
