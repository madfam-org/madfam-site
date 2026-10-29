'use client';

import { useTranslations } from 'next-intl';

/**
 * Keyboard bypass to the page's main content (WCAG 2.4.1). Hidden above the
 * viewport until it takes focus; see `.skip-link` in app/globals.css.
 */
export function SkipLink() {
  const t = useTranslations();
  return (
    <a href="#main-content" className="skip-link">
      {t('skipToContent')}
    </a>
  );
}
