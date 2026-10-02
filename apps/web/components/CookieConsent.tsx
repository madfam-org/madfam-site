'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui';

/**
 * Cookie notice. It states what the site actually does and asks for nothing.
 *
 * The site's own cookie policy (`/[locale]/cookies`, `cookies` namespace) lists
 * only strictly necessary cookies (the next-intl locale cookie and Cloudflare's
 * bot-management cookie) and preference storage (language, theme). Analytics
 * is self-hosted Plausible, which sets no cookie (ruling R41), and there are no
 * marketing or advertising cookies. So there is nothing to opt in to: no
 * analytics or marketing toggle, no "accept all", and no "by continuing you
 * consent" wording (finding M1-030). If the site ever adds a non-essential
 * cookie, it needs a real opt-in here first, and the policy page updated.
 *
 * The dismissal is kept in localStorage under `NOTICE_KEY`. The legacy
 * `cookie-consent` entry, written by the previous banner, recorded "consent"
 * to analytics/marketing cookies that never existed; it is removed on load.
 */
const NOTICE_KEY = 'cookie-notice';
const NOTICE_VERSION = '2026-10-01';
const LEGACY_CONSENT_KEY = 'cookie-consent';

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage blocked (private mode, site data disabled): the notice simply
    // shows again next visit. Nothing else depends on it.
  }
}

export function CookieConsent() {
  const t = useTranslations('cookies');
  const locale = useLocale();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    writeStorage(LEGACY_CONSENT_KEY, null);
    if (readStorage(NOTICE_KEY) === NOTICE_VERSION) return;
    // Show after a short delay so it does not compete with first paint.
    const timer = window.setTimeout(() => setShowBanner(true), 1000);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    writeStorage(NOTICE_KEY, NOTICE_VERSION);
    setShowBanner(false);
  };

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 sm:bottom-8 sm:left-8 sm:right-8 z-50"
          role="region"
          aria-label={t('banner.title')}
        >
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <Cookie className="w-8 h-8 text-sun" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-heading font-semibold mb-2">{t('banner.title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('banner.description')}
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
                    <li>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {t('banner.necessary.title')}
                      </span>{' '}
                      — {t('banner.necessary.description')}
                    </li>
                    <li>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {t('banner.preference.title')}
                      </span>{' '}
                      — {t('banner.preference.description')}
                    </li>
                  </ul>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={dismiss}
                    className="w-full sm:w-auto"
                  >
                    {t('banner.dismiss')}
                  </Button>
                </div>
                <button
                  onClick={dismiss}
                  className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label={t('banner.closeAriaLabel')}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.rich('footer.text', {
                  cookies: chunks => (
                    <Link
                      href={`/${locale}/cookies`}
                      className="underline hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {chunks}
                    </Link>
                  ),
                  privacy: chunks => (
                    <Link
                      href={`/${locale}/privacy`}
                      className="underline hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
