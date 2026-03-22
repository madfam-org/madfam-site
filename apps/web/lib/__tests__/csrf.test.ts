import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../auth', () => ({
  getServerAuth: vi.fn(),
}));

vi.mock('../security', () => ({
  validateCsrfToken: vi.fn(),
}));

vi.mock('@madfam/core', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  })),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
}));

vi.mock('@/lib/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { withCsrfProtection, requiresCsrfProtection } from '../csrf';
import { getServerAuth } from '../auth';
import { validateCsrfToken } from '../security';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockedGetServerAuth = vi.mocked(getServerAuth);
const mockedValidateCsrfToken = vi.mocked(validateCsrfToken);

function makeRequest(method: string, path: string = '/api/test'): Request {
  return new Request(`http://localhost:3000${path}`, { method });
}

function successHandler(): Promise<NextResponse> {
  return Promise.resolve(NextResponse.json({ ok: true }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CSRF Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // withCsrfProtection
  // =========================================================================

  describe('withCsrfProtection()', () => {
    it('bypasses CSRF validation for GET requests and calls handler directly', async () => {
      const handler = vi.fn(successHandler);
      const req = makeRequest('GET');

      const res = await withCsrfProtection(req, handler);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(mockedGetServerAuth).not.toHaveBeenCalled();
      expect(mockedValidateCsrfToken).not.toHaveBeenCalled();
    });

    it('calls handler when POST request has a valid CSRF token', async () => {
      mockedGetServerAuth.mockResolvedValue({
        csrfToken: 'valid-token',
      } as ReturnType<typeof getServerAuth> extends Promise<infer T> ? T : never);
      mockedValidateCsrfToken.mockReturnValue(true);

      const handler = vi.fn(successHandler);
      const req = makeRequest('POST');

      const res = await withCsrfProtection(req, handler);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(mockedGetServerAuth).toHaveBeenCalledTimes(1);
      expect(mockedValidateCsrfToken).toHaveBeenCalledWith(req, 'valid-token');
    });

    it('returns 403 when POST request has an invalid CSRF token', async () => {
      mockedGetServerAuth.mockResolvedValue({
        csrfToken: 'session-token',
      } as ReturnType<typeof getServerAuth> extends Promise<infer T> ? T : never);
      mockedValidateCsrfToken.mockReturnValue(false);

      const handler = vi.fn(successHandler);
      const req = makeRequest('POST');

      const res = await withCsrfProtection(req, handler);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Invalid CSRF token');
      expect(body.code).toBe('CSRF_VALIDATION_FAILED');
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns 403 when session is null (no CSRF token available)', async () => {
      mockedGetServerAuth.mockResolvedValue(null as Awaited<ReturnType<typeof getServerAuth>>);
      mockedValidateCsrfToken.mockReturnValue(false);

      const handler = vi.fn(successHandler);
      const req = makeRequest('POST');

      const res = await withCsrfProtection(req, handler);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Invalid CSRF token');
      expect(body.code).toBe('CSRF_VALIDATION_FAILED');
      expect(handler).not.toHaveBeenCalled();
      expect(mockedValidateCsrfToken).toHaveBeenCalledWith(req, null);
    });

    it('validates CSRF token for PUT requests', async () => {
      mockedGetServerAuth.mockResolvedValue({
        csrfToken: 'put-token',
      } as ReturnType<typeof getServerAuth> extends Promise<infer T> ? T : never);
      mockedValidateCsrfToken.mockReturnValue(true);

      const handler = vi.fn(successHandler);
      const req = makeRequest('PUT');

      const res = await withCsrfProtection(req, handler);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
      expect(mockedGetServerAuth).toHaveBeenCalledTimes(1);
      expect(mockedValidateCsrfToken).toHaveBeenCalledWith(req, 'put-token');
    });
  });

  // =========================================================================
  // requiresCsrfProtection
  // =========================================================================

  describe('requiresCsrfProtection()', () => {
    it('returns false for GET requests', () => {
      const req = makeRequest('GET', '/api/test');

      expect(requiresCsrfProtection(req)).toBe(false);
    });

    it('returns true for POST requests to non-exempt paths', () => {
      const req = makeRequest('POST', '/api/test');

      expect(requiresCsrfProtection(req)).toBe(true);
    });

    it('returns false for POST requests to webhook endpoints', () => {
      const req = makeRequest('POST', '/api/webhook/cms');

      expect(requiresCsrfProtection(req)).toBe(false);
    });
  });
});
