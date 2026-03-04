'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant: 'by-madfam' | 'program' | string;
  children?: React.ReactNode;
  className?: string;
}

const badgeVariants = {
  'by-madfam': 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  'madfam-product': 'bg-amber-50 text-amber-700 border border-amber-200',
  program: 'bg-blue-50 text-blue-700 border border-blue-200',
};

export function Badge({ variant, children, className }: BadgeProps) {
  const t = useTranslations();

  const badgeText = {
    'by-madfam': t('corporate.badges.byMadfam'),
    'madfam-product': t('corporate.badges.byMadfam'),
    program: '',
  };
  const variantClasses =
    badgeVariants[variant as keyof typeof badgeVariants] || badgeVariants['by-madfam'];
  const text = children || badgeText[variant as keyof typeof badgeText] || variant;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses,
        className
      )}
    >
      {text}
    </span>
  );
}
