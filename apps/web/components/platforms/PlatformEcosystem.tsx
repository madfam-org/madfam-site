'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getPlatformBySlug, type Platform } from '@/lib/data/platforms';
import { cn } from '@/components/ui/utils';

interface PlatformEcosystemProps {
  platform: Platform;
  i18nKey: string;
  locale: string;
}

export function PlatformEcosystem({ platform, i18nKey, locale }: PlatformEcosystemProps) {
  const t = useTranslations('platforms');

  const connections = platform.ecosystemConnections
    .map(connection => {
      const connected = getPlatformBySlug(connection.slug);
      if (!connected) return null;
      return { connection, connected };
    })
    .filter(Boolean) as {
    connection: Platform['ecosystemConnections'][number];
    connected: Platform;
  }[];

  if (connections.length === 0) return null;

  return (
    <section
      data-section="ecosystem"
      className="py-20 bg-gray-50 dark:bg-gray-900"
      aria-labelledby="ecosystem-heading"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="ecosystem-heading"
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center"
        >
          {t('shared.sections.ecosystem')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-2xl mx-auto">
          {t(`${i18nKey}.valueProp`)}
        </p>

        <div
          className={cn(
            'grid gap-6',
            connections.length === 1
              ? 'grid-cols-1 max-w-md mx-auto'
              : connections.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-3xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {connections.map(({ connection, connected }) => (
            <Link
              key={connected.slug}
              href={`/${locale}/platforms/${connected.slug}`}
              className={cn(
                'group relative rounded-2xl border bg-white dark:bg-gray-800 p-6 sm:p-8',
                'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                connected.accentColor.border,
                'min-h-[48px]'
              )}
            >
              {/* Connection line indicator */}
              <div
                className={cn(
                  'absolute top-0 left-6 right-6 h-0.5 rounded-b-full bg-gradient-to-r',
                  connected.accentColor.gradient
                )}
                aria-hidden="true"
              />

              <div className="flex items-start gap-4 mt-2">
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0',
                    connected.accentColor.bg
                  )}
                  aria-hidden="true"
                >
                  {connected.icon}
                </div>

                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:underline">
                    {connected.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {t(connection.relationKey)}
                  </p>
                </div>

                {/* Arrow indicator */}
                <svg
                  className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0 mt-1 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
