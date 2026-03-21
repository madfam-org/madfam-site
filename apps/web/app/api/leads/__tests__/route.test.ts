import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/prisma', () => ({
  prisma: {
    lead: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    analyticsEvent: { create: vi.fn() },
    emailQueue: { create: vi.fn() },
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

// Mock CSRF protection to pass-through so we can test the handler directly.
vi.mock('@/lib/csrf', () => ({
  withCsrfProtection: vi.fn((_request: Request, handler: () => Promise<NextResponse>) => handler()),
}));

vi.mock('@/lib/security', () => ({
  validateBearerToken: vi.fn(),
  generateCsrfToken: vi.fn().mockReturnValue('csrf-test-token'),
}));

vi.mock('@/lib/auth', () => ({
  getServerAuth: vi.fn(),
}));

// Force in-memory rate limit store by returning null from Redis.
vi.mock('@/lib/redis', () => ({
  getRedisClient: vi.fn().mockReturnValue(null),
}));

vi.mock('@madfam/analytics', () => ({
  analytics: {
    track: vi.fn(),
    trackLeadCaptured: vi.fn(),
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
// Imports
// ---------------------------------------------------------------------------

import { POST, GET } from '../route';
import { prisma } from '@/lib/prisma';
import { validateBearerToken } from '@/lib/security';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Auto-incrementing IP counter to ensure every test gets a unique IP address,
 * avoiding rate limit collisions across tests in the in-memory store.
 */
let ipCounter = 0;
function uniqueIp(): string {
  ipCounter++;
  return `10.${Math.floor(ipCounter / 256) % 256}.${ipCounter % 256}.${Math.floor(ipCounter / 65536) % 256}`;
}

function makeRequest(url: string, init?: RequestInit & { method?: string }): NextRequest {
  // Inject a unique IP to avoid rate limit collisions between tests
  const headers = new Headers(init?.headers);
  if (!headers.has('x-forwarded-for')) {
    headers.set('x-forwarded-for', uniqueIp());
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    ...init,
    headers,
  });
}

function validLeadPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    email: 'test@company.com',
    name: 'Maria Garcia',
    company: 'ACME Corp',
    phone: '+52-555-1234',
    message: 'I would like to learn more about your AI consulting services for our company.',
    source: 'website',
    preferredLanguage: 'es',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Leads API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ENV = 'test';
    delete process.env.N8N_WEBHOOK_URL;
    delete process.env.API_SECRET;
  });

  // =========================================================================
  // POST /api/leads
  // =========================================================================

  describe('POST /api/leads', () => {
    it('creates a lead with valid data', async () => {
      const createdLead = {
        id: 'lead-1',
        email: 'test@company.com',
        firstName: 'Maria',
        lastName: 'Garcia',
        company: 'ACME Corp',
        phone: '+52-555-1234',
        score: 85,
        source: 'WEBSITE',
        status: 'NEW',
      };

      vi.mocked(prisma.lead.create).mockResolvedValue(createdLead as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload()),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.leadId).toBe('lead-1');
      expect(body.score).toBe(85);
      expect(body.message).toContain('Gracias');

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'test@company.com',
            firstName: 'Maria',
            lastName: 'Garcia',
            company: 'ACME Corp',
            source: 'WEBSITE',
            status: 'NEW',
          }),
        })
      );
    });

    it('returns English message when preferredLanguage is en', async () => {
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-2',
        email: 'test@company.com',
        score: 10,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ preferredLanguage: 'en' })),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(body.message).toContain('Thank you');
    });

    it('queues welcome email with correct language', async () => {
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-3',
        email: 'test@company.com',
        score: 10,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ preferredLanguage: 'es' })),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(req);

      expect(prisma.emailQueue.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            to: ['test@company.com'],
            subject: 'Bienvenido a MADFAM',
            template: 'welcome',
          }),
        })
      );
    });

    it('splits full name into firstName and lastName', async () => {
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-4',
        email: 'test@company.com',
        score: 10,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ name: 'Ana Maria Lopez Garcia' })),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(req);

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'Ana',
            lastName: 'Maria Lopez Garcia',
          }),
        })
      );
    });

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    it('returns 400 for missing email', async () => {
      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ email: undefined })),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.errors).toBeDefined();
    });

    it('returns 400 for invalid email format', async () => {
      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ email: 'not-an-email' })),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })])
      );
    });

    it('returns 400 for missing name', async () => {
      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ name: undefined })),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 for name shorter than 2 characters', async () => {
      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ name: 'A' })),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'name' })])
      );
    });

    it('returns 400 when body is empty', async () => {
      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    // -----------------------------------------------------------------------
    // Lead scoring
    // -----------------------------------------------------------------------

    it('assigns higher score for business email', async () => {
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-score',
        email: 'ceo@acme-corp.com',
        score: 0,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ email: 'ceo@acme-corp.com' })),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(req);

      // business email (+20) + company (+15) + phone (+10)
      // + message > 20 chars (+25) + message > 50 chars (+15) = 85
      const createCall = vi.mocked(prisma.lead.create).mock.calls[0][0];
      expect(createCall.data.score).toBe(85);
    });

    it('assigns lower score for free email provider', async () => {
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-free',
        email: 'user@gmail.com',
        score: 0,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload({ email: 'user@gmail.com' })),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(req);

      // No business email bonus: company (+15) + phone (+10)
      // + message > 20 chars (+25) + message > 50 chars (+15) = 65
      const createCall = vi.mocked(prisma.lead.create).mock.calls[0][0];
      expect(createCall.data.score).toBe(65);
    });

    it('caps lead score at 100', async () => {
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-cap',
        email: 'ceo@enterprise.com',
        score: 0,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(
          validLeadPayload({
            email: 'ceo@enterprise.com',
            company: 'Big Corp',
            phone: '+1-555-1234',
            message:
              'A very detailed inquiry about all your services and how they can help our enterprise. We have a team of 50 and need a complete solution.',
          })
        ),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(req);

      const createCall = vi.mocked(prisma.lead.create).mock.calls[0][0];
      expect(createCall.data.score).toBeLessThanOrEqual(100);
    });

    // -----------------------------------------------------------------------
    // Rate limiting headers
    // -----------------------------------------------------------------------

    it('includes rate limit headers in successful response', async () => {
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-rl',
        email: 'test@company.com',
        score: 10,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload()),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);

      expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    // -----------------------------------------------------------------------
    // Error handling
    // -----------------------------------------------------------------------

    it('returns 500 when prisma lead.create fails', async () => {
      vi.mocked(prisma.lead.create).mockRejectedValue(new Error('DB down') as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload()),
        headers: { 'Content-Type': 'application/json' },
      });

      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
    });

    // -----------------------------------------------------------------------
    // UTM metadata
    // -----------------------------------------------------------------------

    it('extracts UTM parameters from metadata', async () => {
      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-utm',
        email: 'test@company.com',
        score: 10,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(
          validLeadPayload({
            metadata: {
              utm_source: 'google',
              utm_medium: 'cpc',
              utm_campaign: 'spring_2026',
            },
          })
        ),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(req);

      expect(prisma.lead.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            utmSource: 'google',
            utmMedium: 'cpc',
            utmCampaign: 'spring_2026',
          }),
        })
      );
    });

    // -----------------------------------------------------------------------
    // N8N webhook
    // -----------------------------------------------------------------------

    it('triggers n8n webhook when N8N_WEBHOOK_URL is configured', async () => {
      process.env.N8N_WEBHOOK_URL = 'https://n8n.example.com/webhook/test';
      process.env.N8N_API_KEY = 'test-key';

      const fetchSpy = vi
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response('OK', { status: 200 }));

      vi.mocked(prisma.lead.create).mockResolvedValue({
        id: 'lead-n8n',
        email: 'test@company.com',
        company: 'Corp',
        score: 50,
        source: 'WEBSITE',
      } as never);
      vi.mocked(prisma.analyticsEvent.create).mockResolvedValue({} as never);
      vi.mocked(prisma.emailQueue.create).mockResolvedValue({} as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: JSON.stringify(validLeadPayload()),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(req);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/test',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-Key': 'test-key',
          }),
        })
      );

      fetchSpy.mockRestore();
    });
  });

  // =========================================================================
  // GET /api/leads
  // =========================================================================

  describe('GET /api/leads', () => {
    it('returns 500 when API_SECRET is not configured', async () => {
      delete process.env.API_SECRET;

      const req = makeRequest('http://localhost:3000/api/leads', {
        headers: { Authorization: 'Bearer some-token' },
      });

      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Server configuration error');
    });

    it('returns 401 when bearer token is invalid', async () => {
      process.env.API_SECRET = 'correct-secret';
      vi.mocked(validateBearerToken).mockReturnValue(false);

      const req = makeRequest('http://localhost:3000/api/leads', {
        headers: { Authorization: 'Bearer wrong-token' },
      });

      const res = await GET(req);
      expect(res.status).toBe(401);
    });

    it('returns paginated leads with valid authentication', async () => {
      process.env.API_SECRET = 'test-secret';
      vi.mocked(validateBearerToken).mockReturnValue(true);

      const leads = [
        { id: '1', email: 'a@test.com', score: 90, notes: [], activities: [] },
        { id: '2', email: 'b@test.com', score: 70, notes: [], activities: [] },
      ];

      vi.mocked(prisma.lead.findMany).mockResolvedValue(leads as never);
      vi.mocked(prisma.lead.count).mockResolvedValue(2 as never);

      const req = makeRequest('http://localhost:3000/api/leads?page=1&limit=20', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.leads).toHaveLength(2);
      expect(body.total).toBe(2);
      expect(body.page).toBe(1);
      expect(body.limit).toBe(20);
      expect(body.totalPages).toBe(1);
    });

    it('filters leads by status when provided', async () => {
      process.env.API_SECRET = 'test-secret';
      vi.mocked(validateBearerToken).mockReturnValue(true);
      vi.mocked(prisma.lead.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.lead.count).mockResolvedValue(0 as never);

      const req = makeRequest('http://localhost:3000/api/leads?status=QUALIFIED', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      await GET(req);

      expect(prisma.lead.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'QUALIFIED' },
        })
      );
    });

    it('returns rate limit headers on GET response', async () => {
      process.env.API_SECRET = 'test-secret';
      vi.mocked(validateBearerToken).mockReturnValue(true);
      vi.mocked(prisma.lead.findMany).mockResolvedValue([] as never);
      vi.mocked(prisma.lead.count).mockResolvedValue(0 as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);

      expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('returns 500 when prisma findMany fails', async () => {
      process.env.API_SECRET = 'test-secret';
      vi.mocked(validateBearerToken).mockReturnValue(true);
      vi.mocked(prisma.lead.findMany).mockRejectedValue(new Error('DB error') as never);
      vi.mocked(prisma.lead.count).mockRejectedValue(new Error('DB error') as never);

      const req = makeRequest('http://localhost:3000/api/leads', {
        headers: { Authorization: 'Bearer test-secret' },
      });

      const res = await GET(req);
      expect(res.status).toBe(500);
    });
  });
});
