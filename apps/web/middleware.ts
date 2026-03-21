import { i18nConfig } from '@madfam/i18n';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  locales: ['es', 'en', 'pt'],
  defaultLocale: i18nConfig.defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

export default function middleware(request: NextRequest) {
  // Let next-intl middleware handle all routing including root path
  const response = intlMiddleware(request);

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
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https://vercel.live https://www.googletagmanager.com https://www.google-analytics.com https://plausible.io;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://vitals.vercel-insights.com https://www.google-analytics.com https://analytics.google.com https://plausible.io;
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
  ],
};
