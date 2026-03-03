import { NextResponse } from 'next/server';
import { getServerAuth } from './auth';
import { apiLogger } from './logger';
import { validateCsrfToken } from './security';

/**
 * CSRF Protection Middleware
 * Validates CSRF tokens for state-changing requests (POST, PUT, PATCH, DELETE)
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

  // Get session to retrieve CSRF token
  const session = await getServerAuth();

  // Get CSRF token from session
  const sessionCsrfToken = session?.csrfToken;

  // Validate CSRF token
  const isValid = validateCsrfToken(request, sessionCsrfToken || null);

  if (!isValid) {
    apiLogger.warn('CSRF validation failed', {
      method,
      path: new URL(request.url).pathname,
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json(
      {
        error: 'Invalid CSRF token',
        code: 'CSRF_VALIDATION_FAILED',
      },
      { status: 403 }
    );
  }

  // CSRF token is valid, proceed with the handler
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
