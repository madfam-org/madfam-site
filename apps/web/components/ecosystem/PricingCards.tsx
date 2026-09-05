'use client';

// The Ecosystem Membership card.
//
// It carries NO price. Ruling R9 amended D6 to "prices appear only on the
// value-ladder surface, sourced from the registry's `commerce` block, never
// hand-typed, never `TBD`" — and this card is not that surface. It used to
// render a literal «TBD» behind a monthly/yearly toggle, which is the exact
// string the ruling names; the toggle went with it, because it existed only to
// switch between two «TBD»s.
//
// "Ecosystem Membership" stays as the cross-product label it is: the membership
// is a construct that spans products, not a tier of one of them, so it has no
// registry `commerce` entry to read a price from.

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedUrl, type Locale } from '@madfam-site/i18n';
import { Button } from '@/components/ui';
import { PLATFORMS } from '@/lib/data/platforms';

export function PricingCards() {
  const t = useTranslations('ecosystem.pricing');
  const locale = useLocale() as Locale;

  return (
    <div>
      {/* Pricing card */}
      <div className="max-w-md mx-auto">
        <div className="relative p-px rounded-2xl bg-gradient-to-br from-leaf via-lavender to-sun">
          <div className="bg-white dark:bg-gray-950 rounded-2xl p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t('membershipTitle')}
              </h3>
              <p className="mb-2 text-base font-medium text-gray-700 dark:text-gray-300">
                {t('pricePending')}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('includedPlatforms', { count: PLATFORMS.length })}
              </p>
            </div>

            <div className="my-6 border-t border-gray-200 dark:border-gray-800" />

            {/* Features list */}
            <ul className="space-y-3 mb-8">
              {[0, 1, 2, 3, 4].map(i => (
                <li key={i} className="flex items-start gap-3">
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
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t(`features.${i}`)}
                  </span>
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
