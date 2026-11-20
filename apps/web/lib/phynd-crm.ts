import { createHash, createHmac } from 'crypto';
import { apiLogger } from './logger';

/**
 * PhyndCRM lead intake.
 *
 * A lead that `/api/leads` has accepted and stored is also sent to PhyndCRM as
 * a signed `site.lead.captured` event, so the person becomes a contact and a
 * lead there, with the campaign that brought them.
 *
 * Server-only: `PHYND_CRM_BASE_URL` and `PHYND_CRM_LEAD_INTAKE_SECRET` are read
 * from the server environment at call time and must never become
 * `NEXT_PUBLIC_*` variables. With either one unset (or blank) nothing is sent.
 * The secret is the lead-intake route's own signing key and is used exactly as
 * provisioned, never trimmed, because the receiver verifies with the raw value.
 *
 * One round is up to three attempts, each with a 5 s timeout. A network
 * error, a timeout, a 429 or a 5xx is retried after a short jittered pause
 * (~0.5 s, then ~2 s); a 3xx or another 4xx is not. Every attempt sends the
 * same body under a fresh signature. The event id is derived from the lead row
 * id, so a repeated delivery dedups on the CRM side.
 *
 * `/api/leads` does not call deliverLeadToCrm directly: it calls
 * captureLeadForCrm (`lib/crm-lead-outbox.ts`), which stores the event in
 * `CrmLeadDelivery` and replays it until the CRM accepts it, and falls back to
 * deliverLeadToCrm only when that table cannot be written.
 */

const LEAD_INTAKE_PATH = '/api/webhooks/lead-intake';
const SIGNATURE_HEADER = 'x-madfam-signature';
const EVENT_TYPE = 'site.lead.captured';
const EVENT_SOURCE = 'madfam-site';
const DELIVERY_TIMEOUT_MS = 5000;
/** The pause before each retry; each is stretched by up to +50% jitter. */
export const RETRY_DELAYS_MS: readonly number[] = [500, 2000];

/** The CRM's column limits: `name`, `email`, `company` are varchar(255) and
 *  `phone` varchar(50). Lengths are counted in characters, as Postgres does. */
const MAX_NAME_LENGTH = 255;
const MAX_COMPANY_LENGTH = 255;
const MAX_PHONE_LENGTH = 50;
const MAX_EMAIL_LENGTH = 255;
/** The receiver keeps at most 500 characters of a page path. */
const MAX_PAGE_LENGTH = 500;

/** The RFC 4122 URL namespace as raw bytes: the UUIDv5 namespace of event ids. */
const UUID_NAMESPACE_URL = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex');

/** The stored lead row: the event's identity, its time, and the site's own
 *  qualification of it (`budget`, `timeframe` and `score` as `/api/leads`
 *  stored them). */
export interface StoredLead {
  id: string;
  createdAt?: Date | null;
  budget?: string | null;
  timeframe?: string | null;
  score?: number | null;
}

/** The submission `/api/leads` accepted, as its schema validates it. */
export interface LeadSubmission {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message?: string;
  /** Which form this is, e.g. `contact-page`. A label, not a page: not sent. */
  source?: string;
  preferredLanguage?: string;
  /** The form's qualification and campaign fields: intent, product, utm_*,
   *  plus `page` (the path the form was posted from) and `referrer`. */
  metadata?: Record<string, unknown>;
}

export interface SiteLeadCapturedEvent {
  schema_version: '1';
  event_id: string;
  event_type: typeof EVENT_TYPE;
  source: typeof EVENT_SOURCE;
  occurred_at: string;
  payload: {
    lead: { name: string; email: string; phone?: string; company?: string; message?: string };
    /** `budget`, `timeframe` and `site_score` are the site's qualification.
     *  The lead intake has no column for them yet: it keeps them in its raw
     *  event record, and the same three values ride in `lead.message`, which
     *  becomes the lead's note (see qualificationNote). */
    context: {
      page?: string;
      locale?: string;
      plan_interest?: string;
      budget?: string;
      timeframe?: string;
      site_score?: string;
    };
    attribution: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
      utm_content?: string;
      utm_term?: string;
      referrer?: string;
    };
  };
}

export type LeadDelivery = 'skipped' | 'delivered' | 'failed';

/** A trimmed, non-blank string, or undefined for anything else. */
function text(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

/** Characters (code points, as Postgres counts them) in a string. */
function charLength(value: string): number {
  return Array.from(value).length;
}

/** The first `max` characters, never splitting a surrogate pair. */
function cut(value: string, max: number): string {
  return charLength(value) > max ? Array.from(value).slice(0, max).join('') : value;
}

/** The form's page path: a trimmed value starting with `/`, length-capped. */
function pagePath(value: unknown): string | undefined {
  const path = text(value);
  return path?.startsWith('/') ? cut(path, MAX_PAGE_LENGTH) : undefined;
}

/** Keeps only the keys that carry a value, so no key is ever sent empty. */
function present<K extends string>(fields: Record<K, unknown>): Partial<Record<K, string>> {
  const kept: Partial<Record<K, string>> = {};
  for (const key of Object.keys(fields) as K[]) {
    const value = text(fields[key]);
    if (value) kept[key] = value;
  }
  return kept;
}

/**
 * The event id for a lead: the UUIDv5 (URL namespace) of
 * `urn:madfam-site:site.lead.captured:<lead id>`. The same lead row always
 * yields the same id, which is what lets the CRM drop a repeated delivery.
 */
export function leadEventId(leadId: string): string {
  const bytes = createHash('sha1')
    .update(UUID_NAMESPACE_URL)
    .update(`urn:${EVENT_SOURCE}:${EVENT_TYPE}:${leadId}`)
    .digest()
    .subarray(0, 16);
  bytes.writeUInt8((bytes.readUInt8(6) & 0x0f) | 0x50, 6); // version 5
  bytes.writeUInt8((bytes.readUInt8(8) & 0x3f) | 0x80, 8); // RFC 4122 variant
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/** The site's qualification of a lead: the stored value, else the form's. */
function qualification(
  lead: StoredLead,
  metadata: Record<string, unknown>
): { budget?: string; timeframe?: string; siteScore?: string } {
  const { score } = lead;
  return {
    budget: text(lead.budget) ?? text(metadata.budget),
    timeframe: text(lead.timeframe) ?? text(metadata.timeline),
    siteScore:
      typeof score === 'number' && Number.isFinite(score) ? String(Math.round(score)) : undefined,
  };
}

/**
 * The qualification as note lines, so staff see it in the CRM today: the lead
 * intake turns `lead.message` into the lead's note and has no field of its own
 * for budget, timeframe or score. Undefined when there is nothing to add.
 */
export function qualificationNote(q: {
  budget?: string;
  timeframe?: string;
  siteScore?: string;
}): string | undefined {
  const lines = [
    q.budget && `- Presupuesto: ${q.budget}`,
    q.timeframe && `- Plazo: ${q.timeframe}`,
    q.siteScore && `- Puntaje del sitio: ${q.siteScore}/100`,
  ].filter((line): line is string => Boolean(line));
  return lines.length > 0
    ? ['Calificación del sitio (madfam.io):', ...lines].join('\n')
    : undefined;
}

/**
 * Maps a stored lead and its submission onto the `site.lead.captured` contract,
 * within the CRM's column limits: `name` and `company` are cut to 255
 * characters, and a `phone` longer than 50 is left out (the lead still goes).
 * An email over 255 cannot be stored at all; deliverLeadToCrm skips that lead.
 *
 * `context.page` is the path the form was posted from (`metadata.page`), not
 * the form's `source` label, which names a form rather than a page.
 *
 * The site's qualification (budget, timeframe, its own 0-100 score) goes in
 * `context.budget` / `context.timeframe` / `context.site_score` and, as note
 * lines, at the end of `lead.message` (qualificationNote).
 */
export function buildLeadCapturedEvent(
  lead: StoredLead,
  submission: LeadSubmission
): SiteLeadCapturedEvent {
  const metadata = submission.metadata ?? {};
  const phone = text(submission.phone);
  const company = text(submission.company);
  const q = qualification(lead, metadata);
  const note = qualificationNote(q);
  const written = text(submission.message);
  const message = written && note ? `${written}\n\n${note}` : (written ?? note);
  return {
    schema_version: '1',
    event_id: leadEventId(lead.id),
    event_type: EVENT_TYPE,
    source: EVENT_SOURCE,
    occurred_at: (lead.createdAt ?? new Date()).toISOString(),
    payload: {
      lead: {
        name: cut(submission.name.trim(), MAX_NAME_LENGTH),
        email: submission.email.trim(),
        ...present({
          phone: phone && charLength(phone) <= MAX_PHONE_LENGTH ? phone : undefined,
          company: company && cut(company, MAX_COMPANY_LENGTH),
          message,
        }),
      },
      context: present({
        page: pagePath(metadata.page),
        locale: submission.preferredLanguage,
        // The product the visitor came from, else the offer path they chose.
        plan_interest: text(metadata.product) ?? metadata.intent,
        budget: q.budget,
        timeframe: q.timeframe,
        site_score: q.siteScore,
      }),
      attribution: present({
        utm_source: metadata.utm_source,
        utm_medium: metadata.utm_medium,
        utm_campaign: metadata.utm_campaign,
        utm_content: metadata.utm_content,
        utm_term: metadata.utm_term,
        referrer: metadata.referrer,
      }),
    },
  };
}

/**
 * The `x-madfam-signature` value for a body: `t=<unix seconds>,v1=<hex>`, where
 * hex is HMAC-SHA256(secret, `<t>.<rawBody>`). Sign the exact string that is sent.
 */
export function signEventBody(rawBody: string, secret: string, timestamp: number): string {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return `t=${timestamp},v1=${digest}`;
}

/** `<base>/api/webhooks/lead-intake`, or null unless that is an absolute http(s) URL. */
export function intakeUrl(baseUrl: string): string | null {
  let base = baseUrl;
  while (base.endsWith('/')) base = base.slice(0, -1);
  const url = `${base}${LEAD_INTAKE_PATH}`;
  try {
    const { protocol } = new URL(url);
    return protocol === 'https:' || protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/** A short label for the log. Never the error text, which can echo the URL. */
function failureReason(error: unknown, timedOut: boolean): string {
  if (timedOut) return 'timeout';
  if (!(error instanceof Error)) return 'unknown';
  const { cause } = error;
  if (cause instanceof Error && 'code' in cause && typeof cause.code === 'string') {
    return cause.code;
  }
  return error.name;
}

/** Releases a response body without reading it, so the socket is freed now
 *  rather than at garbage collection. Never throws. */
function releaseBody(response: Response): void {
  try {
    response.body?.cancel().catch(() => undefined);
  } catch {
    // Nothing to release.
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** The jittered pause before retry number `index` (0-based). */
function retryDelayMs(index: number): number {
  const base = RETRY_DELAYS_MS[index] ?? 0;
  return base + Math.floor(Math.random() * (base / 2));
}

/** One attempt's outcome. Only a network error, a timeout, a 429 or a 5xx is
 *  worth retrying; a 3xx or another 4xx would fail the same way again. */
type Attempt = { ok: true } | { ok: false; retryable: boolean; status?: number; reason?: string };

/** The CRM settings from the server environment, or null for a missing one.
 *  The secret is used exactly as provisioned (never trimmed); blank = unset. */
export function crmConfig(): { baseUrl: string | null; secret: string | null } {
  const baseUrl = process.env.PHYND_CRM_BASE_URL?.trim();
  const secret = process.env.PHYND_CRM_LEAD_INTAKE_SECRET;
  return { baseUrl: baseUrl ? baseUrl : null, secret: secret?.trim() ? secret : null };
}

/** An email the CRM cannot store (over 255 characters). */
export function emailTooLong(email: string): boolean {
  return charLength(email.trim()) > MAX_EMAIL_LENGTH;
}

/** What a run of attempts came to (the outbox records it). */
export interface RoundResult {
  delivered: boolean;
  attempts: number;
  /** The CRM's HTTP status on the last failed attempt, when it answered. */
  status?: number;
  /** The transport failure of the last attempt (timeout, ECONNREFUSED, …). */
  reason?: string;
}

/**
 * POSTs one serialized event up to `maxAttempts` times, retrying only a
 * network error, a timeout, a 429 or a 5xx after a jittered pause. Same bytes
 * every attempt under a fresh signature. Never throws; logs nothing.
 */
export async function sendLeadBody(
  url: string,
  secret: string,
  rawBody: string,
  maxAttempts: number
): Promise<RoundResult> {
  for (let attempt = 1; ; attempt++) {
    const result = await attemptDelivery(url, secret, rawBody);
    if (result.ok) return { delivered: true, attempts: attempt };
    if (!result.retryable || attempt >= maxAttempts) {
      return { delivered: false, attempts: attempt, status: result.status, reason: result.reason };
    }
    await sleep(retryDelayMs(attempt - 1));
  }
}

/** One signed POST with its own timeout. Signed per attempt, so a retry
 *  carries a fresh timestamp over the same bytes. */
async function attemptDelivery(url: string, secret: string, rawBody: string): Promise<Attempt> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DELIVERY_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [SIGNATURE_HEADER]: signEventBody(rawBody, secret, Math.floor(Date.now() / 1000)),
      },
      body: rawBody,
      // A redirect means the base URL is wrong: report it instead of letting
      // the signed body be re-sent somewhere else.
      redirect: 'manual',
      signal: controller.signal,
    });
    releaseBody(response);
    if (response.ok) return { ok: true };
    const { status } = response;
    return { ok: false, retryable: status === 429 || status >= 500, status };
  } catch (error) {
    return { ok: false, retryable: true, reason: failureReason(error, timedOut) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sends the lead to PhyndCRM. Resolves to what happened and never rejects, so
 * the caller can leave it un-awaited: `skipped` when the integration is not
 * configured, or (logged) when the email is longer than the CRM can store;
 * `failed` (logged once) on a bad base URL, or when the last attempt still met
 * a timeout, a network error or a non-2xx answer.
 */
export async function deliverLeadToCrm(
  lead: StoredLead,
  submission: LeadSubmission
): Promise<LeadDelivery> {
  try {
    const baseUrl = process.env.PHYND_CRM_BASE_URL?.trim();
    const secret = process.env.PHYND_CRM_LEAD_INTAKE_SECRET;
    if (!baseUrl || !secret?.trim()) return 'skipped';

    const url = intakeUrl(baseUrl);
    if (!url) {
      apiLogger.error('PhyndCRM lead delivery failed', undefined, {
        leadId: lead.id,
        reason: 'invalid_base_url',
      });
      return 'failed';
    }

    if (charLength(submission.email.trim()) > MAX_EMAIL_LENGTH) {
      apiLogger.warn('PhyndCRM lead delivery skipped', {
        leadId: lead.id,
        reason: 'email_too_long',
      });
      return 'skipped';
    }

    const event = buildLeadCapturedEvent(lead, submission);
    const rawBody = JSON.stringify(event);

    const round = await sendLeadBody(url, secret, rawBody, RETRY_DELAYS_MS.length + 1);
    if (round.delivered) {
      apiLogger.info('Lead delivered to PhyndCRM', { leadId: lead.id, eventId: event.event_id });
      return 'delivered';
    }
    apiLogger.error('PhyndCRM lead delivery failed', undefined, {
      leadId: lead.id,
      ...(round.status !== undefined ? { status: round.status } : { reason: round.reason }),
      attempts: round.attempts,
    });
    return 'failed';
  } catch (error) {
    // Building or signing the event should not throw; if it ever does, the
    // stored lead and the visitor's response must not notice.
    apiLogger.error('PhyndCRM lead delivery failed', undefined, {
      leadId: lead.id,
      reason: failureReason(error, false),
    });
    return 'failed';
  }
}
