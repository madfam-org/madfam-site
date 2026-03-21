'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/components/ui/utils';

interface PlatformTechSpecsProps {
  i18nKey: string;
}

const SPEC_ITEMS = [
  {
    key: 'apis',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
        />
      </svg>
    ),
  },
  {
    key: 'protocols',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
    ),
  },
  {
    key: 'sdks',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
  },
  {
    key: 'license',
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
] as const;

export function PlatformTechSpecs({ i18nKey }: PlatformTechSpecsProps) {
  const t = useTranslations('platforms');

  return (
    <section
      data-section="tech-specs"
      className="py-20 bg-white dark:bg-gray-950"
      aria-labelledby="techspecs-heading"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2
          id="techspecs-heading"
          className="text-3xl font-bold text-gray-900 dark:text-white mb-12 text-center"
        >
          {t('shared.sections.techSpecs')}
        </h2>

        <div className="space-y-3">
          {SPEC_ITEMS.map(item => (
            <details
              key={item.key}
              className={cn(
                'group rounded-xl border border-gray-200 dark:border-gray-700',
                'bg-gray-50 dark:bg-gray-900 transition-colors',
                'open:bg-white dark:open:bg-gray-800 open:shadow-sm'
              )}
            >
              <summary
                className={cn(
                  'flex items-center gap-3 px-6 py-5 cursor-pointer select-none',
                  'text-gray-900 dark:text-white font-medium',
                  'min-h-[48px] list-none',
                  '[&::-webkit-details-marker]:hidden'
                )}
              >
                <span
                  className="w-9 h-9 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0"
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <span className="flex-1 capitalize">
                  {item.key === 'apis'
                    ? 'APIs'
                    : item.key === 'sdks'
                      ? 'SDKs'
                      : item.key.charAt(0).toUpperCase() + item.key.slice(1)}
                </span>
                {/* Chevron */}
                <svg
                  className="w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform group-open:rotate-180 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-6 pt-0">
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {t(`${i18nKey}.techSpecs.${item.key}`)}
                  </p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
