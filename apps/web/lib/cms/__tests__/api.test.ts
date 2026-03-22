import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mock functions - vi.hoisted ensures these are available when
// vi.mock factories execute (vi.mock calls are hoisted above imports).
// ---------------------------------------------------------------------------

const { mockGetBlogPosts, mockGetCaseStudies, mockGetTeamMembers } = vi.hoisted(() => ({
  mockGetBlogPosts: vi.fn(),
  mockGetCaseStudies: vi.fn(),
  mockGetTeamMembers: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('../../environment', () => ({
  environment: {
    cms: { enabled: false, url: 'http://localhost:3001' },
    isDevelopment: false,
  },
}));

vi.mock('../../fallback-data', () => ({
  getFallbackBlogPosts: vi.fn(() => [
    { id: '1', title: 'Test Post', slug: 'test-post' },
    { id: '2', title: 'Test Post 2', slug: 'test-post-2' },
  ]),
  getFallbackCaseStudies: vi.fn(() => [{ id: 'cs-1', title: 'Test Study', slug: 'test-study' }]),
  getFallbackTeamMembers: vi.fn(() => [
    { id: 'tm-1', name: 'Test Member' },
    { id: 'tm-2', name: 'Test Member 2' },
  ]),
}));

vi.mock('../client', () => {
  const MockCMSClient = vi.fn(function (this: Record<string, unknown>) {
    this.getBlogPosts = mockGetBlogPosts;
    this.getCaseStudies = mockGetCaseStudies;
    this.getTeamMembers = mockGetTeamMembers;
  });
  return { CMSClient: MockCMSClient };
});

vi.mock('../../performance-monitor', () => ({
  performanceMonitor: {
    measureCMSRequest: vi.fn((_name: string, fn: () => Promise<unknown>) =>
      fn().then(result => ({ result, metrics: { responseTime: 100 } }))
    ),
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
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { environment } from '../../environment';
import { getPublishedBlogPosts, getPublishedCaseStudies, getActiveTeamMembers } from '../api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function enableCMS(): void {
  (environment as { cms: { enabled: boolean } }).cms.enabled = true;
}

function disableCMS(): void {
  (environment as { cms: { enabled: boolean } }).cms.enabled = false;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CMS API Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disableCMS();
  });

  // -------------------------------------------------------------------------
  // getPublishedBlogPosts
  // -------------------------------------------------------------------------
  describe('getPublishedBlogPosts', () => {
    it('returns fallback data when CMS is disabled', async () => {
      const result = await getPublishedBlogPosts();

      expect(result.docs).toHaveLength(2);
      expect(result.docs[0]).toEqual(expect.objectContaining({ id: '1', title: 'Test Post' }));
    });

    it('returns source "fallback" when CMS is disabled', async () => {
      const result = await getPublishedBlogPosts();

      expect(result.source).toBe('fallback');
    });

    it('respects limit parameter with fallback data', async () => {
      const result = await getPublishedBlogPosts(undefined, 1);

      expect(result.docs).toHaveLength(1);
      expect(result.totalDocs).toBe(2);
      expect(result.totalPages).toBe(2);
    });

    it('returns CMS data with source "cms" when CMS is enabled', async () => {
      enableCMS();

      const cmsResponse = {
        docs: [{ id: 'cms-1', title: 'CMS Post', slug: 'cms-post' }],
        totalDocs: 1,
        totalPages: 1,
      };
      mockGetBlogPosts.mockResolvedValueOnce(cmsResponse);

      const result = await getPublishedBlogPosts('en', 10);

      expect(result.source).toBe('cms');
      expect(result.docs).toEqual(cmsResponse.docs);
      expect(result.metrics).toEqual(expect.objectContaining({ responseTime: 100 }));
    });

    it('falls back on CMS error when CMS is enabled', async () => {
      enableCMS();

      mockGetBlogPosts.mockRejectedValueOnce(new Error('CMS unavailable'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const result = await getPublishedBlogPosts();

      expect(result.source).toBe('fallback');
      expect(result.docs).toHaveLength(2);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch blog posts from CMS:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
      warnSpy.mockRestore();
    });

    it('uses custom fallbackData when provided and CMS is disabled', async () => {
      const customFallback = [{ id: 'custom-1', title: 'Custom Post', slug: 'custom' }] as never[];

      const result = await getPublishedBlogPosts(undefined, 10, customFallback);

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toEqual(
        expect.objectContaining({ id: 'custom-1', title: 'Custom Post' })
      );
      expect(result.source).toBe('fallback');
    });
  });

  // -------------------------------------------------------------------------
  // getPublishedCaseStudies
  // -------------------------------------------------------------------------
  describe('getPublishedCaseStudies', () => {
    it('returns fallback data when CMS is disabled', async () => {
      const result = await getPublishedCaseStudies();

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toEqual(expect.objectContaining({ id: 'cs-1', title: 'Test Study' }));
    });

    it('returns source "fallback" when CMS is disabled', async () => {
      const result = await getPublishedCaseStudies();

      expect(result.source).toBe('fallback');
    });

    it('returns correct totalDocs and totalPages', async () => {
      const result = await getPublishedCaseStudies(undefined, 10);

      expect(result.totalDocs).toBe(1);
      expect(result.totalPages).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // getActiveTeamMembers
  // -------------------------------------------------------------------------
  describe('getActiveTeamMembers', () => {
    it('returns fallback data when CMS is disabled', async () => {
      const result = await getActiveTeamMembers();

      expect(result.docs).toHaveLength(2);
      expect(result.docs[0]).toEqual(expect.objectContaining({ id: 'tm-1', name: 'Test Member' }));
    });

    it('returns source "fallback" when CMS is disabled', async () => {
      const result = await getActiveTeamMembers();

      expect(result.source).toBe('fallback');
    });

    it('uses custom fallbackData when provided', async () => {
      const customMembers = [{ id: 'custom-tm', name: 'Custom Member' }] as never[];

      const result = await getActiveTeamMembers(20, customMembers);

      expect(result.docs).toHaveLength(1);
      expect(result.docs[0]).toEqual(
        expect.objectContaining({ id: 'custom-tm', name: 'Custom Member' })
      );
      expect(result.totalDocs).toBe(1);
      expect(result.source).toBe('fallback');
    });
  });
});
