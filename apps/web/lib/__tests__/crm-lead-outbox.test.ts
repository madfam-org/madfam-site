import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));
// The Prisma store is not exercised here; the delivery logic runs against an
// in-memory store with the same unique key (lead) and claim rule.
vi.mock('@/lib/prisma', () => ({ prisma: {} }));

import {
  MAX_DELIVERY_ATTEMPTS,
  captureLeadForCrm,
  crmLeadIntakeHealth,
  isPermanentRejection,
  missingCrmConfig,
  outboxBackoffMs,
  replayPendingCrmLeads,
  reportCrmConfigAtStartup,
  type OutboxCounts,
  type OutboxRow,
  type OutboxStore,
} from '../crm-lead-outbox';
import { buildLeadCapturedEvent, leadEventId, type LeadSubmission } from '../phynd-crm';
import { apiLogger } from '@/lib/logger';

const BASE_URL = 'https://crm.example.test';
const SECRET = 'lead-intake-secret-for-tests-only';
const LEAD = {
  id: 'clead0000000000000000042',
  createdAt: new Date('2026-11-20T09:59:00.000Z'),
  budget: '100k-500k-mxn',
  timeframe: '30-days',
  score: 75,
};
const SUBMISSION: LeadSubmission = {
  name: 'Persona Prueba',
  email: 'persona@example.com',
  message: 'Queremos una demo.',
  preferredLanguage: 'es',
  metadata: { intent: 'platform', budget: '100k-500k-mxn', timeline: '30-days' },
};

type MemRow = OutboxRow & {
  eventId: string;
  nextAttemptAt: Date;
  lockedUntil: Date | null;
  lastError: string | null;
  createdAt: Date;
};

function memoryStore(): OutboxStore & { rows: MemRow[] } {
  const rows: MemRow[] = [];
  let seq = 0;
  const find = (id: string): MemRow => {
    const row = rows.find(r => r.id === id);
    if (!row) throw new Error('row not found');
    return row;
  };
  return {
    rows,
    async insert({ leadId, eventId, body }) {
      const existing = rows.find(r => r.leadId === leadId);
      if (existing) return { ...existing };
      const now = new Date();
      const row: MemRow = {
        id: `row-${++seq}`,
        leadId,
        eventId,
        body,
        status: 'pending',
        attempts: 0,
        nextAttemptAt: now,
        lockedUntil: null,
        lastError: null,
        createdAt: now,
      };
      rows.push(row);
      return { ...row };
    },
    async claim(row, now, claimMs) {
      const r = find(row.id);
      if (r.status !== 'pending') return false;
      if (r.lockedUntil && r.lockedUntil.getTime() >= now.getTime()) return false;
      r.lockedUntil = new Date(now.getTime() + claimMs);
      return true;
    },
    async markDelivered(row, attempts) {
      Object.assign(find(row.id), {
        status: 'delivered',
        attempts,
        lockedUntil: null,
        lastError: null,
      });
    },
    async markRetry(row, attempts, nextAttemptAt, lastError) {
      Object.assign(find(row.id), { attempts, nextAttemptAt, lockedUntil: null, lastError });
    },
    async markDead(row, attempts, lastError) {
      Object.assign(find(row.id), { status: 'dead', attempts, lockedUntil: null, lastError });
    },
    async due(now, limit) {
      return rows
        .filter(r => r.status === 'pending' && r.nextAttemptAt.getTime() <= now.getTime())
        .slice(0, limit)
        .map(r => ({ ...r }));
    },
    async counts(): Promise<OutboxCounts> {
      const pending = rows.filter(r => r.status === 'pending');
      return {
        pending: pending.length,
        dead: rows.filter(r => r.status === 'dead').length,
        oldestPendingAt: pending[0]?.createdAt ?? null,
      };
    },
  };
}

const fetchMock = vi.fn();
const respond = (status: number) => () => Promise.resolve(new Response(null, { status }));

async function settle<T>(pending: Promise<T>): Promise<T> {
  await vi.advanceTimersByTimeAsync(30_000);
  return pending;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ now: new Date('2026-11-20T10:00:00.000Z') });
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('PHYND_CRM_BASE_URL', BASE_URL);
  vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', SECRET);
  fetchMock.mockReset();
  fetchMock.mockImplementation(respond(202));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('captureLeadForCrm', () => {
  it('stores the event, then delivers it once with the qualification fields', async () => {
    const store = memoryStore();
    await expect(captureLeadForCrm(LEAD, SUBMISSION, store)).resolves.toBe('delivered');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const sent = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(sent).toEqual(buildLeadCapturedEvent(LEAD, SUBMISSION));
    expect(sent.payload.context).toMatchObject({
      budget: '100k-500k-mxn',
      timeframe: '30-days',
      site_score: '75',
    });
    expect(store.rows[0]).toMatchObject({
      status: 'delivered',
      attempts: 1,
      eventId: leadEventId(LEAD.id),
    });
  });

  it('CRM down then up: queued, then delivered exactly once by the replay', async () => {
    fetchMock.mockImplementation(respond(503));
    const store = memoryStore();

    await expect(settle(captureLeadForCrm(LEAD, SUBMISSION, store))).resolves.toBe('queued');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const row = store.rows[0];
    expect(row).toMatchObject({ status: 'pending', attempts: 3, lastError: 'HTTP 503' });

    await expect(
      replayPendingCrmLeads(new Date(row.nextAttemptAt.getTime() - 1), store)
    ).resolves.toEqual({ attempted: 0, delivered: 0 });

    fetchMock.mockImplementation(respond(200));
    await expect(replayPendingCrmLeads(row.nextAttemptAt, store)).resolves.toEqual({
      attempted: 1,
      delivered: 1,
    });
    expect(row).toMatchObject({ status: 'delivered', attempts: 4 });

    await expect(replayPendingCrmLeads(new Date(Date.now() + 86_400_000), store)).resolves.toEqual({
      attempted: 0,
      delivered: 0,
    });
    await expect(captureLeadForCrm(LEAD, SUBMISSION, store)).resolves.toBe('delivered');
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(store.rows).toHaveLength(1);
    const ids = fetchMock.mock.calls.map(
      ([, init]) => JSON.parse((init as RequestInit).body as string).event_id
    );
    expect(new Set(ids)).toEqual(new Set([leadEventId(LEAD.id)]));
  });

  it('two pods replaying at once send a row once (claim)', async () => {
    fetchMock.mockImplementation(respond(500));
    const store = memoryStore();
    await settle(captureLeadForCrm(LEAD, SUBMISSION, store));
    fetchMock.mockClear();
    fetchMock.mockImplementation(respond(200));
    const due = new Date(Date.now() + 3_600_000);
    const [a, b] = await Promise.all([
      replayPendingCrmLeads(due, store),
      replayPendingCrmLeads(due, store),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(a.delivered + b.delivered).toBe(1);
  });

  it('turns dead after MAX_DELIVERY_ATTEMPTS and shows in health', async () => {
    fetchMock.mockImplementation(respond(503));
    const store = memoryStore();
    await settle(captureLeadForCrm(LEAD, SUBMISSION, store));
    const row = store.rows[0];
    for (let i = 0; i < 100 && row.status === 'pending'; i++) {
      vi.setSystemTime(row.nextAttemptAt);
      await replayPendingCrmLeads(row.nextAttemptAt, store);
    }
    expect(row).toMatchObject({ status: 'dead', attempts: MAX_DELIVERY_ATTEMPTS });
    expect(fetchMock).toHaveBeenCalledTimes(MAX_DELIVERY_ATTEMPTS);
    expect(vi.mocked(apiLogger.error)).toHaveBeenCalledWith(
      'PhyndCRM lead delivery dead',
      undefined,
      expect.objectContaining({ leadId: LEAD.id })
    );
    await expect(crmLeadIntakeHealth(store)).resolves.toMatchObject({
      configured: true,
      outbox: { available: true, pending: 0, dead: 1 },
    });
  });

  it.each([400, 413, 422])('a %p is dead at once', async status => {
    fetchMock.mockImplementation(respond(status));
    const store = memoryStore();
    await expect(settle(captureLeadForCrm(LEAD, SUBMISSION, store))).resolves.toBe('dead');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to the direct send when the table cannot be written', async () => {
    const store = memoryStore();
    store.insert = () => Promise.reject(Object.assign(new Error('no table'), { code: 'P2021' }));
    await expect(captureLeadForCrm(LEAD, SUBMISSION, store)).resolves.toBe('delivered');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(vi.mocked(apiLogger.error)).toHaveBeenCalledWith(
      'PhyndCRM lead outbox unavailable; sending without storing',
      undefined,
      { leadId: LEAD.id, reason: 'P2021' }
    );
  });

  it('never throws, even when the store fails mid-delivery', async () => {
    fetchMock.mockImplementation(respond(503));
    const store = memoryStore();
    store.markRetry = () => Promise.reject(new Error('db gone'));
    await expect(settle(captureLeadForCrm(LEAD, SUBMISSION, store))).resolves.toBe('failed');
  });

  it('skips an email the CRM cannot store, storing nothing', async () => {
    const store = memoryStore();
    const long = `${'a'.repeat(250)}@example.com`;
    await expect(captureLeadForCrm(LEAD, { ...SUBMISSION, email: long }, store)).resolves.toBe(
      'skipped'
    );
    expect(store.rows).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('missing configuration: held, loud, never fatal', () => {
  it('stores the lead while the key is missing, then delivers it once it is set', async () => {
    vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', '   ');
    const store = memoryStore();
    await expect(captureLeadForCrm(LEAD, SUBMISSION, store)).resolves.toBe('queued');
    await expect(replayPendingCrmLeads(new Date(), store)).resolves.toEqual({
      attempted: 0,
      delivered: 0,
    });
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', SECRET);
    await expect(replayPendingCrmLeads(new Date(), store)).resolves.toEqual({
      attempted: 1,
      delivered: 1,
    });
  });

  it('names the missing variables, counting a non-http base URL as missing', () => {
    vi.stubEnv('PHYND_CRM_BASE_URL', 'not a url');
    vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', '');
    expect(missingCrmConfig()).toEqual(['PHYND_CRM_BASE_URL', 'PHYND_CRM_LEAD_INTAKE_SECRET']);
  });

  it('logs one error at start-up in production only, and never throws', () => {
    vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', '');
    expect(() => reportCrmConfigAtStartup('production')).not.toThrow();
    expect(vi.mocked(apiLogger.error)).toHaveBeenCalledTimes(1);
    const line = String(vi.mocked(apiLogger.error).mock.calls[0][0]);
    expect(line).toContain('PHYND_CRM_LEAD_INTAKE_SECRET');
    expect(line).not.toContain(BASE_URL);
    expect(reportCrmConfigAtStartup('development')).toBeNull();
    vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', SECRET);
    expect(reportCrmConfigAtStartup('production')).toBeNull();
    expect(vi.mocked(apiLogger.error)).toHaveBeenCalledTimes(1);
  });

  it('health reports an unavailable outbox without throwing', async () => {
    const store = memoryStore();
    store.counts = () => Promise.reject(Object.assign(new Error('no table'), { code: 'P2021' }));
    await expect(crmLeadIntakeHealth(store)).resolves.toEqual({
      configured: true,
      missing: [],
      outbox: { available: false, error: 'P2021' },
    });
  });
});

describe('backoff and permanence', () => {
  it('waits 1 min after the first round, doubles, caps at 6 h', () => {
    expect([3, 4, 5, 6].map(outboxBackoffMs)).toEqual([60_000, 120_000, 240_000, 480_000]);
    expect(outboxBackoffMs(19)).toBe(6 * 60 * 60 * 1000);
  });

  it('only malformed-payload answers are permanent', () => {
    expect([400, 413, 422].every(s => isPermanentRejection(s))).toBe(true);
    expect([401, 404, 429, 500, undefined].some(s => isPermanentRejection(s))).toBe(false);
  });
});
