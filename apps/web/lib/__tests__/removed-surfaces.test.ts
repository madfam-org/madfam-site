import { readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { i18nConfig } from '@madfam-site/i18n';
import { LEGACY_PATH_ALIASES } from '../seo-urls';
import { seoService } from '../seo';

/**
 * Ruling CX-3 (2026-10-01): the template and lead-magnet pages are deleted and
 * every URL they had moves permanently (308). Findings L1-004, M1-012, M1-021,
 * M1-022. Defaults K1/K2/K3: no invented careers, no phone line, no
 * unconfirmed Co-Labs partner.
 */
interface Redirect {
  source: string;
  destination: string;
  permanent?: boolean;
}

const require = createRequire(__filename);
const appDir = join(__dirname, '../../app');

const { REMOVED_SURFACES, REMOVED_LOCALIZED_SLUGS, removedSurfaceRedirects } =
  require('../removed-surfaces.js') as {
    REMOVED_SURFACES: Record<string, string>;
    REMOVED_LOCALIZED_SLUGS: Record<string, string>;
    removedSurfaceRedirects: () => Redirect[];
  };
const REMOVED = REMOVED_SURFACES;
const LOCALIZED_SLUGS = Object.entries(REMOVED_LOCALIZED_SLUGS);

describe('removed template and lead-magnet surfaces (CX-3)', () => {
  it('has no page or API route left for them', () => {
    const localeRoutes = readdirSync(join(appDir, '[locale]'));
    for (const path of Object.keys(REMOVED)) expect(localeRoutes, path).not.toContain(path);
    const apiRoutes = readdirSync(join(appDir, 'api'));
    expect(apiRoutes).not.toContain('assessment');
    expect(apiRoutes).not.toContain('calculator');
    expect(readdirSync(join(appDir, 'api/leads'))).not.toContain('roi-calculator');
  });

  it('next.config.js wires the removed-surface redirects in', () => {
    const config = readFileSync(join(__dirname, '../../next.config.js'), 'utf8');
    expect(config).toContain("require('./lib/removed-surfaces.js')");
    expect(config).toContain('...removedSurfaceRedirects()');
  });

  it('covers exactly the six CX-3 paths with the agreed destinations', () => {
    expect(REMOVED).toEqual({
      docs: '/platforms',
      api: '/platforms',
      guides: '/platforms',
      estimator: '/contact',
      calculator: '/contact',
      assessment: '/contact',
    });
  });

  it('redirects every removed path permanently, in every locale', () => {
    const all = removedSurfaceRedirects();
    for (const [path, destination] of Object.entries(REMOVED)) {
      const rule = all.find(r => r.source === `/:locale(es|en|pt)/${path}/:path*`);
      expect(rule, path).toBeDefined();
      expect(rule?.permanent, path).toBe(true);
      expect(rule?.destination, path).toBe(`/:locale${destination}`);
    }
    for (const [slug, destination] of LOCALIZED_SLUGS) {
      const rule = all.find(r => r.source === `${slug}/:path*`);
      expect(rule, slug).toBeDefined();
      expect(rule?.permanent, slug).toBe(true);
      expect(rule?.destination, slug).toBe(destination);
    }
  });

  it('is gone from the sitemap, the localized route table and the legacy aliases', () => {
    const urls = seoService.generateSitemapData().map(entry => entry.url);
    const localized = Object.values(i18nConfig.routes).flatMap(table => [
      ...Object.keys(table),
      ...Object.values(table),
    ]);
    const aliases = [...Object.keys(LEGACY_PATH_ALIASES), ...Object.values(LEGACY_PATH_ALIASES)];
    for (const path of Object.keys(REMOVED)) {
      expect(urls, path).not.toContain(`/${path}`);
      expect(localized, path).not.toContain(`/${path}`);
      expect(aliases, path).not.toContain(`/${path}`);
    }
    for (const [slug] of LOCALIZED_SLUGS) {
      const bare = slug.replace(/^\/(es|pt)/, '');
      expect(localized, slug).not.toContain(bare);
      expect(aliases, slug).not.toContain(bare);
    }
  });
});

describe('unbacked contact, careers and Co-Labs claims (K1/K2/K3)', () => {
  const read = (path: string) => readFileSync(join(appDir, path), 'utf8');
  const bundle = (locale: string, name: string) =>
    readFileSync(
      join(__dirname, `../../../../packages/i18n/src/translations/${locale}/${name}.json`),
      'utf8'
    );

  it('/contact publishes no phone, WhatsApp, opening hours or response-time promise', () => {
    const page = read('[locale]/contact/page.tsx');
    expect(page).not.toMatch(/whatsapp|tel:|\+52|CST|\d{1,2}:\d{2}/i);
    for (const locale of ['es', 'en', 'pt']) {
      expect(bundle(locale, 'pages')).not.toMatch(/24 horas|24 hours|24 horas úteis|CST/);
    }
  });

  it('/careers lists no hard-coded role or benefit', () => {
    const page = read('[locale]/careers/page.tsx');
    expect(page).not.toMatch(/positions\.list|benefits\.list/);
    for (const locale of ['es', 'en', 'pt']) {
      const { careers } = JSON.parse(bundle(locale, 'pages'));
      expect(careers.positions.list).toBeUndefined();
      expect(careers.benefits).toBeUndefined();
    }
  });

  it('/solutions/colabs names no partner and lists no "active" program', () => {
    const page = read('[locale]/solutions/colabs/page.tsx');
    expect(page).not.toMatch(/partnerUrl|status: 'active'|https?:\/\//);
    for (const locale of ['es', 'en', 'pt']) {
      const { colabs } = JSON.parse(bundle(locale, 'corporate')).solutions;
      expect(JSON.stringify(colabs)).not.toMatch(/visitPartner|programsTitle|"active"/);
    }
  });
});
