import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_OG_IMAGE,
  LEGACY_PATH_ALIASES,
  SITE_URL,
  canonicalPath,
  localizedAlternates,
  localizedUrl,
  pathWithoutLocale,
} from '../seo-urls';

describe('seo-urls', () => {
  it('builds locale-prefixed canonical URLs (no redirecting unprefixed URLs)', () => {
    expect(localizedUrl('es')).toBe(`${SITE_URL}/es`);
    expect(localizedUrl('en', '/')).toBe(`${SITE_URL}/en`);
    expect(localizedUrl('pt', '/platforms/enclii/')).toBe(`${SITE_URL}/pt/platforms/enclii`);
  });

  it('emits es/en/pt + x-default alternates with a self canonical', () => {
    const alternates = localizedAlternates('en', '/about');
    expect(alternates.canonical).toBe(`${SITE_URL}/en/about`);
    expect(alternates.languages).toEqual({
      es: `${SITE_URL}/es/about`,
      en: `${SITE_URL}/en/about`,
      pt: `${SITE_URL}/pt/about`,
      'x-default': `${SITE_URL}/es/about`,
    });
  });

  it('strips the locale and resolves legacy aliases to the real route', () => {
    expect(pathWithoutLocale('/es')).toEqual({ locale: 'es', path: '' });
    expect(pathWithoutLocale('/pt/contato')).toEqual({ locale: 'pt', path: '/contact' });
    expect(pathWithoutLocale('/en/platforms/janua')).toEqual({
      locale: 'en',
      path: '/platforms/janua',
    });
    expect(pathWithoutLocale('/xx/about')).toBeNull();
    expect(canonicalPath('/soluciones/colabs')).toBe('/solutions/colabs');
  });

  it('covers every localized rewrite in next.config.js', () => {
    const config = readFileSync(join(__dirname, '../../next.config.js'), 'utf8');
    const pairs = [
      ...config.matchAll(/source: '\/(?:es|pt)(\/[^']+)', destination: '\/(?:es|pt)(\/[^']+)'/g),
    ].map(m => [m[1], m[2]] as const);
    expect(pairs.length).toBeGreaterThan(10);
    for (const [source, destination] of pairs) {
      if (source === destination) continue;
      expect(LEGACY_PATH_ALIASES[source], source).toBe(destination);
    }
  });

  // A page that sets `openGraph` replaces the parent's whole object, so a block
  // without `images` publishes no share image for that page.
  it('ships the default share image and every openGraph block includes images', () => {
    const appDir = join(__dirname, '../../app');
    expect(existsSync(join(__dirname, '../../public', DEFAULT_OG_IMAGE.url))).toBe(true);

    const files = (readdirSync(appDir, { recursive: true }) as string[]).filter(f =>
      /page\.tsx$/.test(f)
    );
    const missing = files.filter(f => {
      const src = readFileSync(join(appDir, f), 'utf8');
      const at = src.indexOf('openGraph: {');
      return at !== -1 && !src.slice(at, at + 600).includes('images:');
    });
    expect(missing).toEqual([]);
  });

  // Next streams metadata into <body> for agents outside `htmlLimitedBots`;
  // matching every agent keeps title, description and Open Graph in <head>.
  it('renders metadata in <head> for ordinary browsers and link-preview agents', () => {
    const config = readFileSync(join(__dirname, '../../next.config.js'), 'utf8');
    const match = /htmlLimitedBots:\s*\/(.+)\/,/.exec(config);
    expect(match).not.toBeNull();
    const bots = new RegExp(match![1]);
    const browser =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
    expect(bots.test(browser)).toBe(true);
    expect(bots.test('WhatsApp/2.23')).toBe(true);
  });
});
