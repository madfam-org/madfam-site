import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

describe('GET /api/version', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the baked commit SHA and build time', async () => {
    vi.stubEnv('GIT_SHA', '0123456789abcdef0123456789abcdef01234567');
    vi.stubEnv('BUILD_TIME', '2026-10-01T23:00:00Z');

    const response = GET();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(await response.json()).toEqual({
      sha: '0123456789abcdef0123456789abcdef01234567',
      buildTime: '2026-10-01T23:00:00Z',
    });
  });

  it('reports unknown instead of inventing a version when nothing was baked', async () => {
    vi.stubEnv('GIT_SHA', '');
    vi.stubEnv('BUILD_TIME', '');

    expect(await GET().json()).toEqual({ sha: 'unknown', buildTime: 'unknown' });
  });
});
