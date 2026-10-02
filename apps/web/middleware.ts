import { i18nConfig } from '@madfam-site/i18n';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { PLAUSIBLE_DOMAIN, PLAUSIBLE_HOST } from '@/lib/plausible';
import { PATHNAME_HEADER } from '@/lib/seo-urls';

const intlMiddleware = createIntlMiddleware({
  locales: ['es', 'en', 'pt'],
  defaultLocale: i18nConfig.defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

/**
 * Root-level files the app really serves (public/ + metadata/route handlers).
 * Any other single-segment path containing a dot (e.g. `/x.txt`) used to fall
 * into the [locale] segment and render the app shell as a 200 soft-404
 * (finding C-020); it now gets a real 404.
 */
const ROOT_FILES = new Set([
  '/favicon.svg',
  '/robots.txt',
  '/sitemap.xml',
  '/llms.txt',
  '/llms-full.txt',
]);

const ROOT_FILE_PATTERN = /^\/[^/]*\.[^/]*$/;

/** Request header carrying the per-request CSP nonce to app/layout.tsx. */
export const NONCE_HEADER = 'x-nonce';

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (ROOT_FILE_PATTERN.test(pathname)) {
    if (ROOT_FILES.has(pathname)) return NextResponse.next();
    return new NextResponse('Not Found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Robots-Tag': 'noindex' },
    });
  }

  // Let next-intl middleware handle all routing including root path.
  //
  // NOTE: nauta.quest is NOT served here. The Nauta product front door moved to
  // the standalone `nauta` repo (served by nauta-web at the nauta.quest apex as
  // its own 'marketing' surface). madfam-web serves only madfam.io. The
  // `/[locale]/nauta` page in THIS app is a corporate "about Nauta" page that
  // links out to nauta.quest — it is not the apex's landing.
  //
  // The request path is forwarded as a request header so the [locale] layout
  // can emit a self-referencing canonical + hreflang alternates for every page
  // (finding C-021). next-intl copies the incoming request headers into the
  // request it forwards, so setting it here is enough.
  request.headers.set(PATHNAME_HEADER, request.nextUrl.pathname);

  // Per-request CSP nonce. It travels on the REQUEST (forwarded by next-intl
  // like the pathname header above) so app/layout.tsx can read it with
  // headers() and Next can stamp its own scripts; it is no longer echoed back
  // to the client as an `x-nonce` response header (finding S1-017).
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildContentSecurityPolicy(nonce);
  request.headers.set(NONCE_HEADER, nonce);
  request.headers.set('Content-Security-Policy', csp);

  const response = intlMiddleware(request);
  response.headers.set('Content-Security-Policy', csp);
  return response;
}


/**
 * Content Security Policy with a nonce-based script-src. This is the only
 * header set here: every other security header comes from `headers()` in
 * next.config.js, so pages, /_next/static and /api send identical values
 * (finding S1-017).
 *
 * - 'nonce-…' allows only scripts carrying the matching nonce attribute.
 * - 'unsafe-inline' is a fallback for browsers without nonce support
 *   (browsers that support nonces ignore it).
 * - 'strict-dynamic' propagates trust to scripts loaded by nonced scripts.
 * - style-src keeps 'unsafe-inline' because Tailwind injects styles at runtime.
 * - No Vercel or Google origins (R0a/R41: no Vercel, Plausible only). The
 *   Plausible origin is allowed only when this build renders Plausible
 *   (NEXT_PUBLIC_PLAUSIBLE_DOMAIN set at build time).
 */
export function buildContentSecurityPolicy(nonce: string): string {
  const analytics = PLAUSIBLE_DOMAIN ? ` ${PLAUSIBLE_HOST}` : '';
  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline'${analytics};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self'${analytics};
    media-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'none';
    worker-src 'self' blob:;
    manifest-src 'self';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Static files (_next)
  // - Internal Next.js/Vercel routes (_vercel)
  // - Files with extensions (e.g. favicon.ico)
  matcher: [
    // Enhanced matcher for hyphenated locales like pt-br
    // Excludes /api, /_next, /_vercel, and files with extensions
    '/((?!api|_next|_vercel|.*\\..*).*)',
    // Single-segment paths with a dot (root files): known ones pass through,
    // unknown ones 404 (see ROOT_FILES).
    '/:file([^/]*\\.[^/]*)',
  ],
};
