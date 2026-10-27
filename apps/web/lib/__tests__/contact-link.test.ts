import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogProductSlug, contactHref } from '@/lib/contact-link';
import { PLATFORMS } from '@/lib/data/platforms';

describe('contactHref', () => {
  it('links to the localized contact page with intent and product', () => {
    expect(contactHref('es', { intent: 'platform', product: 'karafiel' })).toBe(
      '/es/contact?intent=platform&product=karafiel'
    );
    expect(contactHref('pt', { intent: 'ecosystem-membership' })).toBe(
      '/pt/contact?intent=ecosystem-membership'
    );
    expect(contactHref('en')).toBe('/en/contact');
  });

  it('accepts only catalog slugs as the product', () => {
    expect(catalogProductSlug(PLATFORMS[0].slug)).toBe(PLATFORMS[0].slug);
    expect(catalogProductSlug('<script>')).toBeUndefined();
    expect(catalogProductSlug('not-a-product')).toBeUndefined();
    expect(catalogProductSlug(undefined)).toBeUndefined();
  });

  // A call to action with href="#" goes nowhere.
  it('the catalog page has no placeholder "#" CTA', () => {
    const page = readFileSync(join(__dirname, '../../app/[locale]/products/page.tsx'), 'utf8');
    expect(page).not.toMatch(/['"]#['"]\s*:/);
    expect(page).not.toMatch(/\?\s*['"]#['"]/);
  });
});
