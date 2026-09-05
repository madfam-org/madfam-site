// ─── Value Ladder Data Registry ──────────────────────────────────────────────
// Structure of the public value-ladder front door. Four ascending BANDS, each
// holding one or more RUNGS.
//
// THIS MODULE HOLDS NO PRICES AND NO TIER LABELS.
//
// Ruling R9 (2026-09-04 coherence docket) amended D6 to: "prices appear only on
// the value-ladder surface, sourced from the registry's `commerce` block, never
// hand-typed, never `TBD`". Ruling R11: "publish no number that is not rendered
// from the registry". This file used to contradict both — it carried six MXN
// amounts and six tier names typed by hand, with a comment asserting they were
// "REAL and benchmarked". They were not in the registry, which is the only place
// this repo is allowed to learn a price from, so they are gone.
//
// Every tier label, every price and every checkout slug below now comes from
// `REGISTRY_COMMERCE` in platforms.generated.ts, which is derived from the
// vendored public projection of the product registry. As of registry v4 the
// projection ratifies no price for any tier, so `REGISTRY_PRICING_STATE.listed`
// is 0 and every rung renders the pending wording from the `valueLadder` i18n
// namespace — a sentence, never a number and never `TBD`. The day a price is
// ratified upstream it renders here with no code change.
//
// Boundary note: the pricing rationale, cost bands and client detail behind the
// ladder live in the PRIVATE internal-devops repo and are cited by name only.
// Policy: internal-devops/docs/repo-boundary-contract.md

import { PLATFORMS, type Platform } from './platforms';
import {
  REGISTRY_COMMERCE,
  REGISTRY_PRODUCTS,
  type RegistryTier,
  type TierPricing,
} from './platforms.generated';

export type { TierPricing } from './platforms.generated';

export type BandId = 'slice' | 'bundle' | 'erp' | 'vcto';

/** How a rung is entered/purchased — drives which CTA is shown. */
export type LadderMotion = 'self-serve' | 'discovery-call';

/** Nothing is priced until the registry says so. */
export const PENDING_PRICE: TierPricing = { state: 'pending' };

export interface LadderRung {
  /** The registry's tier id. Stable, and the DOM key. */
  id: string;
  band: BandId;
  /** The registry's label for the tier. Never written here. */
  label: string;
  /** Dhanam checkout product slug. Registry-owned. */
  checkoutSlug?: string;
  pricing: TierPricing;
  motion: LadderMotion;
}

export interface LadderBand {
  id: BandId;
  /** 1..4 — ascending scope of value. */
  order: number;
  icon: string;
  /** Default motion for the band (a rung may override via its own `motion`). */
  motion: LadderMotion;
}

// ─── The four bands ──────────────────────────────────────────────────────────

export const BANDS: LadderBand[] = [
  { id: 'slice', order: 1, icon: '🧩', motion: 'self-serve' },
  { id: 'bundle', order: 2, icon: '🎁', motion: 'self-serve' },
  { id: 'erp', order: 3, icon: '🏢', motion: 'self-serve' },
  { id: 'vcto', order: 4, icon: '🧭', motion: 'discovery-call' },
];

export function getBand(id: BandId): LadderBand {
  const band = BANDS.find(b => b.id === id);
  if (!band) throw new Error(`Unknown band: ${id}`);
  return band;
}

/** Bands ordered top-of-ladder first (vCTO → slice) for a "climb up" render. */
export const BANDS_DESC: LadderBand[] = [...BANDS].sort((a, b) => b.order - a.order);

// ─── Registry lookups ────────────────────────────────────────────────────────

/**
 * The registry product whose tiers a band renders. Bands 3 and 4 are the two
 * tiers Nauta sells; the band is the site's arrangement, the tier is the
 * registry's fact. Bands 1 and 2 are compositions of other products and have no
 * tier of their own.
 */
const BAND_REGISTRY_TIER: Partial<Record<BandId, { slug: string; tierId: string }>> = {
  erp: { slug: 'nauta', tierId: 'erp' },
  vcto: { slug: 'nauta', tierId: 'vcto' },
};

function registryTier(slug: string, tierId: string): RegistryTier | undefined {
  return REGISTRY_COMMERCE[slug]?.tiers.find(tier => tier.id === tierId);
}

/**
 * Live Dhanam checkout targets for products whose registry entry declares no
 * `checkout_slug` yet. That is a REGISTRY GAP, not a site decision: the value is
 * a link target — never a price and never a tier label — and the registry
 * overrides it the moment it carries one. Nothing may be added here to work
 * around a missing price.
 */
const CHECKOUT_SLUG_FALLBACK: Record<string, string> = {
  nauta: 'nauta-erp',
};

/**
 * The checkout slug for a registry product. The registry's own `checkout_slug`
 * when it declares one, then the known live target, then the product slug.
 */
export function registryCheckoutSlug(slug: string): string {
  return REGISTRY_COMMERCE[slug]?.checkoutSlug ?? CHECKOUT_SLUG_FALLBACK[slug] ?? slug;
}

/**
 * The rungs a band renders, resolved from the registry at import time. A band
 * whose registry product or tier does not exist renders nothing rather than
 * inventing a card — the same rule the platform catalog already follows.
 */
export function getBandRungs(bandId: BandId): LadderRung[] {
  const source = BAND_REGISTRY_TIER[bandId];
  if (!source) return [];

  const tier = registryTier(source.slug, source.tierId);
  if (!tier) return [];

  return [
    {
      id: tier.id,
      band: bandId,
      label: tier.label,
      checkoutSlug: registryCheckoutSlug(source.slug),
      pricing: tier.pricing,
      motion: getBand(bandId).motion,
    },
  ];
}

// ─── Band 2 (curated bundles) ────────────────────────────────────────────────
// A bundle is a composition of registry products, not a registry product, so it
// has no tier and no price of its own. It renders the pending wording until a
// bundle SKU exists in the registry with a ratified price. The launch anchor
// set is "MX Fiscal" and "Design→Sell".

export interface LadderBundle {
  /** i18n key suffix within `valueLadder.bundles.*`. */
  id: string;
  /** Site slugs of the platform slices this bundle composes. */
  slices: string[];
  checkoutSlug: string;
  pricing: TierPricing;
}

export const BUNDLES: LadderBundle[] = [
  {
    id: 'mx-fiscal',
    slices: ['karafiel', 'tezca'],
    checkoutSlug: 'bundle-mx-fiscal',
    pricing: PENDING_PRICE,
  },
  {
    id: 'design-to-sell',
    slices: ['yantra4d', 'forge-sight', 'cotiza-studio'],
    checkoutSlug: 'bundle-design-to-sell',
    pricing: PENDING_PRICE,
  },
];

// ─── Band 1 (single slices) ──────────────────────────────────────────────────
// The client-facing slice set. Slugs use the platforms registry (single source
// of truth); the ordering below is the public "what you can buy self-serve"
// reading order.

/** Slices that ARE in the PLATFORMS registry (get an icon + detail affordances). */
const REGISTRY_SLICE_SLUGS = [
  'dhanam',
  'karafiel',
  'tezca',
  'forge-sight',
  'cotiza-studio',
  'voxa',
  'yantra4d',
] as const;

/**
 * Client-facing slices sold self-serve at Band 1 that have no presentation
 * overlay on this site, so they never become a `PLATFORMS` entry. They still
 * belong on the ladder, so they are listed by registry slug and rendered from
 * registry facts: the registry's display name, the registry's icon, the
 * registry's checkout slug. Nothing about them is typed here.
 */
const EXTRA_SLICE_SLUGS = ['crea-map', 'kalya', 'selva', 'symbiosis', 'acervo'] as const;

export interface ExtraSlice {
  slug: string;
  /** Registry display name — a brand mark, not translated. */
  name: string;
  icon: string;
  checkoutSlug: string;
}

/** Platform slices resolved from the registry, in the public reading order. */
export function getRegistrySlices(): Platform[] {
  return REGISTRY_SLICE_SLUGS.map(slug => PLATFORMS.find(p => p.slug === slug)).filter(
    (p): p is Platform => Boolean(p)
  );
}

/** Extra slices resolved from the registry. A slug the registry drops disappears. */
export function getExtraSlices(): ExtraSlice[] {
  const slices: ExtraSlice[] = [];
  for (const slug of EXTRA_SLICE_SLUGS) {
    const product = REGISTRY_PRODUCTS[slug];
    if (!product) continue;
    slices.push({
      slug,
      name: product.name,
      icon: product.icon,
      checkoutSlug: registryCheckoutSlug(slug),
    });
  }
  return slices;
}

// ─── CTA targets ─────────────────────────────────────────────────────────────

/** Dhanam self-serve checkout, tagged with the ladder source. */
export function dhanamCheckoutUrl(productSlug: string): string {
  const url = new URL('https://dhan.am/pricing');
  url.searchParams.set('product', productSlug);
  url.searchParams.set('source', 'ladder');
  return url.toString();
}

// Kalya discovery-call booking (Band 4, or anyone who wants help). Canonical
// host is kalya.app. TODO(handle): confirm the MADFAM booking handle — the site
// has no existing "book a call" CTA to reuse, so `/madfam` is a placeholder
// pending the real Kalya event-type slug for the discovery call.
export const KALYA_DISCOVERY_CALL_URL = 'https://kalya.app/madfam';

// ─── Self-selector ("Encuentra tu escalón") ─────────────────────────────────
// Two questions map a visitor to a band + a candidate SKU set.
//
// Honesty rule: recommend the SMALLEST rung that does the job; the rung above is
// shown as an option, never a default.

export type NeedId = 'invoices' | 'bookings' | 'money' | 'design-to-sell' | 'unify' | 'run-for-me';

export type SizeId = 'solo' | 'team' | 'biz';

/** Each "need" answer maps to a band and a candidate SKU/slice set. */
export interface NeedOption {
  id: NeedId;
  band: BandId;
  /** Candidate slice/bundle/SKU slugs surfaced with the recommendation. */
  candidates: string[];
}

export const NEED_OPTIONS: NeedOption[] = [
  { id: 'invoices', band: 'slice', candidates: ['karafiel'] },
  { id: 'bookings', band: 'slice', candidates: ['kalya'] },
  { id: 'money', band: 'slice', candidates: ['dhanam'] },
  { id: 'design-to-sell', band: 'bundle', candidates: ['bundle-design-to-sell'] },
  { id: 'unify', band: 'erp', candidates: ['nauta'] },
  { id: 'run-for-me', band: 'vcto', candidates: ['nauta'] },
];

export const SIZE_OPTIONS: SizeId[] = ['solo', 'team', 'biz'];

export interface LadderRecommendation {
  band: BandId;
  /** The recommended rung id (a registry tier id), when the band has one. */
  rungId?: string;
  /** The registry's label for that rung, when the band has one. */
  rungLabel?: string;
  /** The candidate slugs to surface (slice / bundle / SKU). */
  candidates: string[];
  /** The rung above, offered as an option (never a default). */
  upsellBand?: BandId;
  pricing: TierPricing;
  motion: LadderMotion;
  /** Dhanam checkout slug for the primary self-serve CTA, when applicable. */
  checkoutSlug?: string;
}

/**
 * The self-selector engine. Given a need + a size, return the smallest rung that
 * does the job, its price state and motion, the CTA target, and the (optional)
 * rung above as an upsell. Pure + deterministic so it can be unit-tested and run
 * client-side with no network.
 *
 * `size` no longer selects a tier. It used to pick between three hand-typed ERP
 * and three hand-typed vCTO rungs; the registry sells two Nauta tiers, not six,
 * so the size answer sizes the RECOMMENDATION (which band, and whether the
 * bundle or the ERP is the natural next rung) and the registry supplies the tier.
 */
export function recommendRung(need: NeedId, size: SizeId): LadderRecommendation {
  const option = NEED_OPTIONS.find(o => o.id === need);
  if (!option) {
    throw new Error(`Unknown need: ${need}`);
  }
  const { band } = option;

  // Bands 3 & 4 — the registry's Nauta tiers.
  if (band === 'erp' || band === 'vcto') {
    const [rung] = getBandRungs(band);
    return {
      band,
      rungId: rung?.id,
      rungLabel: rung?.label,
      candidates: option.candidates,
      ...(band === 'erp' ? { upsellBand: 'vcto' as BandId } : {}),
      pricing: rung?.pricing ?? PENDING_PRICE,
      motion: rung?.motion ?? getBand(band).motion,
      ...(rung?.motion === 'self-serve' ? { checkoutSlug: rung.checkoutSlug } : {}),
    };
  }

  // Band 2 (bundle) — a composition, priced upstream when a bundle SKU exists.
  if (band === 'bundle') {
    return {
      band,
      candidates: option.candidates,
      upsellBand: 'erp',
      pricing: PENDING_PRICE,
      motion: 'self-serve',
      checkoutSlug: option.candidates[0],
    };
  }

  // Band 1 (slice) — smallest rung. A team/biz-sized buyer is offered the bundle
  // (for design-to-sell needs) or the ERP as the natural next rung. Slice prices
  // are per-product and live on the product's own page, so the ladder routes the
  // visitor to the product rather than restating a price it does not own.
  return {
    band: 'slice',
    candidates: option.candidates,
    upsellBand: size === 'solo' ? 'bundle' : 'erp',
    pricing: PENDING_PRICE,
    motion: 'self-serve',
    checkoutSlug: registryCheckoutSlug(option.candidates[0] ?? ''),
  };
}
