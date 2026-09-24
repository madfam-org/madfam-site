import { buildLlmsTxt } from '@/lib/llms';

// /llms.txt — generated from the registry projection + copy bundle (finding C-020).
export const dynamic = 'force-static';

export function GET(): Response {
  return new Response(buildLlmsTxt(), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
