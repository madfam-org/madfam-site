import { i18nConfig } from '@madfam-site/i18n';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { PLAUSIBLE_HOST } from '@/lib/plausible';
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
  const response = intlMiddleware(request);
  return applySecurityHeaders(response);
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  // Generate a cryptographic nonce for CSP
  // Using crypto.randomUUID() which is available in Edge Runtime,
  // then base64-encoding it for use in CSP headers.
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Content Security Policy with nonce-based script-src
  // - 'nonce-...' allows only scripts with the matching nonce attribute
  // - 'unsafe-inline' is kept as a fallback for older browsers that do not
  //   support nonces (browsers that DO support nonces will ignore 'unsafe-inline')
  // - 'strict-dynamic' propagates trust to scripts loaded by nonced scripts
  // - style-src keeps 'unsafe-inline' because Tailwind injects styles at runtime
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https://vercel.live https://www.googletagmanager.com https://www.google-analytics.com ${PLAUSIBLE_HOST};
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://vitals.vercel-insights.com https://www.google-analytics.com https://analytics.google.com ${PLAUSIBLE_HOST};
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

  response.headers.set('Content-Security-Policy', cspHeader);

  // Expose the nonce to server components via a request header
  // so layout.tsx can read it with headers() and pass it to script tags
  response.headers.set('x-nonce', nonce);

  // Add Strict-Transport-Security for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
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
