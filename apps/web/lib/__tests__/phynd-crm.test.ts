import { createHmac } from 'crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/lib/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks so module resolution picks up stubs)
// ---------------------------------------------------------------------------

import {
  buildLeadCapturedEvent,
  deliverLeadToCrm,
  leadEventId,
  signEventBody,
  type LeadSubmission,
} from '../phynd-crm';
import { apiLogger } from '@/lib/logger';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const BASE_URL = 'https://crm.example.test';
const INTAKE_URL = 'https://crm.example.test/api/webhooks/lead-intake';
const SECRET = 'shared-events-secret-for-tests-only';
const NOW = '2026-11-13T18:00:00.000Z';
const NOW_SECONDS = 1794592800;
const UUID_V5 = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

const LEAD = { id: 'clead0000000000000000001', createdAt: new Date('2026-11-13T17:59:30.000Z') };

/** What the contact page's LeadForm posts, as `/api/leads` validates it. */
const SUBMISSION: LeadSubmission = {
  name: 'María José Núñez',
  email: 'maria@example.com',
  company: 'Talleres Ñandú',
  phone: '+52-555-1234',
  message: 'Queremos facturar con Karafiel desde enero.',
  source: 'contact-page',
  preferredLanguage: 'es',
  metadata: {
    intent: 'platform',
    offerPath: 'platform',
    product: 'karafiel',
    timeline: '30-days',
    region: 'Morelos',
    followUp: 'email',
    utm_source: 'newsletter',
    utm_medium: 'email',
    utm_campaign: 'oct-2026',
    utm_term: 'cfdi',
    utm_content: 'hero',
  },
};

interface SentRequest {
  url: string;
  init: RequestInit & { headers: Record<string, string>; body: string };
}

const fetchMock = vi.fn();

function sentRequest(): SentRequest {
  const [url, init] = fetchMock.mock.calls[0] as [string, SentRequest['init']];
  return { url, init };
}

/** Everything the module logged, at any level, as one searchable string. */
function everythingLogged(): string {
  return JSON.stringify(
    [apiLogger.info, apiLogger.warn, apiLogger.error, apiLogger.debug].map(
      log => vi.mocked(log).mock.calls
    )
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  vi.stubGlobal('fetch', fetchMock);
  vi.stubEnv('PHYND_CRM_BASE_URL', BASE_URL);
  vi.stubEnv('PHYND_CRM_EVENTS_SECRET', SECRET);
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 202 }));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('leadEventId', () => {
  it('is a UUIDv5 that only depends on the lead row id, so a retry dedups', () => {
    const id = leadEventId(LEAD.id);

    expect(id).toMatch(UUID_V5);
    expect(leadEventId(LEAD.id)).toBe(id);
    expect(leadEventId('clead0000000000000000002')).not.toBe(id);
  });

  it('matches uuid5(NAMESPACE_URL, "urn:madfam-site:site.lead.captured:<id>")', () => {
    // Reference value from Python's uuid.uuid5, written without separators.
    expect(leadEventId(LEAD.id).replaceAll('-', '')).toBe('a7ccf781db2951a992dd2fdf38d77d84');
  });
});

describe('buildLeadCapturedEvent', () => {
  it('maps the lead, its context and all five utm_* values onto the contract', () => {
    expect(buildLeadCapturedEvent(LEAD, SUBMISSION)).toStrictEqual({
      schema_version: '1',
      event_id: leadEventId(LEAD.id),
      event_type: 'site.lead.captured',
      source: 'madfam-site',
      occurred_at: '2026-11-13T17:59:30.000Z',
      payload: {
        lead: {
          name: 'María José Núñez',
          email: 'maria@example.com',
          phone: '+52-555-1234',
          company: 'Talleres Ñandú',
          message: 'Queremos facturar con Karafiel desde enero.',
        },
        context: { page: 'contact-page', locale: 'es', plan_interest: 'karafiel' },
        attribution: {
          utm_source: 'newsletter',
          utm_medium: 'email',
          utm_campaign: 'oct-2026',
          utm_content: 'hero',
          utm_term: 'cfdi',
        },
      },
    });
  });

  it('omits every key that has no value instead of sending it empty', () => {
    const event = buildLeadCapturedEvent(LEAD, {
      name: ' Juan Perez ',
      email: 'juan@example.com',
      company: '',
      phone: '   ',
      source: 'website',
      preferredLanguage: 'en',
      metadata: { intent: 'build-with-madfam', product: '', utm_source: '', utm_medium: 42 },
    });

    expect(event.payload).toStrictEqual({
      lead: { name: 'Juan Perez', email: 'juan@example.com' },
      // No product, so the offer path the visitor chose is the interest.
      context: { page: 'website', locale: 'en', plan_interest: 'build-with-madfam' },
      attribution: {},
    });
    expect(JSON.stringify(event)).not.toMatch(/null|""/);
  });

  it('keeps context and attribution as objects when the form sent no metadata', () => {
    const { payload } = buildLeadCapturedEvent(LEAD, {
      name: 'Juan Perez',
      email: 'juan@example.com',
    });

    expect(payload).toStrictEqual({
      lead: { name: 'Juan Perez', email: 'juan@example.com' },
      context: {},
      attribution: {},
    });
  });

  it('passes a referrer through when the metadata carries one', () => {
    const { payload } = buildLeadCapturedEvent(LEAD, {
      ...SUBMISSION,
      metadata: { referrer: 'https://news.example.test/post' },
    });

    expect(payload.attribution).toStrictEqual({ referrer: 'https://news.example.test/post' });
  });

  it('dates the event now when the row carries no createdAt', () => {
    expect(buildLeadCapturedEvent({ id: LEAD.id }, SUBMISSION).occurred_at).toBe(NOW);
  });
});

describe('signEventBody', () => {
  it('is t=<unix seconds>,v1=<hex HMAC-SHA256 of "<t>.<rawBody>">', () => {
    const rawBody = JSON.stringify({ name: 'María José Núñez' });
    const expected = createHmac('sha256', SECRET).update(`${NOW_SECONDS}.${rawBody}`).digest('hex');

    expect(signEventBody(rawBody, SECRET, NOW_SECONDS)).toBe(`t=${NOW_SECONDS},v1=${expected}`);
  });

  it('changes with the body, the secret and the timestamp', () => {
    const signature = signEventBody('{"a":1}', SECRET, NOW_SECONDS);

    expect(signEventBody('{"a":2}', SECRET, NOW_SECONDS)).not.toBe(signature);
    expect(signEventBody('{"a":1}', 'another-secret', NOW_SECONDS)).not.toBe(signature);
    expect(signEventBody('{"a":1}', SECRET, NOW_SECONDS + 1)).not.toBe(signature);
  });
});

describe('deliverLeadToCrm', () => {
  it.each([
    ['both variables are unset', undefined, undefined],
    ['the secret is unset', BASE_URL, undefined],
    ['the base URL is unset', undefined, SECRET],
    ['the base URL is empty', '', SECRET],
    ['the secret is empty', BASE_URL, ''],
  ])('sends nothing and logs nothing when %s', async (_case, baseUrl, secret) => {
    vi.unstubAllEnvs();
    delete process.env.PHYND_CRM_BASE_URL;
    delete process.env.PHYND_CRM_EVENTS_SECRET;
    if (baseUrl !== undefined) vi.stubEnv('PHYND_CRM_BASE_URL', baseUrl);
    if (secret !== undefined) vi.stubEnv('PHYND_CRM_EVENTS_SECRET', secret);

    await expect(deliverLeadToCrm(LEAD, SUBMISSION)).resolves.toBe('skipped');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(everythingLogged()).toBe('[[],[],[],[]]');
  });

  it('POSTs the event as JSON to the lead-intake webhook', async () => {
    await expect(deliverLeadToCrm(LEAD, SUBMISSION)).resolves.toBe('delivered');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const { url, init } = sentRequest();
    expect(url).toBe(INTAKE_URL);
    expect(init.method).toBe('POST');
    expect(init.headers['content-type']).toBe('application/json');
    expect(init.redirect).toBe('manual');
    expect(JSON.parse(init.body)).toStrictEqual(buildLeadCapturedEvent(LEAD, SUBMISSION));
  });

  it('signs the exact body it sends with the shared secret', async () => {
    await deliverLeadToCrm(LEAD, SUBMISSION);

    const { init } = sentRequest();
    const expected = createHmac('sha256', SECRET)
      .update(`${NOW_SECONDS}.${init.body}`)
      .digest('hex');
    expect(init.headers['x-madfam-signature']).toBe(`t=${NOW_SECONDS},v1=${expected}`);
  });

  it('tolerates a trailing slash on the base URL', async () => {
    vi.stubEnv('PHYND_CRM_BASE_URL', `${BASE_URL}/`);

    await deliverLeadToCrm(LEAD, SUBMISSION);

    expect(sentRequest().url).toBe(INTAKE_URL);
  });

  it.each([301, 401, 503])(
    'reports a %i answer with the lead id and status, without throwing',
    async status => {
      fetchMock.mockResolvedValue(new Response(null, { status }));

      await expect(deliverLeadToCrm(LEAD, SUBMISSION)).resolves.toBe('failed');

      expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
        leadId: LEAD.id,
        status,
      });
    }
  );

  it('does not throw when the CRM is unreachable', async () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    fetchMock.mockRejectedValue(new TypeError(`fetch failed for ${INTAKE_URL}`, { cause }));

    await expect(deliverLeadToCrm(LEAD, SUBMISSION)).resolves.toBe('failed');

    expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
      leadId: LEAD.id,
      reason: 'ECONNREFUSED',
    });
  });

  it('does not throw when fetch itself throws something that is not an Error', async () => {
    fetchMock.mockImplementation(() => {
      throw 'boom';
    });

    await expect(deliverLeadToCrm(LEAD, SUBMISSION)).resolves.toBe('failed');

    expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
      leadId: LEAD.id,
      reason: 'unknown',
    });
  });

  it('gives up after 5 seconds and reports a timeout', async () => {
    let signal: AbortSignal | undefined;
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal = init.signal ?? undefined;
          signal?.addEventListener('abort', () => reject(new Error('aborted')));
        })
    );

    const delivery = deliverLeadToCrm(LEAD, SUBMISSION);
    await vi.advanceTimersByTimeAsync(4999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await expect(delivery).resolves.toBe('failed');
    expect(signal?.aborted).toBe(true);
    expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
      leadId: LEAD.id,
      reason: 'timeout',
    });
  });

  it('reports a base URL that is not an absolute http(s) URL without calling it', async () => {
    vi.stubEnv('PHYND_CRM_BASE_URL', 'replace-with-phynd-crm-base-url');

    await expect(deliverLeadToCrm(LEAD, SUBMISSION)).resolves.toBe('failed');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
      leadId: LEAD.id,
      reason: 'invalid_base_url',
    });
  });

  it('never logs the secret, the signature or the URL, whatever the outcome', async () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    fetchMock
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      .mockRejectedValueOnce(new TypeError(`fetch failed for ${INTAKE_URL}`, { cause }));

    await deliverLeadToCrm(LEAD, SUBMISSION);
    await deliverLeadToCrm(LEAD, SUBMISSION);
    await deliverLeadToCrm(LEAD, SUBMISSION);

    const signature = sentRequest().init.headers['x-madfam-signature'].split('v1=')[1];
    const logged = everythingLogged();
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(logged).toContain(LEAD.id);
    expect(logged).not.toContain(SECRET);
    expect(logged).not.toContain(signature);
    expect(logged).not.toContain('crm.example.test');
  });
});
