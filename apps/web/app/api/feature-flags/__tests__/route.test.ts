import { createHash } from 'crypto';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Hoisted mocks — vi.hoisted ensures these run before vi.mock factories
// ---------------------------------------------------------------------------

const { mockIsEnabled, mockGetAllFlags, MockFeatureFlagProvider } = vi.hoisted(() => {
  const mockIsEnabled = vi.fn().mockReturnValue(false);
  const mockGetAllFlags = vi.fn().mockReturnValue({});
  const MockFeatureFlagProvider = vi.fn().mockImplementation(function (this: unknown) {
    return { isEnabled: mockIsEnabled, getAllFlags: mockGetAllFlags };
  });
  return { mockIsEnabled, mockGetAllFlags, MockFeatureFlagProvider };
});

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  prisma: {
    featureFlag: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getServerAuth: vi.fn(),
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

import { GET, POST, PATCH } from '../route';
import { prisma } from '@/lib/prisma';
import { getServerAuth } from '@/lib/auth';

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
    MockFeatureFlagProvider.mockImplementation(function (this: unknown) {
      return { isEnabled: mockIsEnabled, getAllFlags: mockGetAllFlags };
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
    // Error handling
    // -----------------------------------------------------------------------

    it('returns 500 when an unexpected error occurs', async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockRejectedValue(
        new Error('DB connection lost') as never
      );

      const req = makeRequest('http://localhost:3000/api/feature-flags?flag=BROKEN');
      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Failed to fetch feature flags');
    });
  });

  // =========================================================================
  // POST
  // =========================================================================

  describe('POST /api/feature-flags', () => {
    it('returns 401 when there is no session', async () => {
      vi.mocked(getServerAuth).mockResolvedValue(null);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: 'TEST', name: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Unauthorized');
    });

    it('returns 403 when user is not an ADMIN', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'user-1', role: 'EDITOR', email: 'editor@example.com' },
        csrfToken: 'tok',
      } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: 'TEST', name: 'Test' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toContain('Forbidden');
    });

    it('returns 400 for invalid Zod input (bad key format)', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: 'lowercase-bad', name: 'Bad' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe('Invalid input');
      expect(body.details).toBeDefined();
    });

    it('returns 400 when name is missing', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: 'VALID_KEY' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when key exceeds max length', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      const longKey = 'A'.repeat(51);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: longKey, name: 'Long' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for rolloutPercentage out of range', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: 'VALID_KEY', name: 'Valid', rolloutPercentage: 150 }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('creates/upserts a feature flag successfully', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      const createdFlag = {
        id: 'flag-1',
        key: 'NEW_FEATURE',
        name: 'New Feature',
        description: 'desc',
        enabled: true,
        enabledDev: true,
        enabledStaging: false,
        enabledProd: false,
        rolloutPercentage: null,
        userGroups: [],
      };

      vi.mocked(prisma.featureFlag.upsert).mockResolvedValue(createdFlag as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({
          key: 'NEW_FEATURE',
          name: 'New Feature',
          description: 'desc',
          enabledDev: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.flag.key).toBe('NEW_FEATURE');

      expect(prisma.featureFlag.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { key: 'NEW_FEATURE' },
          create: expect.objectContaining({ key: 'NEW_FEATURE', name: 'New Feature' }),
          update: expect.objectContaining({ name: 'New Feature' }),
        })
      );
    });

    it('returns 500 when prisma upsert fails', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      vi.mocked(prisma.featureFlag.upsert).mockRejectedValue(new Error('DB error') as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'POST',
        body: JSON.stringify({ key: 'FAIL_FLAG', name: 'Fail' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });

  // =========================================================================
  // PATCH
  // =========================================================================

  describe('PATCH /api/feature-flags', () => {
    it('returns 401 when there is no session', async () => {
      vi.mocked(getServerAuth).mockResolvedValue(null);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'FLAG', enabled: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      expect(res.status).toBe(401);
    });

    it('returns 403 when user is not an ADMIN', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'viewer-1', role: 'VIEWER' },
        csrfToken: 'tok',
      } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'FLAG', enabled: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      expect(res.status).toBe(403);
    });

    it('returns 404 when the flag does not exist', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(null as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'MISSING_FLAG', enabled: false }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe('Feature flag not found');
    });

    it('toggles flag for development environment by default', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        key: 'TOGGLE_FLAG',
        enabledDev: false,
      } as never);

      const updatedFlag = { key: 'TOGGLE_FLAG', enabledDev: true };
      vi.mocked(prisma.featureFlag.update).mockResolvedValue(updatedFlag as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'TOGGLE_FLAG', enabled: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);

      expect(prisma.featureFlag.update).toHaveBeenCalledWith({
        where: { key: 'TOGGLE_FLAG' },
        data: { enabledDev: true },
      });
    });

    it('toggles flag for staging environment', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        key: 'STAGING_TOG',
      } as never);

      vi.mocked(prisma.featureFlag.update).mockResolvedValue({ key: 'STAGING_TOG' } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'STAGING_TOG', enabled: false, environment: 'staging' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);

      expect(prisma.featureFlag.update).toHaveBeenCalledWith({
        where: { key: 'STAGING_TOG' },
        data: { enabledStaging: false },
      });
    });

    it('toggles flag for production environment', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        key: 'PROD_TOG',
      } as never);

      vi.mocked(prisma.featureFlag.update).mockResolvedValue({ key: 'PROD_TOG' } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'PROD_TOG', enabled: true, environment: 'production' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      expect(res.status).toBe(200);

      expect(prisma.featureFlag.update).toHaveBeenCalledWith({
        where: { key: 'PROD_TOG' },
        data: { enabledProd: true },
      });
    });

    it('returns 400 for invalid Zod input (missing key)', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ enabled: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid environment value', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'FLAG', enabled: true, environment: 'invalid-env' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      expect(res.status).toBe(400);
    });

    it('returns 500 when prisma update fails', async () => {
      vi.mocked(getServerAuth).mockResolvedValue({
        user: { id: 'admin-1', role: 'ADMIN' },
        csrfToken: 'tok',
      } as never);

      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        key: 'ERR_FLAG',
      } as never);

      vi.mocked(prisma.featureFlag.update).mockRejectedValue(new Error('DB write error') as never);

      const req = makeRequest('http://localhost:3000/api/feature-flags', {
        method: 'PATCH',
        body: JSON.stringify({ key: 'ERR_FLAG', enabled: true }),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await PATCH(req);
      expect(res.status).toBe(500);
    });
  });
});
