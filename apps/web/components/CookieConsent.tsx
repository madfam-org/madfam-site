'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

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
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-4 sm:bottom-4"
          role="region"
          aria-label={t('banner.title')}
        >
          {/* One compact bar: the notice asks for nothing, so it should not
              cover the page. The full breakdown lives on the cookie policy. */}
          <div className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-gray-200 bg-white px-4 py-3 shadow-lg dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:gap-4 sm:rounded-xl sm:border">
            <p className="flex-1 text-sm leading-snug text-gray-700 dark:text-gray-300">
              {t('banner.description')}{' '}
              {t.rich('footer.text', {
                cookies: chunks => (
                  <Link
                    href={`/${locale}/cookies`}
                    className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-white"
                  >
                    {chunks}
                  </Link>
                ),
                privacy: chunks => (
                  <Link
                    href={`/${locale}/privacy`}
                    className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-white"
                  >
                    {chunks}
                  </Link>
                ),
              })}
            </p>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={dismiss}
                className="min-h-[44px] rounded-lg bg-obsidian px-4 text-sm font-medium text-pearl hover:bg-obsidian/90 dark:bg-pearl dark:text-obsidian dark:hover:bg-white"
              >
                {t('banner.dismiss')}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label={t('banner.closeAriaLabel')}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
