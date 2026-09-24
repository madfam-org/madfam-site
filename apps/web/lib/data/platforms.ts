// ─── Platform Data Registry ──────────────────────────────────────────────────
// The public platform catalog, assembled at import time from two halves:
//
//   platforms.generated.ts    — GENERATED from the vendored ecosystem registry
//                               projection. Every product FACT: name, icon,
//                               category, layer, track, status, product URL,
//                               GitHub URL, licence, catalog order.
//   platforms.presentation.ts — HAND-KEPT. Only what this website decides:
//                               accent palette, feature count, detail-page
//                               existence, ecosystem relationships, CTA shape.
//
// The merged `Platform` shape below is unchanged from when this file held the
// catalog by hand, so every consumer (value ladder, footer, navbar, platform
// pages, PlatformGrid, sitemap) is untouched.
//
// A product renders here only if the registry knows it AND the overlay dresses
// it. Neither half can add a product on its own, and a retired product cannot
// be added by either — see scripts/__tests__/platform-registry.test.mjs.
//
// Used by: platform detail pages, homepage, products page, navbar, footer,
// PlatformGrid, search index, sitemap.

import {
  REGISTRY_COMMERCE,
  REGISTRY_PRODUCTS,
  REGISTRY_PRODUCT_ORDER,
  RETIRED_PRODUCTS,
  type EngagementTrack,
  type PlatformLayer,
  type PlatformStatus,
  type RegistryProduct,
  type RetiredProduct,
} from './platforms.generated';
import {
  PLATFORM_PRESENTATION,
  type EcosystemConnection,
  type PlatformPresentation,
  type PresentationCTA,
} from './platforms.presentation';

/**
 * Re-exported so that consumers keep importing the whole catalog vocabulary
 * from `@/lib/data/platforms`, as they did when this file owned it.
 *
 * `PlatformLayer` is the registry's site category (Infrastructure /
 * Intelligence / Standards / Applications), lower-cased.
 *
 * `PlatformStatus` is derived from the registry's `lifecycle`:
 *   live        → 'production'        fully live
 *   beta        → 'production-beta'   live with caveats
 *   degraded    → 'production-beta'   live, with a known impairment
 *   incubating  → 'coming-soon'       announced, not yet public
 *   retired     → never rendered at all
 * The site no longer carries a hand-set completion percentage: the registry
 * records a lifecycle and a probe date, not a number, and a published number
 * that no source owns is a number nobody can check.
 *
 * `EngagementTrack` drives self-serve vs white-glove CTA paths:
 *   self-serve : public sign-up, pricing page, free tier or trial.
 *   platform   : foundational service consumed by the rest of the ecosystem,
 *                also sold to enterprises (white-glove default).
 *   ecosystem  : building block consumed primarily by other MADFAM platforms;
 *                public detail page exists, but engagement is contact-led.
 */
export type {
  EcosystemConnection,
  EngagementTrack,
  PlatformLayer,
  PlatformPresentation,
  PlatformStatus,
  RegistryProduct,
  RetiredProduct,
};

export interface PlatformCTA {
  type: 'external' | 'contact' | 'waitlist';
  labelKey: string; // i18n key within platforms namespace
  url?: string;
}

export interface Platform {
  slug: string;
  name: string;
  icon: string;
  layer: PlatformLayer;
  status: PlatformStatus;
  externalUrl?: string;
  githubUrl?: string;
  /** Track that determines how this platform is sold/consumed. */
  track: EngagementTrack;
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
  /** True when a dedicated platform detail page exists at /platforms/[slug]. */
  hasDetailPage: boolean;
  category: string; // Display category for products page grouping
  /** SPDX identifier, from the registry. */
  license: string;
  /** Separate data licence, where the product ships one (Forgesight). */
  dataLicense?: string;
}

// ─── The merge ───────────────────────────────────────────────────────────────

function resolveCTA(cta: PresentationCTA, product: RegistryProduct): PlatformCTA {
  const url =
    cta.urlFrom === 'github'
      ? product.githubUrl
      : cta.urlFrom === 'external'
        ? product.externalUrl
        : undefined;

  return url
    ? { type: cta.type, labelKey: cta.labelKey, url }
    : { type: cta.type, labelKey: cta.labelKey };
}

function mergePlatform(product: RegistryProduct, presentation: PlatformPresentation): Platform {
  return {
    slug: product.slug,
    name: product.name,
    icon: product.icon,
    layer: product.layer,
    status: product.status,
    ...(product.externalUrl ? { externalUrl: product.externalUrl } : {}),
    ...(product.githubUrl ? { githubUrl: product.githubUrl } : {}),
    track: product.track,
    accentColor: presentation.accentColor,
    primaryCTA: resolveCTA(presentation.primaryCTA, product),
    secondaryCTA: resolveCTA(presentation.secondaryCTA, product),
    ecosystemConnections: presentation.ecosystemConnections,
    featureCount: presentation.featureCount,
    hasComparison: presentation.hasComparison,
    hasTechSpecs: presentation.hasTechSpecs,
    hasDetailPage: presentation.hasDetailPage,
    category: product.category,
    license: product.license,
    ...(product.dataLicense ? { dataLicense: product.dataLicense } : {}),
  };
}

/**
 * The public catalog, in the registry's own order. A registry product with no
 * presentation overlay is simply not surfaced yet; an overlay entry with no
 * registry product cannot exist, because CI fails first.
 */
export const PLATFORMS: Platform[] = REGISTRY_PRODUCT_ORDER.map(slug => {
  const product = REGISTRY_PRODUCTS[slug];
  const presentation = PLATFORM_PRESENTATION[slug];
  return product && presentation ? mergePlatform(product, presentation) : null;
}).filter((platform): platform is Platform => platform !== null);

/** Slugs the registry has retired. Nothing here may ever render. */
export const RETIRED_PLATFORM_SLUGS: string[] = RETIRED_PRODUCTS.map(product => product.slug);

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

/**
 * Returns slugs for which a /platforms/[slug] detail page is built. Used by
 * generateStaticParams so that adding registry entries that don't (yet) have
 * a dedicated detail page does not 404 the new platform on the products list.
 */
export function getPlatformsWithDetailPages(): Platform[] {
  return PLATFORMS.filter(p => p.hasDetailPage);
}

export function getPlatformsByTrack(track: EngagementTrack): Platform[] {
  return PLATFORMS.filter(p => p.track === track);
}

/**
 * Self-serve flagships: production-ready, public sign-up, sit on top of an
 * obvious product domain. These are the headline self-serve stories featured
 * on the homepage and in the products grid's "self-serve" rail.
 */
export function getSelfServeFlagships(): Platform[] {
  return PLATFORMS.filter(p => p.track === 'self-serve' && !isComingSoon(p));
}

export function isComingSoon(platform: Platform): boolean {
  return platform.status === 'coming-soon' || platform.status === 'in-development';
}

/**
 * Whether the registry's tier vocabulary for this product includes a `free`
 * tier. This is the ONLY source for a "free tier" claim on the site (finding
 * C-010: the catalog used to badge every self-serve product "Free + Pro",
 * which the registry does not back — e.g. Forgesight's tiers are
 * essentials/pro/madfam).
 */
export function hasFreeTier(slug: string): boolean {
  return REGISTRY_COMMERCE[slug]?.tiers.some(tier => tier.id === 'free') ?? false;
}

/**
 * The i18n key (platforms namespace) for a platform's primary call to action,
 * driven by lifecycle (finding C-011): a product the registry marks live and
 * that has its own domain gets a plain "go to the platform" CTA; anything else
 * keeps the overlay's label (early access, waitlist, contact). Live products
 * used to say "Get early access".
 */
export function primaryCtaLabelKey(platform: Platform): string {
  if (platform.status === 'production' && platform.primaryCTA.type === 'external') {
    return 'shared.visitPlatform';
  }
  return platform.primaryCTA.labelKey;
}

/** Display names of the live self-serve products, in registry order. */
export function getSelfServeNames(): string[] {
  return getSelfServeFlagships()
    .filter(p => p.status === 'production')
    .map(p => p.name);
}

/**
 * Licence facts for copy that talks about "our code": how many catalog
 * products the registry lists as AGPL-3.0, out of how many (finding C-010:
 * the site used to claim every product was "MIT or AGPL").
 */
export function getLicenseSummary(): { agpl: number; total: number } {
  return {
    agpl: PLATFORMS.filter(p => p.license === 'AGPL-3.0').length,
    total: PLATFORMS.length,
  };
}

export interface FooterPlatformLink {
  slug: string;
  name: string;
  href: string;
  external: boolean;
}

/**
 * The footer's platform column, in the registry's order. A platform with an
 * in-site detail page links to it; one whose canonical landing is its own
 * domain links there. Neither the names nor the hrefs are hand-kept any more —
 * this replaces the `footer.platforms.*` block that used to be maintained by
 * hand in every locale bundle and had drifted out of step with the catalog.
 */
export function getFooterPlatforms(locale: string): FooterPlatformLink[] {
  return PLATFORMS.filter(p => !isComingSoon(p)).map(p =>
    p.hasDetailPage || !p.externalUrl
      ? { slug: p.slug, name: p.name, href: `/${locale}/platforms/${p.slug}`, external: false }
      : { slug: p.slug, name: p.name, href: p.externalUrl, external: true }
  );
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
