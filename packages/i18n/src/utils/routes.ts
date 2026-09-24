import { Locale } from '../config';

export type RouteKey =
  | 'home'
  // Corporate structure routes
  | 'solutions'
  | 'solutions.colabs'
  | 'solutions.maker-node'
  | 'programs'
  | 'case-studies'
  | 'impact'
  | 'showcase'
  | 'ecosystem'
  // Core routes
  | 'platforms'
  | 'products'
  | 'value-ladder'
  | 'nauta'
  | 'about'
  | 'contact'
  | 'blog'
  | 'careers'
  | 'privacy'
  | 'terms'
  | 'cookies';

// Public path for each route, per locale.
//
// Every locale uses the app's real route segment (the [locale]/<segment> folder).
// Localized slugs used to live here ('/plataformas', '/ecosistema', '/nosotros',
// '/carreras', '/impacto', '/privacidad', '/terminos', '/soluciones/maker-node'…)
// but only some of them had a rewrite in next.config.js, so the navbar, footer
// and CTAs linked to 404s in es/pt; and the ones that did resolve were
// duplicate URLs of the canonical page (findings C-021/C-024, 2026-09-23). The
// legacy rewrites stay in next.config.js so old inbound links keep working; the
// canonical tag on those pages points at the path below.
const routes: Record<RouteKey, Record<Locale, string>> = {
  home: {
    en: '/',
    es: '/',
    pt: '/',
  },
  // NEW: Corporate structure routes
  solutions: {
    en: '/solutions',
    es: '/solutions',
    pt: '/solutions',
  },
  'solutions.colabs': {
    en: '/solutions/colabs',
    es: '/solutions/colabs',
    pt: '/solutions/colabs',
  },
  'solutions.maker-node': {
    en: '/solutions/maker-node',
    es: '/solutions/maker-node',
    pt: '/solutions/maker-node',
  },
  ecosystem: {
    en: '/ecosystem',
    es: '/ecosystem',
    pt: '/ecosystem',
  },

  programs: {
    en: '/programs',
    es: '/programs',
    pt: '/programs',
  },
  'case-studies': {
    en: '/case-studies',
    es: '/case-studies',
    pt: '/case-studies',
  },
  impact: {
    en: '/impact',
    es: '/impact',
    pt: '/impact',
  },
  showcase: {
    en: '/showcase',
    es: '/showcase',
    pt: '/showcase',
  },
  platforms: {
    en: '/platforms',
    es: '/platforms',
    pt: '/platforms',
  },
  products: {
    en: '/products',
    es: '/products',
    pt: '/products',
  },
  'value-ladder': {
    en: '/value-ladder',
    es: '/value-ladder',
    pt: '/value-ladder',
  },
  nauta: {
    en: '/nauta',
    es: '/nauta',
    pt: '/nauta',
  },
  about: {
    en: '/about',
    es: '/about',
    pt: '/about',
  },
  contact: {
    en: '/contact',
    es: '/contact',
    pt: '/contact',
  },
  blog: {
    en: '/blog',
    es: '/blog',
    pt: '/blog',
  },
  careers: {
    en: '/careers',
    es: '/careers',
    pt: '/careers',
  },
  privacy: {
    en: '/privacy',
    es: '/privacy',
    pt: '/privacy',
  },
  terms: {
    en: '/terms',
    es: '/terms',
    pt: '/terms',
  },
  cookies: {
    en: '/cookies',
    es: '/cookies',
    pt: '/cookies',
  },
};

// Get the localized path for a route
export function getLocalizedPath(route: RouteKey, locale: Locale): string {
  const routeConfig = routes[route];
  if (!routeConfig) {
    console.warn(`Route "${route}" not found in routes configuration`);
    return `/${route}`; // Fallback to basic path
  }

  const localizedPath = routeConfig[locale];
  if (!localizedPath) {
    console.warn(`Locale "${locale}" not found for route "${route}"`);
    // Try to fallback to English, then Spanish
    return routeConfig['en'] || routeConfig['es'] || `/${route}`;
  }

  return localizedPath;
}

// Get the full URL with locale prefix
export function getLocalizedUrl(route: RouteKey, locale: Locale): string {
  const path = getLocalizedPath(route, locale);
  return `/${locale}${path}`;
}

// Parse a path to find the matching route key
export function getRouteKeyFromPath(path: string, locale: Locale): RouteKey | null {
  // Remove locale prefix if present
  const pathWithoutLocale = path.replace(new RegExp(`^/${locale}`), '');

  for (const [key, localePaths] of Object.entries(routes)) {
    if (localePaths[locale] === pathWithoutLocale) {
      return key as RouteKey;
    }
  }

  return null;
}
