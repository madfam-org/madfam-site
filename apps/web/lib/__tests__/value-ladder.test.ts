import fs from 'node:fs';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  BANDS,
  BUNDLES,
  LADDER_DISCOVERY_CALL_URL,
  NEED_OPTIONS,
  SIZE_OPTIONS,
  ctaTarget,
  getBandRungs,
  getExtraSlices,
  getRegistrySlices,
  recommendRung,
  registryCheckoutSlug,
  type BandId,
} from '@/lib/data/value-ladder';

/**
 * Ruling CX-1 (2026-10-01) and R27, findings L1-005 / M1-003 / C1-002 / M1-018.
 *
 * The facts are read from the vendored projection itself, not from the
 * generated module the code under test imports, so a drift between the two
 * cannot make this test agree with itself.
 */
interface ProjectionProduct {
  slug: string;
  site_slug?: string;
  domains?: { primary?: string | null };
  commerce?: { checkout_slug?: string };
}

const projection = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../data/projection.public.json'), 'utf8')
) as { products: ProjectionProduct[] };

const bySiteSlug = new Map(projection.products.map(p => [p.site_slug ?? p.slug, p]));
const projectionCheckoutSlug = (siteSlug: string) =>
  bySiteSlug.get(siteSlug)?.commerce?.checkout_slug;

const BAND_IDS: BandId[] = BANDS.map(b => b.id);

interface Cta {
  where: string;
  /** Site slug of the product the CTA sells, when it sells one. */
  product?: string;
  motion: 'self-serve' | 'discovery-call';
  href: string;
  checkoutSlug?: string;
}

/** Every CTA the ladder surface (page + selector) can render. */
function allCtas(): Cta[] {
  const ctas: Cta[] = [];
  for (const { platform, target } of getRegistrySlices()) {
    ctas.push({ where: `slice ${platform.slug}`, product: platform.slug, ...target });
  }
  for (const slice of getExtraSlices()) {
    ctas.push({ where: `slice ${slice.slug}`, product: slice.slug, ...slice.target });
  }
  for (const bundle of BUNDLES) {
    ctas.push({ where: `bundle ${bundle.id}`, motion: bundle.motion, href: bundle.href });
  }
  for (const band of BAND_IDS) {
    for (const rung of getBandRungs(band)) {
      ctas.push({
        where: `rung ${band}/${rung.id}`,
        product: 'nauta',
        motion: rung.motion,
        href: rung.href,
        checkoutSlug: rung.checkoutSlug,
      });
    }
  }
  for (const need of NEED_OPTIONS) {
    for (const size of SIZE_OPTIONS) {
      const rec = recommendRung(need.id, size);
      ctas.push({
        where: `selector ${need.id}/${size}`,
        product: rec.band === 'slice' ? need.candidates[0] : undefined,
        motion: rec.motion,
        href: rec.href,
        checkoutSlug: rec.checkoutSlug,
      });
    }
  }
  return ctas;
}

describe('value ladder CTAs (ruling CX-1)', () => {
  it('renders at least one CTA of each kind', () => {
    const ctas = allCtas();
    expect(ctas.some(c => c.motion === 'self-serve')).toBe(true);
    expect(ctas.some(c => c.motion === 'discovery-call')).toBe(true);
  });

  it('every self-serve rung has a registry checkout_slug', () => {
    const selfServe = allCtas().filter(c => c.motion === 'self-serve');
    for (const cta of selfServe) {
      expect(cta.product, `${cta.where} sells no product`).toBeDefined();
      const slug = projectionCheckoutSlug(cta.product ?? '');
      expect(slug, `${cta.where}: registry has no commerce.checkout_slug`).toBeTruthy();
      expect(cta.checkoutSlug, cta.where).toBe(slug);
    }
  });

  it('never links dhan.am/pricing?product= for a product other than Dhanam', () => {
    const offenders = allCtas().filter(
      c => c.href.includes('dhan.am/pricing?product=') && c.product !== 'dhanam'
    );
    expect(offenders.map(c => `${c.where} → ${c.href}`)).toEqual([]);

    // The same holds for every product the registry knows, not only today's rungs.
    for (const siteSlug of bySiteSlug.keys()) {
      const { href } = ctaTarget(siteSlug);
      if (siteSlug !== 'dhanam') expect(href, siteSlug).not.toContain('dhan.am/pricing');
    }
  });

  it('a self-serve product links its own registry primary (Dhanam: its own pricing page)', () => {
    for (const cta of allCtas().filter(c => c.motion === 'self-serve')) {
      if (cta.product === 'dhanam') {
        expect(cta.href.startsWith('https://dhan.am/pricing?product=dhanam')).toBe(true);
        continue;
      }
      const primary = bySiteSlug.get(cta.product ?? '')?.domains?.primary;
      expect(primary, cta.where).toBeTruthy();
      expect(new URL(cta.href).hostname, cta.where).toBe(primary);
    }
  });

  it('every non-self-serve CTA is the Kalya discovery call', () => {
    for (const cta of allCtas().filter(c => c.motion !== 'self-serve')) {
      expect(cta.href, cta.where).toBe(LADDER_DISCOVERY_CALL_URL);
    }
  });

  it('Nauta ERP is a discovery call, never a checkout (R27)', () => {
    const [erp] = getBandRungs('erp');
    expect(erp).toBeDefined();
    expect(erp.motion).toBe('discovery-call');
    expect(erp.checkoutSlug).toBeUndefined();
    expect(erp.href).toBe(LADDER_DISCOVERY_CALL_URL);
    expect(recommendRung('unify', 'biz').href).toBe(LADDER_DISCOVERY_CALL_URL);
    // No site-side fallback slug survives for a product the registry does not sell.
    expect(registryCheckoutSlug('nauta')).toBeUndefined();
    expect(ctaTarget('nauta').motion).toBe('discovery-call');
  });

  it('bundles and acervo go to the discovery call', () => {
    for (const bundle of BUNDLES) expect(bundle.href).toBe(LADDER_DISCOVERY_CALL_URL);
    expect(recommendRung('design-to-sell', 'team').href).toBe(LADDER_DISCOVERY_CALL_URL);
    const acervo = getExtraSlices().find(s => s.slug === 'acervo');
    if (acervo && !projectionCheckoutSlug('acervo')) {
      expect(acervo.target).toEqual({ motion: 'discovery-call', href: LADDER_DISCOVERY_CALL_URL });
    }
  });
});

/**
 * Money-engine journeys 2026-10-11 (J3c): every ladder href leaves madfam.io as
 * an own-site link on the `ladder` surface. Dhanam reads only `utm_*`, so the
 * old `source=ladder` parameter is gone; `product` stays.
 */
describe('ladder links carry the ecosystem UTM set', () => {
  // test/setup.ts points NEXT_PUBLIC_BASE_URL at localhost, from which nothing
  // is tagged. Production builds leave it unset (SITE_URL = https://madfam.io),
  // so load a fresh copy of the ladder under that value.
  let L: typeof import('@/lib/data/value-ladder');

  beforeAll(async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://madfam.io');
    vi.resetModules();
    L = await import('@/lib/data/value-ladder');
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  function ctaHrefs(): string[] {
    const hrefs = [
      L.LADDER_DISCOVERY_CALL_URL,
      ...L.BUNDLES.map(b => b.href),
      ...L.getRegistrySlices().map(s => s.target.href),
      ...L.getExtraSlices().map(s => s.target.href),
      ...(['erp', 'vcto'] as BandId[]).flatMap(b => L.getBandRungs(b).map(r => r.href)),
    ];
    for (const need of L.NEED_OPTIONS) {
      for (const size of L.SIZE_OPTIONS) hrefs.push(L.recommendRung(need.id, size).href);
    }
    return hrefs;
  }

  it('tags every ladder href with utm_source=madfam.io, medium ecosystem, campaign ladder', () => {
    for (const href of ctaHrefs()) {
      const url = new URL(href);
      expect(url.searchParams.get('utm_source'), href).toBe('madfam.io');
      expect(url.searchParams.get('utm_medium'), href).toBe('ecosystem');
      expect(url.searchParams.get('utm_campaign'), href).toBe('ladder');
      expect(url.searchParams.has('source'), href).toBe(false);
    }
  });

  it('keeps the Kalya booking page as the discovery-call destination', () => {
    const url = new URL(L.LADDER_DISCOVERY_CALL_URL);
    expect(`${url.origin}${url.pathname}`).toBe(L.KALYA_DISCOVERY_CALL_URL);
  });

  it("keeps Dhanam's product parameter and drops source=ladder", () => {
    const target = L.ctaTarget('dhanam');
    if (target.motion !== 'self-serve') return; // the registry sells no Dhanam checkout today
    const url = new URL(target.href);
    expect(url.hostname).toBe('dhan.am');
    expect(url.pathname).toBe('/pricing');
    expect(url.searchParams.get('product')).toBe(target.checkoutSlug);
    expect(url.searchParams.has('source')).toBe(false);
    expect(url.searchParams.get('utm_campaign')).toBe('ladder');
  });
});
