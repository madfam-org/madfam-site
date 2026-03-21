'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getLocalizedUrl, type Locale } from '@madfam/i18n';
import type { Platform } from '@/lib/data/platforms';
import { Badge } from '@/components/corporate/Badge';
import { Newsletter } from '@/components/ui/Newsletter';
import { cn } from '@/components/ui/utils';

interface PlatformHeroProps {
  platform: Platform;
  i18nKey: string;
  locale: string;
}

const STATUS_BADGE_STYLES: Record<string, string> = {
  production:
    'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  'production-beta':
    'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
  'coming-soon':
    'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  'in-development':
    'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
        STATUS_BADGE_STYLES[status] || STATUS_BADGE_STYLES['production']
      )}
    >
      {label}
    </span>
  );
}

function CTAButton({
  cta,
  locale,
  t,
  variant,
}: {
  cta: Platform['primaryCTA'];
  locale: string;
  t: ReturnType<typeof useTranslations>;
  variant: 'primary' | 'secondary';
}) {
  const baseStyles =
    'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 min-h-[48px] px-6 py-3 text-base';
  const primaryStyles =
    'bg-white text-obsidian hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-obsidian';
  const secondaryStyles =
    'border border-white/30 text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-obsidian';

  if (cta.type === 'waitlist') {
    return (
      <div className="w-full max-w-md">
        <Newsletter
          title=""
          description=""
          placeholder="email@example.com"
          buttonText={t(cta.labelKey)}
          variant="inline"
          className="[&_h3]:hidden [&_p]:hidden"
        />
      </div>
    );
  }

  const href =
    cta.type === 'external' && cta.url ? cta.url : getLocalizedUrl('contact', locale as Locale);

  const isExternal = cta.type === 'external' && cta.url;

  return (
    <Link
      href={href}
      className={cn(baseStyles, variant === 'primary' ? primaryStyles : secondaryStyles)}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {t(cta.labelKey)}
      {isExternal && (
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
      )}
    </Link>
  );
}

const STATUS_I18N_MAP: Record<string, string> = {
  production: 'production',
  'production-beta': 'productionBeta',
  'coming-soon': 'comingSoon',
  'in-development': 'inDevelopment',
};

export function PlatformHero({ platform, i18nKey, locale }: PlatformHeroProps) {
  const t = useTranslations('platforms');

  return (
    <section
      data-section="hero"
      className="relative bg-obsidian overflow-hidden py-24 sm:py-32 lg:py-40"
      aria-labelledby="platform-hero-heading"
    >
      {/* Decorative accent gradient blobs */}
      <div
        className={cn(
          'absolute -top-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br',
          platform.accentColor.gradient
        )}
        aria-hidden="true"
      />
      <div
        className={cn(
          'absolute -bottom-32 -left-32 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-15 bg-gradient-to-tr',
          platform.accentColor.gradient
        )}
        aria-hidden="true"
      />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Status badge */}
        <div className="mb-6">
          <StatusBadge
            status={platform.status}
            label={t(`shared.status.${STATUS_I18N_MAP[platform.status] || platform.status}`)}
          />
        </div>

        {/* Platform icon and name */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-5xl sm:text-6xl" role="img" aria-hidden="true">
            {platform.icon}
          </span>
          <h1
            id="platform-hero-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white tracking-tight"
          >
            {platform.name}
          </h1>
        </div>

        {/* "by MADFAM" badge */}
        <div className="mb-6">
          <Badge
            variant="by-madfam"
            className="dark:bg-white/10 dark:text-white/70 dark:border-white/20"
          />
        </div>

        {/* Tagline */}
        <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto mb-12 leading-relaxed">
          {t(`${i18nKey}.tagline`)}
        </p>

        {/* Key metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
          {Object.entries(t.raw(`${i18nKey}.metrics`) as Record<string, string>).map(
            ([metricKey, value]) => (
              <div
                key={metricKey}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-5"
              >
                <p className={cn('text-2xl sm:text-3xl font-bold', platform.accentColor.text)}>
                  {value}
                </p>
                <p className="text-sm text-gray-400 mt-1 capitalize">{metricKey}</p>
              </div>
            )
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <CTAButton cta={platform.primaryCTA} locale={locale} t={t} variant="primary" />
          <CTAButton cta={platform.secondaryCTA} locale={locale} t={t} variant="secondary" />
        </div>
      </div>
    </section>
  );
}
