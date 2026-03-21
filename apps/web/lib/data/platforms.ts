// ─── Platform Data Registry ──────────────────────────────────────────────────
// Single source of truth for all MADFAM platform data.
// Used by: platform detail pages, homepage, products page, navbar, footer, PlatformGrid

export type PlatformLayer = 'infrastructure' | 'intelligence' | 'standards' | 'applications';

export type PlatformStatus =
  | 'production' // 100% — fully live
  | 'production-beta' // 90-99% — live with caveats
  | 'coming-soon' // Alpha / announced
  | 'in-development'; // Not yet announced publicly

export interface PlatformCTA {
  type: 'external' | 'contact' | 'waitlist';
  labelKey: string; // i18n key within platforms namespace
  url?: string;
}

export interface EcosystemConnection {
  slug: string;
  relationKey: string; // i18n key describing the relationship
}

export interface Platform {
  slug: string;
  name: string;
  icon: string;
  layer: PlatformLayer;
  status: PlatformStatus;
  statusPercent?: number;
  externalUrl?: string;
  githubUrl?: string;
  accentColor: {
    gradient: string; // Tailwind gradient classes
    border: string; // Tailwind border classes
    text: string; // Tailwind text classes
    bg: string; // Tailwind background classes
  };
  primaryCTA: PlatformCTA;
  secondaryCTA: PlatformCTA;
  ecosystemConnections: EcosystemConnection[];
  featureCount: number;
  hasComparison: boolean;
  hasTechSpecs: boolean;
  category: string; // Display category for products page grouping
}

// ─── Platform Registry ─────────────────────────────────────────────────────────

export const PLATFORMS: Platform[] = [
  // ── Infrastructure Layer ──────────────────────────────────────────────────
  {
    slug: 'enclii',
    name: 'Enclii',
    icon: '☁️',
    layer: 'infrastructure',
    status: 'production-beta',
    statusPercent: 95,
    externalUrl: 'https://enclii.dev',
    githubUrl: 'https://github.com/madfam-org/enclii',
    accentColor: {
      gradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'enclii.cta.primary',
      url: 'https://enclii.dev',
    },
    secondaryCTA: {
      type: 'external',
      labelKey: 'enclii.cta.secondary',
      url: 'https://github.com/madfam-org/enclii',
    },
    ecosystemConnections: [
      { slug: 'janua', relationKey: 'enclii.connections.janua' },
      { slug: 'pravara-mes', relationKey: 'enclii.connections.pravara' },
    ],
    featureCount: 6,
    hasComparison: true,
    hasTechSpecs: true,
    category: 'Infrastructure',
  },
  {
    slug: 'janua',
    name: 'Janua',
    icon: '🔐',
    layer: 'infrastructure',
    status: 'production',
    statusPercent: 100,
    externalUrl: 'https://janua.dev',
    githubUrl: 'https://github.com/madfam-org/janua',
    accentColor: {
      gradient: 'from-indigo-500/20 to-indigo-600/10',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'janua.cta.primary',
      url: 'https://janua.dev',
    },
    secondaryCTA: {
      type: 'external',
      labelKey: 'janua.cta.secondary',
      url: 'https://github.com/madfam-org/janua',
    },
    ecosystemConnections: [
      { slug: 'enclii', relationKey: 'janua.connections.enclii' },
      { slug: 'dhanam', relationKey: 'janua.connections.dhanam' },
    ],
    featureCount: 6,
    hasComparison: true,
    hasTechSpecs: true,
    category: 'Infrastructure',
  },

  // ── Intelligence Layer ────────────────────────────────────────────────────
  {
    slug: 'forge-sight',
    name: 'Forge Sight',
    icon: '🏭',
    layer: 'intelligence',
    status: 'production-beta',
    statusPercent: 95,
    externalUrl: 'https://forgesight.quest',
    accentColor: {
      gradient: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'forgeSight.cta.primary',
      url: 'https://forgesight.quest',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'forgeSight.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'cotiza-studio', relationKey: 'forgeSight.connections.cotiza' },
      { slug: 'dhanam', relationKey: 'forgeSight.connections.dhanam' },
    ],
    featureCount: 6,
    hasComparison: true,
    hasTechSpecs: true,
    category: 'Intelligence',
  },
  {
    slug: 'dhanam',
    name: 'Dhanam',
    icon: '💰',
    layer: 'intelligence',
    status: 'production',
    statusPercent: 100,
    externalUrl: 'https://dhan.am',
    accentColor: {
      gradient: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'dhanam.cta.primary',
      url: 'https://dhan.am',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'dhanam.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'forge-sight', relationKey: 'dhanam.connections.forgeSight' },
      { slug: 'cotiza-studio', relationKey: 'dhanam.connections.cotiza' },
    ],
    featureCount: 5,
    hasComparison: true,
    hasTechSpecs: false,
    category: 'Intelligence',
  },

  // ── Standards Layer ───────────────────────────────────────────────────────
  {
    slug: 'tezca',
    name: 'Tezca',
    icon: '⚖️',
    layer: 'standards',
    status: 'production-beta',
    statusPercent: 90,
    externalUrl: 'https://tezca.mx',
    accentColor: {
      gradient: 'from-rose-500/20 to-rose-600/10',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'tezca.cta.primary',
      url: 'https://tezca.mx',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'tezca.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'avala', relationKey: 'tezca.connections.avala' },
      { slug: 'pravara-mes', relationKey: 'tezca.connections.pravara' },
    ],
    featureCount: 5,
    hasComparison: false,
    hasTechSpecs: true,
    category: 'Standards',
  },
  {
    slug: 'avala',
    name: 'AVALA',
    icon: '🎓',
    layer: 'standards',
    status: 'coming-soon',
    accentColor: {
      gradient: 'from-teal-500/20 to-teal-600/10',
      border: 'border-teal-200 dark:border-teal-800',
      text: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10',
    },
    primaryCTA: {
      type: 'waitlist',
      labelKey: 'avala.cta.primary',
    },
    secondaryCTA: {
      type: 'external',
      labelKey: 'avala.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'tezca', relationKey: 'avala.connections.tezca' },
      { slug: 'pravara-mes', relationKey: 'avala.connections.pravara' },
    ],
    featureCount: 4,
    hasComparison: false,
    hasTechSpecs: false,
    category: 'Standards',
  },

  // ── Applications Layer ────────────────────────────────────────────────────
  {
    slug: 'yantra4d',
    name: 'Yantra4D',
    icon: '📐',
    layer: 'applications',
    status: 'production',
    statusPercent: 100,
    externalUrl: 'https://4d-app.madfam.io',
    accentColor: {
      gradient: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'yantra4d.cta.primary',
      url: 'https://4d-app.madfam.io',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'yantra4d.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'cotiza-studio', relationKey: 'yantra4d.connections.cotiza' },
      { slug: 'pravara-mes', relationKey: 'yantra4d.connections.pravara' },
    ],
    featureCount: 5,
    hasComparison: false,
    hasTechSpecs: true,
    category: 'Applications',
  },
  {
    slug: 'cotiza-studio',
    name: 'Cotiza Studio',
    icon: '📊',
    layer: 'applications',
    status: 'production',
    statusPercent: 100,
    externalUrl: 'https://cotiza.studio',
    accentColor: {
      gradient: 'from-cyan-500/20 to-cyan-600/10',
      border: 'border-cyan-200 dark:border-cyan-800',
      text: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'cotizaStudio.cta.primary',
      url: 'https://cotiza.studio',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'cotizaStudio.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'forge-sight', relationKey: 'cotizaStudio.connections.forgeSight' },
      { slug: 'yantra4d', relationKey: 'cotizaStudio.connections.yantra4d' },
    ],
    featureCount: 5,
    hasComparison: false,
    hasTechSpecs: false,
    category: 'Applications',
  },
  {
    slug: 'pravara-mes',
    name: 'Pravara-MES',
    icon: '⚙️',
    layer: 'applications',
    status: 'production-beta',
    statusPercent: 97,
    externalUrl: 'https://mes.madfam.io',
    accentColor: {
      gradient: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'pravaraMes.cta.primary',
      url: 'https://mes.madfam.io',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'pravaraMes.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'yantra4d', relationKey: 'pravaraMes.connections.yantra4d' },
      { slug: 'tezca', relationKey: 'pravaraMes.connections.tezca' },
    ],
    featureCount: 6,
    hasComparison: false,
    hasTechSpecs: true,
    category: 'Applications',
  },
  {
    slug: 'penny',
    name: 'PENNY',
    icon: '🤖',
    layer: 'applications',
    status: 'in-development',
    accentColor: {
      gradient: 'from-pink-500/20 to-pink-600/10',
      border: 'border-pink-200 dark:border-pink-800',
      text: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-500/10',
    },
    primaryCTA: {
      type: 'waitlist',
      labelKey: 'penny.cta.primary',
    },
    secondaryCTA: {
      type: 'external',
      labelKey: 'penny.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'dhanam', relationKey: 'penny.connections.dhanam' },
      { slug: 'cotiza-studio', relationKey: 'penny.connections.cotiza' },
    ],
    featureCount: 4,
    hasComparison: false,
    hasTechSpecs: false,
    category: 'Applications',
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getPlatformBySlug(slug: string): Platform | undefined {
  return PLATFORMS.find(p => p.slug === slug);
}

export function getPlatformsByLayer(layer: PlatformLayer): Platform[] {
  return PLATFORMS.filter(p => p.layer === layer);
}

export function getProductionPlatforms(): Platform[] {
  return PLATFORMS.filter(p => p.status === 'production' || p.status === 'production-beta');
}

export function getComingSoonPlatforms(): Platform[] {
  return PLATFORMS.filter(p => p.status === 'coming-soon' || p.status === 'in-development');
}

export function getAllPlatformSlugs(): string[] {
  return PLATFORMS.map(p => p.slug);
}

export function isComingSoon(platform: Platform): boolean {
  return platform.status === 'coming-soon' || platform.status === 'in-development';
}

// Layer display metadata (i18n keys)
export const LAYERS: { key: PlatformLayer; icon: string; labelKey: string }[] = [
  { key: 'infrastructure', icon: '🌱', labelKey: 'shared.layers.infrastructure' },
  { key: 'intelligence', icon: '🌿', labelKey: 'shared.layers.intelligence' },
  { key: 'standards', icon: '🌳', labelKey: 'shared.layers.standards' },
  { key: 'applications', icon: '🍃', labelKey: 'shared.layers.applications' },
];

// Integration flow order (for the pipeline diagram)
export const INTEGRATION_FLOW: { slug: string; stepKey: string }[] = [
  { slug: 'yantra4d', stepKey: 'shared.flow.design' },
  { slug: 'cotiza-studio', stepKey: 'shared.flow.quote' },
  { slug: 'forge-sight', stepKey: 'shared.flow.price' },
  { slug: 'dhanam', stepKey: 'shared.flow.finance' },
  { slug: 'pravara-mes', stepKey: 'shared.flow.manufacture' },
  { slug: 'tezca', stepKey: 'shared.flow.comply' },
];
