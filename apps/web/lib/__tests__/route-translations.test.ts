import { describe, expect, it } from 'vitest';
import { translatePathname } from '@/lib/route-translations';
import { seoService } from '@/lib/seo';

const LOCALES = ['es', 'en', 'pt'] as const;

// The language switcher must never send a visitor to a URL with no route.
// Every page in the sitemap exists under the same segments in each locale.
describe('translatePathname', () => {
  const paths = seoService.generateSitemapData().map(entry => (entry.url === '/' ? '' : entry.url));

  it.each(LOCALES.flatMap(from => LOCALES.map(to => [from, to] as const)))(
    'keeps every sitemap path when switching %s -> %s',
    (from, to) => {
      for (const path of paths) {
        expect(translatePathname(`/${from}${path}`, to)).toBe(`/${to}${path}`);
      }
    }
  );

  it.each([
    ['/en/ecosystem', 'es', '/es/ecosystem'],
    ['/es/ecosystem', 'pt', '/pt/ecosystem'],
    ['/en/careers', 'es', '/es/careers'],
    ['/en/solutions/maker-node', 'pt', '/pt/solutions/maker-node'],
  ])('does not produce a localized slug without a route: %s -> %s', (from, to, expected) => {
    expect(translatePathname(from, to)).toBe(expected);
  });

  it('resolves legacy localized slugs to their canonical route', () => {
    expect(translatePathname('/es/productos', 'en')).toBe('/en/products');
    expect(translatePathname('/pt/contato', 'es')).toBe('/es/contact');
  });

  it('handles the locale root and trailing slashes', () => {
    expect(translatePathname('/es', 'en')).toBe('/en');
    expect(translatePathname('/', 'pt')).toBe('/pt');
    expect(translatePathname('/en/about/', 'es')).toBe('/es/about');
  });
});
