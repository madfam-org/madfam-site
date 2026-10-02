import { NextResponse } from 'next/server';

// Readiness + informational health (finding S1-008).
//
// - The HTTP status is always 200 while the process can answer: madfam.io
//   renders its pages without any of the services listed below, so their
//   state must not take pods out of rotation (or, as a liveness target,
//   restart them). Liveness/startup use /api/health/live.
// - A service whose URL is not configured is reported as `unknown`, never as
//   `ok`: the previous handler claimed every unset service was healthy.
// - A configured service is probed with a short budget (below the readiness
//   probe's 3 s timeout) and its result is informational only.
// - No fabricated `version`/`uptime`: the deployed commit is served by
//   /api/version.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DOWNSTREAM_TIMEOUT_MS = 1500;

type ServiceStatus = 'ok' | 'degraded' | 'error' | 'unknown';

export interface ServiceHealth {
  status: ServiceStatus;
  configured: boolean;
  responseTime?: number;
  error?: string;
}

export interface HealthResponse {
  status: 'ok';
  timestamp: string;
  environment: string;
  dependencies: ServiceStatus;
  services: {
    janua: ServiceHealth;
    cotiza: ServiceHealth;
  };
}

async function checkService(url: string | undefined): Promise<ServiceHealth> {
  if (!url) {
    return { status: 'unknown', configured: false };
  }

  const start = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DOWNSTREAM_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    });
    return {
      status: response.ok ? 'ok' : 'degraded',
      configured: true,
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      status: 'error',
      configured: true,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function rollUp(statuses: ServiceStatus[]): ServiceStatus {
  const known = statuses.filter(s => s !== 'unknown');
  if (known.length === 0) return 'unknown';
  if (known.every(s => s === 'ok')) return 'ok';
  return 'degraded';
}

export async function GET() {
  const [janua, cotiza] = await Promise.all([
    checkService(process.env.JANUA_API_URL),
    checkService(process.env.COTIZA_API_URL),
  ]);

  const body: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NEXT_PUBLIC_ENV || process.env.NODE_ENV || 'development',
    dependencies: rollUp([janua.status, cotiza.status]),
    services: { janua, cotiza },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
