import { NextResponse } from 'next/server';

/** GET /health — retained from the pre-v3 Express server for external monitors. */
export const dynamic = 'force-dynamic';

export function GET(): NextResponse {
  return NextResponse.json({ status: 'ok', service: 'cms' });
}
