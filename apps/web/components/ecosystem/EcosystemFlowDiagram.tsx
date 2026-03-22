'use client';

import { useTranslations } from 'next-intl';
import { INTEGRATION_FLOW, getPlatformBySlug } from '@/lib/data/platforms';

interface EcosystemFlowDiagramProps {
  variant?: 'full' | 'compact' | 'contextual';
  highlightSlug?: string;
}

function ArrowConnector({ muted }: { muted: boolean }): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className={`hidden md:flex items-center justify-center flex-shrink-0 px-1 ${
        muted ? 'text-gray-300 dark:text-gray-700' : 'text-leaf'
      }`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function VerticalArrowConnector(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className="flex md:hidden items-center justify-center py-1 text-gray-300 dark:text-gray-700"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}

export function EcosystemFlowDiagram({
  variant = 'full',
  highlightSlug,
}: EcosystemFlowDiagramProps): React.ReactElement {
  const t = useTranslations('platforms');
  const isCompact = variant === 'compact';

  return (
    <div
      role="list"
      aria-label="Integration pipeline"
      className={`flex flex-col md:flex-row items-stretch md:items-center ${
        isCompact ? 'gap-1 md:gap-0' : 'gap-2 md:gap-0'
      }`}
    >
      {INTEGRATION_FLOW.map((step, index) => {
        const platform = getPlatformBySlug(step.slug);
        if (!platform) return null;

        const isHighlighted = highlightSlug === step.slug;
        const isMuted = highlightSlug !== null && !isHighlighted;
        const stepLabel = t(step.stepKey);

        // Determine styling based on highlight state
        const cardBorderClass = isHighlighted
          ? `${platform.accentColor.border} ring-2 ring-offset-1 ring-leaf/40`
          : isMuted
            ? 'border-gray-200 dark:border-gray-800 opacity-50'
            : 'border-gray-200 dark:border-gray-700 hover:border-leaf/50 dark:hover:border-leaf/50';

        const cardBgClass = isHighlighted
          ? `bg-gradient-to-br ${platform.accentColor.gradient}`
          : 'bg-white dark:bg-gray-800';

        const textColorClass = isHighlighted
          ? platform.accentColor.text
          : isMuted
            ? 'text-gray-400 dark:text-gray-600'
            : 'text-gray-700 dark:text-gray-300';

        return (
          <div key={step.slug} className="contents" role="listitem">
            {/* Step card */}
            <div
              className={`flex-1 flex ${
                isCompact ? 'flex-row md:flex-col items-center gap-2' : 'flex-col items-center'
              } text-center rounded-xl border transition-all duration-300 ${cardBorderClass} ${cardBgClass} ${
                isCompact ? 'p-2 md:p-3' : 'p-4 md:p-5'
              }`}
            >
              {/* Platform icon */}
              <div
                className={`${
                  isCompact ? 'w-8 h-8 text-base' : 'w-12 h-12 text-2xl mb-2'
                } rounded-full flex items-center justify-center flex-shrink-0 ${
                  isHighlighted ? platform.accentColor.bg : 'bg-gray-100 dark:bg-gray-700'
                }`}
                aria-hidden="true"
              >
                {platform.icon}
              </div>

              <div className={isCompact ? '' : 'space-y-1'}>
                {/* Step label */}
                <span
                  className={`${isCompact ? 'text-xs' : 'text-sm'} font-semibold ${textColorClass}`}
                >
                  {stepLabel}
                </span>

                {/* Platform name (hidden in compact) */}
                {!isCompact && (
                  <p
                    className={`text-xs ${
                      isHighlighted
                        ? platform.accentColor.text
                        : isMuted
                          ? 'text-gray-400 dark:text-gray-600'
                          : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {platform.name}
                  </p>
                )}
              </div>
            </div>

            {/* Arrow connector between steps */}
            {index < INTEGRATION_FLOW.length - 1 && (
              <>
                <ArrowConnector muted={isMuted && !isHighlighted} />
                <VerticalArrowConnector />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
