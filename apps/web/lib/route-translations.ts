import { i18nConfig, type Locale } from '@madfam-site/i18n';
import { canonicalPath } from '@/lib/seo-urls';

/**
 * The same pathname in another locale.
 *
 * Every route is served under the same segments in every locale
 * (`/es/ecosystem`, `/en/ecosystem`, `/pt/ecosystem`), so switching language
 * swaps only the locale prefix. Legacy localized slugs that are still served
 * through rewrites (`/es/productos`) resolve to their canonical route first.
 * Mapping to localized slugs instead sent visitors to URLs with no route
 * (`/es/ecosistema`, `/pt/ecossistema`), which answered 404.
 *
 * @param pathname - The full pathname including locale (e.g. '/es/ecosystem')
 * @param toLocale - The target locale
 * @returns The pathname under the target locale (e.g. '/pt/ecosystem')
 */
export function translatePathname(pathname: string, toLocale: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const hasLocale = segments[0] !== undefined && i18nConfig.locales.includes(segments[0] as Locale);
  const route = `/${(hasLocale ? segments.slice(1) : segments).join('/')}`;

  return `/${toLocale}${canonicalPath(route)}`;
}

/**
 * Gets the current locale from a pathname
 * @param pathname - The pathname to extract locale from
 * @returns The detected locale
 */
export function getLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && i18nConfig.locales.includes(firstSegment as Locale)) {
    return firstSegment;
  }

  return i18nConfig.defaultLocale;
}

/**
 * Removes the locale prefix from a pathname
 * @param pathname - The pathname with locale prefix
 * @returns The pathname without locale prefix
 */
export function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return '/';
  }

  const firstSegment = segments[0];

  if (firstSegment && i18nConfig.locales.includes(firstSegment as Locale)) {
    return `/${segments.slice(1).join('/')}`;
  }

  return pathname;
}
