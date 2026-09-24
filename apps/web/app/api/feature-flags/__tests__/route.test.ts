import { createHash } from 'crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.hoisted ensures these run before vi.mock factories
// ---------------------------------------------------------------------------

const { mockIsEnabled, mockGetAllFlags, MockFeatureFlagProvider } = vi.hoisted(() => {
  const isEnabled = vi.fn(() => false);
  const getAllFlags = vi.fn(() => ({}));
  // Use a named function for the provider constructor to satisfy vitest v4's
  // requirement that vi.fn() mocks use 'function' or 'class' implementations
  function FeatureFlagProviderMock() {
    return { isEnabled, getAllFlags };
  }
  const Provider = vi.fn(FeatureFlagProviderMock);
  return {
    mockIsEnabled: isEnabled,
    mockGetAllFlags: getAllFlags,
    MockFeatureFlagProvider: Provider,
  };
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  prisma: {
    featureFlag: {
      findUnique: vi.fn(() => Promise.resolve(null)),
      findMany: vi.fn(() => Promise.resolve([])),
      upsert: vi.fn(() => Promise.resolve(null)),
      update: vi.fn(() => Promise.resolve(null)),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@madfam-site/core', () => ({
  FeatureFlagProvider: MockFeatureFlagProvider,
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
  featureFlags: {},
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

vi.mock('@prisma/client', () => ({
  UserRole: { ADMIN: 'ADMIN', EDITOR: 'EDITOR', VIEWER: 'VIEWER' },
  LeadSource: {
    WEBSITE: 'WEBSITE',
    REFERRAL: 'REFERRAL',
    SOCIAL: 'SOCIAL',
    EVENT: 'EVENT',
    DIRECT: 'DIRECT',
  },
  LeadStatus: {
    NEW: 'NEW',
    CONTACTED: 'CONTACTED',
    QUALIFIED: 'QUALIFIED',
    UNQUALIFIED: 'UNQUALIFIED',
    CONVERTED: 'CONVERTED',
  },
}));

// ---------------------------------------------------------------------------
// Imports (only from resolvable modules)
// ---------------------------------------------------------------------------

import { GET } from '../route';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(url: string, init?: RequestInit & { method?: string }): NextRequest {
  return new NextRequest(new URL(url, 'http://localhost:3000'), init);
}

/**
 * Mirror the production stable rollout hash so tests can assert deterministic
 * results without depending on internal implementation details.
 */
function expectedHash(flagKey: string, identifier: string): number {
  const hash = createHash('sha256').update(`${flagKey}:${identifier}`).digest();
  return hash.readUInt32BE(0) % 100;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Feature Flags API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ENV = 'test';

    // Restore provider mock behavior after clearAllMocks wipes implementations
    mockIsEnabled.mockReturnValue(false);
    mockGetAllFlags.mockReturnValue({});
    // Named function required: vitest v4 needs 'function' or 'class' for constructor mocks
    // eslint-disable-next-line prefer-arrow-callback
    MockFeatureFlagProvider.mockImplementation(function FeatureFlagProviderMock() {
      return {
        isEnabled: mockIsEnabled,
        getAllFlags: mockGetAllFlags,
      };
    });
  });

  // =========================================================================
  // GET
  // =========================================================================

  describe('GET /api/feature-flags', () => {
    // -----------------------------------------------------------------------
    // Single flag lookup
    // -----------------------------------------------------------------------

    it('returns a specific flag from DB when ?flag=X and flag exists', async () => {
      const dbFlag = {
        key: 'NEW_FEATURE',
        name: 'New Feature',
        description: 'A shiny new feature',
        enabled: true,
        enabledDev: true,
        enabledStaging: false,
        enabledProd: false,
        rolloutPercentage: null,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const req = makeRequest(
        'http://localhost:3000/api/feature-flags?flag=NEW_FEATURE&env=development'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.key).toBe('NEW_FEATURE');
      expect(body.enabled).toBe(true);
      expect(body.source).toBe('database');
      expect(body.environment).toBe('development');
      expect(body.metadata.name).toBe('New Feature');
    });

    it('returns flag enabled state per staging environment', async () => {
      const dbFlag = {
        key: 'STAGING_FLAG',
        name: 'Staging Flag',
        description: null,
        enabled: true,
        enabledDev: false,
        enabledStaging: true,
        enabledProd: false,
        rolloutPercentage: null,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const req = makeRequest(
        'http://localhost:3000/api/feature-flags?flag=STAGING_FLAG&env=staging'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(body.enabled).toBe(true);
      expect(body.environment).toBe('staging');
    });

    it('returns flag enabled state per production environment', async () => {
      const dbFlag = {
        key: 'PROD_FLAG',
        name: 'Prod Flag',
        description: null,
        enabled: true,
        enabledDev: false,
        enabledStaging: false,
        enabledProd: true,
        rolloutPercentage: null,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const req = makeRequest(
        'http://localhost:3000/api/feature-flags?flag=PROD_FLAG&env=production'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(body.enabled).toBe(true);
    });

    it('falls back to default enabled field for unknown environment', async () => {
      const dbFlag = {
        key: 'UNKNOWN_ENV',
        name: 'Unknown Env Flag',
        description: null,
        enabled: true,
        enabledDev: false,
        enabledStaging: false,
        enabledProd: false,
        rolloutPercentage: null,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const req = makeRequest(
        'http://localhost:3000/api/feature-flags?flag=UNKNOWN_ENV&env=custom'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(body.enabled).toBe(true);
    });

    it('falls back to FeatureFlagProvider when flag is not in DB', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(null as never);
      mockIsEnabled.mockReturnValue(true);

      const req = makeRequest('http://localhost:3000/api/feature-flags?flag=UNKNOWN_FLAG');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.enabled).toBe(true);
      expect(body.source).toBe('provider');
      expect(mockIsEnabled).toHaveBeenCalledWith('UNKNOWN_FLAG');
    });

    it('falls back to provider returning false for unknown flag', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(null as never);
      mockIsEnabled.mockReturnValue(false);

      const req = makeRequest('http://localhost:3000/api/feature-flags?flag=NONEXISTENT');
      const res = await GET(req);
      const body = await res.json();

      expect(body.enabled).toBe(false);
      expect(body.source).toBe('provider');
    });

    // -----------------------------------------------------------------------
    // Rollout percentage (stable hash)
    // -----------------------------------------------------------------------

    it('applies rollout percentage only in production', async () => {
      const identifier = 'user-abc-123';
      const flagKey = 'ROLLOUT_FLAG';
      const rolloutPercentage = 50;

      const hashValue = expectedHash(flagKey, identifier);
      const shouldBeEnabled = hashValue < rolloutPercentage;

      const dbFlag = {
        key: flagKey,
        name: 'Rollout Flag',
        description: null,
        enabled: true,
        enabledDev: true,
        enabledStaging: true,
        enabledProd: true,
        rolloutPercentage,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const req = makeRequest(
        `http://localhost:3000/api/feature-flags?flag=${flagKey}&env=production&userId=${identifier}`
      );
      const res = await GET(req);
      const body = await res.json();

      expect(body.enabled).toBe(shouldBeEnabled);
    });

    it('produces the same rollout result for the same identifier (deterministic)', async () => {
      const identifier = 'stable-user';
      const flagKey = 'DETERMINISTIC_FLAG';

      const dbFlag = {
        key: flagKey,
        name: 'Deterministic',
        description: null,
        enabled: true,
        enabledDev: true,
        enabledStaging: true,
        enabledProd: true,
        rolloutPercentage: 50,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const url = `http://localhost:3000/api/feature-flags?flag=${flagKey}&env=production&userId=${identifier}`;

      const res1 = await GET(makeRequest(url));
      const body1 = await res1.json();

      const res2 = await GET(makeRequest(url));
      const body2 = await res2.json();

      expect(body1.enabled).toBe(body2.enabled);
    });

    it('skips rollout check when not in production', async () => {
      const dbFlag = {
        key: 'DEV_ROLLOUT',
        name: 'Dev Rollout',
        description: null,
        enabled: true,
        enabledDev: true,
        enabledStaging: true,
        enabledProd: true,
        rolloutPercentage: 1,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const req = makeRequest(
        'http://localhost:3000/api/feature-flags?flag=DEV_ROLLOUT&env=development'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(body.enabled).toBe(true);
    });

    it('skips rollout check when rolloutPercentage is null', async () => {
      const dbFlag = {
        key: 'NO_ROLLOUT',
        name: 'No Rollout',
        description: null,
        enabled: true,
        enabledDev: true,
        enabledStaging: true,
        enabledProd: true,
        rolloutPercentage: null,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const req = makeRequest(
        'http://localhost:3000/api/feature-flags?flag=NO_ROLLOUT&env=production'
      );
      const res = await GET(req);
      const body = await res.json();

      expect(body.enabled).toBe(true);
    });

    it('uses x-forwarded-for as identifier when userId is not provided', async () => {
      const flagKey = 'IP_ROLLOUT';
      const ip = '203.0.113.42';
      const rolloutPercentage = 50;
      const hashValue = expectedHash(flagKey, ip);
      const shouldBeEnabled = hashValue < rolloutPercentage;

      const dbFlag = {
        key: flagKey,
        name: 'IP Rollout',
        description: null,
        enabled: true,
        enabledDev: true,
        enabledStaging: true,
        enabledProd: true,
        rolloutPercentage,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(dbFlag as never);

      const req = makeRequest(
        `http://localhost:3000/api/feature-flags?flag=${flagKey}&env=production`,
        { headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` } }
      );
      const res = await GET(req);
      const body = await res.json();

      expect(body.enabled).toBe(shouldBeEnabled);
    });

    // -----------------------------------------------------------------------
    // All flags listing
    // -----------------------------------------------------------------------

    it('returns all flags when no ?flag param is provided', async () => {
      const dbFlags = [
        {
          key: 'FLAG_A',
          name: 'Flag A',
          enabled: true,
          enabledDev: true,
          enabledStaging: false,
          enabledProd: false,
          rolloutPercentage: null,
          userGroups: [],
        },
        {
          key: 'FLAG_B',
          name: 'Flag B',
          enabled: true,
          enabledDev: false,
          enabledStaging: true,
          enabledProd: false,
          rolloutPercentage: null,
          userGroups: [],
        },
      ];

      vi.mocked(prisma.featureFlag.findMany).mockResolvedValue(dbFlags as never);
      mockIsEnabled.mockReturnValue(false);

      const req = makeRequest('http://localhost:3000/api/feature-flags?env=development');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.flags).toBeDefined();
      expect(body.flags.FLAG_A).toBe(true);
      expect(body.flags.FLAG_B).toBe(false);
      expect(body.environment).toBe('development');
      expect(body.timestamp).toBeDefined();
    });

    it('merges provider flags that are not in the database', async () => {
      vi.mocked(prisma.featureFlag.findMany).mockResolvedValue([] as never);
      mockIsEnabled.mockReturnValue(true);

      const req = makeRequest('http://localhost:3000/api/feature-flags?env=development');
      const res = await GET(req);
      const body = await res.json();

      expect(body.flags.NEW_LEAD_SCORING).toBe(true);
      expect(body.flags.INTERACTIVE_CALCULATOR).toBe(true);
      expect(body.flags.CHAT_SUPPORT).toBe(true);
      expect(body.flags.PORTUGUESE_LOCALE).toBe(true);
      expect(body.flags.ADVANCED_ANALYTICS).toBe(true);
      expect(body.flags.N8N_WORKFLOWS).toBe(true);
    });

    it('does not override DB flags with provider flags when both exist', async () => {
      const dbFlags = [
        {
          key: 'NEW_LEAD_SCORING',
          name: 'Lead Scoring',
          enabled: true,
          enabledDev: false,
          enabledStaging: false,
          enabledProd: false,
          rolloutPercentage: null,
          userGroups: [],
        },
      ];

      vi.mocked(prisma.featureFlag.findMany).mockResolvedValue(dbFlags as never);
      mockIsEnabled.mockReturnValue(true);

      const req = makeRequest('http://localhost:3000/api/feature-flags?env=development');
      const res = await GET(req);
      const body = await res.json();

      expect(body.flags.NEW_LEAD_SCORING).toBe(false);
    });

    // -----------------------------------------------------------------------
    // Database unavailability fallback
    // -----------------------------------------------------------------------

    it('falls back to provider when DB throws on single flag lookup', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockRejectedValue(
        new Error('DB connection lost') as never
      );
      mockIsEnabled.mockReturnValue(true);

      const req = makeRequest('http://localhost:3000/api/feature-flags?flag=BROKEN');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.source).toBe('provider');
      expect(body.enabled).toBe(true);
      expect(mockIsEnabled).toHaveBeenCalledWith('BROKEN');
    });

    it('falls back to provider-only flags when DB throws on findMany', async () => {
      vi.mocked(prisma.featureFlag.findMany).mockRejectedValue(
        new Error('DB connection lost') as never
      );
      mockIsEnabled.mockReturnValue(false);

      const req = makeRequest('http://localhost:3000/api/feature-flags?env=development');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.flags).toBeDefined();
      // Should still contain provider flags (all false since mockIsEnabled returns false)
      expect(body.flags.NEW_LEAD_SCORING).toBe(false);
      expect(body.flags.CHAT_SUPPORT).toBe(false);
    });
  });

  // =========================================================================
  // POST
  // =========================================================================
});
