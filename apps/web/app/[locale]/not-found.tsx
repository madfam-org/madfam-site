import { getLocalizedUrl, type Locale } from '@madfam-site/i18n';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound');
  return { title: `${t('title')} — MADFAM`, robots: { index: false, follow: true } };
}

/**
 * The localized 404. Rendered inside `app/[locale]/layout.tsx`, so it keeps the
 * site header and footer; its copy is the `notFound` block of the system bundle
 * (es/en/pt).
 */
export default async function NotFound() {
  const t = await getTranslations('notFound');
  const locale = (await getLocale()) as Locale;

  const links = [
    { href: getLocalizedUrl('products', locale), label: t('products') },
    { href: getLocalizedUrl('about', locale), label: t('about') },
    { href: getLocalizedUrl('contact', locale), label: t('contact') },
  ];

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-4 pt-28 pb-20">
      <div className="text-center max-w-xl">
        <p className="text-7xl font-bold text-gray-500 dark:text-gray-400" aria-hidden="true">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold text-obsidian dark:text-pearl">{t('title')}</h1>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{t('description')}</p>

        <Link
          href={`/${locale}`}
          className="mt-8 inline-block px-6 py-3 rounded-lg font-medium bg-obsidian text-pearl hover:bg-obsidian/90 dark:bg-pearl dark:text-obsidian dark:hover:bg-white transition-colors"
        >
          {t('goHome')}
        </Link>

        <nav
          aria-label={t('helpfulLinks')}
          className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-800"
        >
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {links.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-gray-700 dark:text-gray-300 underline underline-offset-4 hover:text-obsidian dark:hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
