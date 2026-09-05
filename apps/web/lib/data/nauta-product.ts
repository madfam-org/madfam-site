// ─── Nauta Product Data Registry ─────────────────────────────────────────────
// Single source of truth for the standalone Nauta product front door (nauta.quest).
//
// Nauta is one product family with two rungs:
//   • Nauta ERP  — the entitled-services hub. One login gathers every MADFAM
//                  service a business is entitled to, into one operations cockpit.
//   • Nauta vCTO — the fractional-CTO product on top. Advisor-led; a technical
//                  operator runs the stack for you.
//
// Both are tiers of the `nauta` product in the registry, and the registry is
// where their labels come from.
//
// This module deliberately REUSES the rungs, the catalog, and the CTA builders
// from the value-ladder registry so the two public surfaces never drift. It adds
// only the Nauta-product framing: the value pillars, the salida-digna promise,
// and the reading order of the two rungs.
//
// It holds NO price and NO tier label. Both come from the registry through
// `getBandRungs` — see the header of ./value-ladder for rulings R9 and R11 and
// why the six MXN amounts that used to live there are gone. Copy for every
// user-visible string lives in the `nauta` i18n namespace (es/en/pt).

import {
  getBandRungs,
  getExtraSlices,
  getRegistrySlices,
  dhanamCheckoutUrl,
  registryCheckoutSlug,
  KALYA_DISCOVERY_CALL_URL,
  type LadderRung,
  type TierPricing,
  type ExtraSlice,
} from './value-ladder';
import { type Platform } from './platforms';

// Re-export the load-bearing pieces the page needs, so the page imports one
// module and the coupling to the registry stays explicit and in one place.
export {
  getBandRungs,
  getExtraSlices,
  getRegistrySlices,
  dhanamCheckoutUrl,
  KALYA_DISCOVERY_CALL_URL,
};
export type { LadderRung, TierPricing, ExtraSlice, Platform };

/**
 * The Dhanam self-serve checkout slug for Nauta ERP. Resolved through the
 * registry, which today declares no `checkout_slug` for `nauta` and so falls
 * back to the existing live target. A link, not a price.
 */
export const NAUTA_ERP_CHECKOUT_SLUG = registryCheckoutSlug('nauta');

/** Direct self-serve checkout for Nauta ERP, tagged with the nauta.quest source. */
export function nautaErpCheckoutUrl(): string {
  const url = new URL('https://dhan.am/pricing');
  url.searchParams.set('product', NAUTA_ERP_CHECKOUT_SLUG);
  url.searchParams.set('source', 'nauta');
  return url.toString();
}

// ─── The two product rungs, in reading order ─────────────────────────────────

export type NautaRungId = 'erp' | 'vcto';

export interface NautaRung {
  id: NautaRungId;
  /** 1 = ERP (base), 2 = vCTO (top). */
  order: number;
  icon: string;
  /** The registry's tiers for this rung. Labels and prices are the registry's. */
  tiers: LadderRung[];
  /** 'self-serve' (ERP) drives a Dhanam CTA; 'discovery-call' (vCTO) drives Kalya. */
  motion: 'self-serve' | 'discovery-call';
}

export const NAUTA_RUNGS: NautaRung[] = [
  { id: 'erp', order: 1, icon: '🏢', tiers: getBandRungs('erp'), motion: 'self-serve' },
  { id: 'vcto', order: 2, icon: '🧭', tiers: getBandRungs('vcto'), motion: 'discovery-call' },
];

// ─── Value pillars (the "why Nauta" grid) ────────────────────────────────────
// Each pillar is an i18n key suffix within `nauta.pillars.*`. Order is the
// render order on the page.

export const NAUTA_PILLARS = [
  'oneLogin', // one identity across every entitled service
  'salidaDigna', // yours to keep — leaving vCTO never takes the ERP away
  'fiscalNative', // MX-native fiscal/compliance built in, not bolted on
  'vctoOnTap', // a fractional CTO to run it, only when you want one
] as const;

export type NautaPillar = (typeof NAUTA_PILLARS)[number];

// ─── The catalog Nauta unifies ───────────────────────────────────────────────
// The client-facing service set the ERP hub gathers under one login. Sourced
// from the value-ladder registry so the landing narrates exactly the catalog the
// hub entitles. Every slice carries the registry's own icon and display name;
// nothing here is typed by hand.

export function getNautaCatalogRegistrySlices(): Platform[] {
  return getRegistrySlices();
}

export function getNautaCatalogExtraSlices(): ExtraSlice[] {
  return getExtraSlices();
}
