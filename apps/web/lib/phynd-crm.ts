import { createHash, createHmac } from 'crypto';
import { apiLogger } from './logger';

/**
 * PhyndCRM lead intake.
 *
 * A lead that `/api/leads` has accepted and stored is also sent to PhyndCRM as
 * a signed `site.lead.captured` event, so the person becomes a contact and a
 * lead there, with the campaign that brought them.
 *
 * Server-only: `PHYND_CRM_BASE_URL` and `PHYND_CRM_EVENTS_SECRET` are read from
 * the server environment at call time and must never become `NEXT_PUBLIC_*`
 * variables. With either one unset nothing is sent.
 *
 * Best effort, like the n8n webhook in `/api/leads`: one attempt with a 5 s
 * timeout, and a failure is logged with the lead id and never thrown, because
 * the lead is already stored here. The event id is derived from the lead row
 * id, so sending the same lead again dedups on the CRM side.
 */

const LEAD_INTAKE_PATH = '/api/webhooks/lead-intake';
const SIGNATURE_HEADER = 'x-madfam-signature';
const EVENT_TYPE = 'site.lead.captured';
const EVENT_SOURCE = 'madfam-site';
const DELIVERY_TIMEOUT_MS = 5000;

/** The RFC 4122 URL namespace as raw bytes: the UUIDv5 namespace of event ids. */
const UUID_NAMESPACE_URL = Buffer.from('6ba7b8119dad11d180b400c04fd430c8', 'hex');

/** The stored lead row: the event's identity and its time. */
export interface StoredLead {
  id: string;
  createdAt?: Date | null;
}

/** The submission `/api/leads` accepted, as its schema validates it. */
export interface LeadSubmission {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message?: string;
  /** Where the form lives, e.g. `contact-page`. */
  source?: string;
  preferredLanguage?: string;
  /** The form's qualification and campaign fields: intent, product, utm_*. */
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
    context: { page?: string; locale?: string; plan_interest?: string };
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

/** Maps a stored lead and its submission onto the `site.lead.captured` contract. */
export function buildLeadCapturedEvent(
  lead: StoredLead,
  submission: LeadSubmission
): SiteLeadCapturedEvent {
  const metadata = submission.metadata ?? {};
  return {
    schema_version: '1',
    event_id: leadEventId(lead.id),
    event_type: EVENT_TYPE,
    source: EVENT_SOURCE,
    occurred_at: (lead.createdAt ?? new Date()).toISOString(),
    payload: {
      lead: {
        name: submission.name.trim(),
        email: submission.email.trim(),
        ...present({
          phone: submission.phone,
          company: submission.company,
          message: submission.message,
        }),
      },
      context: present({
        page: submission.source,
        locale: submission.preferredLanguage,
        // The product the visitor came from, else the offer path they chose.
        plan_interest: text(metadata.product) ?? metadata.intent,
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
function intakeUrl(baseUrl: string): string | null {
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

/**
 * Sends the lead to PhyndCRM. Resolves to what happened and never rejects, so
 * the caller can leave it un-awaited: `skipped` when the integration is not
 * configured, `failed` (logged) on a bad base URL, a timeout, a network error
 * or a non-2xx answer.
 */
export async function deliverLeadToCrm(
  lead: StoredLead,
  submission: LeadSubmission
): Promise<LeadDelivery> {
  const baseUrl = process.env.PHYND_CRM_BASE_URL?.trim();
  const secret = process.env.PHYND_CRM_EVENTS_SECRET;
  if (!baseUrl || !secret) return 'skipped';

  const url = intakeUrl(baseUrl);
  if (!url) {
    apiLogger.error('PhyndCRM lead delivery failed', undefined, {
      leadId: lead.id,
      reason: 'invalid_base_url',
    });
    return 'failed';
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, DELIVERY_TIMEOUT_MS);

  try {
    const event = buildLeadCapturedEvent(lead, submission);
    const rawBody = JSON.stringify(event);
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

    if (!response.ok) {
      apiLogger.error('PhyndCRM lead delivery failed', undefined, {
        leadId: lead.id,
        status: response.status,
      });
      return 'failed';
    }

    apiLogger.info('Lead delivered to PhyndCRM', { leadId: lead.id, eventId: event.event_id });
    return 'delivered';
  } catch (error) {
    apiLogger.error('PhyndCRM lead delivery failed', undefined, {
      leadId: lead.id,
      reason: failureReason(error, timedOut),
    });
    return 'failed';
  } finally {
    clearTimeout(timer);
  }
}
