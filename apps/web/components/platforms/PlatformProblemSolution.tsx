'use client';

import { useTranslations } from 'next-intl';

interface PlatformProblemSolutionProps {
  i18nKey: string;
}

export function PlatformProblemSolution({ i18nKey }: PlatformProblemSolutionProps) {
  const t = useTranslations('platforms');

  return (
    <section
      data-section="problem-solution"
      className="py-20 bg-gray-50 dark:bg-gray-900"
      aria-labelledby="problem-heading solution-heading"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* The Challenge */}
          <div className="relative rounded-2xl border border-red-200 dark:border-red-800/40 bg-white dark:bg-gray-800 p-8 sm:p-10">
            {/* Red accent bar */}
            <div
              className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-gradient-to-r from-red-400 to-red-500"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div
                className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h2 id="problem-heading" className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('shared.sections.problem')}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
              {t(`${i18nKey}.problem`)}
            </p>
          </div>

          {/* Our Solution */}
          <div className="relative rounded-2xl border border-green-200 dark:border-green-800/40 bg-white dark:bg-gray-800 p-8 sm:p-10">
            {/* Green accent bar */}
            <div
              className="absolute top-0 left-8 right-8 h-1 rounded-b-full bg-gradient-to-r from-green-400 to-green-500"
              aria-hidden="true"
            />
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div
                className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2
                id="solution-heading"
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                {t('shared.sections.solution')}
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
              {t(`${i18nKey}.solution`)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
