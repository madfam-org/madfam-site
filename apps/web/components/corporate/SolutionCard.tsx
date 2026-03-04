'use client';

import { ArrowUpRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Badge } from './Badge';
import { cn } from '@/lib/utils';

interface SolutionCardProps {
  solution: {
    id: string;
    name: string;
    tagline: string;
    description: string;
    badge: string;
    accent: 'green' | 'copper' | 'teal' | 'blue' | 'purple';
    capabilities: string[];
    products: Array<{
      name: string;
      url: string;
      comingSoon?: boolean;
    }>;
    externalUrl?: string;
    internalUrl?: string;
    comingSoon?: boolean;
  };
}

const accentColors = {
  green: {
    border: 'border-green-200 hover:border-green-300',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    accent: 'text-green-600',
    button: 'bg-green-100 text-green-700 hover:bg-green-200',
  },
  copper: {
    border: 'border-amber-200 hover:border-amber-300',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    accent: 'text-amber-600',
    button: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
  },
  teal: {
    border: 'border-teal-200 hover:border-teal-300',
    bg: 'bg-gradient-to-br from-teal-50 to-cyan-50',
    accent: 'text-teal-600',
    button: 'bg-teal-100 text-teal-700 hover:bg-teal-200',
  },
  blue: {
    border: 'border-blue-200 hover:border-blue-300',
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
    accent: 'text-blue-600',
    button: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
  },
  purple: {
    border: 'border-purple-200 hover:border-purple-300',
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    accent: 'text-purple-600',
    button: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
  },
};

export function SolutionCard({ solution }: SolutionCardProps) {
  const t = useTranslations();
  const colors = accentColors[solution.accent];
  const href = `/solutions/${solution.id}`;

  return (
    <div
      className={cn(
        'relative p-6 border rounded-xl transition-all duration-200 group',
        colors.border,
        colors.bg,
        solution.comingSoon && 'opacity-75'
      )}
    >
      {/* Coming Soon Badge */}
      {solution.comingSoon && (
        <div className="absolute top-4 right-4">
          <span className="px-2 py-1 bg-neutral-100 text-neutral-600 text-xs rounded-full">
            {t('common.comingSoon')}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-neutral-900 mb-1">{solution.name}</h3>
            <Badge variant="by-madfam" />
          </div>
        </div>

        <p className={cn('font-medium text-sm mb-3', colors.accent)}>{solution.tagline}</p>

        <p className="text-neutral-600 text-sm leading-relaxed">{solution.description}</p>
      </div>

      {/* Capabilities */}
      <div className="mb-6">
        <h4 className="font-semibold text-neutral-900 text-sm mb-3">
          {t('corporate.solutions.mainCapabilities')}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {solution.capabilities.slice(0, 4).map((capability, index) => (
            <div key={index} className="text-xs text-neutral-600 flex items-center gap-1">
              <span className={cn('w-1.5 h-1.5 rounded-full', `bg-${solution.accent}-400`)} />
              {capability}
            </div>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="mb-6">
        <h4 className="font-semibold text-neutral-900 text-sm mb-3">
          {t('corporate.solutions.mainProducts')}
        </h4>
        <div className="flex flex-wrap gap-2">
          {solution.products.slice(0, 3).map((product, index) => (
            <span
              key={index}
              className={cn(
                'px-2 py-1 rounded text-xs border',
                product.comingSoon
                  ? 'bg-neutral-50 text-neutral-500 border-neutral-200'
                  : `${colors.button} border-transparent`
              )}
            >
              {product.name}
              {product.comingSoon && ` ${t('common.comingSoonBrackets')}`}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {!solution.comingSoon && (solution.internalUrl || !solution.externalUrl) && (
          <Link
            href={solution.internalUrl || href}
            className={cn(
              'flex-1 px-4 py-2 rounded-lg text-center text-sm font-medium transition-colors',
              colors.button
            )}
          >
            {t('common.viewDetails')}
          </Link>
        )}

        {solution.externalUrl && !solution.comingSoon && (
          <Link
            href={solution.externalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
              solution.internalUrl
                ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                : colors.button
            )}
          >
            {solution.internalUrl ? (
              <>
                <span>Sitio web</span>
                <ArrowUpRightIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                {t('common.visitWebsite')}
                <ArrowUpRightIcon className="w-4 h-4" />
              </>
            )}
          </Link>
        )}

        {solution.comingSoon && (
          <div className="flex-1 px-4 py-2 bg-neutral-100 text-neutral-500 rounded-lg text-center text-sm font-medium cursor-not-allowed">
            {t('common.comingSoon')}
          </div>
        )}
      </div>
    </div>
  );
}
