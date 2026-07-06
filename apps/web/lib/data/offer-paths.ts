import { getLocalizedUrl, type Locale } from '@madfam/i18n';

export type OfferPathId = 'platform' | 'build' | 'ecosystem' | 'partner';

export const OFFER_PATH_IDS: readonly OfferPathId[] = [
  'platform',
  'build',
  'ecosystem',
  'partner',
] as const;

export interface OfferPath {
  id: OfferPathId;
  href: string;
  accent: {
    ring: string;
    gradient: string;
    text: string;
    dot: string;
    glow: string;
  };
}

// Copy for the offer paths lives in the i18n catalog under
// `ecosystem.offerPaths` — this module only owns structure (ids,
// destinations, accents).

const CONTACT_INTENT: Record<OfferPathId, string> = {
  platform: 'platform',
  build: 'build-with-madfam',
  ecosystem: 'ecosystem-membership',
  partner: 'partner-invest',
};

const ACCENTS: Record<OfferPathId, OfferPath['accent']> = {
  platform: {
    ring: 'border-leaf/30 hover:border-leaf/70',
    gradient: 'from-leaf/20 via-leaf/5 to-transparent',
    text: 'text-leaf',
    dot: 'bg-leaf',
    glow: 'group-hover:shadow-leaf/20',
  },
  build: {
    ring: 'border-sun/40 hover:border-sun/80',
    gradient: 'from-sun/25 via-sun/5 to-transparent',
    text: 'text-sun',
    dot: 'bg-sun',
    glow: 'group-hover:shadow-sun/20',
  },
  ecosystem: {
    ring: 'border-lavender/35 hover:border-lavender/75',
    gradient: 'from-lavender/25 via-lavender/5 to-transparent',
    text: 'text-lavender',
    dot: 'bg-lavender',
    glow: 'group-hover:shadow-lavender/20',
  },
  partner: {
    ring: 'border-cyan-400/35 hover:border-cyan-400/75',
    gradient: 'from-cyan-400/20 via-cyan-400/5 to-transparent',
    text: 'text-cyan-300',
    dot: 'bg-cyan-300',
    glow: 'group-hover:shadow-cyan-400/20',
  },
};

function contactHref(locale: Locale, id: OfferPathId): string {
  return `${getLocalizedUrl('contact', locale)}?intent=${CONTACT_INTENT[id]}`;
}

function hrefForPath(locale: Locale, id: OfferPathId): string {
  if (id === 'platform') return getLocalizedUrl('products', locale);
  if (id === 'ecosystem') return getLocalizedUrl('ecosystem', locale);
  return contactHref(locale, id);
}

export function getOfferPaths(locale: Locale): OfferPath[] {
  return OFFER_PATH_IDS.map(id => ({
    id,
    href: hrefForPath(locale, id),
    accent: ACCENTS[id],
  }));
}
