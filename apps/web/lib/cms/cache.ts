/**
 * CMS Caching System
 *
 * Supports in-memory cache (single pod) and Redis cache (multi-pod K8s).
 * Auto-selects Redis when REDIS_URL is configured; falls back to in-memory.
 */

import { getRedisClient } from '../redis';
import { recordCacheHit, recordCacheMiss } from '../performance-monitor';
import type { CacheConfig, CacheEntry } from './types';

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  ttl: 3600, // 1 hour
  staleWhileRevalidate: 86400, // 24 hours
  maxAge: 604800, // 7 days
};

// ---------------------------------------------------------------------------
// In-memory cache (default / fallback)
// ---------------------------------------------------------------------------
const memoryCache = new Map<string, CacheEntry>();

class MemoryCMSCache {
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl * 1000;
  }

  get<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (entry && this.isValid(entry)) return entry.data as T;
    return null;
  }

  getStale<T>(key: string): T | null {
    const entry = memoryCache.get(key);
    if (entry) {
      const staleValid = Date.now() - entry.timestamp < this.config.staleWhileRevalidate * 1000;
      if (staleValid) return entry.data as T;
    }
    return null;
  }

  set<T>(key: string, data: T): void {
    memoryCache.set(key, { data, timestamp: Date.now(), ttl: this.config.ttl });
  }

  clear(pattern?: string): void {
    if (pattern) {
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern)) memoryCache.delete(key);
      }
    } else {
      memoryCache.clear();
    }
  }

  async getStats(): Promise<{ size: number; keys: string[] }> {
    return { size: memoryCache.size, keys: Array.from(memoryCache.keys()) };
  }
}

// ---------------------------------------------------------------------------
// Redis cache (multi-pod)
// ---------------------------------------------------------------------------
const CMS_KEY_PREFIX = 'cms:';

class RedisCMSCache {
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
  }

  private redis() {
    const client = getRedisClient();
    if (!client) throw new Error('Redis client unavailable');
    return client;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.redis().get(CMS_KEY_PREFIX + key);
    if (!raw) return null;
    try {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp < entry.ttl * 1000) return entry.data as T;
    } catch {
      /* corrupted entry */
    }
    return null;
  }

  async getStale<T>(key: string): Promise<T | null> {
    const raw = await this.redis().get(CMS_KEY_PREFIX + key);
    if (!raw) return null;
    try {
      const entry: CacheEntry = JSON.parse(raw);
      if (Date.now() - entry.timestamp < this.config.staleWhileRevalidate * 1000) {
        return entry.data as T;
      }
    } catch {
      /* corrupted entry */
    }
    return null;
  }

  async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry = { data, timestamp: Date.now(), ttl: this.config.ttl };
    await this.redis().set(CMS_KEY_PREFIX + key, JSON.stringify(entry), 'EX', this.config.maxAge);
  }

  async clear(pattern?: string): Promise<void> {
    const client = this.redis();
    if (pattern) {
      const keys = await client.keys(`${CMS_KEY_PREFIX}*${pattern}*`);
      if (keys.length > 0) await client.del(...keys);
    } else {
      const keys = await client.keys(`${CMS_KEY_PREFIX}*`);
      if (keys.length > 0) await client.del(...keys);
    }
  }

  async getStats(): Promise<{ size: number; keys: string[] }> {
    const keys = await this.redis().keys(`${CMS_KEY_PREFIX}*`);
    return { size: keys.length, keys };
  }
}

// ---------------------------------------------------------------------------
// Public CMSCache — delegates to Redis or Memory
// ---------------------------------------------------------------------------
export class CMSCache {
  private config: CacheConfig;
  private memory: MemoryCMSCache;
  private redis: RedisCMSCache | null;

  constructor(config: CacheConfig = DEFAULT_CACHE_CONFIG) {
    this.config = config;
    this.memory = new MemoryCMSCache(config);
    this.redis = getRedisClient() ? new RedisCMSCache(config) : null;
  }

  private getCacheKey(endpoint: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  get<T>(endpoint: string, options?: RequestInit): T | null {
    const key = this.getCacheKey(endpoint, options);

    // Redis path is async — for backward compat, use memory as sync fast-path
    const result = this.memory.get<T>(key);
    if (result) {
      recordCacheHit('cache-check');
      return result;
    }
    recordCacheMiss('cache-check');
    return null;
  }

  getStale<T>(endpoint: string, options?: RequestInit): T | null {
    const key = this.getCacheKey(endpoint, options);
    return this.memory.getStale<T>(key);
  }

  set<T>(endpoint: string, data: T, options?: RequestInit): void {
    if (options?.method === 'POST') return;

    const key = this.getCacheKey(endpoint, options);
    this.memory.set(key, data);

    // Write-through to Redis (fire-and-forget)
    if (this.redis) {
      this.redis.set(key, data).catch(() => {
        /* Redis write failure is non-fatal */
      });
    }
  }

  clear(endpoint?: string): void {
    this.memory.clear(endpoint);

    if (this.redis) {
      this.redis.clear(endpoint).catch(() => {
        /* Redis clear failure is non-fatal */
      });
    }
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()),
    };
  }
}
