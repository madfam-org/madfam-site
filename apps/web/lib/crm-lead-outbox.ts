import { apiLogger } from './logger';
import {
  RETRY_DELAYS_MS,
  buildLeadCapturedEvent,
  crmConfig,
  deliverLeadToCrm,
  emailTooLong,
  intakeUrl,
  leadEventId,
  sendLeadBody,
  type LeadSubmission,
  type RoundResult,
  type StoredLead,
} from './phynd-crm';
import { prisma } from './prisma';

/**
 * Durable delivery of site leads to PhyndCRM: a stored lead is never lost.
 *
 * Before, `/api/leads` made three fire-and-forget attempts and a lead the CRM
 * did not take in those ~3 s was only a log line. Now:
 *
 *  1. captureLeadForCrm writes the event to `CrmLeadDelivery` (one row per
 *     lead) BEFORE anything is sent. A second capture of the same lead finds
 *     the row and never sends twice.
 *  2. It then makes one round (at most 3 attempts) off the response path.
 *  3. Still undelivered → the row stays `pending`; replayPendingCrmLeads (every
 *     minute on every pod, started by instrumentation.ts) re-sends it with
 *     backoff: 1 min, doubling, capped at 6 h. Each send first CLAIMS the row
 *     (lockedUntil), so two pods never send it at once; the CRM also
 *     deduplicates on event_id.
 *  4. After MAX_DELIVERY_ATTEMPTS, or at once on a 400/413/422 (the CRM read the
 *     body and refused it), the row turns `dead`: kept, logged as an error,
 *     counted in GET /api/health. Re-queue by setting status back to 'pending'
 *     and attempts to 0.
 *
 * A missing URL or key delays, never loses: the lead is stored and held, and
 * goes out on the first replay after both are set. In production a missing
 * variable is one error line at start-up.
 *
 * If the table cannot be written (schema not pushed yet, database error), the
 * capture falls back to the direct send (deliverLeadToCrm) and logs it.
 */

export const OUTBOX_PENDING = 'pending';
export const OUTBOX_DELIVERED = 'delivered';
export const OUTBOX_DEAD = 'dead';

/** HTTP attempts in all (the first round's included) before a row is dead:
 *  with the backoff below about three days. */
export const MAX_DELIVERY_ATTEMPTS = 20;
export const OUTBOX_BASE_BACKOFF_MS = 60_000;
export const OUTBOX_MAX_BACKOFF_MS = 6 * 60 * 60 * 1000;
export const OUTBOX_CLAIM_MS = 5 * 60 * 1000;
export const OUTBOX_REPLAY_BATCH = 50;

const FIRST_ROUND_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

/** Pause before the next replay of a row with `attempts` attempts. PURE. */
export function outboxBackoffMs(attempts: number): number {
  const replaysSoFar = Math.max(0, attempts - FIRST_ROUND_ATTEMPTS);
  return Math.min(OUTBOX_BASE_BACKOFF_MS * 2 ** replaysSoFar, OUTBOX_MAX_BACKOFF_MS);
}

/** A CRM answer no replay can fix. 401/403/404, a redirect, 429 and 5xx stay
 *  pending: an operator can fix those. PURE. */
export function isPermanentRejection(status: number | undefined): boolean {
  return status === 400 || status === 413 || status === 422;
}

// ── Storage seam ─────────────────────────────────────────────────────────────

export interface OutboxRow {
  id: string;
  leadId: string;
  body: string;
  status: string;
  attempts: number;
}

export interface OutboxCounts {
  pending: number;
  dead: number;
  oldestPendingAt: Date | null;
}

export interface OutboxStore {
  /** Insert the row, or return the existing row for the same lead. */
  insert(row: { leadId: string; eventId: string; body: string }): Promise<OutboxRow>;
  claim(row: OutboxRow, now: Date, claimMs: number): Promise<boolean>;
  markDelivered(row: OutboxRow, attempts: number, at: Date): Promise<void>;
  markRetry(
    row: OutboxRow,
    attempts: number,
    nextAttemptAt: Date,
    lastError: string
  ): Promise<void>;
  markDead(row: OutboxRow, attempts: number, lastError: string): Promise<void>;
  due(now: Date, limit: number): Promise<OutboxRow[]>;
  counts(): Promise<OutboxCounts>;
}

const ROW_SELECT = { id: true, leadId: true, body: true, status: true, attempts: true } as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    error !== null && typeof error === 'object' && (error as { code?: unknown }).code === 'P2002'
  );
}

export function prismaOutboxStore(): OutboxStore {
  const table = prisma.crmLeadDelivery;
  return {
    async insert({ leadId, eventId, body }) {
      try {
        return await table.create({ data: { leadId, eventId, body }, select: ROW_SELECT });
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
        const existing = await table.findUnique({ where: { leadId }, select: ROW_SELECT });
        if (!existing) throw error;
        return existing;
      }
    },
    async claim(row, now, claimMs) {
      const { count } = await table.updateMany({
        where: {
          id: row.id,
          status: OUTBOX_PENDING,
          OR: [{ lockedUntil: null }, { lockedUntil: { lt: now } }],
        },
        data: { lockedUntil: new Date(now.getTime() + claimMs) },
      });
      return count === 1;
    },
    async markDelivered(row, attempts, at) {
      await table.update({
        where: { id: row.id },
        data: {
          status: OUTBOX_DELIVERED,
          attempts,
          deliveredAt: at,
          lockedUntil: null,
          lastError: null,
        },
      });
    },
    async markRetry(row, attempts, nextAttemptAt, lastError) {
      await table.update({
        where: { id: row.id },
        data: { attempts, nextAttemptAt, lockedUntil: null, lastError },
      });
    },
    async markDead(row, attempts, lastError) {
      await table.update({
        where: { id: row.id },
        data: { status: OUTBOX_DEAD, attempts, lockedUntil: null, lastError },
      });
    },
    async due(now, limit) {
      return table.findMany({
        where: { status: OUTBOX_PENDING, nextAttemptAt: { lte: now } },
        orderBy: { nextAttemptAt: 'asc' },
        take: limit,
        select: ROW_SELECT,
      });
    },
    async counts() {
      const [pending, dead, oldest] = await Promise.all([
        table.count({ where: { status: OUTBOX_PENDING } }),
        table.count({ where: { status: OUTBOX_DEAD } }),
        table.findFirst({
          where: { status: OUTBOX_PENDING },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        }),
      ]);
      return { pending, dead, oldestPendingAt: oldest?.createdAt ?? null };
    },
  };
}

// ── Delivery ─────────────────────────────────────────────────────────────────

export type CaptureOutcome =
  | 'delivered'
  /** Stored; the replay sends it (CRM down, or URL/key not set yet). */
  | 'queued'
  /** Stored but given up on (attempt cap, or a body the CRM refused). */
  | 'dead'
  /** Email longer than the CRM can store: not stored, not sent. */
  | 'skipped'
  /** Not stored and not delivered (outbox unavailable, direct send failed). */
  | 'failed';

/** A Prisma error code (P2021 = table missing) or the error class; never data. */
function describeError(error: unknown): string {
  if (error !== null && typeof error === 'object') {
    const { code } = error as { code?: unknown };
    if (typeof code === 'string') return code;
    if (error instanceof Error) return error.name;
  }
  return 'unknown';
}

function roundStatus(round: RoundResult): string {
  return round.status !== undefined ? `HTTP ${round.status}` : (round.reason ?? 'unknown');
}

/** Claim a stored row, send it, record the outcome. Never throws. */
async function deliverRow(
  row: OutboxRow,
  store: OutboxStore,
  maxAttempts: number,
  now: Date
): Promise<CaptureOutcome> {
  const { baseUrl, secret } = crmConfig();
  const url = baseUrl ? intakeUrl(baseUrl) : null;
  if (!url || !secret) return 'queued';
  if (!(await store.claim(row, now, OUTBOX_CLAIM_MS))) return 'queued';

  const round = await sendLeadBody(url, secret, row.body, maxAttempts);
  const attempts = row.attempts + round.attempts;
  const finishedAt = new Date();
  if (round.delivered) {
    await store.markDelivered(row, attempts, finishedAt);
    apiLogger.info('Lead delivered to PhyndCRM', { leadId: row.leadId, attempts });
    return 'delivered';
  }
  const status = roundStatus(round);
  if (isPermanentRejection(round.status) || attempts >= MAX_DELIVERY_ATTEMPTS) {
    await store.markDead(row, attempts, status);
    apiLogger.error('PhyndCRM lead delivery dead', undefined, {
      leadId: row.leadId,
      status,
      attempts,
    });
    return 'dead';
  }
  await store.markRetry(
    row,
    attempts,
    new Date(finishedAt.getTime() + outboxBackoffMs(attempts)),
    status
  );
  apiLogger.warn('PhyndCRM lead not delivered yet; queued', {
    leadId: row.leadId,
    status,
    attempts,
  });
  return 'queued';
}

/**
 * Store a lead's CRM event and try to send it. `/api/leads` starts this WITHOUT
 * awaiting it, right after the lead row is written. Never throws or rejects.
 */
export async function captureLeadForCrm(
  lead: StoredLead,
  submission: LeadSubmission,
  store: OutboxStore = prismaOutboxStore()
): Promise<CaptureOutcome> {
  try {
    if (emailTooLong(submission.email)) {
      apiLogger.warn('PhyndCRM lead delivery skipped', {
        leadId: lead.id,
        reason: 'email_too_long',
      });
      return 'skipped';
    }
    // Serialized once: stored, and signed + sent byte-identical every attempt.
    const body = JSON.stringify(buildLeadCapturedEvent(lead, submission));
    let row: OutboxRow;
    try {
      row = await store.insert({ leadId: lead.id, eventId: leadEventId(lead.id), body });
    } catch (error) {
      apiLogger.error('PhyndCRM lead outbox unavailable; sending without storing', undefined, {
        leadId: lead.id,
        reason: describeError(error),
      });
      const direct = await deliverLeadToCrm(lead, submission);
      return direct === 'delivered' ? 'delivered' : 'failed';
    }
    if (row.status === OUTBOX_DELIVERED) return 'delivered';
    if (row.status === OUTBOX_DEAD) return 'dead';
    return await deliverRow(row, store, FIRST_ROUND_ATTEMPTS, new Date());
  } catch (error) {
    apiLogger.error('PhyndCRM lead capture failed', undefined, {
      leadId: lead.id,
      reason: describeError(error),
    });
    return 'failed';
  }
}

/** One replay run: due pending rows, one attempt each. Never throws. */
export async function replayPendingCrmLeads(
  now: Date = new Date(),
  store: OutboxStore = prismaOutboxStore()
): Promise<{ attempted: number; delivered: number }> {
  const result = { attempted: 0, delivered: 0 };
  if (missingCrmConfig().length > 0) return result;
  try {
    for (const row of await store.due(now, OUTBOX_REPLAY_BATCH)) {
      result.attempted += 1;
      if ((await deliverRow(row, store, 1, now)) === 'delivered') result.delivered += 1;
    }
  } catch (error) {
    apiLogger.error('PhyndCRM lead replay failed', undefined, { reason: describeError(error) });
  }
  return result;
}

// ── Configuration visibility ─────────────────────────────────────────────────

/** Names of the missing CRM variables (never values). A base URL that is not
 *  an absolute http(s) URL counts as missing. */
export function missingCrmConfig(): string[] {
  const { baseUrl, secret } = crmConfig();
  const missing: string[] = [];
  if (!baseUrl || !intakeUrl(baseUrl)) missing.push('PHYND_CRM_BASE_URL');
  if (!secret) missing.push('PHYND_CRM_LEAD_INTAKE_SECRET');
  return missing;
}

/** In production, one error line naming the missing variables. Never throws,
 *  never stops the app. Returns what it logged. */
export function reportCrmConfigAtStartup(nodeEnv = process.env.NODE_ENV): string | null {
  if (nodeEnv !== 'production') return null;
  const missing = missingCrmConfig();
  if (missing.length === 0) return null;
  const line =
    `CRM lead intake not configured: missing ${missing.join(', ')}; ` +
    'leads are stored and held until it is set. See GET /api/health (crmLeadIntake).';
  apiLogger.error(line, undefined, { missing });
  return line;
}

export interface CrmLeadIntakeHealth {
  configured: boolean;
  missing: string[];
  outbox:
    | { available: true; pending: number; dead: number; oldestPendingAt: string | null }
    | { available: false; error: string };
}

/** For GET /api/health. Reported only; never throws. */
export async function crmLeadIntakeHealth(
  store: OutboxStore = prismaOutboxStore()
): Promise<CrmLeadIntakeHealth> {
  const missing = missingCrmConfig();
  try {
    const counts = await store.counts();
    return {
      configured: missing.length === 0,
      missing,
      outbox: {
        available: true,
        pending: counts.pending,
        dead: counts.dead,
        oldestPendingAt: counts.oldestPendingAt ? counts.oldestPendingAt.toISOString() : null,
      },
    };
  } catch (error) {
    return {
      configured: missing.length === 0,
      missing,
      outbox: { available: false, error: describeError(error) },
    };
  }
}
