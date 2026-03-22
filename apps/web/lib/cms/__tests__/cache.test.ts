import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../../redis', () => ({
  getRedisClient: vi.fn(() => null),
}));

vi.mock('../../performance-monitor', () => ({
  recordCacheHit: vi.fn(),
  recordCacheMiss: vi.fn(),
}));

vi.mock('../../environment', () => ({
  environment: {
    cms: { url: 'http://localhost:3001', enabled: true },
    isDevelopment: false,
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { CMSCache, DEFAULT_CACHE_CONFIG } from '../cache';
import { recordCacheHit, recordCacheMiss } from '../../performance-monitor';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = 1_700_000_000_000; // Stable base timestamp for deterministic tests
let dateNowSpy: ReturnType<typeof vi.spyOn>;

function advanceTime(ms: number): void {
  dateNowSpy.mockReturnValue(NOW + ms);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CMSCache (memory-only mode)', () => {
  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(NOW);
    // Each test gets a fresh cache; but the underlying module-level Map persists,
    // so we clear it via a cache instance before every test.
    const cleaner = new CMSCache(DEFAULT_CACHE_CONFIG);
    cleaner.clear();
    vi.clearAllMocks();
    // Re-set the spy since clearAllMocks may clear call counts
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(NOW);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  // -------------------------------------------------------------------------
  // get
  // -------------------------------------------------------------------------

  it('returns data when the entry has not expired', () => {
    const cache = new CMSCache({ ttl: 60, staleWhileRevalidate: 120, maxAge: 600 });
    cache.set('/posts', { docs: [1, 2] });

    // Advance 30 seconds (within 60s TTL)
    advanceTime(30_000);

    const result = cache.get<{ docs: number[] }>('/posts');
    expect(result).toEqual({ docs: [1, 2] });
    expect(recordCacheHit).toHaveBeenCalledWith('cache-check');
  });

  it('returns null when the entry has expired past TTL', () => {
    const cache = new CMSCache({ ttl: 60, staleWhileRevalidate: 120, maxAge: 600 });
    cache.set('/posts', { docs: [1] });

    // Advance 61 seconds (past 60s TTL)
    advanceTime(61_000);

    const result = cache.get('/posts');
    expect(result).toBeNull();
    expect(recordCacheMiss).toHaveBeenCalledWith('cache-check');
  });

  // -------------------------------------------------------------------------
  // set
  // -------------------------------------------------------------------------

  it('stores data that can be retrieved immediately', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    const data = { title: 'Hello' };

    cache.set('/endpoint', data);
    const result = cache.get<typeof data>('/endpoint');

    expect(result).toEqual(data);
  });

  it('does not cache POST requests', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    cache.set('/endpoint', { a: 1 }, { method: 'POST' } as RequestInit);

    const result = cache.get('/endpoint', { method: 'POST' } as RequestInit);
    expect(result).toBeNull();
  });

  // -------------------------------------------------------------------------
  // clear
  // -------------------------------------------------------------------------

  it('removes all entries when called without a pattern', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    cache.set('/posts', { a: 1 });
    cache.set('/studies', { b: 2 });

    cache.clear();

    expect(cache.get('/posts')).toBeNull();
    expect(cache.get('/studies')).toBeNull();
    expect(cache.getStats().size).toBe(0);
  });

  it('removes only matching entries when called with a pattern', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    cache.set('/blog-posts', { a: 1 });
    cache.set('/case-studies', { b: 2 });
    cache.set('/blog-posts-featured', { c: 3 });

    // The pattern is matched against the cache key, which includes "GET:" prefix
    cache.clear('blog-posts');

    // blog-posts entries removed; case-studies kept
    const stats = cache.getStats();
    expect(stats.keys.every((k: string) => !k.includes('blog-posts'))).toBe(true);
    expect(stats.keys.some((k: string) => k.includes('case-studies'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // getStale
  // -------------------------------------------------------------------------

  it('returns stale data within the staleWhileRevalidate window', () => {
    const cache = new CMSCache({ ttl: 60, staleWhileRevalidate: 300, maxAge: 600 });
    cache.set('/posts', { stale: true });

    // Past TTL (60s) but within staleWhileRevalidate (300s)
    advanceTime(120_000);

    const result = cache.getStale<{ stale: boolean }>('/posts');
    expect(result).toEqual({ stale: true });
  });

  it('returns null when data is beyond the staleWhileRevalidate window', () => {
    const cache = new CMSCache({ ttl: 60, staleWhileRevalidate: 300, maxAge: 600 });
    cache.set('/posts', { stale: true });

    // Past both TTL and staleWhileRevalidate
    advanceTime(301_000);

    const result = cache.getStale('/posts');
    expect(result).toBeNull();
  });

  // -------------------------------------------------------------------------
  // getCacheKey (tested indirectly through get/set round-trips)
  // -------------------------------------------------------------------------

  it('generates distinct keys for different HTTP methods', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    cache.set('/endpoint', { method: 'get' });
    cache.set('/endpoint', { method: 'put' }, { method: 'PUT' } as RequestInit);

    // GET variant (default method)
    const getResult = cache.get<{ method: string }>('/endpoint');
    expect(getResult).toEqual({ method: 'get' });

    // PUT variant
    const putResult = cache.get<{ method: string }>('/endpoint', {
      method: 'PUT',
    } as RequestInit);
    expect(putResult).toEqual({ method: 'put' });
  });

  // -------------------------------------------------------------------------
  // getStats
  // -------------------------------------------------------------------------

  it('returns the correct size and key list', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    cache.set('/alpha', { a: 1 });
    cache.set('/beta', { b: 2 });

    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.keys).toHaveLength(2);
    expect(stats.keys.some((k: string) => k.includes('/alpha'))).toBe(true);
    expect(stats.keys.some((k: string) => k.includes('/beta'))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // Multiple entries and overwrites
  // -------------------------------------------------------------------------

  it('stores and retrieves multiple independent entries', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    cache.set('/a', { v: 1 });
    cache.set('/b', { v: 2 });
    cache.set('/c', { v: 3 });

    expect(cache.get<{ v: number }>('/a')).toEqual({ v: 1 });
    expect(cache.get<{ v: number }>('/b')).toEqual({ v: 2 });
    expect(cache.get<{ v: number }>('/c')).toEqual({ v: 3 });
    expect(cache.getStats().size).toBe(3);
  });

  it('overwrites an existing key with new data', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    cache.set('/posts', { version: 1 });
    cache.set('/posts', { version: 2 });

    const result = cache.get<{ version: number }>('/posts');
    expect(result).toEqual({ version: 2 });
  });

  // -------------------------------------------------------------------------
  // Round-trip (set then get) with full config
  // -------------------------------------------------------------------------

  it('performs a complete set and get round-trip with default config', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    const payload = { docs: [{ id: '1' }, { id: '2' }], total: 2 };

    cache.set('/blog-posts?limit=10', payload);
    const retrieved = cache.get<typeof payload>('/blog-posts?limit=10');

    expect(retrieved).toEqual(payload);
    expect(retrieved?.docs).toHaveLength(2);
  });

  // -------------------------------------------------------------------------
  // Clear specific endpoint (integration-style)
  // -------------------------------------------------------------------------

  it('clears entries for a specific endpoint while keeping others', () => {
    const cache = new CMSCache(DEFAULT_CACHE_CONFIG);
    cache.set('/team-members', { members: ['a'] });
    cache.set('/blog-posts', { posts: ['b'] });

    cache.clear('team-members');

    expect(cache.get('/team-members')).toBeNull();
    expect(cache.get<{ posts: string[] }>('/blog-posts')).toEqual({ posts: ['b'] });
  });
});
