'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedUrl } from '@madfam/i18n';
import type { Locale } from '@madfam/i18n';
import { Button } from '@/components/ui';

export function PricingCards() {
  const t = useTranslations('ecosystem.pricing');
  const locale = useLocale() as Locale;
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div>
      {/* Period toggle */}
      <div className="flex items-center justify-center gap-3 mb-10">
        <button
          onClick={() => setPeriod('monthly')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            period === 'monthly'
              ? 'bg-leaf text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t('monthly')}
        </button>
        <button
          onClick={() => setPeriod('yearly')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
            period === 'yearly'
              ? 'bg-leaf text-white shadow-md'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          {t('yearly')}
          <span className="absolute -top-2 -right-2 bg-sun text-obsidian text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {t('yearlyDiscount')}
          </span>
        </button>
      </div>

      {/* Pricing card */}
      <div className="max-w-md mx-auto">
        <div className="relative p-px rounded-2xl bg-gradient-to-br from-leaf via-lavender to-sun">
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Ecosystem Membership
              </h3>
              <div className="mb-2">
                <span className="text-4xl font-bold bg-gradient-to-r from-leaf to-lavender bg-clip-text text-transparent">
                  {t(`${period}Price`)}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  {period === 'monthly' ? t('perMonth') : t('perYear')}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('includedPlatforms', { count: 9 })}
              </p>
            </div>

            <div className="my-6 border-t border-gray-200 dark:border-gray-800" />

            {/* Features list */}
            <ul className="space-y-3 mb-8">
              {[
                'Pro access on all 9 platforms',
                'Up to 20% off Maker Node orders',
                'Priority support',
                'Early access to PENNY & AVALA',
                'Members-only community',
              ].map(feature => (
                <li key={feature} className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-leaf flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>

            <Link href={getLocalizedUrl('contact', locale)}>
              <Button
                size="lg"
                className="w-full bg-gradient-to-r from-leaf to-lavender hover:from-leaf/90 hover:to-lavender/90 text-white font-semibold"
              >
                {t('cta')}
              </Button>
            </Link>

            <p className="text-center text-xs text-gray-400 mt-3">{t('waitlistNote')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
