import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks - must be declared before any import of the module under test
// ---------------------------------------------------------------------------

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
// Helpers
// ---------------------------------------------------------------------------

/**
 * Dynamically imports the environment module after resetting the module
 * registry so that `process.env` is re-evaluated from scratch.
 */
async function importEnvironment() {
  return import('../environment');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lib/environment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Shallow clone so each test starts with a clean env object
    process.env = { ...originalEnv };
    vi.resetModules();
    // Suppress console.log / console.warn from the development side-effect
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Environment type detection
  // -----------------------------------------------------------------------

  describe('environment type detection', () => {
    it('detects development environment type', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_ENV;

      const { environment } = await importEnvironment();

      expect(environment.type).toBe('development');
      expect(environment.isDevelopment).toBe(true);
      expect(environment.isProduction).toBe(false);
      expect(environment.isStaging).toBe(false);
    });

    it('detects staging environment type', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'staging';

      const { environment } = await importEnvironment();

      expect(environment.type).toBe('staging');
      expect(environment.isStaging).toBe(true);
      expect(environment.isProduction).toBe(false);
      expect(environment.isDevelopment).toBe(false);
    });

    it('detects production environment type', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';

      const { environment } = await importEnvironment();

      expect(environment.type).toBe('production');
      expect(environment.isProduction).toBe(true);
      expect(environment.isDevelopment).toBe(false);
      expect(environment.isStaging).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Deploy target / static export
  // -----------------------------------------------------------------------

  describe('deploy target and static export', () => {
    it('sets isStaticExport when DEPLOY_TARGET is github-pages', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      process.env.DEPLOY_TARGET = 'github-pages';

      const { environment } = await importEnvironment();

      expect(environment.deployTarget).toBe('github-pages');
      expect(environment.isStaticExport).toBe(true);
    });

    it('defaults deploy target to vercel', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      delete process.env.DEPLOY_TARGET;

      const { environment } = await importEnvironment();

      expect(environment.deployTarget).toBe('vercel');
      expect(environment.isStaticExport).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // Feature flags
  // -----------------------------------------------------------------------

  describe('feature flags', () => {
    it('enables database feature when DATABASE_URL is set and not static export', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      delete process.env.DEPLOY_TARGET;

      const { environment } = await importEnvironment();

      expect(environment.features.database).toBe(true);
    });

    it('disables database feature on static export even with DATABASE_URL', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.DEPLOY_TARGET = 'github-pages';

      const { environment } = await importEnvironment();

      expect(environment.features.database).toBe(false);
    });

    it('enables cms feature when NEXT_PUBLIC_CMS_URL is set and not static export', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      process.env.NEXT_PUBLIC_CMS_URL = 'https://cms.madfam.io';
      delete process.env.DEPLOY_TARGET;

      const { environment } = await importEnvironment();

      expect(environment.features.cms).toBe(true);
    });

    it('always enables analytics', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';

      const { environment } = await importEnvironment();

      expect(environment.features.analytics).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getApiUrl
  // -----------------------------------------------------------------------

  describe('getApiUrl', () => {
    it('builds correct URL with leading-slash path', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.DEPLOY_TARGET;

      const { getApiUrl } = await importEnvironment();

      expect(getApiUrl('/health')).toBe('/api/health');
    });

    it('handles path without leading slash', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.DEPLOY_TARGET;

      const { getApiUrl } = await importEnvironment();

      expect(getApiUrl('health')).toBe('/api/health');
    });

    it('returns base URL when no path is provided', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      delete process.env.NEXT_PUBLIC_API_URL;
      delete process.env.DEPLOY_TARGET;

      const { getApiUrl } = await importEnvironment();

      expect(getApiUrl()).toBe('/api');
    });
  });

  // -----------------------------------------------------------------------
  // getCmsUrl
  // -----------------------------------------------------------------------

  describe('getCmsUrl', () => {
    it('builds correct URL from NEXT_PUBLIC_CMS_URL', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      process.env.NEXT_PUBLIC_CMS_URL = 'https://cms.madfam.io';

      const { getCmsUrl } = await importEnvironment();

      expect(getCmsUrl('/api/pages')).toBe('https://cms.madfam.io/api/pages');
    });

    it('falls back to localhost URL in development without CMS URL', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_CMS_URL;
      delete process.env.DEPLOY_TARGET;

      const { getCmsUrl } = await importEnvironment();

      expect(getCmsUrl('/api/pages')).toBe('http://localhost:3001/api/pages');
    });
  });

  // -----------------------------------------------------------------------
  // isFeatureEnabled
  // -----------------------------------------------------------------------

  describe('isFeatureEnabled', () => {
    it('returns true for an enabled feature', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      // analytics is always true
      const { isFeatureEnabled } = await importEnvironment();

      expect(isFeatureEnabled('analytics')).toBe(true);
    });

    it('returns false for a disabled feature', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_CMS_URL;
      delete process.env.DEPLOY_TARGET;

      const { isFeatureEnabled } = await importEnvironment();

      // cms is disabled when NEXT_PUBLIC_CMS_URL is not set
      expect(isFeatureEnabled('cms')).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // validateEnvironment
  // -----------------------------------------------------------------------

  describe('validateEnvironment', () => {
    it('passes validation in development', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_ENV;

      const { validateEnvironment } = await importEnvironment();
      const result = validateEnvironment();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('reports missing DATABASE_URL in production when database is enabled', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      // DATABASE_URL present at config time so features.database = true
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      delete process.env.DEPLOY_TARGET;

      const mod = await importEnvironment();

      // Now remove DATABASE_URL so validateEnvironment detects the gap
      delete process.env.DATABASE_URL;

      const result = mod.validateEnvironment();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'DATABASE_URL is required in production when database feature is enabled'
      );
    });
  });

  // -----------------------------------------------------------------------
  // getEnvironmentInfo
  // -----------------------------------------------------------------------

  describe('getEnvironmentInfo', () => {
    it('returns only enabled feature names', async () => {
      process.env.NODE_ENV = 'production';
      process.env.NEXT_PUBLIC_ENV = 'production';
      delete process.env.DATABASE_URL;
      delete process.env.NEXT_PUBLIC_CMS_URL;
      delete process.env.DEPLOY_TARGET;
      delete process.env.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED;
      delete process.env.SENTRY_DSN;

      const { getEnvironmentInfo, environment } = await importEnvironment();
      const info = getEnvironmentInfo();

      // Collect the features we expect to be enabled from the environment
      const expectedFeatures = Object.entries(environment.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature);

      expect(info.features).toEqual(expectedFeatures);
      expect(info.environment).toBe('production');
      expect(info.deployTarget).toBe('vercel');
    });

    it('includes build information', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.NEXT_PUBLIC_ENV;

      const { getEnvironmentInfo } = await importEnvironment();
      const info = getEnvironmentInfo();

      expect(info).toHaveProperty('timestamp');
      expect(info).toHaveProperty('commit');
      expect(info).toHaveProperty('branch');
      expect(info).toHaveProperty('version');
    });
  });
});
