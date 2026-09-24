// ─── Nauta: the corporate summary on madfam.io ──────────────────────────────
// Data for the short "about Nauta" page at madfam.io/[locale]/nauta.
//
// This is NOT Nauta's front door. Nauta's public front door is nauta.quest,
// served by the standalone `nauta` repo (registry `domains.primary`, ruling
// R31); the cockpit lives on app.nauta.quest. Ruling R30 (coherence audit
// 2026-09-23) reduced this page to a short corporate summary with no prices,
// whose canonical URL is https://nauta.quest/ — so the two surfaces no longer
// compete for the same query or disagree on a number (finding C-008).
//
// It holds NO price, NO tier and NO checkout link: prices live only on the
// value-ladder surface, from the registry (R9). The only CTAs are the Nauta
// front door and the Kalya discovery call (R27 — no self-serve ERP CTA while no
// Dhanam plan exists). Copy lives in the `nauta` i18n namespace (es/en/pt).

import { KALYA_DISCOVERY_CALL_URL } from './value-ladder';

export { KALYA_DISCOVERY_CALL_URL };

/** Nauta's public front door and this page's canonical URL (R30/R31). */
export const NAUTA_FRONT_DOOR_URL = 'https://nauta.quest/';

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
