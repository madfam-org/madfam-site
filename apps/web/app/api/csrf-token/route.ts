import { NextResponse } from 'next/server';
import { getServerAuth } from '@/lib/auth';
import { apiLogger } from '@/lib/logger';
import { generateCsrfToken } from '@/lib/security';

// Force dynamic rendering since this route uses session/headers
export const dynamic = 'force-dynamic';

/**
 * GET /api/csrf-token
 * Returns a CSRF token for the current session
 */
export async function GET(_request: Request) {
  try {
    const session = await getServerAuth();

    // Return existing CSRF token from session, or generate a new one for anonymous users
    const csrfToken = session?.csrfToken || generateCsrfToken();

    return NextResponse.json({
      csrfToken,
    });
  } catch (error) {
    apiLogger.error('Error generating CSRF token', error as Error);
    return NextResponse.json(
      {
        error: 'Failed to generate CSRF token',
      },
      { status: 500 }
    );
  }
}
