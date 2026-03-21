import { NextRequest, NextResponse } from 'next/server';
import { getRedisClient } from './redis';
import type Redis from 'ioredis';

interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<RateLimitEntry>;
}

// ---------------------------------------------------------------------------
// MemoryStore – in-process Map (original behaviour)
// ---------------------------------------------------------------------------

class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitEntry>();

  constructor() {
    // Clean up expired entries every 60 s
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.store.entries()) {
        if (value.resetTime < now) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const now = Date.now();
    let entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime: now + windowMs };
    }

    entry.count++;
    this.store.set(key, entry);
    return entry;
  }
}

// ---------------------------------------------------------------------------
// RedisStore – distributed rate limiting via INCR + PEXPIRE
// ---------------------------------------------------------------------------

class RedisStore implements RateLimitStore {
  private client: Redis;

  constructor(client: Redis) {
    this.client = client;
  }

  async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
    const redisKey = `ratelimit:${key}`;

    // INCR is atomic; returns 1 on first call (key created)
    const count = await this.client.incr(redisKey);

    if (count === 1) {
      // First request in this window – set the expiry
      await this.client.pexpire(redisKey, windowMs);
    }

    // Retrieve remaining TTL so we can compute resetTime
    const ttl = await this.client.pttl(redisKey);
    const resetTime = Date.now() + (ttl > 0 ? ttl : windowMs);

    return { count, resetTime };
  }
}

// ---------------------------------------------------------------------------
// Store singleton – prefer Redis when available, fall back to memory
// ---------------------------------------------------------------------------

let store: RateLimitStore | null = null;

function getStore(): RateLimitStore {
  if (store) return store;

  const redis = getRedisClient();
  if (redis) {
    store = new RedisStore(redis);
  } else {
    store = new MemoryStore();
  }

  return store;
}

// ---------------------------------------------------------------------------
// Public API (signatures unchanged)
// ---------------------------------------------------------------------------

export function rateLimit(options: RateLimitOptions = {}) {
  const {
    windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes default
    maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests default
    keyGenerator = (req: NextRequest) => {
      // Use IP address as default key
      return (
        req.headers.get('x-forwarded-for')?.split(',')[0] ||
        req.headers.get('x-real-ip') ||
        'anonymous'
      );
    },
  } = options;

  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (req: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const key = keyGenerator(request);
    const now = Date.now();

    const rateLimitEntry = await getStore().increment(key, windowMs);

    // Check if rate limit exceeded
    if (rateLimitEntry.count > maxRequests) {
      const retryAfter = Math.ceil((rateLimitEntry.resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(rateLimitEntry.resetTime).toISOString(),
          },
        }
      );
    }

    // Add rate limit headers to response
    const response = await handler(request);

    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', (maxRequests - rateLimitEntry.count).toString());
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitEntry.resetTime).toISOString());

    return response;
  };
}

// Helper function to apply rate limiting to API routes
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: RateLimitOptions
) {
  const rateLimiter = rateLimit(options);

  return async function (req: NextRequest): Promise<NextResponse> {
    return rateLimiter(req, handler);
  };
}
