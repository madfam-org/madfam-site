/**
 * Auth utilities — wraps @janua/nextjs for server-side session access.
 *
 * Replaces NextAuth v4's getServerSession(authOptions) with Janua SDK.
 * Preserves the same session shape (user.role, csrfToken, etc.) so
 * consumers (API routes, server components) work without changes.
 */

import { getSession as januaGetSession } from '@janua/nextjs';
import { UserRole } from '@/lib/prisma-types';
import { generateCsrfToken } from '@/lib/security';

const JANUA_APP_ID = process.env.JANUA_APP_ID || 'madfam-web';
const JANUA_API_KEY = process.env.JANUA_API_KEY || '';
const JANUA_JWT_SECRET = process.env.JANUA_JWT_SECRET || '';

export interface MadfamSession {
  user: {
    id: string;
    role: UserRole;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    orgId?: string;
    permissions?: string[];
  };
  csrfToken: string;
  authProvider?: string;
  januaAccessToken?: string;
  error?: string;
}

/**
 * Server-side session access — drop-in replacement for getServerSession(authOptions).
 */
export async function getServerAuth(): Promise<MadfamSession | null> {
  try {
    const session = await januaGetSession(JANUA_APP_ID, JANUA_API_KEY, JANUA_JWT_SECRET);

    if (!session?.user) {
      return null;
    }

    const claims = session.user as unknown as Record<string, unknown>;

    // Map Janua role to UserRole enum
    const roleStr = (claims.role as string) || 'VIEWER';
    const role = (UserRole[roleStr as keyof typeof UserRole] || UserRole.VIEWER) as UserRole;

    return {
      user: {
        id: session.user.id || '',
        role,
        email: session.user.email,
        name: session.user.name || session.user.display_name,
        image: (claims.picture as string) || (claims.avatar as string) || null,
        orgId: (claims.org_id as string) || undefined,
        permissions: (claims.permissions as string[]) || [],
      },
      csrfToken: generateCsrfToken(),
      authProvider: 'janua',
      januaAccessToken: (session.session as unknown as Record<string, unknown>)
        ?.accessToken as string,
    };
  } catch (error) {
    console.error('Failed to get auth session:', error);
    return null;
  }
}
