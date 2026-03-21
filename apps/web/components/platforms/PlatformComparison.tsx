'use client';

import { useTranslations } from 'next-intl';
import type { Platform } from '@/lib/data/platforms';
import { cn } from '@/components/ui/utils';

interface PlatformComparisonProps {
  platform: Platform;
  i18nKey: string;
}

export function PlatformComparison({ platform, i18nKey }: PlatformComparisonProps) {
  const t = useTranslations('platforms');

  const headers = t.raw(`${i18nKey}.comparison.headers`) as string[];
  const rows = t.raw(`${i18nKey}.comparison.rows`) as Record<string, string[]>;
  const rowEntries = Object.entries(rows);

  return (
    <section
      data-section="comparison"
      className="py-20 bg-white dark:bg-gray-950"
      aria-labelledby="comparison-heading"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="comparison-heading"
          className="text-3xl font-bold text-gray-900 dark:text-white mb-4 text-center"
        >
          {t(`${i18nKey}.comparison.title`)}
        </h2>

        {/* Desktop table */}
        <div className="mt-12 hidden sm:block overflow-x-auto">
          <table className="w-full border-collapse" role="table">
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    scope="col"
                    className={cn(
                      'px-6 py-4 text-left text-sm font-semibold border-b-2',
                      i === 1
                        ? cn(
                            'border-b-2',
                            platform.accentColor.text,
                            platform.accentColor.border,
                            platform.accentColor.bg
                          )
                        : 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    )}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowEntries.map(([key, values]) => (
                <tr
                  key={key}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  {values.map((cell, i) => (
                    <td
                      key={i}
                      className={cn(
                        'px-6 py-4 text-sm',
                        i === 0
                          ? 'font-medium text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-300',
                        i === 1 &&
                          cn(platform.accentColor.bg, 'font-semibold', platform.accentColor.text)
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card layout */}
        <div className="mt-12 sm:hidden space-y-6">
          {rowEntries.map(([key, values]) => (
            <div
              key={key}
              className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-5"
            >
              <p className="font-semibold text-gray-900 dark:text-white mb-3 text-base">
                {values[0]}
              </p>
              <div className="space-y-2">
                {headers.slice(1).map((header, i) => (
                  <div key={i} className="flex justify-between items-baseline gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {header}
                    </span>
                    <span
                      className={cn(
                        'text-sm font-medium text-right',
                        i === 0
                          ? cn(platform.accentColor.text, 'font-semibold')
                          : 'text-gray-700 dark:text-gray-300'
                      )}
                    >
                      {values[i + 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
