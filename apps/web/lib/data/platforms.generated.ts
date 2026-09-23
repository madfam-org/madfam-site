// ─── GENERATED FILE — DO NOT EDIT ────────────────────────────────────────────
// Regenerate with: node scripts/generate-platform-registry.mjs --apply
//
// Every fact below comes from apps/web/lib/data/projection.public.json, the
// public-safe projection of the MADFAM product registry. Hand-editing either
// this file or the vendored projection turns `pnpm test:scripts` red — see
// scripts/__tests__/platform-registry.test.mjs.
//
// Site-local presentation (accent colours, feature counts, detail pages,
// ecosystem relationships, CTA shape) is NOT here: it is hand-kept in
// platforms.presentation.ts and merged at import time by platforms.ts.

/** Ecosystem layer a product sits in. Derived from the registry's site category. */
export type PlatformLayer = 'infrastructure' | 'intelligence' | 'standards' | 'applications';

/** Public status. Derived from the registry's `lifecycle`; `retired` never renders. */
export type PlatformStatus = 'production' | 'production-beta' | 'coming-soon' | 'in-development';

/** How a product is sold/consumed. Carried verbatim from the registry. */
export type EngagementTrack = 'self-serve' | 'platform' | 'ecosystem';

/** Registry lifecycle, carried through so guards can reason about it. */
export type RegistryLifecycle = 'incubating' | 'beta' | 'live' | 'degraded';

export interface RegistryProduct {
  /** Slug this site uses in URLs and i18n keys (the registry's `site_slug`). */
  slug: string;
  /** Slug the registry itself uses, when it differs from the site's. */
  registrySlug: string;
  name: string;
  icon: string;
  category: string;
  layer: PlatformLayer;
  track: EngagementTrack;
  status: PlatformStatus;
  lifecycle: RegistryLifecycle;
  license: string;
  dataLicense?: string;
  /** The product's public front door. Never an operational endpoint. */
  externalUrl?: string;
  /** Present only when the registry says the repository is public. */
  githubUrl?: string;
  /** Registry-owned catalog order. */
  order: number;
  /** Tier vocabulary and prices. Absent when the registry sells no tiers. */
  commerce?: RegistryCommerce;
}

/**
 * What a tier costs, as the registry states it.
 *
 * `pending` is not "unknown" and it is certainly not `TBD` — it is the
 * registry saying, on the record, that no list price is ratified for this tier
 * yet. Surfaces render the pending wording from the `valueLadder` i18n
 * namespace; they never render a number, an approximation or a placeholder.
 */
export type TierPricing =
  { state: 'listed'; amount: number; currency: string; unit: string } | { state: 'pending' };

export interface RegistryTier {
  /** The registry's tier id. */
  id: string;
  /** The registry's label for the tier, falling back to the tier id. */
  label: string;
  pricing: TierPricing;
}

export interface RegistryCommerce {
  /** Tier vocabulary, in the registry's own order. */
  tiers: RegistryTier[];
  /** Present only when the registry declares a checkout slug for the product. */
  checkoutSlug?: string;
}

export interface RetiredProduct {
  slug: string;
  name: string;
  retiredOn: string;
  successorSlug?: string;
  redirectTo?: string;
}

/** Every customer-facing product the registry knows, keyed by site slug. */
export const REGISTRY_PRODUCTS: Record<string, RegistryProduct> = {
  enclii: {
    slug: 'enclii',
    registrySlug: 'enclii',
    name: 'Enclii',
    icon: '☁️',
    category: 'Infrastructure',
    layer: 'infrastructure',
    track: 'platform',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 1,
    externalUrl: 'https://enclii.dev',
    githubUrl: 'https://github.com/madfam-org/enclii',
    commerce: {
      tiers: [
        {
          id: 'community',
          label: 'community',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  janua: {
    slug: 'janua',
    registrySlug: 'janua',
    name: 'Janua',
    icon: '🔐',
    category: 'Infrastructure',
    layer: 'infrastructure',
    track: 'platform',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 2,
    externalUrl: 'https://janua.dev',
    githubUrl: 'https://github.com/madfam-org/janua',
    commerce: {
      tiers: [
        {
          id: 'community',
          label: 'community',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'enterprise',
          label: 'enterprise',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  selva: {
    slug: 'selva',
    registrySlug: 'selva',
    name: 'Selva',
    icon: '🌳',
    category: 'Infrastructure',
    layer: 'infrastructure',
    track: 'platform',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 3,
    externalUrl: 'https://selva.town',
    githubUrl: 'https://github.com/madfam-org/selva-office',
    commerce: {
      tiers: [
        {
          id: 'maker',
          label: 'maker',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'studio',
          label: 'studio',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'enterprise',
          label: 'enterprise',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'selva',
    },
  },
  'forge-sight': {
    slug: 'forge-sight',
    registrySlug: 'forgesight',
    name: 'Forgesight',
    icon: '🏭',
    category: 'Intelligence',
    layer: 'intelligence',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 4,
    externalUrl: 'https://forgesight.quest',
    dataLicense: 'DATA_LICENSE',
    commerce: {
      tiers: [
        {
          id: 'essentials',
          label: 'essentials',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'forgesight',
    },
  },
  dhanam: {
    slug: 'dhanam',
    registrySlug: 'dhanam',
    name: 'Dhanam',
    icon: '💰',
    category: 'Intelligence',
    layer: 'intelligence',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 5,
    externalUrl: 'https://dhan.am',
    commerce: {
      tiers: [
        {
          id: 'community',
          label: 'community',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'essentials',
          label: 'essentials',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'dhanam',
    },
  },
  fortuna: {
    slug: 'fortuna',
    registrySlug: 'fortuna',
    name: 'Fortuna',
    icon: '🔮',
    category: 'Intelligence',
    layer: 'intelligence',
    track: 'self-serve',
    status: 'production-beta',
    lifecycle: 'degraded',
    license: 'Proprietary',
    order: 6,
    externalUrl: 'https://fortuna.tube',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'free',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  rondelio: {
    slug: 'rondelio',
    registrySlug: 'rondelio',
    name: 'Rondelio',
    icon: '🎲',
    category: 'Intelligence',
    layer: 'intelligence',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'Proprietary',
    order: 7,
    externalUrl: 'https://rondel.io',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'free',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  karafiel: {
    slug: 'karafiel',
    registrySlug: 'karafiel',
    name: 'Karafiel',
    icon: '📜',
    category: 'Standards',
    layer: 'standards',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 8,
    externalUrl: 'https://karafiel.mx',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'free',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'contador',
          label: 'contador',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'despacho',
          label: 'despacho',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'firma',
          label: 'firma',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'karafiel',
    },
  },
  tezca: {
    slug: 'tezca',
    registrySlug: 'tezca',
    name: 'Tezca',
    icon: '⚖️',
    category: 'Standards',
    layer: 'standards',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 9,
    externalUrl: 'https://tezca.mx',
    githubUrl: 'https://github.com/madfam-org/tezca',
    commerce: {
      tiers: [
        {
          id: 'community',
          label: 'community',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'essentials',
          label: 'essentials',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'institutional',
          label: 'institutional',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'tezca',
    },
  },
  avala: {
    slug: 'avala',
    registrySlug: 'avala',
    name: 'Avala',
    icon: '🎓',
    category: 'Standards',
    layer: 'standards',
    track: 'ecosystem',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 10,
    externalUrl: 'https://avala.studio',
    commerce: {
      tiers: [
        {
          id: 'institution',
          label: 'institution',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'issuer',
          label: 'issuer',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'enterprise',
          label: 'enterprise',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  yantra4d: {
    slug: 'yantra4d',
    registrySlug: 'yantra4d',
    name: 'Yantra4D',
    icon: '📐',
    category: 'Applications',
    layer: 'applications',
    track: 'ecosystem',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 11,
    externalUrl: 'https://yantra4d.com',
    githubUrl: 'https://github.com/madfam-org/yantra4d',
    commerce: {
      tiers: [
        {
          id: 'guest',
          label: 'guest',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'essentials',
          label: 'essentials',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'yantra4d',
    },
  },
  'cotiza-studio': {
    slug: 'cotiza-studio',
    registrySlug: 'cotiza',
    name: 'Cotiza',
    icon: '📊',
    category: 'Applications',
    layer: 'applications',
    track: 'ecosystem',
    status: 'production',
    lifecycle: 'live',
    license: 'Proprietary',
    order: 12,
    externalUrl: 'https://cotiza.studio',
    githubUrl: 'https://github.com/madfam-org/digifab-quoting',
    commerce: {
      tiers: [
        {
          id: 'maker',
          label: 'maker',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'creator-pro',
          label: 'creator-pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'business',
          label: 'business',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'enterprise',
          label: 'enterprise',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'cotiza',
    },
  },
  'pravara-mes': {
    slug: 'pravara-mes',
    registrySlug: 'pravara-mes',
    name: 'Pravara MES',
    icon: '⚙️',
    category: 'Applications',
    layer: 'applications',
    track: 'ecosystem',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 13,
    externalUrl: 'https://mes.madfam.io',
    githubUrl: 'https://github.com/madfam-org/pravara-mes',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'free',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  voxa: {
    slug: 'voxa',
    registrySlug: 'voxa',
    name: 'Voxa',
    icon: '🗣️',
    category: 'Applications',
    layer: 'applications',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'Apache-2.0',
    order: 14,
    externalUrl: 'https://voxa.madfam.io',
    githubUrl: 'https://github.com/madfam-org/voxa',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'free',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'family',
          label: 'family',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'clinic',
          label: 'clinic',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'voxa',
    },
  },
  'phynd-crm': {
    slug: 'phynd-crm',
    registrySlug: 'phynd-crm',
    name: 'PhyndCRM',
    icon: '🤝',
    category: 'Applications',
    layer: 'applications',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 15,
    externalUrl: 'https://phynd.app',
    githubUrl: 'https://github.com/madfam-org/phynd-crm',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'free',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  ceq: {
    slug: 'ceq',
    registrySlug: 'ceq',
    name: 'CEQ',
    icon: '🎨',
    category: 'Applications',
    layer: 'applications',
    track: 'self-serve',
    status: 'production-beta',
    lifecycle: 'degraded',
    license: 'AGPL-3.0',
    order: 16,
    externalUrl: 'https://ceq.lol',
    githubUrl: 'https://github.com/madfam-org/ceq',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'free',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'madfam',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  acervo: {
    slug: 'acervo',
    registrySlug: 'acervo',
    name: 'Acervo',
    icon: '📚',
    category: 'Applications',
    layer: 'applications',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'UNLICENSED',
    order: 17,
    externalUrl: 'https://acervo.madfam.io',
    commerce: {
      tiers: [],
    },
  },
  kalya: {
    slug: 'kalya',
    registrySlug: 'kalya',
    name: 'Kalya',
    icon: '📅',
    category: 'Applications',
    layer: 'applications',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'UNLICENSED',
    order: 18,
    externalUrl: 'https://kalya.app',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'Gratis',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'solo',
          label: 'Solo',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'team',
          label: 'Equipo',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'biz',
          label: 'Negocio',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'kalya',
    },
  },
  symbiosis: {
    slug: 'symbiosis',
    registrySlug: 'symbiosis',
    name: 'Symbiosis HCM',
    icon: '🧬',
    category: 'Applications',
    layer: 'applications',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 19,
    externalUrl: 'https://hcm.madfam.io',
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'Gratis',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'team',
          label: 'Equipo',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'biz',
          label: 'Negocio',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'symbiosis',
    },
  },
  'crea-map': {
    slug: 'crea-map',
    registrySlug: 'crea-map',
    name: 'MAP — Modelo de Acompañamiento Personalizado',
    icon: '🗺️',
    category: 'Applications',
    layer: 'applications',
    track: 'ecosystem',
    status: 'production',
    lifecycle: 'live',
    license: 'UNLICENSED',
    order: 20,
    externalUrl: 'https://crea-map.madfam.io',
    commerce: {
      tiers: [
        {
          id: 'membership',
          label: 'Acceso de equipo',
          pricing: {
            state: 'pending',
          },
        },
      ],
      checkoutSlug: 'crea-map',
    },
  },
  nauta: {
    slug: 'nauta',
    registrySlug: 'nauta',
    name: 'Nauta',
    icon: '🧭',
    category: 'Applications',
    layer: 'applications',
    track: 'platform',
    status: 'production',
    lifecycle: 'live',
    license: 'UNLICENSED',
    order: 21,
    externalUrl: 'https://app.nauta.quest',
    commerce: {
      tiers: [
        {
          id: 'erp',
          label: 'ERP',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'vcto',
          label: 'vCTO',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  meridian: {
    slug: 'meridian',
    registrySlug: 'meridian',
    name: 'Meridian',
    icon: '🛂',
    category: 'Standards',
    layer: 'standards',
    track: 'ecosystem',
    status: 'production-beta',
    lifecycle: 'degraded',
    license: 'AGPL-3.0',
    order: 22,
    externalUrl: 'https://meridian.madfam.io',
    githubUrl: 'https://github.com/madfam-org/meridian',
    commerce: {
      tiers: [],
    },
  },
  'fashion-cabinet': {
    slug: 'fashion-cabinet',
    registrySlug: 'fashion-cabinet',
    name: 'Fashion Cabinet',
    icon: '👗',
    category: 'Applications',
    layer: 'applications',
    track: 'ecosystem',
    status: 'production',
    lifecycle: 'live',
    license: 'AGPL-3.0',
    order: 23,
    externalUrl: 'https://fashioncabi.net',
    commerce: {
      tiers: [],
    },
  },
  factlas: {
    slug: 'factlas',
    registrySlug: 'factlas',
    name: 'Factlas',
    icon: '🌎',
    category: 'Intelligence',
    layer: 'intelligence',
    track: 'ecosystem',
    status: 'production',
    lifecycle: 'live',
    license: 'Proprietary',
    order: 24,
    externalUrl: 'https://factl.as',
    commerce: {
      tiers: [
        {
          id: 'pilot',
          label: 'pilot',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'analyst',
          label: 'analyst',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'institutional',
          label: 'institutional',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  periplo: {
    slug: 'periplo',
    registrySlug: 'periplo',
    name: 'Periplo',
    icon: '📍',
    category: 'Applications',
    layer: 'applications',
    track: 'self-serve',
    status: 'coming-soon',
    lifecycle: 'incubating',
    license: 'UNLICENSED',
    order: 25,
    commerce: {
      tiers: [
        {
          id: 'free',
          label: 'free',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'essentials',
          label: 'essentials',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'pro',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  'geom-core': {
    slug: 'geom-core',
    registrySlug: 'geom-core',
    name: 'geom-core',
    icon: '🧮',
    category: 'Standards',
    layer: 'standards',
    track: 'ecosystem',
    status: 'coming-soon',
    lifecycle: 'incubating',
    license: 'Apache-2.0',
    order: 26,
    githubUrl: 'https://github.com/madfam-org/geom-core',
    commerce: {
      tiers: [],
    },
  },
  fragua: {
    slug: 'fragua',
    registrySlug: 'fragua',
    name: 'Fragua',
    icon: '⚒️',
    category: 'Infrastructure',
    layer: 'infrastructure',
    track: 'platform',
    status: 'coming-soon',
    lifecycle: 'incubating',
    license: 'AGPL-3.0',
    order: 27,
    githubUrl: 'https://github.com/madfam-org/enclii',
    commerce: {
      tiers: [
        {
          id: 'arranque',
          label: 'Arranque',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'equipo',
          label: 'Equipo',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'escala',
          label: 'Escala',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'dedicada',
          label: 'Dedicada',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  enclii_depot: {
    slug: 'enclii_depot',
    registrySlug: 'enclii_depot',
    name: 'Enclii Depot',
    icon: '🗄️',
    category: 'Infrastructure',
    layer: 'infrastructure',
    track: 'platform',
    status: 'coming-soon',
    lifecycle: 'incubating',
    license: 'AGPL-3.0',
    order: 28,
    githubUrl: 'https://github.com/madfam-org/enclii',
    commerce: {
      tiers: [
        {
          id: 'community',
          label: 'Comunidad',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'pro',
          label: 'Estándar',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'premium',
          label: 'Alta disponibilidad',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'madfam',
          label: 'Dedicado',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
  routecraft: {
    slug: 'routecraft',
    registrySlug: 'routecraft',
    name: 'RouteCraft',
    icon: '🗺️',
    category: 'Applications',
    layer: 'applications',
    track: 'self-serve',
    status: 'production',
    lifecycle: 'live',
    license: 'Proprietary',
    order: 30,
    externalUrl: 'https://routecraft.app',
    commerce: {
      tiers: [
        {
          id: 'discovery',
          label: 'Discovery',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'professional',
          label: 'Professional',
          pricing: {
            state: 'pending',
          },
        },
        {
          id: 'enterprise',
          label: 'Enterprise',
          pricing: {
            state: 'pending',
          },
        },
      ],
    },
  },
};

/** Catalog order, as the registry declares it. */
export const REGISTRY_PRODUCT_ORDER: string[] = [
  'enclii',
  'janua',
  'selva',
  'forge-sight',
  'dhanam',
  'fortuna',
  'rondelio',
  'karafiel',
  'tezca',
  'avala',
  'yantra4d',
  'cotiza-studio',
  'pravara-mes',
  'voxa',
  'phynd-crm',
  'ceq',
  'acervo',
  'kalya',
  'symbiosis',
  'crea-map',
  'nauta',
  'meridian',
  'fashion-cabinet',
  'factlas',
  'periplo',
  'geom-core',
  'fragua',
  'enclii_depot',
  'routecraft',
];

/**
 * Tombstones. These brands exist so that a guard can say "this is a KNOWN
 * retired product and must not render" instead of "this is an unknown string" —
 * which is how one of them survived in eleven files.
 */
export const RETIRED_PRODUCTS: RetiredProduct[] = [
  {
    slug: 'penny',
    name: 'PENNY',
    retiredOn: '2026-07-25',
    successorSlug: 'selva',
    redirectTo: 'https://selva.town',
  },
  {
    slug: 'sim4d',
    name: 'Sim4D',
    retiredOn: '2026-08-30',
    successorSlug: 'yantra4d',
    redirectTo: 'https://yantra4d.com',
  },
  {
    slug: 'spark',
    name: 'SPARK',
    retiredOn: '2026-04-08',
  },
];

/**
 * Commerce facts only, keyed by site slug — the single source of tier
 * vocabulary and of every price the site is allowed to publish (ruling R9).
 * A surface that wants a tier label or a price reads it from here; a surface
 * that types one is a bug, and `scripts/__tests__/no-hand-typed-prices.test.mjs`
 * fails on it.
 */
export const REGISTRY_COMMERCE: Record<string, RegistryCommerce> = {
  enclii: {
    tiers: [
      {
        id: 'community',
        label: 'community',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  janua: {
    tiers: [
      {
        id: 'community',
        label: 'community',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'enterprise',
        label: 'enterprise',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  selva: {
    tiers: [
      {
        id: 'maker',
        label: 'maker',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'studio',
        label: 'studio',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'enterprise',
        label: 'enterprise',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'selva',
  },
  'forge-sight': {
    tiers: [
      {
        id: 'essentials',
        label: 'essentials',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'forgesight',
  },
  dhanam: {
    tiers: [
      {
        id: 'community',
        label: 'community',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'essentials',
        label: 'essentials',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'dhanam',
  },
  fortuna: {
    tiers: [
      {
        id: 'free',
        label: 'free',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  rondelio: {
    tiers: [
      {
        id: 'free',
        label: 'free',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  karafiel: {
    tiers: [
      {
        id: 'free',
        label: 'free',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'contador',
        label: 'contador',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'despacho',
        label: 'despacho',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'firma',
        label: 'firma',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'karafiel',
  },
  tezca: {
    tiers: [
      {
        id: 'community',
        label: 'community',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'essentials',
        label: 'essentials',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'institutional',
        label: 'institutional',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'tezca',
  },
  avala: {
    tiers: [
      {
        id: 'institution',
        label: 'institution',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'issuer',
        label: 'issuer',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'enterprise',
        label: 'enterprise',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  yantra4d: {
    tiers: [
      {
        id: 'guest',
        label: 'guest',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'essentials',
        label: 'essentials',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'yantra4d',
  },
  'cotiza-studio': {
    tiers: [
      {
        id: 'maker',
        label: 'maker',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'creator-pro',
        label: 'creator-pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'business',
        label: 'business',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'enterprise',
        label: 'enterprise',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'cotiza',
  },
  'pravara-mes': {
    tiers: [
      {
        id: 'free',
        label: 'free',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  voxa: {
    tiers: [
      {
        id: 'free',
        label: 'free',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'family',
        label: 'family',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'clinic',
        label: 'clinic',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'voxa',
  },
  'phynd-crm': {
    tiers: [
      {
        id: 'free',
        label: 'free',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  ceq: {
    tiers: [
      {
        id: 'free',
        label: 'free',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'madfam',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  acervo: {
    tiers: [],
  },
  kalya: {
    tiers: [
      {
        id: 'free',
        label: 'Gratis',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'solo',
        label: 'Solo',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'team',
        label: 'Equipo',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'biz',
        label: 'Negocio',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'kalya',
  },
  symbiosis: {
    tiers: [
      {
        id: 'free',
        label: 'Gratis',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'team',
        label: 'Equipo',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'biz',
        label: 'Negocio',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'symbiosis',
  },
  'crea-map': {
    tiers: [
      {
        id: 'membership',
        label: 'Acceso de equipo',
        pricing: {
          state: 'pending',
        },
      },
    ],
    checkoutSlug: 'crea-map',
  },
  nauta: {
    tiers: [
      {
        id: 'erp',
        label: 'ERP',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'vcto',
        label: 'vCTO',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  meridian: {
    tiers: [],
  },
  'fashion-cabinet': {
    tiers: [],
  },
  factlas: {
    tiers: [
      {
        id: 'pilot',
        label: 'pilot',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'analyst',
        label: 'analyst',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'institutional',
        label: 'institutional',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  periplo: {
    tiers: [
      {
        id: 'free',
        label: 'free',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'essentials',
        label: 'essentials',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'pro',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  'geom-core': {
    tiers: [],
  },
  fragua: {
    tiers: [
      {
        id: 'arranque',
        label: 'Arranque',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'equipo',
        label: 'Equipo',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'escala',
        label: 'Escala',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'dedicada',
        label: 'Dedicada',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  enclii_depot: {
    tiers: [
      {
        id: 'community',
        label: 'Comunidad',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'pro',
        label: 'Estándar',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'premium',
        label: 'Alta disponibilidad',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'madfam',
        label: 'Dedicado',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
  routecraft: {
    tiers: [
      {
        id: 'discovery',
        label: 'Discovery',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'professional',
        label: 'Professional',
        pricing: {
          state: 'pending',
        },
      },
      {
        id: 'enterprise',
        label: 'Enterprise',
        pricing: {
          state: 'pending',
        },
      },
    ],
  },
};

/**
 * How many tiers the registry currently prices, and how many it does not.
 * `listed` is 0 for as long as the registry ratifies no price, and that is the
 * whole reason the site shows pending wording instead of numbers.
 */
export const REGISTRY_PRICING_STATE = {
  listed: 0,
  pending: 79,
} as const;

/** Provenance of the vendored projection. The hash is the freshness check. */
export const REGISTRY_SOURCE = {
  schema: 'madfam-product-projection/v1',
  registryVersion: 4,
  lastUpdated: '2026-09-05',
  generatedFrom: 'internal-devops/ecosystem/registry/products.yaml',
  sha256: 'b2a80ca57dd6fdf20905771855cc264e6d6362c4d40c1297a04ba3c250951fe1',
  productCount: 29,
  retiredCount: 3,
} as const;
