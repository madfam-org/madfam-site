'use client';

import { ArrowUpRight as ArrowUpRightIcon } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Badge } from './Badge';
import { SDGInlineBadge } from '@/components/SDGBadge';

interface ProductCardProps {
  product: {
    name: string;
    description: string;
    audience: string;
    badge: string;
    tiers?: string;
    primaryCta: {
      label: string;
      url: string;
      external?: boolean;
      comingSoon?: boolean;
    };
    secondaryCta: {
      label: string;
      url: string;
    };
    features: string[];
    sdgs?: string[];
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const t = useTranslations();
  return (
    <div className="bg-white dark:bg-gray-900 border border-neutral-200 dark:border-gray-800 rounded-xl p-6 hover:border-neutral-300 dark:hover:border-gray-700 transition-colors">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">{product.name}</h3>
          <div className="flex items-center gap-2">
            {product.tiers && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-leaf/10 text-leaf border border-leaf/20">
                {product.tiers}
              </span>
            )}
            {product.sdgs && product.sdgs.length > 0 && (
              <SDGInlineBadge count={product.sdgs.length} />
            )}
            <Badge variant="by-madfam">{product.badge}</Badge>
          </div>
        </div>

        <p className="text-neutral-600 text-sm leading-relaxed mb-4">{product.description}</p>

        <div className="bg-neutral-50 rounded-lg p-3">
          <p className="text-neutral-700 text-sm">
            <span className="font-medium">{t('corporate.products.idealFor')}</span>{' '}
            {product.audience}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mb-6">
        <h4 className="font-semibold text-neutral-900 text-sm mb-3">
          {t('corporate.products.mainFeatures')}
        </h4>
        <ul className="space-y-2">
          {product.features.map((feature, index) => (
            <li key={index} className="text-neutral-600 text-sm flex items-start gap-2">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {product.primaryCta.external ? (
          <Link
            href={product.primaryCta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg text-center text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2"
          >
            {product.primaryCta.label}
            <ArrowUpRightIcon className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href={product.primaryCta.url}
            className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg text-center text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            {product.primaryCta.label}
          </Link>
        )}

        <Link
          href={product.secondaryCta.url}
          className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors"
        >
          {product.secondaryCta.label}
        </Link>
      </div>
    </div>
  );
}
