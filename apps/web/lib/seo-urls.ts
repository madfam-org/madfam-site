// Dependency-free URL helpers (safe to import from middleware / the edge).

// ─── Locale-aware URLs (findings C-021, C-024) ───────────────────────────────
// Every page is served under a locale prefix (`localePrefix: 'always'`), so an
// unprefixed URL 307-redirects. Canonicals, hreflang alternates and sitemap
// entries therefore always carry the locale; `x-default` points at the default
// locale (es).

export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://madfam.io';
export const SEO_LOCALES = ['es', 'en', 'pt'] as const;
export type SeoLocale = (typeof SEO_LOCALES)[number];
export const SEO_DEFAULT_LOCALE: SeoLocale = 'es';

/** Request header carrying the request pathname from middleware to layouts. */
export const PATHNAME_HEADER = 'x-madfam-pathname';
/** Request header next-intl's middleware sets with the resolved locale. */
export const LOCALE_HEADER = 'x-next-intl-locale';

/** Normalise a locale-less path: '' for the home page, '/x/y' otherwise. */
export function normalisePath(path: string = ''): string {
  if (!path || path === '/') return '';
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.replace(/\/+$/, '');
}

export function localizedUrl(locale: string, path: string = ''): string {
  return `${SITE_URL}/${locale}${normalisePath(path)}`;
}

/** `alternates` for Next metadata: self canonical + es/en/pt + x-default. */
export function localizedAlternates(
  locale: string,
  path: string = ''
): { canonical: string; languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const l of SEO_LOCALES) languages[l] = localizedUrl(l, path);
  languages['x-default'] = localizedUrl(SEO_DEFAULT_LOCALE, path);
  return { canonical: localizedUrl(locale, path), languages };
}

/**
 * Legacy localized slugs that next.config.js still rewrites to a real route
 * (so old inbound links keep working). A page reached through one of them must
 * still declare the real route as canonical, or the site publishes two URLs
 * for one page. Kept in step with next.config.js `rewrites()` by
 * apps/web/lib/__tests__/seo-urls.test.ts.
 */
export const LEGACY_PATH_ALIASES: Record<string, string> = {
  '/soluciones': '/solutions',
  '/soluciones/colabs': '/solutions/colabs',
  '/soluciones/showtech': '/solutions/showtech',
  '/solucoes': '/solutions',
  '/solucoes/colabs': '/solutions/colabs',
  '/solucoes/showtech': '/solutions/showtech',
  '/productos': '/products',
  '/produtos': '/products',
  '/programas': '/programs',
  '/casos': '/work',
  '/seguridad': '/security',
  '/seguranca': '/security',
  '/sobre': '/about',
  '/contacto': '/contact',
  '/contato': '/contact',
  '/carreiras': '/careers',
  '/casos-de-sucesso': '/case-studies',
  '/documentacao': '/docs',
  '/guias': '/guides',
  '/avaliacao': '/assessment',
  '/calculadora': '/calculator',
  '/estimador': '/estimator',
  '/privacidade': '/privacy',
  '/termos': '/terms',
};

/** The real route path for a locale-less path (legacy aliases resolved). */
export function canonicalPath(path: string): string {
  const normalised = normalisePath(path);
  return LEGACY_PATH_ALIASES[normalised] ?? normalised;
}

/**
 * Strip the locale prefix from a request pathname ('/es/about' -> '/about',
 * '/pt' -> ''). Returns null when the first segment is not a known locale.
 */
export function pathWithoutLocale(pathname: string): { locale: SeoLocale; path: string } | null {
  const match = /^\/([^/]+)(\/.*)?$/.exec(pathname || '');
  if (!match) return null;
  const locale = match[1] as SeoLocale;
  if (!SEO_LOCALES.includes(locale)) return null;
  return { locale, path: canonicalPath(match[2] ?? '') };
}
