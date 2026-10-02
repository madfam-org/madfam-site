import { describe, it, expect, vi } from 'vitest';

vi.mock('../environment', () => ({
  environment: { isDevelopment: false },
}));

vi.mock('@madfam-site/core', () => ({
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

import {
  FALLBACK_DATA_VERSION,
  FallbackDataManager,
  fallbackDataManager,
  getFallbackBlogPosts,
  getFallbackBlogPost,
  getFallbackCaseStudies,
  getFallbackCaseStudy,
  getFallbackTeamMembers,
} from '../fallback-data';

describe('Fallback Data Manager', () => {
  it('FALLBACK_DATA_VERSION is defined as 1.0.0', () => {
    expect(FALLBACK_DATA_VERSION).toBe('1.0.0');
  });

  it('singleton returns the same instance on repeated calls', () => {
    const first = FallbackDataManager.getInstance();
    const second = FallbackDataManager.getInstance();

    expect(first).toBe(second);
    expect(first).toBe(fallbackDataManager);
  });

  describe('getBlogPosts', () => {
    it('carries no fallback blog posts (the invented ones were removed)', () => {
      expect(fallbackDataManager.getBlogPosts()).toEqual([]);
    });
  });

  describe('getBlogPost', () => {
    it('no longer resolves a removed invented post', () => {
      expect(fallbackDataManager.getBlogPost('customer-success-automation')).toBeNull();
    });

    it('returns null for a non-existent slug', () => {
      const post = fallbackDataManager.getBlogPost('non-existent-slug');

      expect(post).toBeNull();
    });
  });

  describe('getCaseStudies', () => {
    it('carries no fallback case studies (the invented clients were removed)', () => {
      expect(fallbackDataManager.getCaseStudies()).toEqual([]);
    });
  });

  describe('getCaseStudy', () => {
    it('no longer resolves a removed invented case study', () => {
      expect(fallbackDataManager.getCaseStudy('makerspace-fabrication-automation')).toBeNull();
    });

    it('returns null for a non-existent slug', () => {
      const study = fallbackDataManager.getCaseStudy('does-not-exist');

      expect(study).toBeNull();
    });
  });

  describe('getTeamMembers', () => {
    it('returns all 4 active team members', () => {
      const members = fallbackDataManager.getTeamMembers();

      expect(members).toHaveLength(4);
      for (const member of members) {
        expect(member.status).toBe('active');
        expect(member.id).toBeDefined();
        expect(member.name).toBeDefined();
        expect(member.position).toBeDefined();
      }
    });
  });

  describe('getDataSetInfo', () => {
    it('returns correct version and counts', () => {
      const info = fallbackDataManager.getDataSetInfo();

      expect(info.version).toBe('1.0.0');
      expect(info.lastUpdated).toBeDefined();
      expect(info.counts).toEqual({
        blogPosts: 0,
        caseStudies: 0,
        teamMembers: 4,
      });
    });
  });

  describe('validateData', () => {
    it('passes validation for the built-in fallback data', () => {
      const result = fallbackDataManager.validateData();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('convenience functions', () => {
    it('delegate to the singleton instance and return matching results', () => {
      const instance = FallbackDataManager.getInstance();

      expect(getFallbackBlogPosts()).toEqual(instance.getBlogPosts());
      expect(getFallbackBlogPost('future-ai-business-transformation')).toEqual(
        instance.getBlogPost('future-ai-business-transformation')
      );
      expect(getFallbackCaseStudies()).toEqual(instance.getCaseStudies());
      expect(getFallbackCaseStudy('agriexport-ai-transformation')).toEqual(
        instance.getCaseStudy('agriexport-ai-transformation')
      );
      expect(getFallbackTeamMembers()).toEqual(instance.getTeamMembers());
    });
  });
});
