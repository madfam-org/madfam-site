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
  RETRY_DELAYS_MS,
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
const SECRET = 'lead-intake-secret-for-tests-only';
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
    page: '/es/contact',
    referrer: 'https://news.example.test/post',
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

/** Runs a delivery to the end: retries wait on (fake) timers. */
async function settle<T>(pending: Promise<T>): Promise<T> {
  await vi.runAllTimersAsync();
  return pending;
}

function sentRequests(): SentRequest[] {
  return fetchMock.mock.calls.map(([url, init]) => ({
    url: url as string,
    init: init as SentRequest['init'],
  }));
}

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
  vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', SECRET);
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
          // The site's qualification rides at the end of the message, which
          // the intake turns into the lead's note.
          message:
            'Queremos facturar con Karafiel desde enero.\n\n' +
            'Calificación del sitio (madfam.io):\n- Plazo: 30-days',
        },
        // The page is the path the form was posted from, not the form label.
        context: {
          page: '/es/contact',
          locale: 'es',
          plan_interest: 'karafiel',
          timeframe: '30-days',
        },
        attribution: {
          utm_source: 'newsletter',
          utm_medium: 'email',
          utm_campaign: 'oct-2026',
          utm_content: 'hero',
          utm_term: 'cfdi',
          referrer: 'https://news.example.test/post',
        },
      },
    });
  });

  it('carries the stored budget, timeframe and site score as context fields and note lines', () => {
    const event = buildLeadCapturedEvent(
      { ...LEAD, budget: '500k-plus-mxn', timeframe: 'now', score: 85 },
      {
        ...SUBMISSION,
        metadata: { ...SUBMISSION.metadata, budget: 'ignored', timeline: 'ignored' },
      }
    );
    expect(event.payload.context).toMatchObject({
      budget: '500k-plus-mxn',
      timeframe: 'now',
      site_score: '85',
    });
    expect(event.payload.lead.message).toBe(
      'Queremos facturar con Karafiel desde enero.\n\n' +
        'Calificación del sitio (madfam.io):\n' +
        '- Presupuesto: 500k-plus-mxn\n- Plazo: now\n- Puntaje del sitio: 85/100'
    );
  });

  it('sends the qualification as the whole message when the visitor wrote none, score 0 included', () => {
    const event = buildLeadCapturedEvent(
      { id: LEAD.id, score: 0 },
      { name: 'Juan Perez', email: 'juan@example.com', metadata: { budget: '50k-100k-mxn' } }
    );
    expect(event.payload.lead.message).toBe(
      'Calificación del sitio (madfam.io):\n- Presupuesto: 50k-100k-mxn\n- Puntaje del sitio: 0/100'
    );
    expect(event.payload.context).toStrictEqual({ budget: '50k-100k-mxn', site_score: '0' });
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
      // No product, so the offer path the visitor chose is the interest. The
      // `source` label is not a page and is not sent.
      context: { locale: 'en', plan_interest: 'build-with-madfam' },
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

  it('sends only a path as the page, and caps its length', () => {
    const pageOf = (page: unknown) =>
      buildLeadCapturedEvent(LEAD, { ...SUBMISSION, metadata: { page } }).payload.context.page;

    expect(pageOf('/en/pricing')).toBe('/en/pricing');
    expect(pageOf('contact-page')).toBeUndefined();
    expect(pageOf('https://elsewhere.example.test/x')).toBeUndefined();
    expect(pageOf(7)).toBeUndefined();
    expect(pageOf(`/${'p'.repeat(800)}`)).toHaveLength(500);
  });

  it('fits name, company and phone into the CRM columns', () => {
    const {
      payload: { lead },
    } = buildLeadCapturedEvent(LEAD, {
      ...SUBMISSION,
      name: `${'ñ'.repeat(300)}`,
      company: `${'😀'.repeat(300)}`,
      phone: '5'.repeat(51),
    });

    expect(Array.from(lead.name)).toHaveLength(255);
    // Cut by character, never in the middle of a surrogate pair.
    expect(lead.company).toBe('😀'.repeat(255));
    // A phone that cannot be stored is left out; the lead still goes.
    expect(lead).not.toHaveProperty('phone');
    expect(lead.email).toBe(SUBMISSION.email);

    const atLimit = buildLeadCapturedEvent(LEAD, { ...SUBMISSION, phone: '5'.repeat(50) });
    expect(atLimit.payload.lead.phone).toBe('5'.repeat(50));
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
    ['the secret is only whitespace', BASE_URL, ' \n '],
  ])('sends nothing and logs nothing when %s', async (_case, baseUrl, secret) => {
    vi.unstubAllEnvs();
    delete process.env.PHYND_CRM_BASE_URL;
    delete process.env.PHYND_CRM_LEAD_INTAKE_SECRET;
    if (baseUrl !== undefined) vi.stubEnv('PHYND_CRM_BASE_URL', baseUrl);
    if (secret !== undefined) vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', secret);

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

  it('signs with the secret exactly as provisioned, surrounding whitespace included', async () => {
    vi.stubEnv('PHYND_CRM_LEAD_INTAKE_SECRET', ` ${SECRET}\n`);

    await deliverLeadToCrm(LEAD, SUBMISSION);

    const { init } = sentRequest();
    const expected = createHmac('sha256', ` ${SECRET}\n`)
      .update(`${NOW_SECONDS}.${init.body}`)
      .digest('hex');
    expect(init.headers['x-madfam-signature']).toBe(`t=${NOW_SECONDS},v1=${expected}`);
  });

  it('does not fall back to the old shared key name', async () => {
    vi.unstubAllEnvs();
    delete process.env.PHYND_CRM_LEAD_INTAKE_SECRET;
    vi.stubEnv('PHYND_CRM_BASE_URL', BASE_URL);
    vi.stubEnv('PHYND_CRM_EVENTS_SECRET', SECRET);

    await expect(deliverLeadToCrm(LEAD, SUBMISSION)).resolves.toBe('skipped');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips a lead whose email is longer than the CRM can store, logging the lead id only', async () => {
    const email = `${'a'.repeat(244)}@example.com`;
    expect(email).toHaveLength(256);

    await expect(deliverLeadToCrm(LEAD, { ...SUBMISSION, email })).resolves.toBe('skipped');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(apiLogger.warn).toHaveBeenCalledTimes(1);
    expect(apiLogger.warn).toHaveBeenCalledWith('PhyndCRM lead delivery skipped', {
      leadId: LEAD.id,
      reason: 'email_too_long',
    });
    expect(everythingLogged()).not.toContain(email);

    await expect(deliverLeadToCrm(LEAD, { ...SUBMISSION, email: email.slice(1) })).resolves.toBe(
      'delivered'
    );
  });

  it('tolerates a trailing slash on the base URL', async () => {
    vi.stubEnv('PHYND_CRM_BASE_URL', `${BASE_URL}/`);

    await deliverLeadToCrm(LEAD, SUBMISSION);

    expect(sentRequest().url).toBe(INTAKE_URL);
  });

  it.each([301, 400, 401, 404, 422])(
    'reports a %i answer once with the lead id and status, without retrying',
    async status => {
      fetchMock.mockResolvedValue(new Response(null, { status }));

      await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('failed');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(apiLogger.error).toHaveBeenCalledTimes(1);
      expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
        leadId: LEAD.id,
        status,
        attempts: 1,
      });
    }
  );

  it('does not throw when the CRM is unreachable', async () => {
    const cause = Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    fetchMock.mockRejectedValue(new TypeError(`fetch failed for ${INTAKE_URL}`, { cause }));

    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('failed');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(apiLogger.error).toHaveBeenCalledTimes(1);
    expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
      leadId: LEAD.id,
      reason: 'ECONNREFUSED',
      attempts: 3,
    });
  });

  it('does not throw when fetch itself throws something that is not an Error', async () => {
    fetchMock.mockImplementation(() => {
      throw 'boom';
    });

    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('failed');

    expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
      leadId: LEAD.id,
      reason: 'unknown',
      attempts: 3,
    });
  });

  it('aborts each attempt after 5 seconds, retries, and reports a timeout', async () => {
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
    expect(signal?.aborted).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await expect(settle(delivery)).resolves.toBe('failed');
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(apiLogger.error).toHaveBeenCalledTimes(1);
    expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
      leadId: LEAD.id,
      reason: 'timeout',
      attempts: 3,
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

    await settle(deliverLeadToCrm(LEAD, SUBMISSION));
    await settle(deliverLeadToCrm(LEAD, SUBMISSION));
    await settle(deliverLeadToCrm(LEAD, SUBMISSION));

    const signature = sentRequest().init.headers['x-madfam-signature'].split('v1=')[1];
    const logged = everythingLogged();
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
    expect(logged).toContain(LEAD.id);
    expect(logged).not.toContain(SECRET);
    expect(logged).not.toContain(signature);
    expect(logged).not.toContain('crm.example.test');
  });
});

describe('deliverLeadToCrm retries', () => {
  it('succeeds on the first try with a single request', async () => {
    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('delivered');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(apiLogger.error).not.toHaveBeenCalled();
    expect(apiLogger.warn).not.toHaveBeenCalled();
  });

  it('retries a 503 and delivers the same body on the second attempt', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response('busy', { status: 503 }))
      .mockResolvedValueOnce(new Response(null, { status: 202 }));

    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('delivered');

    const [first, second] = sentRequests();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(second.init.body).toBe(first.init.body);
    expect(apiLogger.error).not.toHaveBeenCalled();
  });

  it('waits ~0.5 s and then ~2 s before the retries', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 502 })));

    const delivery = deliverLeadToCrm(LEAD, SUBMISSION);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[0] - 1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS_MS[1] - 1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    await expect(delivery).resolves.toBe('failed');
    vi.mocked(Math.random).mockRestore();
  });

  it('gives up after three 429 answers and logs once', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 429 })));

    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('failed');

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(apiLogger.error).toHaveBeenCalledTimes(1);
    expect(apiLogger.error).toHaveBeenCalledWith('PhyndCRM lead delivery failed', undefined, {
      leadId: LEAD.id,
      status: 429,
      attempts: 3,
    });
  });

  it('does not retry a 400', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 400 }));

    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('failed');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a timed-out attempt and delivers on the next one', async () => {
    fetchMock
      .mockImplementationOnce(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
          })
      )
      .mockResolvedValueOnce(new Response(null, { status: 202 }));

    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('delivered');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(sentRequests()[1].init.signal?.aborted).toBe(false);
    expect(apiLogger.error).not.toHaveBeenCalled();
  });

  it('signs every attempt with a fresh timestamp over the same body', async () => {
    vi.setSystemTime(new Date('2026-11-13T18:00:00.800Z'));
    fetchMock.mockImplementation(() => Promise.resolve(new Response(null, { status: 500 })));

    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('failed');

    const requests = sentRequests();
    expect(new Set(requests.map(({ init }) => init.body)).size).toBe(1);
    expect(JSON.parse(requests[0].init.body).event_id).toBe(leadEventId(LEAD.id));
    const timestamps = requests.map(({ init }) => {
      const signature = init.headers['x-madfam-signature'];
      const t = Number(/^t=(\d+),/.exec(signature)?.[1]);
      const expected = createHmac('sha256', SECRET).update(`${t}.${init.body}`).digest('hex');
      expect(signature).toBe(`t=${t},v1=${expected}`);
      return t;
    });
    expect(timestamps).toHaveLength(3);
    expect(timestamps[1]).toBeGreaterThan(timestamps[0]);
    expect(timestamps[2]).toBeGreaterThan(timestamps[1]);
  });

  it('releases every response body it does not read', async () => {
    const responses = [new Response('busy', { status: 503 }), new Response('{}', { status: 202 })];
    const cancels = responses.map(response => vi.spyOn(response.body as ReadableStream, 'cancel'));
    fetchMock.mockResolvedValueOnce(responses[0]).mockResolvedValueOnce(responses[1]);

    await expect(settle(deliverLeadToCrm(LEAD, SUBMISSION))).resolves.toBe('delivered');

    for (const cancel of cancels) expect(cancel).toHaveBeenCalledTimes(1);
  });
});
