'use client';

// The Ecosystem Membership block — a waitlist, not a price card.
//
// Ruling R29 (coherence audit 2026-09-23): no membership price card, no
// monthly/annual toggle, no "Pro on all platforms" claim; keep a waitlist
// line. The membership exists in neither the registry nor Dhanam, so there is
// no price or entitlement to render (R9: prices only on the value-ladder
// surface, from the registry). Ruling MH-10 (2026-10-01): R29 overrides the
// deck §5.4 benefit list — the membership is one waitlist sentence, with no
// benefits, anywhere on the site.

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { getLocalizedUrl, type Locale } from '@madfam-site/i18n';
import { Button } from '@/components/ui';

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

          <p className="text-center text-sm text-gray-700 dark:text-gray-300 mb-8">
            {t('subtitle')}
          </p>

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
