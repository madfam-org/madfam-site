import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from '../route';

describe('GET /api/health/live', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('answers 200 without calling any downstream service', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const response = GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
