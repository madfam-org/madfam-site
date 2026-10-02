import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

describe('GET /api/health', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('reports unconfigured services as unknown, not ok, and makes no calls', async () => {
    vi.stubEnv('JANUA_API_URL', '');
    vi.stubEnv('COTIZA_API_URL', '');
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.dependencies).toBe('unknown');
    expect(body.services.janua).toEqual({ status: 'unknown', configured: false });
    expect(body.services.cotiza).toEqual({ status: 'unknown', configured: false });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('no longer fabricates version or uptime', async () => {
    vi.stubEnv('JANUA_API_URL', '');
    vi.stubEnv('COTIZA_API_URL', '');
    const body = await (await GET()).json();

    expect(body).not.toHaveProperty('version');
    expect(body).not.toHaveProperty('uptime');
    expect(body.services).not.toHaveProperty('forgesight');
  });

  it('stays 200 (ready) when every configured downstream is failing', async () => {
    vi.stubEnv('JANUA_API_URL', 'https://janua.invalid');
    vi.stubEnv('COTIZA_API_URL', 'https://cotiza.invalid');
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('connect ECONNREFUSED'));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.dependencies).toBe('degraded');
    expect(body.services.janua.status).toBe('error');
    expect(body.services.janua.configured).toBe(true);
    expect(body.services.cotiza.error).toBe('connect ECONNREFUSED');
  });

  it('reports a configured, healthy downstream as ok', async () => {
    vi.stubEnv('JANUA_API_URL', 'https://janua.invalid');
    vi.stubEnv('COTIZA_API_URL', '');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }));

    const body = await (await GET()).json();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('https://janua.invalid/health');
    expect(body.services.janua.status).toBe('ok');
    expect(body.dependencies).toBe('ok');
  });
});
