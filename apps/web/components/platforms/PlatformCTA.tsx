'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import type { Platform } from '@/lib/data/platforms';
import { Newsletter } from '@/components/ui/Newsletter';
import { cn } from '@/components/ui/utils';

interface PlatformCTAProps {
  platform: Platform;
  i18nKey: string;
  locale: string;
  comingSoon: boolean;
}

export function PlatformCTA({ platform, i18nKey, locale, comingSoon }: PlatformCTAProps) {
  const t = useTranslations('platforms');

  return (
    <section
      data-section="cta"
      className="relative bg-obsidian overflow-hidden py-20 sm:py-28"
      aria-labelledby="platform-cta-heading"
    >
      {/* Decorative gradient blobs */}
      <div
        className={cn(
          'absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15 bg-gradient-to-bl',
          platform.accentColor.gradient
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute bottom-0 left-0 w-72 h-72 rounded-full blur-3xl opacity-10 bg-gradient-to-tr',
          platform.accentColor.gradient
        )}
        aria-hidden="true"
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="platform-cta-heading" className="text-3xl sm:text-4xl font-bold text-white mb-6">
          {t(`${i18nKey}.tagline`)}
        </h2>

        {comingSoon ? (
          <>
            <p className="text-gray-300 mb-8 text-lg leading-relaxed">
              {t(`${i18nKey}.valueProp`)}
            </p>

            {/* Waitlist Newsletter */}
            <div className="max-w-md mx-auto mb-10">
              <Newsletter
                title=""
                description=""
                placeholder="email@example.com"
                buttonText={t('shared.joinWaitlist')}
                variant="inline"
                className="[&_h3]:hidden [&_p]:hidden [&_input]:bg-white/10 [&_input]:border-white/20 [&_input]:text-white [&_input]:placeholder-gray-400"
              />
            </div>

            {/* Explore ecosystem link */}
            <Link
              href={getLocalizedUrl('ecosystem', locale as Locale)}
              className={cn(
                'inline-flex items-center gap-2 text-gray-300 hover:text-white',
                'transition-colors font-medium min-h-[48px] px-4 py-3',
                'focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg'
              )}
            >
              {t('shared.exploreEcosystem')}
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </>
        ) : (
          <>
            <p className="text-gray-300 mb-10 text-lg leading-relaxed">
              {t(`${i18nKey}.valueProp`)}
            </p>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              {platform.primaryCTA.type === 'external' && platform.primaryCTA.url ? (
                <Link
                  href={platform.primaryCTA.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium',
                    'bg-white text-obsidian hover:bg-gray-100 min-h-[48px] px-8 py-3 text-base',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-obsidian'
                  )}
                >
                  {t(platform.primaryCTA.labelKey)}
                  <svg
                    className="ml-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </Link>
              ) : (
                <Link
                  href={getLocalizedUrl('contact', locale as Locale)}
                  className={cn(
                    'inline-flex items-center justify-center rounded-lg font-medium',
                    'bg-white text-obsidian hover:bg-gray-100 min-h-[48px] px-8 py-3 text-base',
                    'transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-obsidian'
                  )}
                >
                  {t(platform.primaryCTA.labelKey)}
                </Link>
              )}
            </div>

            {/* Ecosystem membership upsell */}
            <div className="border-t border-white/10 pt-8">
              <p className="text-sm text-gray-400 mb-4">{t('shared.cta.membership')}</p>
              <Link
                href={getLocalizedUrl('ecosystem', locale as Locale)}
                className={cn(
                  'inline-flex items-center gap-2 text-gray-300 hover:text-white',
                  'transition-colors font-medium text-sm min-h-[48px] px-4 py-3',
                  'focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg'
                )}
              >
                {t('shared.cta.membershipLink')}
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
