import { describe, expect, it } from 'vitest';
import { PLATFORMS, getFooterPlatforms } from '@/lib/data/platforms';

// Owner ruling 2026-10-28: the footer names only the few platforms that are
// ready and that MADFAM has implemented with success, chosen through the
// overlay's `inFooter` flag. Everything else stays reachable through the
// footer's "all platforms" link to the catalog.
const CURATED = ['enclii', 'dhanam', 'karafiel', 'tezca', 'yantra4d', 'nauta'];

describe('footer platform column', () => {
  it('lists exactly the curated platforms, in registry order', () => {
    const slugs = getFooterPlatforms('es').map(link => link.slug);
    expect([...slugs].sort()).toEqual([...CURATED].sort());
    const registryOrder = PLATFORMS.map(p => p.slug).filter(slug => CURATED.includes(slug));
    expect(slugs).toEqual(registryOrder);
  });

  it('stays short and only names products that exist today', () => {
    const footer = PLATFORMS.filter(p => p.inFooter);
    expect(footer.length).toBeLessThanOrEqual(7);
    for (const platform of footer) {
      expect(['live', 'beta', 'degraded']).toContain(platform.lifecycle);
    }
  });

  it('links to the detail page when one exists, else to the product domain', () => {
    for (const link of getFooterPlatforms('en')) {
      const platform = PLATFORMS.find(p => p.slug === link.slug)!;
      if (platform.hasDetailPage || !platform.externalUrl) {
        expect(link).toMatchObject({ href: `/en/platforms/${link.slug}`, external: false });
      } else {
        expect(link).toMatchObject({ href: platform.externalUrl, external: true });
      }
    }
  });
});
