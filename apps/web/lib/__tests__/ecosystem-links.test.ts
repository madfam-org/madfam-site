import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  MADFAM_OWNED_DOMAINS,
  OWN_SITE_REL,
  THIRD_PARTY_REL,
  ecosystemLink,
  isOwnHost,
  isPublicHost,
  normalizeHost,
} from '@/lib/ecosystem-links';

type Links = typeof import('@/lib/ecosystem-links');

/**
 * Own-site link policy (money-engine journeys 2026-10-11, J3c): links to
 * MADFAM-owned hosts keep the origin (`rel="noopener"` + ecosystem UTM); every
 * other link keeps `noopener noreferrer` and is never tagged.
 */
const OWNED = ['madfam.io', 'dhan.am', 'kalya.app'];

describe('host helpers', () => {
  it('normalizes hosts', () => {
    expect(normalizeHost('WWW.Madfam.IO.')).toBe('madfam.io');
  });

  it('matches owned domains and their subdomains only', () => {
    expect(isOwnHost('dhan.am', OWNED)).toBe(true);
    expect(isOwnHost('app.dhan.am', OWNED)).toBe(true);
    expect(isOwnHost('voxa.madfam.io', OWNED)).toBe(true);
    expect(isOwnHost('evildhan.am', OWNED)).toBe(false);
    expect(isOwnHost('dhan.am.example.com', OWNED)).toBe(false);
  });

  it('accepts only public hostnames as an origin', () => {
    expect(isPublicHost('madfam.io')).toBe(true);
    for (const host of ['localhost', '127.0.0.1', '[::1]', 'app.localhost', 'x.test', '']) {
      expect(isPublicHost(host), host).toBe(false);
    }
  });
});

describe('ecosystemLink', () => {
  it('tags an own-site link and keeps existing parameters', () => {
    const link = ecosystemLink('https://dhan.am/pricing?product=dhanam_pro', {
      surface: 'ladder',
      originHost: 'madfam.io',
      ownedDomains: OWNED,
    });
    expect(link.rel).toBe('noopener');
    const url = new URL(link.href);
    expect(url.searchParams.get('product')).toBe('dhanam_pro');
    expect(url.searchParams.get('utm_source')).toBe('madfam.io');
    expect(url.searchParams.get('utm_medium')).toBe('ecosystem');
    expect(url.searchParams.get('utm_campaign')).toBe('ladder');
  });

  it('leaves third-party, same-host, local-origin and pre-tagged links untagged', () => {
    const opts = { surface: 'cta' as const, ownedDomains: OWNED };
    expect(
      ecosystemLink('https://github.com/madfam-org', { ...opts, originHost: 'madfam.io' })
    ).toEqual({ href: 'https://github.com/madfam-org', rel: THIRD_PARTY_REL });
    expect(ecosystemLink('https://madfam.io/es', { ...opts, originHost: 'www.madfam.io' })).toEqual(
      {
        href: 'https://madfam.io/es',
        rel: OWN_SITE_REL,
      }
    );
    expect(ecosystemLink('https://dhan.am', { ...opts, originHost: 'localhost' })).toEqual({
      href: 'https://dhan.am',
      rel: OWN_SITE_REL,
    });
    const tagged = 'https://dhan.am/?utm_source=newsletter';
    expect(ecosystemLink(tagged, { ...opts, originHost: 'madfam.io' })).toEqual({
      href: tagged,
      rel: OWN_SITE_REL,
    });
    expect(ecosystemLink('mailto:hola@example.com', { ...opts, originHost: 'madfam.io' }).rel).toBe(
      THIRD_PARTY_REL
    );
  });
});

describe('madfam.io bindings', () => {
  // test/setup.ts points NEXT_PUBLIC_BASE_URL at localhost, from which nothing
  // is tagged. Production builds leave it unset, so SITE_URL is
  // https://madfam.io; load a fresh module under that value.
  let SITE_HOST: Links['SITE_HOST'];
  let siteLink: Links['siteLink'];
  let outboundRel: Links['outboundRel'];

  beforeAll(async () => {
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'https://madfam.io');
    vi.resetModules();
    ({ SITE_HOST, siteLink, outboundRel } = await import('@/lib/ecosystem-links'));
  });

  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('derives the owned set from the registry plus madfam.io', () => {
    expect(MADFAM_OWNED_DOMAINS).toContain('madfam.io');
    for (const host of ['dhan.am', 'kalya.app', 'nauta.quest', 'karafiel.mx', 'forgesight.app']) {
      expect(isOwnHost(host, MADFAM_OWNED_DOMAINS), host).toBe(true);
    }
    expect(isOwnHost('github.com', MADFAM_OWNED_DOMAINS)).toBe(false);
  });

  it('uses this site as utm_source', () => {
    expect(SITE_HOST).toBe('madfam.io');
  });

  it('tags the Kalya discovery CTA on each surface', () => {
    for (const surface of ['banner', 'ladder', 'footer', 'cta'] as const) {
      const link = siteLink('https://kalya.app/madfam', surface);
      expect(link.rel).toBe('noopener');
      expect(link.href).toBe(
        `https://kalya.app/madfam?utm_source=madfam.io&utm_medium=ecosystem&utm_campaign=${surface}`
      );
    }
  });

  it('tags nothing when the site runs on localhost', () => {
    expect(
      ecosystemLink('https://kalya.app/madfam', {
        surface: 'cta',
        originHost: 'localhost',
        ownedDomains: MADFAM_OWNED_DOMAINS,
      })
    ).toEqual({ href: 'https://kalya.app/madfam', rel: OWN_SITE_REL });
  });

  it('keeps noreferrer for third-party destinations', () => {
    expect(siteLink('https://github.com/madfam-org', 'footer')).toEqual({
      href: 'https://github.com/madfam-org',
      rel: 'noopener noreferrer',
    });
    expect(outboundRel('https://linkedin.com/company/madfam')).toBe('noopener noreferrer');
    expect(outboundRel('https://dhan.am/pricing')).toBe('noopener');
  });
});
