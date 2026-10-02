import { NextResponse } from 'next/server';

// Deploy proof (finding S1-008/S1-011). GIT_SHA and BUILD_TIME are baked into
// the image by apps/web/Dockerfile (build args passed by deploy-web.yml), so
// this answers "which commit is production serving?" without cluster access.
// The Deploy Web `verify` job polls it until `sha` equals the merged commit.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface VersionResponse {
  sha: string;
  buildTime: string;
}

export function GET() {
  const body: VersionResponse = {
    sha: process.env.GIT_SHA || 'unknown',
    buildTime: process.env.BUILD_TIME || 'unknown',
  };

  return NextResponse.json(body, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
