/**
 * Header snapshot for finding S1-017 (batch S5): one source for the static
 * security headers (next.config.js), a CSP without Vercel/Google origins, the
 * nonce forwarded on the request and never echoed in the response.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import middleware, { buildContentSecurityPolicy, NONCE_HEADER } from '../middleware';

// next-intl's middleware forwards the incoming request headers with
// NextResponse.next({ request: { headers } }); stand in for it here (its ESM
// build does not resolve under vitest) so the test pins our side of that
// contract: what middleware.ts puts on the request and on the response.
vi.mock('next-intl/middleware', () => ({
  default: () => (request: NextRequest) =>
    NextResponse.next({ request: { headers: request.headers } }),
}));

interface HeaderRule {
  source: string;
  headers: { key: string; value: string }[];
}

/**
 * Loads next.config.js in a plain Node process (the next-intl plugin it wraps
 * cannot load inside the jsdom test environment) and returns what Next sees.
 */
function loadConfig(): { config: { poweredByHeader?: boolean }; rules: HeaderRule[] } {
  const script = `
    const config = require('./next.config.js');
    config.headers().then(rules => {
      process.stdout.write(JSON.stringify({ config: { poweredByHeader: config.poweredByHeader }, rules }));
    });
  `;
  const out = execFileSync(process.execPath, ['-e', script], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf-8',
  });
  return JSON.parse(out);
}

describe('next.config.js security headers', () => {
  it('disables X-Powered-By', () => {
    const { config } = loadConfig();
    expect(config.poweredByHeader).toBe(false);
  });

  it('sends one identical set of security headers on every path', () => {
    const { rules } = loadConfig();
    const all = rules.find(rule => rule.source === '/:path*');
    expect(all).toBeDefined();
    expect(Object.fromEntries(all!.headers.map(h => [h.key, h.value]))).toEqual({
      'X-DNS-Prefetch-Control': 'on',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-XSS-Protection': '0',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    });
    // No other rule may override a security header for a sub-path (the old
    // config sent SAMEORIGIN and HSTS without preload to /api).
    const securityKeys = new Set(all!.headers.map(h => h.key));
    for (const rule of rules.filter(r => r !== all)) {
      for (const header of rule.headers) {
        expect(securityKeys.has(header.key)).toBe(false);
      }
    }
  });
});

describe('Content-Security-Policy', () => {
  const csp = buildContentSecurityPolicy('bm9uY2U=');

  it('carries the nonce and strict-dynamic', () => {
    expect(csp).toContain("script-src 'self' 'nonce-bm9uY2U=' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });

  it('allows no Vercel or Google origins', () => {
    for (const origin of [
      'vercel.live',
      'vercel-insights.com',
      'googletagmanager.com',
      'google-analytics.com',
      'analytics.google.com',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
    ]) {
      expect(csp).not.toContain(origin);
    }
    expect(csp).not.toMatch(/vercel|google|gstatic/i);
  });

  it('loads styles and fonts from this origin only', () => {
    expect(csp).toContain("style-src 'self' 'unsafe-inline';");
    expect(csp).toContain("font-src 'self';");
  });

  it('allows the Plausible origin only when the build renders Plausible', () => {
    // NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset in tests (as in production until O49).
    expect(csp).not.toContain('plausible');
  });
});

describe('middleware', () => {
  it('sets the CSP on the response and forwards the nonce on the request only', () => {
    const response = middleware(new NextRequest('https://madfam.io/es'));

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(response.headers.get(NONCE_HEADER)).toBeNull();

    // next-intl forwards request headers via Next's x-middleware-request-* protocol.
    const forwarded = response.headers.get(`x-middleware-request-${NONCE_HEADER}`);
    expect(forwarded).toBeTruthy();
    expect(csp).toContain(`'nonce-${forwarded}'`);
  });

  it('answers unknown root files with a 404 without running the CSP path', () => {
    const response = middleware(new NextRequest('https://madfam.io/x.txt'));
    expect(response.status).toBe(404);
  });
});
