import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// The ONE robots source for madfam.io (finding C-019; public/robots.txt was
// deleted because it shadowed this file). Ruling R40: AI crawlers are allowed on
// public landing hosts; app, API and admin paths are disallowed for everyone.
// The Cloudflare zone's bot policy must match (operator item O48).

/** R40 allow-list, named explicitly so the intent is reviewable. */
export const AI_CRAWLERS = [
  'ClaudeBot',
  'anthropic-ai',
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
] as const;

/** App/API/admin paths, at the root and under every locale prefix. */
export const DISALLOWED_PATHS = [
  '/api/',
  '/auth/',
  '/dashboard/',
  '/*/auth/',
  '/*/dashboard/',
] as const;

export default function robots(): MetadataRoute.Robots {
  const disallow = [...DISALLOWED_PATHS];
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      { userAgent: [...AI_CRAWLERS], allow: '/', disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
