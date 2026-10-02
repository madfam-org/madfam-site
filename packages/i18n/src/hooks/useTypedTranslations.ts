'use client';

import { useTranslations } from 'next-intl';
import { interpolate } from '../utils/translations';

export type TranslationNamespace =
  | 'common'
  | 'home'
  | 'services'
  | 'about'
  | 'products'
  | 'contact'
  | 'footer'
  | 'auth'
  | 'dashboard'
  | 'careers'
  | 'blog'
  | 'caseStudies'
  | 'cookies'
  | 'privacy'
  | 'terms';

export interface TypedTranslations {
  (key: string, variables?: Record<string, string | number>): string;
  rich: (key: string, components: Record<string, React.ReactNode>) => React.ReactNode;
  has: (key: string) => boolean;
}

export function useTypedTranslations(namespace?: TranslationNamespace): TypedTranslations {
  const t = useTranslations(namespace);

  const typedT = (key: string, variables?: Record<string, string | number>): string => {
    const translation = t(key);
    return variables ? interpolate(translation, variables) : translation;
  };

  typedT.rich = (key: string, components: Record<string, React.ReactNode>) => {
    return t.rich(key, components as any);
  };

  typedT.has = (key: string) => {
    try {
      t(key);
      return true;
    } catch {
      return false;
    }
  };

  return typedT;
}
