import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  BANDS,
  BUNDLES,
  KALYA_DISCOVERY_CALL_URL,
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
      expect(cta.href, cta.where).toBe(KALYA_DISCOVERY_CALL_URL);
    }
  });

  it('Nauta ERP is a discovery call, never a checkout (R27)', () => {
    const [erp] = getBandRungs('erp');
    expect(erp).toBeDefined();
    expect(erp.motion).toBe('discovery-call');
    expect(erp.checkoutSlug).toBeUndefined();
    expect(erp.href).toBe(KALYA_DISCOVERY_CALL_URL);
    expect(recommendRung('unify', 'biz').href).toBe(KALYA_DISCOVERY_CALL_URL);
    // No site-side fallback slug survives for a product the registry does not sell.
    expect(registryCheckoutSlug('nauta')).toBeUndefined();
    expect(ctaTarget('nauta').motion).toBe('discovery-call');
  });

  it('bundles and acervo go to the discovery call', () => {
    for (const bundle of BUNDLES) expect(bundle.href).toBe(KALYA_DISCOVERY_CALL_URL);
    expect(recommendRung('design-to-sell', 'team').href).toBe(KALYA_DISCOVERY_CALL_URL);
    const acervo = getExtraSlices().find(s => s.slug === 'acervo');
    if (acervo && !projectionCheckoutSlug('acervo')) {
      expect(acervo.target).toEqual({ motion: 'discovery-call', href: KALYA_DISCOVERY_CALL_URL });
    }
  });
});
