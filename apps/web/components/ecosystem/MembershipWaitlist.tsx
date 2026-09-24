'use client';

// The Ecosystem Membership block — a waitlist, not a price card.
//
// Ruling R29 (coherence audit 2026-09-23): no membership price card, no
// monthly/annual toggle, no "Pro on all platforms" claim; keep a waitlist
// line. The membership exists in neither the registry nor Dhanam, so there is
// no price or entitlement to render (R9: prices only on the value-ladder
// surface, from the registry). Copy is the signed-off deck §5.4 wording (R14),
// with the Maker Node benefit marked "coming soon" (R12).

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedUrl, type Locale } from '@madfam-site/i18n';
import { Button } from '@/components/ui';

const BENEFIT_KEYS = [0, 1, 2, 3] as const;

export function MembershipWaitlist() {
  const t = useTranslations('ecosystem.pricing');
  const locale = useLocale() as Locale;

  return (
    <div className="max-w-md mx-auto">
      <div className="relative p-px rounded-2xl bg-gradient-to-br from-leaf via-lavender to-sun">
        <div className="bg-white dark:bg-gray-950 rounded-2xl p-8">
          <h3 className="text-center text-lg font-semibold text-gray-900 dark:text-white mb-6">
            {t('membershipTitle')}
          </h3>

          <ul className="space-y-3 mb-8">
            {BENEFIT_KEYS.map(i => (
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
  );
}
