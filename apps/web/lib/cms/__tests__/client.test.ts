import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock references - vi.hoisted ensures availability in vi.mock factories
// ---------------------------------------------------------------------------

const { mockGet, mockGetStale, mockSet, mockClear, mockGetStats, MockCMSCache } = vi.hoisted(() => {
  const get = vi.fn(() => null);
  const getStale = vi.fn(() => null);
  const set = vi.fn();
  const clear = vi.fn();
  const getStats = vi.fn(() => ({ size: 0, keys: [] }));
  function CacheMock() {
    return { get, getStale, set, clear, getStats };
  }
  return {
    mockGet: get,
    mockGetStale: getStale,
    mockSet: set,
    mockClear: clear,
    mockGetStats: getStats,
    MockCMSCache: vi.fn(CacheMock),
  };
});

const { mockExecute, MockRetryHandler } = vi.hoisted(() => {
  const execute = vi.fn();
  function RetryMock() {
    return { execute };
  }
  return { mockExecute: execute, MockRetryHandler: vi.fn(RetryMock) };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('../cache', () => ({
  CMSCache: MockCMSCache,
  DEFAULT_CACHE_CONFIG: { ttl: 3600, staleWhileRevalidate: 86400, maxAge: 604800 },
}));

vi.mock('../retry', () => ({
  RetryHandler: MockRetryHandler,
  DEFAULT_RETRY_CONFIG: { maxRetries: 3, baseDelay: 1000, maxDelay: 10000 },
  fetchWithTimeout: vi.fn(),
}));

vi.mock('../../environment', () => ({
  environment: {
    cms: { url: 'http://localhost:3001', enabled: true },
    isDevelopment: false,
  },
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
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { CMSClient } from '../client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Make the retry handler immediately invoke the operation passed to execute(). */
function setupRetryPassthrough(): void {
  mockExecute.mockImplementation(async (operation: () => Promise<unknown>) => operation());
}

/** Standard CMS list response factory. */
function makeCMSResponse<T>(docs: T[], totalDocs?: number, totalPages?: number) {
  return {
    docs,
    totalDocs: totalDocs ?? docs.length,
    totalPages: totalPages ?? 1,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CMSClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockReturnValue(null);
    mockGetStale.mockReturnValue(null);
    setupRetryPassthrough();
  });

  // -------------------------------------------------------------------------
  // Constructor
  // -------------------------------------------------------------------------

  it('creates cache and retry handler instances on construction', () => {
    const client = new CMSClient();
    // CMSCache and RetryHandler constructors should each have been called once
    expect(MockCMSCache).toHaveBeenCalledTimes(1);
    expect(MockRetryHandler).toHaveBeenCalledTimes(1);
    expect(client).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // getBlogPosts
  // -------------------------------------------------------------------------

  describe('getBlogPosts', () => {
    it('builds the correct query string from params', async () => {
      const response = makeCMSResponse([{ id: '1', title: 'Post', slug: 'post' }]);
      mockExecute.mockResolvedValueOnce(response);

      const client = new CMSClient();
      await client.getBlogPosts({ status: 'published', limit: 5, page: 2, locale: 'es' });

      // The cache.get call receives the constructed endpoint
      const endpoint = mockGet.mock.calls[0][0] as string;
      expect(endpoint).toContain('/blog-posts?');
      expect(endpoint).toContain('where%5Bstatus%5D%5Bequals%5D=published');
      expect(endpoint).toContain('limit=5');
      expect(endpoint).toContain('page=2');
      expect(endpoint).toContain('locale=es');
    });

    it('returns cached data on cache hit without fetching', async () => {
      const cachedData = makeCMSResponse([{ id: 'cached', title: 'Cached' }]);
      mockGet.mockReturnValueOnce(cachedData);

      const client = new CMSClient();
      const result = await client.getBlogPosts();

      expect(result).toEqual(cachedData);
      // Retry handler should never be invoked when cache hits
      expect(mockExecute).not.toHaveBeenCalled();
    });

    it('fetches fresh data on cache miss and stores in cache', async () => {
      const freshData = makeCMSResponse([{ id: 'fresh', title: 'Fresh Post' }]);
      mockExecute.mockResolvedValueOnce(freshData);

      const client = new CMSClient();
      const result = await client.getBlogPosts();

      expect(result).toEqual(freshData);
      expect(mockSet).toHaveBeenCalledWith(
        expect.stringContaining('/blog-posts'),
        freshData,
        undefined
      );
    });
  });

  // -------------------------------------------------------------------------
  // getBlogPost (single by slug)
  // -------------------------------------------------------------------------

  describe('getBlogPost', () => {
    it('returns the first doc matching the slug', async () => {
      const post = { id: '1', title: 'Found', slug: 'found-post' };
      const response = makeCMSResponse([post]);
      mockExecute.mockResolvedValueOnce(response);

      const client = new CMSClient();
      const result = await client.getBlogPost('found-post', 'en');

      expect(result).toEqual(post);
      const endpoint = mockGet.mock.calls[0][0] as string;
      expect(endpoint).toContain('where%5Bslug%5D%5Bequals%5D=found-post');
      expect(endpoint).toContain('locale=en');
    });

    it('returns null when no docs match the slug', async () => {
      const response = makeCMSResponse([]);
      mockExecute.mockResolvedValueOnce(response);

      const client = new CMSClient();
      const result = await client.getBlogPost('nonexistent');

      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // getCaseStudies
  // -------------------------------------------------------------------------

  describe('getCaseStudies', () => {
    it('builds correct query for case studies endpoint', async () => {
      const response = makeCMSResponse([{ id: 'cs-1', title: 'Study', slug: 'study' }]);
      mockExecute.mockResolvedValueOnce(response);

      const client = new CMSClient();
      await client.getCaseStudies({ status: 'published', limit: 3, locale: 'pt' });

      const endpoint = mockGet.mock.calls[0][0] as string;
      expect(endpoint).toContain('/case-studies?');
      expect(endpoint).toContain('where%5Bstatus%5D%5Bequals%5D=published');
      expect(endpoint).toContain('limit=3');
      expect(endpoint).toContain('locale=pt');
    });
  });

  // -------------------------------------------------------------------------
  // getCaseStudy
  // -------------------------------------------------------------------------

  describe('getCaseStudy', () => {
    it('returns first matching case study by slug', async () => {
      const study = { id: 'cs-1', title: 'Case', slug: 'case-slug' };
      const response = makeCMSResponse([study]);
      mockExecute.mockResolvedValueOnce(response);

      const client = new CMSClient();
      const result = await client.getCaseStudy('case-slug');

      expect(result).toEqual(study);
    });
  });

  // -------------------------------------------------------------------------
  // getTeamMembers
  // -------------------------------------------------------------------------

  describe('getTeamMembers', () => {
    it('builds correct query with status and limit', async () => {
      const response = makeCMSResponse([{ id: 'tm-1', name: 'Member' }]);
      mockExecute.mockResolvedValueOnce(response);

      const client = new CMSClient();
      await client.getTeamMembers({ status: 'active', limit: 10 });

      const endpoint = mockGet.mock.calls[0][0] as string;
      expect(endpoint).toContain('/team-members?');
      expect(endpoint).toContain('where%5Bstatus%5D%5Bequals%5D=active');
      expect(endpoint).toContain('limit=10');
    });
  });

  // -------------------------------------------------------------------------
  // getMediaUrl
  // -------------------------------------------------------------------------

  describe('getMediaUrl', () => {
    it('returns the fully qualified media URL', async () => {
      const client = new CMSClient();
      const url = await client.getMediaUrl('abc-123');

      expect(url).toBe('http://localhost:3001/api/media/file/abc-123');
    });
  });

  // -------------------------------------------------------------------------
  // Cache management
  // -------------------------------------------------------------------------

  describe('clearCache', () => {
    it('delegates to the cache clear method', () => {
      const client = new CMSClient();
      client.clearCache('/blog-posts');

      expect(mockClear).toHaveBeenCalledWith('/blog-posts');
    });

    it('calls clear without arguments when no endpoint given', () => {
      const client = new CMSClient();
      client.clearCache();

      expect(mockClear).toHaveBeenCalledWith(undefined);
    });
  });

  describe('getCacheStats', () => {
    it('delegates to and returns cache getStats result', () => {
      const stats = { size: 3, keys: ['a', 'b', 'c'] };
      mockGetStats.mockReturnValueOnce(stats);

      const client = new CMSClient();
      const result = client.getCacheStats();

      expect(mockGetStats).toHaveBeenCalledTimes(1);
      expect(result).toEqual(stats);
    });
  });

  // -------------------------------------------------------------------------
  // Error propagation
  // -------------------------------------------------------------------------

  describe('error handling', () => {
    it('propagates errors from the retry handler', async () => {
      const networkError = new Error('Network failure');
      mockExecute.mockRejectedValueOnce(networkError);

      const client = new CMSClient();

      await expect(client.getBlogPosts()).rejects.toThrow('Network failure');
    });
  });
});
