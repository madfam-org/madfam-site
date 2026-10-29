// Kalya booking embed: the URL builders and the `kalya-embed/v1` message
// protocol, implemented natively here so madfam.io never loads a Kalya script.
// Dependency-free on purpose: middleware.ts imports KALYA_ORIGIN for the CSP
// `frame-src`, so the iframe and the policy can never name different origins.

/** Kalya's production origin. */
export const DEFAULT_KALYA_ORIGIN = 'https://kalya.app';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Returns `value` as a bare origin (`scheme://host[:port]`), or null when it is
 * anything else: a path, query, fragment, credentials, a wildcard, or plain
 * http to a non-loopback host. Only https is accepted, except http on a
 * loopback host for a local Kalya.
 */
export function parseKalyaOrigin(value: string | undefined | null): string | null {
  const raw = value?.trim().replace(/\/$/, '');
  if (!raw || raw.includes('*')) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const secure = url.protocol === 'https:';
  const loopbackHttp = url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname);
  if (!secure && !loopbackHttp) return null;
  if (url.username || url.password || url.search || url.hash) return null;
  // Rejects any path: the origin of `https://kalya.app/x` differs from the input.
  return url.origin === raw ? url.origin : null;
}

/**
 * The one Kalya origin this site frames and accepts messages from. Set
 * NEXT_PUBLIC_KALYA_ORIGIN (inlined at build time) to point at a local Kalya;
 * an invalid value falls back to production rather than widening the CSP.
 */
export const KALYA_ORIGIN =
  parseKalyaOrigin(process.env.NEXT_PUBLIC_KALYA_ORIGIN) ?? DEFAULT_KALYA_ORIGIN;

/** MADFAM's tenant handle on Kalya and its discovery-call event type. */
export const KALYA_HANDLE = 'madfam';
export const KALYA_DISCOVERY_EVENT_TYPE = 'discovery-call';

export const KALYA_EMBED_PROTOCOL = 'kalya-embed/v1';

// ─── Attribution ─────────────────────────────────────────────────────────────

/** Where a booking came from; every value lands in Kalya's booking record. */
export interface BookingAttribution {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content?: string;
  utm_term?: string;
}

const ATTRIBUTION_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

/** Kalya drops (silently) any attribution value outside this grammar. */
const ATTRIBUTION_VALUE = /^[A-Za-z0-9._~:/@+%=-]{1,120}$/;

export function isAttributionValue(value: string): boolean {
  return ATTRIBUTION_VALUE.test(value);
}

function appendAttribution(params: URLSearchParams, attribution: BookingAttribution): void {
  for (const key of ATTRIBUTION_KEYS) {
    const value = attribution[key];
    if (value && isAttributionValue(value)) params.set(key, value);
  }
}

/** The teammate card's attribution (the printed QR's own campaign). */
export function cardAttribution(slug: string): BookingAttribution {
  return { utm_source: 'madf.am', utm_medium: 'qr', utm_campaign: 'tarjeta', utm_content: slug };
}

/**
 * A madfam.io page's attribution. Same source/medium/campaign as every other
 * own-site CTA (`lib/ecosystem-links.ts`: madfam.io / ecosystem / cta), with the
 * placement in `utm_content`, so earlier Kalya reports stay comparable.
 */
export function siteAttribution(placement: string): BookingAttribution {
  return {
    utm_source: 'madfam.io',
    utm_medium: 'ecosystem',
    utm_campaign: 'cta',
    utm_content: placement,
  };
}

/** Kalya's public booking page, tagged: the no-JS / failed-embed destination. */
export function kalyaBookingUrl(attribution: BookingAttribution): string {
  const params = new URLSearchParams();
  appendAttribution(params, attribution);
  const query = params.toString();
  return `${KALYA_ORIGIN}/${KALYA_HANDLE}${query ? `?${query}` : ''}`;
}

// ─── Theme ───────────────────────────────────────────────────────────────────

/** The theme tokens Kalya's embed accepts (literal colors only, no var()). */
export interface KalyaEmbedTheme {
  scheme: 'dark' | 'light';
  radius: number;
  accent: string;
  accentEnd?: string;
  onAccent: string;
  bg: string;
  surface: string;
  field: string;
  text: string;
  muted: string;
  border: string;
}

/**
 * madfam.io's card world as literal values (the `@theme` tokens in
 * app/globals.css: obsidian #0A0E27, leaf #6BCB77, sun #FFD93D, pearl #FAFAFA).
 * Primary buttons are obsidian on leaf→sun, the card's AA-safe pairing; the
 * background is transparent so the host panel's obsidian and glows show
 * through. Surfaces mirror the card's white/5 chips and white/15 borders.
 */
export const MADFAM_EMBED_THEME: KalyaEmbedTheme = {
  scheme: 'dark',
  radius: 12,
  accent: '#6BCB77',
  accentEnd: '#FFD93D',
  onAccent: '#0A0E27',
  bg: 'transparent',
  surface: 'rgba(255, 255, 255, 0.05)',
  field: 'rgba(255, 255, 255, 0.07)',
  text: '#FAFAFA',
  muted: 'rgba(250, 250, 250, 0.7)',
  border: 'rgba(255, 255, 255, 0.15)',
};

// ─── Embed URL ───────────────────────────────────────────────────────────────

export interface KalyaEmbedUrlOptions {
  /** The host page's `window.location.origin`; Kalya posts messages only there. */
  hostOrigin: string;
  attribution: BookingAttribution;
  /** The host page's path (`window.location.pathname`), recorded as `ref`. */
  ref?: string;
  theme?: KalyaEmbedTheme;
  eventType?: string | null;
  handle?: string;
}

/** `${KALYA_ORIGIN}/embed/{handle}/{eventType}?origin=…&scheme=…&utm_…&ref=…` */
export function kalyaEmbedUrl({
  hostOrigin,
  attribution,
  ref,
  theme = MADFAM_EMBED_THEME,
  eventType = KALYA_DISCOVERY_EVENT_TYPE,
  handle = KALYA_HANDLE,
}: KalyaEmbedUrlOptions): string {
  const params = new URLSearchParams({ origin: hostOrigin });
  for (const [key, value] of Object.entries(theme) as [string, string | number | undefined][]) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  appendAttribution(params, attribution);
  if (ref && isAttributionValue(ref)) params.set('ref', ref);
  const path = [handle, eventType]
    .filter((segment): segment is string => Boolean(segment))
    .map(segment => encodeURIComponent(segment))
    .join('/');
  return `${KALYA_ORIGIN}/embed/${path}?${params.toString()}`;
}

// ─── Frame → host messages ───────────────────────────────────────────────────

export type KalyaStep = 'service' | 'slot' | 'form' | 'done';

export type KalyaMessage =
  | { type: 'ready'; eventType: string | null }
  | { type: 'resize'; height: number }
  | { type: 'step'; step: KalyaStep }
  | { type: 'booked'; eventType: string | null; start: string; end: string }
  | { type: 'cancelled' };

const STEPS: readonly KalyaStep[] = ['service', 'slot', 'form', 'done'];

/** Tallest frame we honour; a runaway height cannot push the page into kilometres. */
export const MAX_FRAME_HEIGHT = 6000;

export interface KalyaMessageEventLike {
  origin: string;
  source: unknown;
  data: unknown;
}

/**
 * Accepts a `message` event only when it comes from KALYA_ORIGIN, from our own
 * iframe's window, speaks `kalya-embed/v1` for the expected handle and has a
 * well-formed payload. Everything else is null, so other frames, extensions
 * and a different tenant can never drive the host.
 */
export function parseKalyaMessage(
  event: KalyaMessageEventLike,
  frameWindow: unknown,
  { origin = KALYA_ORIGIN, handle = KALYA_HANDLE }: { origin?: string; handle?: string } = {}
): KalyaMessage | null {
  if (event.origin !== origin) return null;
  if (!frameWindow || event.source !== frameWindow) return null;
  const { data } = event;
  if (!data || typeof data !== 'object') return null;
  const msg = data as Record<string, unknown>;
  if (msg.protocol !== KALYA_EMBED_PROTOCOL || msg.handle !== handle) return null;

  const eventType = typeof msg.eventType === 'string' ? msg.eventType : null;
  switch (msg.type) {
    case 'ready':
      return { type: 'ready', eventType };
    case 'resize': {
      const { height } = msg;
      if (typeof height !== 'number' || !Number.isFinite(height) || height <= 0) return null;
      return { type: 'resize', height: Math.min(Math.ceil(height), MAX_FRAME_HEIGHT) };
    }
    case 'step':
      return STEPS.includes(msg.step as KalyaStep)
        ? { type: 'step', step: msg.step as KalyaStep }
        : null;
    case 'booked':
      if (typeof msg.start !== 'string' || typeof msg.end !== 'string') return null;
      return { type: 'booked', eventType, start: msg.start, end: msg.end };
    case 'cancelled':
      return { type: 'cancelled' };
    default:
      return null;
  }
}

// ─── Host state ──────────────────────────────────────────────────────────────

export type KalyaEmbedStatus = 'loading' | 'ready' | 'failed';

export interface KalyaEmbedState {
  status: KalyaEmbedStatus;
  /** Frame height in CSS px; null until the first `resize`. */
  height: number | null;
  step: KalyaStep | null;
  booked: { eventType: string | null; start: string; end: string } | null;
}

export const INITIAL_EMBED_STATE: KalyaEmbedState = {
  status: 'loading',
  height: null,
  step: null,
  booked: null,
};

export type KalyaEmbedAction = KalyaMessage | { type: 'timeout' } | { type: 'error' };

/**
 * The host's view of the frame. `ready` (or any later message, which proves the
 * frame is alive) clears a failure; `timeout` fails only a frame that never
 * became ready; `cancelled` clears a booking.
 */
export function kalyaEmbedReducer(
  state: KalyaEmbedState,
  action: KalyaEmbedAction
): KalyaEmbedState {
  switch (action.type) {
    case 'timeout':
      return state.status === 'loading' ? { ...state, status: 'failed' } : state;
    case 'error':
      return state.status === 'ready' ? state : { ...state, status: 'failed' };
    case 'ready':
      return { ...state, status: 'ready' };
    case 'resize':
      return { ...state, height: action.height };
    case 'step':
      return { ...state, status: 'ready', step: action.step };
    case 'booked':
      return {
        ...state,
        status: 'ready',
        step: 'done',
        booked: { eventType: action.eventType, start: action.start, end: action.end },
      };
    case 'cancelled':
      return { ...state, booked: null };
    default:
      return state;
  }
}
