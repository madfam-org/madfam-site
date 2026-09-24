import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

vi.mock('@/lib/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

import { withCsrfProtection, requiresCsrfProtection, isSameOriginRequest } from '../csrf';

function makeRequest(
  method: string,
  path: string = '/api/test',
  headers: Record<string, string> = {}
): Request {
  return new Request(`https://madfam.io${path}`, {
    method,
    headers: { host: 'madfam.io', ...headers },
  });
}

function successHandler(): Promise<NextResponse> {
  return Promise.resolve(NextResponse.json({ ok: true }));
}

describe('CSRF Protection (same-origin check)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withCsrfProtection()', () => {
    it('bypasses the check for GET requests', async () => {
      const handler = vi.fn(successHandler);
      const res = await withCsrfProtection(
        makeRequest('GET', '/api/test', { origin: 'https://evil.example' }),
        handler
      );
      expect(handler).toHaveBeenCalledOnce();
      expect(res.status).toBe(200);
    });

    it('lets a same-origin browser POST through (the contact form case)', async () => {
      const handler = vi.fn(successHandler);
      const res = await withCsrfProtection(
        makeRequest('POST', '/api/leads', { origin: 'https://madfam.io' }),
        handler
      );
      expect(handler).toHaveBeenCalledOnce();
      expect(res.status).toBe(200);
    });

    it('accepts www and the forwarded host behind the tunnel', async () => {
      expect(
        isSameOriginRequest(makeRequest('POST', '/', { origin: 'https://www.madfam.io' }))
      ).toBe(true);
      expect(
        isSameOriginRequest(
          new Request('http://10.0.0.1:3000/api/leads', {
            method: 'POST',
            headers: { 'x-forwarded-host': 'madfam.io', origin: 'https://madfam.io' },
          })
        )
      ).toBe(true);
    });

    it('rejects a cross-site POST with 403', async () => {
      const handler = vi.fn(successHandler);
      const res = await withCsrfProtection(
        makeRequest('POST', '/api/leads', { origin: 'https://evil.example' }),
        handler
      );
      expect(handler).not.toHaveBeenCalled();
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toMatchObject({ code: 'CSRF_VALIDATION_FAILED' });
    });

    it('falls back to Referer when Origin is absent', async () => {
      expect(
        isSameOriginRequest(makeRequest('POST', '/', { referer: 'https://madfam.io/es/contact' }))
      ).toBe(true);
      expect(
        isSameOriginRequest(makeRequest('POST', '/', { referer: 'https://evil.example/x' }))
      ).toBe(false);
    });

    it('rejects an opaque "null" origin', () => {
      expect(isSameOriginRequest(makeRequest('POST', '/', { origin: 'null' }))).toBe(false);
    });

    it('allows a request with neither Origin nor Referer (not a browser cross-site request)', async () => {
      const handler = vi.fn(successHandler);
      const res = await withCsrfProtection(makeRequest('PUT', '/api/test'), handler);
      expect(handler).toHaveBeenCalledOnce();
      expect(res.status).toBe(200);
    });
  });

  describe('requiresCsrfProtection()', () => {
    it('returns false for GET requests', () => {
      expect(requiresCsrfProtection(makeRequest('GET', '/api/test'))).toBe(false);
    });

    it('returns true for POST requests to non-exempt paths', () => {
      expect(requiresCsrfProtection(makeRequest('POST', '/api/test'))).toBe(true);
    });

    it('returns false for POST requests to webhook endpoints', () => {
      expect(requiresCsrfProtection(makeRequest('POST', '/api/webhook/cms'))).toBe(false);
    });
  });
});
