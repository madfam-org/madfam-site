/**
 * MADFAM Corporate Redirects
 * Handles URL routing for corporate architecture
 */

export const programRedirects = [
  // Services to Programs mapping
  {
    source: '/services',
    destination: '/programs',
    permanent: true,
  },
  {
    source: '/:locale/services',
    destination: '/:locale/programs',
    permanent: true,
  },

  // Specific service tiers to programs
  {
    source: '/services/level-1-essentials',
    destination: '/programs#design-fabrication',
    permanent: true,
  },
  {
    source: '/services/level-2-advanced',
    destination: '/programs#design-fabrication',
    permanent: true,
  },
  {
    source: '/services/level-3-consulting',
    destination: '/programs#strategy-enablement',
    permanent: true,
  },
  {
    source: '/services/level-4-platforms',
    destination: '/programs#platform-pilots',
    permanent: true,
  },
  {
    source: '/services/level-5-strategic',
    destination: '/programs#strategic-partnerships',
    permanent: true,
  },

  // Localized service redirects
  {
    source: '/:locale/services/level-1-essentials',
    destination: '/:locale/programs#design-fabrication',
    permanent: true,
  },
  {
    source: '/:locale/services/level-2-advanced',
    destination: '/:locale/programs#design-fabrication',
    permanent: true,
  },
  {
    source: '/:locale/services/level-3-consulting',
    destination: '/:locale/programs#strategy-enablement',
    permanent: true,
  },
  {
    source: '/:locale/services/level-4-platforms',
    destination: '/:locale/programs#platform-pilots',
    permanent: true,
  },
  {
    source: '/:locale/services/level-5-strategic',
    destination: '/:locale/programs#strategic-partnerships',
    permanent: true,
  },

  // Localized Spanish service redirects
  {
    source: '/servicios',
    destination: '/programas',
    permanent: true,
  },
  {
    source: '/servicios/nivel-1-esenciales',
    destination: '/programas#design-fabrication',
    permanent: true,
  },
  {
    source: '/servicios/nivel-2-avanzado',
    destination: '/programas#design-fabrication',
    permanent: true,
  },
  {
    source: '/servicios/nivel-3-consultoria',
    destination: '/programas#strategy-enablement',
    permanent: true,
  },
  {
    source: '/servicios/nivel-4-plataformas',
    destination: '/programas#platform-pilots',
    permanent: true,
  },
  {
    source: '/servicios/nivel-5-estrategico',
    destination: '/programas#strategic-partnerships',
    permanent: true,
  },

  // Portuguese service redirects
  {
    source: '/servicos',
    destination: '/programas',
    permanent: true,
  },
  {
    source: '/servicos/nivel-1-essenciais',
    destination: '/programas#design-fabrication',
    permanent: true,
  },
  {
    source: '/servicos/nivel-2-avancado',
    destination: '/programas#design-fabrication',
    permanent: true,
  },
  {
    source: '/servicos/nivel-3-consultoria',
    destination: '/programas#strategy-enablement',
    permanent: true,
  },
  {
    source: '/servicos/nivel-4-plataformas',
    destination: '/programas#platform-pilots',
    permanent: true,
  },
  {
    source: '/servicos/nivel-5-estrategico',
    destination: '/programas#strategic-partnerships',
    permanent: true,
  },
];

/**
 * Corporate structure navigation mapping
 * Maps URLs to corporate structure
 */
export const corporateMapping = {
  // Program mapping
  DESIGN_FABRICATION: {
    program: 'design-fabrication',
    arm: 'madfam',
    provider: 'MADFAM',
  },
  STRATEGY_ENABLEMENT: {
    program: 'strategy-enablement',
    arm: 'madfam',
    provider: 'MADFAM',
  },
  PLATFORM_PILOTS: {
    program: 'platform-pilots',
    arm: 'madfam',
    provider: 'MADFAM',
  },
  STRATEGIC_PARTNERSHIPS: {
    program: 'strategic-partnerships',
    arm: 'madfam',
    provider: 'MADFAM',
  },
};

/**
 * Product ownership mapping
 * Defines which ARM owns which product
 */
export const productOwnership = {
  'forge-sight': {
    arm: 'madfam',
    badge: 'por MADFAM',
    url: 'https://www.forgesight.quest',
  },
  dhanam: {
    arm: 'madfam',
    badge: 'por MADFAM',
    url: 'https://www.dhan.am',
  },
  avala: {
    arm: 'madfam',
    badge: 'by MADFAM',
    url: '#',
  },
};
