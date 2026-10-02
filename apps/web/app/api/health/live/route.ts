import { NextResponse } from 'next/server';

// Liveness (finding S1-008): answers as long as the Node process can serve a
// request. It makes no downstream, database or filesystem calls, so a slow or
// failing dependency can never make Kubernetes restart healthy pods.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { status: 'ok' },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}
