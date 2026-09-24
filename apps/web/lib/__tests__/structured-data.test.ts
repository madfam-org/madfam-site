import { describe, expect, it } from 'vitest';
import { messages } from '@madfam-site/i18n';
import { getPlatformsWithDetailPages, PLATFORMS } from '@/lib/data/platforms';
import { breadcrumbLd, faqPageLd, softwareApplicationLd, type JsonLd } from '@/lib/structured-data';

// CI validation for the site's JSON-LD (finding C-025). It checks the shape
// schema.org consumers require for each type we emit, and the rulings that
// apply to structured data: no offers or prices anywhere (R9/R25), entity
// facts only from the registry/copy, absolute https URLs.

const LOCALES = ['es', 'en', 'pt'] as const;
const PRICE_PATTERN = /(\$|MX\$|R\$|US\$)\s?\d|\bTBD\b|\d+\s?(MXN|USD|BRL)\b/;

function assertBase(ld: JsonLd, type: string) {
  expect(ld['@context']).toBe('https://schema.org');
  expect(ld['@type']).toBe(type);
  const serialised = JSON.stringify(ld);
  expect(serialised).not.toMatch(/"offers"|"price"/);
  expect(serialised).not.toMatch(PRICE_PATTERN);
}

function assertAbsoluteUrl(value: unknown) {
  expect(typeof value).toBe('string');
  const url = new URL(value as string);
  expect(['https:', 'http:']).toContain(url.protocol);
}

describe('SoftwareApplication JSON-LD', () => {
  const platforms = getPlatformsWithDetailPages();

  it('covers every platform detail page', () => {
    expect(platforms.length).toBeGreaterThan(0);
  });

  for (const platform of platforms) {
    for (const locale of LOCALES) {
      it(`${platform.slug} (${locale}) is valid`, () => {
        const ld = softwareApplicationLd(platform, { description: 'x' }, locale);
        assertBase(ld, 'SoftwareApplication');
        expect(ld.name).toBe(platform.name);
        assertAbsoluteUrl(ld.url);
        expect(ld.applicationCategory).toBeTruthy();
        expect(ld.operatingSystem).toBeTruthy();
        expect((ld.publisher as Record<string, unknown>).legalName).toBe(
          'Innovaciones MADFAM S.A.S. de C.V.'
        );
        if (ld.license !== undefined) {
          expect(String(ld.license)).toMatch(/^https:\/\/spdx\.org\/licenses\/.+\.html$/);
        }
        if (ld.isAccessibleForFree !== undefined) expect(ld.isAccessibleForFree).toBe(true);
      });
    }
  }

  it('never claims a licence page for proprietary or unlicensed products', () => {
    for (const platform of PLATFORMS.filter(p => /Proprietary|UNLICENSED/.test(p.license))) {
      expect(softwareApplicationLd(platform, { description: 'x' }, 'es').license).toBeUndefined();
    }
  });
});

describe('FAQPage JSON-LD', () => {
  for (const locale of LOCALES) {
    it(`builds from the ${locale} ecosystem FAQ bundle`, () => {
      const bundle = (
        messages[locale] as unknown as {
          ecosystem: { faq: { items: Record<string, { question: string; answer: string }> } };
        }
      ).ecosystem.faq.items;
      const ld = faqPageLd(Object.values(bundle));
      expect(ld['@context']).toBe('https://schema.org');
      expect(ld['@type']).toBe('FAQPage');
      const entities = ld.mainEntity as Array<Record<string, unknown>>;
      expect(entities.length).toBeGreaterThan(0);
      for (const entity of entities) {
        expect(entity['@type']).toBe('Question');
        expect(String(entity.name).length).toBeGreaterThan(0);
        const answer = entity.acceptedAnswer as Record<string, unknown>;
        expect(answer['@type']).toBe('Answer');
        expect(String(answer.text).length).toBeGreaterThan(0);
      }
    });
  }
});

describe('BreadcrumbList JSON-LD', () => {
  it('numbers items from 1 with absolute URLs', () => {
    const ld = breadcrumbLd([
      { name: 'Inicio', url: 'https://madfam.io/es' },
      { name: 'Plataformas', url: 'https://madfam.io/es/platforms' },
    ]);
    assertBase(ld, 'BreadcrumbList');
    const items = ld.itemListElement as Array<Record<string, unknown>>;
    expect(items.map(item => item.position)).toEqual([1, 2]);
    for (const item of items) {
      expect(item['@type']).toBe('ListItem');
      assertAbsoluteUrl(item.item);
    }
  });
});
