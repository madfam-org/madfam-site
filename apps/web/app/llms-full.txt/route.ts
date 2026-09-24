import { buildLlmsFullTxt } from '@/lib/llms';

// /llms-full.txt — generated from the registry projection + copy bundle (finding C-020).
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(buildLlmsFullTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
