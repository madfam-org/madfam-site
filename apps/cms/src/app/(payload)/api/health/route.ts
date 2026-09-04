import { NextResponse } from 'next/server';

/**
 * GET /api/health — liveness/readiness/startup probe target.
 *
 * k8s/production/madfam-cms-deployment.yaml points all three probes here, so it
 * must stay on this path and port 3000, must not touch the database (the
 * startup probe has to pass before migrations finish) and must stay cheap.
 *
 * A static segment beats the `[...slug]` catch-all that serves the Payload REST
 * API, so this route is not shadowed by it.
 */
export const dynamic = 'force-dynamic';

export function GET(): NextResponse {
  return NextResponse.json({ status: 'ok' });
}
