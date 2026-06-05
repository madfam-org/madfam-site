import { describe, expect, it } from 'vitest';
import { getOfferPaths } from '@/lib/data/offer-paths';

describe('offer path routing', () => {
  it('returns four localized conversion paths with stable destinations', () => {
    const paths = getOfferPaths('en');

    expect(paths.map(path => path.id)).toEqual(['platform', 'build', 'ecosystem', 'partner']);
    expect(paths.find(path => path.id === 'platform')?.href).toBe('/en/products');
    expect(paths.find(path => path.id === 'ecosystem')?.href).toBe('/en/ecosystem');
    expect(paths.find(path => path.id === 'build')?.href).toBe(
      '/en/contact?intent=build-with-madfam'
    );
    expect(paths.find(path => path.id === 'partner')?.href).toBe(
      '/en/contact?intent=partner-invest'
    );
  });

  it('localizes internal contact and ecosystem routes', () => {
    const paths = getOfferPaths('es');

    expect(paths.find(path => path.id === 'ecosystem')?.href).toBe('/es/ecosistema');
    expect(paths.find(path => path.id === 'build')?.href).toBe(
      '/es/contacto?intent=build-with-madfam'
    );
  });
});
