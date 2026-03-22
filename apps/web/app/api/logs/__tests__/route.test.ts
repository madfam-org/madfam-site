import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

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
// Imports
// ---------------------------------------------------------------------------

import { GET, POST } from '../route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(new URL('http://localhost:3000/api/logs'), {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function validLogBatch(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    logs: [
      {
        timestamp: new Date().toISOString(),
        level: 1,
        message: 'Test log message',
      },
    ],
    environment: 'production',
    serviceName: 'web-app',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Logs API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_ENV = 'test';
  });

  // =========================================================================
  // GET /api/logs
  // =========================================================================

  describe('GET /api/logs', () => {
    it('returns 200 health check with status, service, and timestamp', async () => {
      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.status).toBe('healthy');
      expect(body.service).toBe('log-ingestion');
      expect(body.timestamp).toBeDefined();
      expect(typeof body.timestamp).toBe('string');
      expect(body.environment).toBeDefined();
    });
  });

  // =========================================================================
  // POST /api/logs
  // =========================================================================

  describe('POST /api/logs', () => {
    it('accepts valid log batch and returns success with received count', async () => {
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 1,
          message: 'Info log entry',
        },
        {
          timestamp: new Date().toISOString(),
          level: 2,
          message: 'Warning log entry',
        },
      ];

      const req = makeRequest(validLogBatch({ logs }));
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.received).toBe(2);
      expect(body.timestamp).toBeDefined();
      expect(typeof body.timestamp).toBe('string');
    });

    it('returns 400 on missing logs array', async () => {
      const req = makeRequest({
        environment: 'production',
        serviceName: 'web-app',
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid log data');
      expect(body.timestamp).toBeDefined();
    });

    it('returns 400 on invalid environment enum', async () => {
      const req = makeRequest(validLogBatch({ environment: 'invalid-env' }));
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid log data');
    });

    it('validates log entry schema - level and message required', async () => {
      const req = makeRequest(
        validLogBatch({
          logs: [
            {
              timestamp: new Date().toISOString(),
              // missing level and message
            },
          ],
        })
      );
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Invalid log data');
    });

    it('handles error.stack field in log entries', async () => {
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 0,
          message: 'Something failed',
          error: {
            name: 'TypeError',
            message: 'Cannot read property of undefined',
            stack:
              'TypeError: Cannot read property of undefined\n    at Object.<anonymous> (app.ts:10:5)',
          },
        },
      ];

      const req = makeRequest(validLogBatch({ logs }));
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.received).toBe(1);
    });

    it('handles metadata object in log entries', async () => {
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 1,
          message: 'Request processed',
          metadata: {
            requestId: 'req-123',
            duration: 150,
            path: '/api/users',
            statusCode: 200,
          },
        },
      ];

      const req = makeRequest(validLogBatch({ logs }));
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.received).toBe(1);
    });

    it('handles development environment logs with error field', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 0,
          message: 'Critical failure in auth service',
          context: 'AuthModule',
          error: {
            name: 'AuthenticationError',
            message: 'Token expired',
          },
          userId: 'user-456',
          sessionId: 'session-789',
          requestId: 'req-abc',
        },
      ];

      const req = makeRequest(validLogBatch({ logs, environment: 'development' }));
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.received).toBe(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error:',
        expect.objectContaining({
          name: 'AuthenticationError',
          message: 'Token expired',
        })
      );

      consoleSpy.mockRestore();
    });
  });
});
