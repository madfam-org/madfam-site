import { describe, expect, it } from 'vitest';
import {
  DEFAULT_KALYA_ORIGIN,
  INITIAL_EMBED_STATE,
  KALYA_EMBED_PROTOCOL,
  KALYA_ORIGIN,
  MADFAM_EMBED_THEME,
  MAX_FRAME_HEIGHT,
  cardAttribution,
  kalyaBookingUrl,
  kalyaEmbedReducer,
  kalyaEmbedUrl,
  parseKalyaMessage,
  parseKalyaOrigin,
  siteAttribution,
  type KalyaEmbedState,
} from '../kalya-embed';
import { bookingUrl } from '../team-cards';

describe('parseKalyaOrigin', () => {
  it.each([
    ['https://kalya.app', 'https://kalya.app'],
    ['https://kalya.app/', 'https://kalya.app'],
    ['  https://staging.kalya.app  ', 'https://staging.kalya.app'],
    ['http://localhost:3100', 'http://localhost:3100'],
    ['http://127.0.0.1:3100', 'http://127.0.0.1:3100'],
    ['http://[::1]:3100', 'http://[::1]:3100'],
  ])('accepts %s', (input, origin) => {
    expect(parseKalyaOrigin(input)).toBe(origin);
  });

  it.each([
    undefined,
    '',
    'kalya.app',
    'https://*.kalya.app',
    '*',
    'http://kalya.app',
    'https://kalya.app/madfam',
    'https://kalya.app?x=1',
    'https://kalya.app#x',
    'https://user:pw@kalya.app',
    'data:text/html,kalya',
    "https://kalya.app 'unsafe-inline'",
    'https://kalya.app; script-src *',
  ])('rejects %s', input => {
    expect(parseKalyaOrigin(input)).toBeNull();
  });

  it('defaults to production when the env var is unset', () => {
    expect(KALYA_ORIGIN).toBe(DEFAULT_KALYA_ORIGIN);
  });
});

describe('kalyaBookingUrl', () => {
  it('keeps the card link byte-identical to the printed-card era', () => {
    expect(bookingUrl('aldo')).toBe(
      'https://kalya.app/madfam?utm_source=madf.am&utm_medium=qr&utm_campaign=tarjeta&utm_content=aldo'
    );
  });

  it('tags site CTAs as own-site ecosystem links, placement in utm_content', () => {
    expect(kalyaBookingUrl(siteAttribution('home-hero'))).toBe(
      'https://kalya.app/madfam?utm_source=madfam.io&utm_medium=ecosystem&utm_campaign=cta&utm_content=home-hero'
    );
  });

  it('drops attribution values Kalya would reject', () => {
    const url = new URL(
      kalyaBookingUrl({ utm_source: 'madfam.io', utm_medium: 'a b', utm_campaign: 'x'.repeat(121) })
    );
    expect(url.searchParams.get('utm_source')).toBe('madfam.io');
    expect(url.searchParams.has('utm_medium')).toBe(false);
    expect(url.searchParams.has('utm_campaign')).toBe(false);
  });
});

describe('kalyaEmbedUrl', () => {
  const src = kalyaEmbedUrl({
    hostOrigin: 'https://madfam.io',
    attribution: cardAttribution('carolina'),
    ref: '/es/c/carolina',
  });
  const url = new URL(src);

  it('points at the discovery-call embed on the Kalya origin', () => {
    expect(url.origin).toBe(KALYA_ORIGIN);
    expect(url.pathname).toBe('/embed/madfam/discovery-call');
  });

  it('names the host origin, attribution and ref', () => {
    expect(url.searchParams.get('origin')).toBe('https://madfam.io');
    expect(url.searchParams.get('utm_source')).toBe('madf.am');
    expect(url.searchParams.get('utm_medium')).toBe('qr');
    expect(url.searchParams.get('utm_campaign')).toBe('tarjeta');
    expect(url.searchParams.get('utm_content')).toBe('carolina');
    expect(url.searchParams.get('ref')).toBe('/es/c/carolina');
  });

  it('URL-encodes values (the decoded value is what Kalya validates)', () => {
    expect(src).toContain('origin=https%3A%2F%2Fmadfam.io');
    expect(src).toContain('ref=%2Fes%2Fc%2Fcarolina');
    expect(src).toContain('surface=rgba%28255%2C+255%2C+255%2C+0.05%29');
  });

  it('carries the MADFAM theme as literal tokens', () => {
    expect(url.searchParams.get('scheme')).toBe('dark');
    expect(url.searchParams.get('radius')).toBe('12');
    expect(url.searchParams.get('accent')).toBe('#6BCB77');
    expect(url.searchParams.get('accentEnd')).toBe('#FFD93D');
    expect(url.searchParams.get('onAccent')).toBe('#0A0E27');
    expect(url.searchParams.get('bg')).toBe('transparent');
  });

  it('omits the event type to let the visitor pick a service', () => {
    const generic = new URL(
      kalyaEmbedUrl({
        hostOrigin: 'http://localhost:3000',
        attribution: siteAttribution('contact'),
        eventType: null,
      })
    );
    expect(generic.pathname).toBe('/embed/madfam');
    expect(generic.searchParams.has('ref')).toBe(false);
  });

  it('drops a ref outside the attribution grammar', () => {
    const odd = new URL(
      kalyaEmbedUrl({
        hostOrigin: 'https://madfam.io',
        attribution: siteAttribution('contact'),
        ref: '/es/contacto con espacio',
      })
    );
    expect(odd.searchParams.has('ref')).toBe(false);
  });
});

describe('MADFAM_EMBED_THEME', () => {
  // Kalya's color grammar: hex, `transparent`, or one function with a plain body.
  const COLOR =
    /^(#[0-9a-fA-F]{3,4}|#[0-9a-fA-F]{6}|#[0-9a-fA-F]{8}|transparent|(oklch|oklab|rgb|rgba|hsl|hsla)\([0-9.,%/+\- a-z]*\))$/;
  const BODY = /^[0-9.,%/+\- ]*$/;

  it.each(
    Object.entries(MADFAM_EMBED_THEME).filter(([key]) => key !== 'scheme' && key !== 'radius')
  )('%s is a color Kalya accepts', (_key, value) => {
    expect(String(value)).toMatch(COLOR);
    const body = String(value).match(/\((.*)\)/)?.[1];
    if (body) expect(body.replace(/deg|none/g, '')).toMatch(BODY);
    expect(String(value)).not.toContain('var(');
  });

  it('keeps the radius in Kalya’s 0–32 px range', () => {
    expect(MADFAM_EMBED_THEME.radius).toBeGreaterThanOrEqual(0);
    expect(MADFAM_EMBED_THEME.radius).toBeLessThanOrEqual(32);
  });
});

describe('parseKalyaMessage', () => {
  const frame = { name: 'kalya-frame' };
  const base = { protocol: KALYA_EMBED_PROTOCOL, handle: 'madfam' };
  const event = (data: unknown, overrides: Partial<{ origin: string; source: unknown }> = {}) => ({
    origin: KALYA_ORIGIN,
    source: frame,
    data,
    ...overrides,
  });

  it('ignores another origin', () => {
    expect(
      parseKalyaMessage(
        event({ ...base, type: 'ready' }, { origin: 'https://evil.example' }),
        frame
      )
    ).toBeNull();
  });

  it('ignores another window, even from the Kalya origin', () => {
    expect(parseKalyaMessage(event({ ...base, type: 'ready' }, { source: {} }), frame)).toBeNull();
    expect(parseKalyaMessage(event({ ...base, type: 'ready' }), null)).toBeNull();
  });

  it('ignores another protocol, handle or shape', () => {
    expect(
      parseKalyaMessage(event({ ...base, protocol: 'kalya-embed/v2', type: 'ready' }), frame)
    ).toBeNull();
    expect(parseKalyaMessage(event({ ...base, handle: 'other', type: 'ready' }), frame)).toBeNull();
    expect(parseKalyaMessage(event('ready'), frame)).toBeNull();
    expect(parseKalyaMessage(event({ ...base, type: 'navigate' }), frame)).toBeNull();
    expect(parseKalyaMessage(event({ ...base, type: 'step', step: 'pay' }), frame)).toBeNull();
    expect(parseKalyaMessage(event({ ...base, type: 'booked', start: 1 }), frame)).toBeNull();
  });

  it('accepts ready with or without an event type', () => {
    expect(
      parseKalyaMessage(event({ ...base, type: 'ready', eventType: 'discovery-call' }), frame)
    ).toEqual({ type: 'ready', eventType: 'discovery-call' });
    expect(parseKalyaMessage(event({ ...base, type: 'ready', eventType: null }), frame)).toEqual({
      type: 'ready',
      eventType: null,
    });
  });

  it('accepts a sane resize height, rounded up and capped', () => {
    expect(parseKalyaMessage(event({ ...base, type: 'resize', height: 712.4 }), frame)).toEqual({
      type: 'resize',
      height: 713,
    });
    expect(parseKalyaMessage(event({ ...base, type: 'resize', height: 1e9 }), frame)).toEqual({
      type: 'resize',
      height: MAX_FRAME_HEIGHT,
    });
    for (const height of [0, -5, Number.NaN, Number.POSITIVE_INFINITY, '700']) {
      expect(parseKalyaMessage(event({ ...base, type: 'resize', height }), frame)).toBeNull();
    }
  });

  it('accepts step, booked and cancelled', () => {
    expect(parseKalyaMessage(event({ ...base, type: 'step', step: 'slot' }), frame)).toEqual({
      type: 'step',
      step: 'slot',
    });
    expect(
      parseKalyaMessage(
        event({
          ...base,
          type: 'booked',
          eventType: 'discovery-call',
          start: '2026-11-04T16:00:00Z',
          end: '2026-11-04T16:30:00Z',
        }),
        frame
      )
    ).toEqual({
      type: 'booked',
      eventType: 'discovery-call',
      start: '2026-11-04T16:00:00Z',
      end: '2026-11-04T16:30:00Z',
    });
    expect(parseKalyaMessage(event({ ...base, type: 'cancelled' }), frame)).toEqual({
      type: 'cancelled',
    });
  });
});

describe('kalyaEmbedReducer', () => {
  const reduce = (...actions: Parameters<typeof kalyaEmbedReducer>[1][]): KalyaEmbedState =>
    actions.reduce(kalyaEmbedReducer, INITIAL_EMBED_STATE);

  it('flags ready and applies the resize height', () => {
    const state = reduce({ type: 'ready', eventType: null }, { type: 'resize', height: 640 });
    expect(state.status).toBe('ready');
    expect(state.height).toBe(640);
  });

  it('fails a frame that never became ready, and only that one', () => {
    expect(reduce({ type: 'timeout' }).status).toBe('failed');
    expect(reduce({ type: 'ready', eventType: null }, { type: 'timeout' }).status).toBe('ready');
    expect(reduce({ type: 'error' }).status).toBe('failed');
  });

  it('recovers when a late ready arrives', () => {
    expect(reduce({ type: 'timeout' }, { type: 'ready', eventType: null }).status).toBe('ready');
  });

  it('flags a booking and clears it on cancel', () => {
    const booked = reduce(
      { type: 'ready', eventType: 'discovery-call' },
      { type: 'booked', eventType: 'discovery-call', start: 's', end: 'e' }
    );
    expect(booked.booked).toEqual({ eventType: 'discovery-call', start: 's', end: 'e' });
    expect(booked.step).toBe('done');
    expect(kalyaEmbedReducer(booked, { type: 'cancelled' }).booked).toBeNull();
  });
});
