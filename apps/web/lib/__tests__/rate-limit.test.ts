import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Force in-memory store by returning null from Redis client.
vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn().mockReturnValue(null),
}));

vi.mock('@/lib/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@madfam/core', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
  },
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() })),
  })),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { rateLimit, withRateLimit } from '../rate-limit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(ip: string = '127.0.0.1'): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/test'), {
    headers: { 'x-forwarded-for': ip },
  });
}

function successHandler(_req: NextRequest): Promise<NextResponse> {
  return Promise.resolve(NextResponse.json({ ok: true }));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // The MemoryStore is a singleton via the module-level `store` variable.
    // To get a fresh store between tests, we need to reset the module.
    vi.resetModules();
  });

  // =========================================================================
  // rateLimit (middleware factory)
  // =========================================================================

  describe('rateLimit()', () => {
    it('allows requests under the limit', async () => {
      // Re-import after module reset to get fresh store
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 5, windowMs: 60000 });
      const req = makeRequest('10.0.0.1');

      const res = await limiter(req, successHandler);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.ok).toBe(true);
    });

    it('adds rate limit headers to successful responses', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 10, windowMs: 60000 });
      const req = makeRequest('10.0.0.2');

      const res = await limiter(req, successHandler);

      expect(res.headers.get('X-RateLimit-Limit')).toBe('10');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
      expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('decrements remaining count with each request', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 5, windowMs: 60000 });
      const ip = '10.0.0.3';

      const res1 = await limiter(makeRequest(ip), successHandler);
      expect(res1.headers.get('X-RateLimit-Remaining')).toBe('4');

      const res2 = await limiter(makeRequest(ip), successHandler);
      expect(res2.headers.get('X-RateLimit-Remaining')).toBe('3');

      const res3 = await limiter(makeRequest(ip), successHandler);
      expect(res3.headers.get('X-RateLimit-Remaining')).toBe('2');
    });

    it('returns 429 when rate limit is exceeded', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 2, windowMs: 60000 });
      const ip = '10.0.0.4';

      // First two requests should succeed
      await limiter(makeRequest(ip), successHandler);
      await limiter(makeRequest(ip), successHandler);

      // Third request should be rate limited
      const res = await limiter(makeRequest(ip), successHandler);
      const body = await res.json();

      expect(res.status).toBe(429);
      expect(body.error).toBe('Too many requests');
      expect(body.message).toContain('Rate limit exceeded');
    });

    it('includes Retry-After header when rate limited', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 1, windowMs: 60000 });
      const ip = '10.0.0.5';

      await limiter(makeRequest(ip), successHandler);
      const res = await limiter(makeRequest(ip), successHandler);

      expect(res.status).toBe(429);
      expect(res.headers.get('Retry-After')).toBeTruthy();
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('includes rate limit headers on 429 response', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 1, windowMs: 60000 });
      const ip = '10.0.0.6';

      await limiter(makeRequest(ip), successHandler);
      const res = await limiter(makeRequest(ip), successHandler);

      expect(res.headers.get('X-RateLimit-Limit')).toBe('1');
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(res.headers.get('X-RateLimit-Reset')).toBeTruthy();
    });

    it('tracks rate limits independently per IP', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 1, windowMs: 60000 });

      // First IP exhausts its limit
      await limiter(makeRequest('10.0.0.7'), successHandler);
      const blockedRes = await limiter(makeRequest('10.0.0.7'), successHandler);
      expect(blockedRes.status).toBe(429);

      // Second IP should still be allowed
      const allowedRes = await limiter(makeRequest('10.0.0.8'), successHandler);
      expect(allowedRes.status).toBe(200);
    });

    it('uses x-real-ip when x-forwarded-for is not present', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 1, windowMs: 60000 });

      const req = new NextRequest(new URL('http://localhost:3000/api/test'), {
        headers: { 'x-real-ip': '192.168.1.100' },
      });

      const res = await limiter(req, successHandler);
      expect(res.status).toBe(200);
      expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('falls back to "anonymous" when no IP headers are present', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({ maxRequests: 2, windowMs: 60000 });

      const req1 = new NextRequest(new URL('http://localhost:3000/api/test'));
      const req2 = new NextRequest(new URL('http://localhost:3000/api/test'));

      const res1 = await limiter(req1, successHandler);
      expect(res1.headers.get('X-RateLimit-Remaining')).toBe('1');

      const res2 = await limiter(req2, successHandler);
      expect(res2.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('supports custom keyGenerator', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      const limiter = freshRateLimit({
        maxRequests: 1,
        windowMs: 60000,
        keyGenerator: req => req.headers.get('x-api-key') || 'no-key',
      });

      const req1 = new NextRequest(new URL('http://localhost:3000/api/test'), {
        headers: { 'x-api-key': 'key-1' },
      });

      const req2 = new NextRequest(new URL('http://localhost:3000/api/test'), {
        headers: { 'x-api-key': 'key-2' },
      });

      // Both should succeed because they have different keys
      const res1 = await limiter(req1, successHandler);
      const res2 = await limiter(req2, successHandler);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
    });

    it('resets counter after window expires', async () => {
      const { rateLimit: freshRateLimit } = await import('../rate-limit');

      // Use a very short window
      const limiter = freshRateLimit({ maxRequests: 1, windowMs: 50 });
      const ip = '10.0.0.9';

      // First request succeeds
      const res1 = await limiter(makeRequest(ip), successHandler);
      expect(res1.status).toBe(200);

      // Second request is blocked
      const res2 = await limiter(makeRequest(ip), successHandler);
      expect(res2.status).toBe(429);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Third request should succeed (window has reset)
      const res3 = await limiter(makeRequest(ip), successHandler);
      expect(res3.status).toBe(200);
    });
  });

  // =========================================================================
  // withRateLimit (convenience wrapper)
  // =========================================================================

  describe('withRateLimit()', () => {
    it('wraps a handler with rate limiting', async () => {
      const { withRateLimit: freshWithRateLimit } = await import('../rate-limit');

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: 'test' }));

      const wrapped = freshWithRateLimit(handler, { maxRequests: 5, windowMs: 60000 });
      const req = makeRequest('10.0.1.1');
      const res = await wrapped(req);

      expect(res.status).toBe(200);
      expect(handler).toHaveBeenCalledWith(req);
      expect(res.headers.get('X-RateLimit-Limit')).toBe('5');
    });

    it('blocks handler execution when rate limited', async () => {
      const { withRateLimit: freshWithRateLimit } = await import('../rate-limit');

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ data: 'test' }));

      const wrapped = freshWithRateLimit(handler, { maxRequests: 1, windowMs: 60000 });
      const ip = '10.0.1.2';

      // First call - handler executes
      await wrapped(makeRequest(ip));
      expect(handler).toHaveBeenCalledTimes(1);

      // Second call - handler should NOT execute
      const res = await wrapped(makeRequest(ip));
      expect(res.status).toBe(429);
      expect(handler).toHaveBeenCalledTimes(1); // Still only called once
    });

    it('uses default options from environment variables when none provided', async () => {
      const { withRateLimit: freshWithRateLimit } = await import('../rate-limit');

      const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));

      const wrapped = freshWithRateLimit(handler);
      const req = makeRequest('10.0.1.3');
      const res = await wrapped(req);

      expect(res.status).toBe(200);
      // Default maxRequests from env or 100
      expect(res.headers.get('X-RateLimit-Limit')).toBeTruthy();
    });
  });
});
