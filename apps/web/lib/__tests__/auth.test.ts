import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@janua/nextjs', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/security', () => ({
  generateCsrfToken: vi.fn(() => 'csrf-token'),
}));

vi.mock('@prisma/client', () => ({
  UserRole: { ADMIN: 'ADMIN', EDITOR: 'EDITOR', VIEWER: 'VIEWER' },
}));

vi.mock('@madfam/core', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  })),
  LogLevel: { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 },
}));

vi.mock('@/lib/logger', () => ({
  apiLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { getSession } from '@janua/nextjs';
import { getServerAuth } from '../auth';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJanuaSession(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: 'user-123',
      email: 'ada@madfam.io',
      name: 'Ada Lovelace',
      display_name: 'Ada L.',
      role: 'ADMIN',
      ...overrides,
    },
    session: {
      accessToken: 'janua-access-tok',
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getServerAuth()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when Janua session is null', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const result = await getServerAuth();

    expect(result).toBeNull();
  });

  it('returns null when session.user is undefined', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: undefined } as never);

    const result = await getServerAuth();

    expect(result).toBeNull();
  });

  it('maps Janua session to MadfamSession correctly', async () => {
    vi.mocked(getSession).mockResolvedValue(makeJanuaSession() as never);

    const result = await getServerAuth();

    expect(result).not.toBeNull();
    expect(result!.user.id).toBe('user-123');
    expect(result!.user.email).toBe('ada@madfam.io');
    expect(result!.user.name).toBe('Ada Lovelace');
    expect(result!.csrfToken).toBe('csrf-token');
    expect(result!.authProvider).toBe('janua');
    expect(result!.januaAccessToken).toBe('janua-access-tok');
  });

  it('maps role string ADMIN to UserRole.ADMIN', async () => {
    vi.mocked(getSession).mockResolvedValue(makeJanuaSession({ role: 'ADMIN' }) as never);

    const result = await getServerAuth();

    expect(result!.user.role).toBe('ADMIN');
  });

  it('defaults to VIEWER when role is missing', async () => {
    vi.mocked(getSession).mockResolvedValue(makeJanuaSession({ role: undefined }) as never);

    const result = await getServerAuth();

    expect(result!.user.role).toBe('VIEWER');
  });

  it('defaults to VIEWER when role is unrecognized', async () => {
    vi.mocked(getSession).mockResolvedValue(makeJanuaSession({ role: 'SUPERUSER' }) as never);

    const result = await getServerAuth();

    expect(result!.user.role).toBe('VIEWER');
  });

  it('extracts picture/avatar from claims', async () => {
    vi.mocked(getSession).mockResolvedValue(
      makeJanuaSession({ picture: 'https://cdn.madfam.io/avatar.png' }) as never
    );

    const result = await getServerAuth();

    expect(result!.user.image).toBe('https://cdn.madfam.io/avatar.png');

    // Falls back to avatar when picture is absent
    vi.mocked(getSession).mockResolvedValue(
      makeJanuaSession({
        picture: undefined,
        avatar: 'https://cdn.madfam.io/fallback.png',
      }) as never
    );

    const fallback = await getServerAuth();

    expect(fallback!.user.image).toBe('https://cdn.madfam.io/fallback.png');
  });

  it('returns null on exception (error handling)', async () => {
    vi.mocked(getSession).mockRejectedValue(new Error('Network failure'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await getServerAuth();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to get auth session:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});
