import { Locale } from '../config';

export type RouteKey =
  | 'home'
  // Corporate structure routes
  | 'solutions'
  | 'solutions.colabs'
  | 'programs'
  | 'case-studies'
  | 'work'
  | 'security'
  | 'impact'
  | 'showcase'
  // Core routes
  | 'products'
  | 'about'
  | 'contact'
  | 'blog'
  | 'careers'
  | 'privacy'
  | 'terms'
  | 'cookies';

// Define localized slugs for each route (Updated for normalized locales)
const routes: Record<RouteKey, Record<Locale, string>> = {
  home: {
    en: '/',
    es: '/',
    pt: '/',
  },
  // NEW: Corporate structure routes
  solutions: {
    en: '/solutions',
    es: '/soluciones',
    pt: '/solucoes',
  },
  'solutions.colabs': {
    en: '/solutions/colabs',
    es: '/soluciones/colabs',
    pt: '/solucoes/colabs',
  },

  programs: {
    en: '/programs',
    es: '/programas',
    pt: '/programas',
  },
  'case-studies': {
    en: '/case-studies',
    es: '/case-studies',
    pt: '/case-studies',
  },
  work: {
    en: '/work',
    es: '/casos',
    pt: '/casos',
  },
  security: {
    en: '/security',
    es: '/seguridad',
    pt: '/seguranca',
  },
  impact: {
    en: '/impact',
    es: '/impacto',
    pt: '/impacto',
  },
  showcase: {
    en: '/showcase',
    es: '/casos',
    pt: '/casos',
  },
  products: {
    en: '/products',
    es: '/productos',
    pt: '/produtos',
  },
  about: {
    en: '/about',
    es: '/nosotros',
    pt: '/sobre',
  },
  contact: {
    en: '/contact',
    es: '/contacto',
    pt: '/contato',
  },
  blog: {
    en: '/blog',
    es: '/blog',
    pt: '/blog',
  },
  careers: {
    en: '/careers',
    es: '/carreras',
    pt: '/carreiras',
  },
  privacy: {
    en: '/privacy',
    es: '/privacidad',
    pt: '/privacidade',
  },
  terms: {
    en: '/terms',
    es: '/terminos',
    pt: '/termos',
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
