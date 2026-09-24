// ─── Platform Presentation Overlay (HAND-KEPT) ───────────────────────────────
// The site-local half of the platform catalog.
//
// Everything a product IS — its name, icon, category, layer, track, status,
// public URL, GitHub URL and licence — comes from the ecosystem registry and
// lands in platforms.generated.ts. Nothing in this file may restate any of it:
// a fact typed here would be a sixth hand-maintained product list, which is the
// exact failure the 2026-09-04 coherence audit found.
//
// What lives here is what the registry must NOT own, because it is a decision
// of this website rather than a fact about the product: the accent palette, how
// many features the copy deck writes up, whether a dedicated detail page has
// been built, which relationships the ecosystem diagram draws, and the SHAPE of
// the two CTAs. CTA *targets* still come from the registry — `urlFrom` names
// which registry URL to use, so no product URL is ever hand-typed here.
//
// This overlay is also the site's surfacing decision. A registry product only
// renders once it has marketing copy in the `platforms` i18n namespace and an
// accent palette here; inventing either would be a marketing act, not a
// generation step. The reverse direction is enforced in CI: every slug below
// must exist in the registry and must not be retired
// (scripts/__tests__/platform-registry.test.mjs).

/** A relationship the ecosystem diagram draws between two platforms. */
export interface EcosystemConnection {
  slug: string;
  /** i18n key within the `platforms` namespace describing the relationship. */
  relationKey: string;
}

/** Which registry URL a CTA points at. Absent → the CTA carries no URL. */
export type CTAUrlSource = 'external' | 'github';

export interface PresentationCTA {
  type: 'external' | 'contact' | 'waitlist';
  /** i18n key within the `platforms` namespace. */
  labelKey: string;
  urlFrom?: CTAUrlSource;
}

export interface PlatformPresentation {
  accentColor: {
    gradient: string; // Tailwind gradient classes
    border: string; // Tailwind border classes
    text: string; // Tailwind text classes
    bg: string; // Tailwind background classes
  };
  primaryCTA: PresentationCTA;
  secondaryCTA: PresentationCTA;
  ecosystemConnections: EcosystemConnection[];
  featureCount: number;
  hasComparison: boolean;
  hasTechSpecs: boolean;
  /** True when a dedicated platform detail page exists at /platforms/[slug]. */
  hasDetailPage: boolean;
}

/**
 * Keyed by the registry's site slug. Order is NOT meaningful here — the catalog
 * is ordered by the registry's own `order` field.
 */
export const PLATFORM_PRESENTATION: Record<string, PlatformPresentation> = {
  enclii: {
    accentColor: {
      gradient: 'from-blue-500/20 to-blue-600/10',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'enclii.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'external',
      labelKey: 'enclii.cta.secondary',
      urlFrom: 'github',
    },
    ecosystemConnections: [
      { slug: 'janua', relationKey: 'enclii.connections.janua' },
      { slug: 'pravara-mes', relationKey: 'enclii.connections.pravara' },
    ],
    featureCount: 6,
    hasComparison: true,
    hasTechSpecs: true,
    hasDetailPage: true,
  },
  janua: {
    accentColor: {
      gradient: 'from-indigo-500/20 to-indigo-600/10',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'janua.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'external',
      labelKey: 'janua.cta.secondary',
      urlFrom: 'github',
    },
    ecosystemConnections: [
      { slug: 'enclii', relationKey: 'janua.connections.enclii' },
      { slug: 'dhanam', relationKey: 'janua.connections.dhanam' },
    ],
    featureCount: 6,
    hasComparison: true,
    hasTechSpecs: true,
    hasDetailPage: true,
  },
  selva: {
    accentColor: {
      gradient: 'from-green-500/20 to-green-600/10',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'selva.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'selva.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'enclii', relationKey: 'selva.connections.enclii' },
      { slug: 'janua', relationKey: 'selva.connections.janua' },
    ],
    featureCount: 5,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  'forge-sight': {
    accentColor: {
      gradient: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'forgeSight.cta.primary',
      urlFrom: 'external',
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
    hasDetailPage: true,
  },
  dhanam: {
    accentColor: {
      gradient: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'dhanam.cta.primary',
      urlFrom: 'external',
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
    hasDetailPage: true,
  },
  fortuna: {
    accentColor: {
      gradient: 'from-violet-500/20 to-violet-600/10',
      border: 'border-violet-200 dark:border-violet-800',
      text: 'text-violet-600 dark:text-violet-400',
      bg: 'bg-violet-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'fortuna.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'fortuna.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'selva', relationKey: 'fortuna.connections.selva' },
      { slug: 'dhanam', relationKey: 'fortuna.connections.dhanam' },
    ],
    featureCount: 5,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  rondelio: {
    accentColor: {
      gradient: 'from-fuchsia-500/20 to-fuchsia-600/10',
      border: 'border-fuchsia-200 dark:border-fuchsia-800',
      text: 'text-fuchsia-600 dark:text-fuchsia-400',
      bg: 'bg-fuchsia-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'rondelio.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'rondelio.cta.secondary',
    },
    ecosystemConnections: [{ slug: 'fortuna', relationKey: 'rondelio.connections.fortuna' }],
    featureCount: 5,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  karafiel: {
    accentColor: {
      gradient: 'from-red-500/20 to-red-600/10',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'karafiel.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'karafiel.cta.secondary',
    },
    ecosystemConnections: [
      { slug: 'tezca', relationKey: 'karafiel.connections.tezca' },
      { slug: 'dhanam', relationKey: 'karafiel.connections.dhanam' },
    ],
    featureCount: 5,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  tezca: {
    accentColor: {
      gradient: 'from-rose-500/20 to-rose-600/10',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'tezca.cta.primary',
      urlFrom: 'external',
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
    hasDetailPage: true,
  },
  avala: {
    accentColor: {
      gradient: 'from-teal-500/20 to-teal-600/10',
      border: 'border-teal-200 dark:border-teal-800',
      text: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'avala.cta.primary',
      urlFrom: 'external',
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
    hasDetailPage: true,
  },
  yantra4d: {
    accentColor: {
      gradient: 'from-purple-500/20 to-purple-600/10',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'yantra4d.cta.primary',
      urlFrom: 'external',
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
    hasDetailPage: true,
  },
  'cotiza-studio': {
    accentColor: {
      gradient: 'from-cyan-500/20 to-cyan-600/10',
      border: 'border-cyan-200 dark:border-cyan-800',
      text: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'cotizaStudio.cta.primary',
      urlFrom: 'external',
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
    hasDetailPage: true,
  },
  'pravara-mes': {
    accentColor: {
      gradient: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'pravaraMes.cta.primary',
      urlFrom: 'external',
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
    hasDetailPage: true,
  },
  voxa: {
    accentColor: {
      gradient: 'from-sky-500/20 to-sky-600/10',
      border: 'border-sky-200 dark:border-sky-800',
      text: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'voxa.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'voxa.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 4,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  // R32 (coherence audit 2026-09-23): every customer-facing registry product
  // whose lifecycle is live, beta or degraded is in the catalog. Incubating
  // products stay out until they carry "coming soon" copy. Copy for these
  // entries lives in the `platforms` namespace under the registry slug.
  'phynd-crm': {
    accentColor: {
      gradient: 'from-rose-500/20 to-rose-600/10',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'phynd-crm.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'phynd-crm.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 4,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  ceq: {
    accentColor: {
      gradient: 'from-fuchsia-500/20 to-fuchsia-600/10',
      border: 'border-fuchsia-200 dark:border-fuchsia-800',
      text: 'text-fuchsia-600 dark:text-fuchsia-400',
      bg: 'bg-fuchsia-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'ceq.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'ceq.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 3,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  acervo: {
    accentColor: {
      gradient: 'from-stone-500/20 to-stone-600/10',
      border: 'border-stone-200 dark:border-stone-800',
      text: 'text-stone-600 dark:text-stone-400',
      bg: 'bg-stone-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'acervo.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'acervo.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 4,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  kalya: {
    accentColor: {
      gradient: 'from-teal-500/20 to-teal-600/10',
      border: 'border-teal-200 dark:border-teal-800',
      text: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'kalya.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'kalya.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 3,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  symbiosis: {
    accentColor: {
      gradient: 'from-lime-500/20 to-lime-600/10',
      border: 'border-lime-200 dark:border-lime-800',
      text: 'text-lime-600 dark:text-lime-400',
      bg: 'bg-lime-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'symbiosis.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'symbiosis.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 4,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  nauta: {
    accentColor: {
      gradient: 'from-indigo-500/20 to-indigo-600/10',
      border: 'border-indigo-200 dark:border-indigo-800',
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'nauta.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'nauta.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 3,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  meridian: {
    accentColor: {
      gradient: 'from-cyan-500/20 to-cyan-600/10',
      border: 'border-cyan-200 dark:border-cyan-800',
      text: 'text-cyan-600 dark:text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'meridian.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'meridian.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 4,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  'fashion-cabinet': {
    accentColor: {
      gradient: 'from-pink-500/20 to-pink-600/10',
      border: 'border-pink-200 dark:border-pink-800',
      text: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'fashion-cabinet.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'fashion-cabinet.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 4,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  factlas: {
    accentColor: {
      gradient: 'from-emerald-500/20 to-emerald-600/10',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'factlas.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'factlas.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 3,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  routecraft: {
    accentColor: {
      gradient: 'from-orange-500/20 to-orange-600/10',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'routecraft.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'routecraft.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 3,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
  tlacuilo: {
    accentColor: {
      gradient: 'from-amber-500/20 to-amber-600/10',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    primaryCTA: {
      type: 'external',
      labelKey: 'tlacuilo.cta.primary',
      urlFrom: 'external',
    },
    secondaryCTA: {
      type: 'contact',
      labelKey: 'tlacuilo.cta.secondary',
    },
    ecosystemConnections: [],
    featureCount: 3,
    hasComparison: false,
    hasTechSpecs: false,
    hasDetailPage: false,
  },
};
