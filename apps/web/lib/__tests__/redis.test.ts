import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockOn = vi.fn();
const mockRedisInstance = { on: mockOn };

vi.mock('ioredis', () => {
  // Must be a constructor-compatible function (called with `new Redis(...)`)
  const RedisMock = vi.fn(function (this: typeof mockRedisInstance) {
    Object.assign(this, mockRedisInstance);
  });
  return { default: RedisMock };
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('getRedisClient', () => {
  let originalRedisUrl: string | undefined;

  beforeEach(() => {
    originalRedisUrl = process.env.REDIS_URL;
    delete process.env.REDIS_URL;
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalRedisUrl !== undefined) {
      process.env.REDIS_URL = originalRedisUrl;
    } else {
      delete process.env.REDIS_URL;
    }
  });

  it('returns null when REDIS_URL is not set', async () => {
    delete process.env.REDIS_URL;

    const { getRedisClient } = await import('../redis');
    const client = getRedisClient();

    expect(client).toBeNull();
  });

  it('returns a Redis instance when REDIS_URL is set', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    const { getRedisClient } = await import('../redis');
    const client = getRedisClient();

    expect(client).not.toBeNull();
    expect(client).toHaveProperty('on');

    const Redis = (await import('ioredis')).default;
    expect(Redis).toHaveBeenCalledWith('redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });
  });

  it('returns the same instance on repeated calls (singleton)', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    const { getRedisClient } = await import('../redis');
    const first = getRedisClient();
    const second = getRedisClient();

    expect(first).toBe(second);

    const Redis = (await import('ioredis')).default;
    expect(Redis).toHaveBeenCalledTimes(1);
  });

  it('registers an error event handler on the Redis instance', async () => {
    process.env.REDIS_URL = 'redis://localhost:6379';

    const { getRedisClient } = await import('../redis');
    getRedisClient();

    expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));

    // Verify the handler logs the error message
    const errorHandler = mockOn.mock.calls[0][1];
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(new Error('Connection refused'));

    expect(consoleSpy).toHaveBeenCalledWith('[Redis] Connection error:', 'Connection refused');

    consoleSpy.mockRestore();
  });
});
