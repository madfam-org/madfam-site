export const i18nConfig = {
  // UPDATED: Normalized locales (es-MX → es, en-US → en, pt-BR → pt)
  defaultLocale: 'es',
  locales: ['es', 'en', 'pt'] as const,

  localeDetection: true,

  // SEO-friendly locale names
  localeNames: {
    es: 'Español',
    en: 'English',
    pt: 'Português',
  },

  // Hreflang mappings for SEO
  hreflangMap: {
    es: 'es-MX',
    en: 'en',
    pt: 'pt-BR',
  },

  // Route translations - maps canonical routes to localized routes
  routes: {
    es: {
      // NEW: Corporate structure routes (updated to use '/solutions')
      '/solutions': '/soluciones',
      '/solutions/colabs': '/soluciones/colabs',
      '/solutions/showtech': '/soluciones/showtech',
      '/solutions/maker-node': '/soluciones/maker-node',
      '/ecosystem': '/ecosistema',
      '/products': '/productos',
      '/programs': '/programas',
      '/about': '/sobre',
      '/contact': '/contacto',

      // PRESERVE: Existing routes
      '/careers': '/carreras',
      '/privacy': '/privacidad',
      '/terms': '/terminos',
      '/cookies': '/cookies',
    },
    pt: {
      // Portuguese routes (updated to use '/solutions')
      '/solutions': '/solucoes',
      '/solutions/colabs': '/solucoes/colabs',
      '/solutions/showtech': '/solucoes/showtech',
      '/solutions/maker-node': '/solucoes/maker-node',
      '/ecosystem': '/ecossistema',
      '/products': '/produtos',
      '/programs': '/programas',
      '/about': '/sobre',
      '/contact': '/contato',
      '/careers': '/carreiras',
      '/privacy': '/privacidade',
      '/terms': '/termos',
      '/cookies': '/cookies',
    },
    en: {
      // English routes are the canonical/default routes - no mapping needed
    },
  },
} as const;

export type Locale = (typeof i18nConfig.locales)[number];
export type LocalePrefix = 'always' | 'as-needed' | 'never';
