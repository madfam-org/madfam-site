/**
 * Facts every MADFAM email shares: where links point, who it is from, and the
 * legal entity line. One module, so a template cannot drift from them.
 *
 * - Links are built from `SITE_URL`, default `https://madfam.io`. Never
 *   `VERCEL_URL` (Vercel is retired) and never localhost: an email outlives
 *   the process that rendered it (finding M1-027). A `SITE_URL` that is not a
 *   public https origin is a configuration error and throws, so the queue
 *   records a failed send instead of mailing a dead link.
 * - The platform sender is `MADFAM <hola@madfam.io>` (ruling R46).
 * - The entity line matches the site footer and legal pages (rulings R37/R47).
 */

export const DEFAULT_SITE_URL = 'https://madfam.io';

export const SENDER_NAME = 'MADFAM';
export const SENDER_ADDRESS = 'hola@madfam.io';
/** RFC 5322 From header for the platform sender (R46). */
export const DEFAULT_FROM = `${SENDER_NAME} <${SENDER_ADDRESS}>`;

export const ENTITY_LINE = 'Innovaciones MADFAM S.A.S. de C.V. · Cuernavaca, Morelos, México';

/** Kalya discovery-call booking page (same target as the site's CTAs, R27). */
export const DISCOVERY_CALL_URL = 'https://kalya.app/madfam';

const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0']);

/** The public site origin, without a trailing slash. */
export function siteUrl(): string {
  const configured = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
  let parsed: URL;
  try {
    parsed = new URL(configured);
  } catch {
    throw new Error(`SITE_URL is not a URL: ${configured}`);
  }
  if (parsed.protocol !== 'https:' || LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error(`SITE_URL must be a public https origin for email links, got ${configured}`);
  }
  return configured;
}

/** Email-ready raster logo (email clients do not render SVG); path is stable by contract. */
export function logoUrl(): string {
  return `${siteUrl()}/assets/brand/email/madfam-logo-112.png`;
}

export type EmailLanguage = 'es' | 'en' | 'pt';

/**
 * Normalise whatever language tag a caller passes (`es`, `es-MX`, `en-US`,
 * `pt-BR`, …) to a site locale. Spanish is the default (es-MX first).
 */
export function emailLanguage(value?: string | null): EmailLanguage {
  const tag = (value ?? '').toLowerCase();
  if (tag.startsWith('en')) return 'en';
  if (tag.startsWith('pt')) return 'pt';
  return 'es';
}

/** A localized page on the public site, e.g. `localizedSiteUrl('es', '/contact')`. */
export function localizedSiteUrl(language: EmailLanguage, path: string): string {
  return `${siteUrl()}/${language}${path.startsWith('/') ? path : `/${path}`}`;
}
