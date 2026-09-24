import { NextResponse } from 'next/server';
import { apiLogger } from './logger';

/**
 * CSRF protection for state-changing API requests — a stateless same-origin
 * check.
 *
 * WHY (2026-09-23). The previous design compared an `X-CSRF-Token` header with
 * a token stored in the visitor's Janua session. madfam.io visitors are
 * anonymous (there is no sign-in; the /auth and /dashboard surfaces were
 * removed under finding C-003 / ruling R42), so the session was always null,
 * no client ever sent the header, and every protected POST — including the
 * contact form (`/api/leads`) — was rejected with 403.
 *
 * A browser always sends `Origin` on a cross-site POST, so rejecting a POST
 * whose `Origin` (or, failing that, `Referer`) is not this site stops
 * cross-site request forgery without any session state. A request with
 * neither header is not a browser-driven cross-site request, so it is allowed
 * (and still rate limited by the route).
 */

const SITE_HOSTS = new Set(['madfam.io', 'www.madfam.io']);

function sourceOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (origin && origin !== 'null') return origin;
  if (origin === 'null') return 'null';
  const referer = request.headers.get('referer');
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return 'null';
  }
}

function allowedHosts(request: Request): Set<string> {
  const hosts = new Set(SITE_HOSTS);
  const forwarded = request.headers.get('x-forwarded-host');
  const host = forwarded?.split(',')[0]?.trim() || request.headers.get('host');
  if (host) hosts.add(host.toLowerCase());
  const configured = process.env.NEXT_PUBLIC_BASE_URL;
  if (configured) {
    try {
      hosts.add(new URL(configured).host.toLowerCase());
    } catch {
      // ignore a malformed base URL; the static hosts still apply
    }
  }
  return hosts;
}

/** True when the request is not a cross-site browser request. */
export function isSameOriginRequest(request: Request): boolean {
  const origin = sourceOrigin(request);
  if (origin === null) return true;
  if (origin === 'null') return false;
  try {
    return allowedHosts(request).has(new URL(origin).host.toLowerCase());
  } catch {
    return false;
  }
}

/**
 * CSRF Protection Middleware
 * Validates the request origin for state-changing requests (POST, PUT, PATCH, DELETE)
 */
export async function withCsrfProtection(
  request: Request,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const { method } = request;

  // Only validate CSRF for state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return handler();
  }

  if (!isSameOriginRequest(request)) {
    apiLogger.warn('CSRF validation failed', {
      method,
      path: new URL(request.url).pathname,
      origin: request.headers.get('origin') || request.headers.get('referer') || 'none',
    });

    return NextResponse.json(
      {
        error: 'Invalid request origin',
        code: 'CSRF_VALIDATION_FAILED',
      },
      { status: 403 }
    );
  }

  return handler();
}

/**
 * Check if request requires CSRF protection
 * Exempts certain routes (webhooks, OAuth callbacks, etc.)
 */
export function requiresCsrfProtection(request: Request): boolean {
  const url = new URL(request.url);
  const { method } = request;

  // Only protect state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false;
  }

  // Exempt webhook endpoints (they use HMAC signatures)
  if (url.pathname.startsWith('/api/webhook')) {
    return false;
  }

  // Exempt OAuth callbacks
  if (url.pathname.startsWith('/api/auth')) {
    return false;
  }

  return true;
}
