module.exports = {
  ci: {
    collect: {
      // Run from the repo root after `pnpm build`. The image runs the
      // standalone server (`output: 'standalone'`), so Lighthouse measures
      // that, not `next start` (finding S1-004). `/` only redirects to the
      // default locale, so the localized pages are measured directly.
      url: [
        'http://127.0.0.1:3000/es',
        'http://127.0.0.1:3000/es/products',
        'http://127.0.0.1:3000/es/programs',
      ],
      startServerCommand: 'pnpm --filter @madfam-site/web serve:standalone',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': 'off',
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        // Resource hints
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'off',
        // Security
        'is-on-https': 'error',
        // Best practices
        'errors-in-console': 'warn',
        'image-aspect-ratio': 'warn',
        'image-size-responsive': 'warn',
        // SEO
        'meta-description': 'error',
        hreflang: 'warn',
        canonical: 'warn',
        // Accessibility
        'aria-allowed-attr': 'error',
        'aria-hidden-body': 'error',
        'aria-hidden-focus': 'error',
        'aria-required-attr': 'error',
        'aria-roles': 'error',
        'aria-valid-attr': 'error',
        'aria-valid-attr-value': 'error',
        'button-name': 'error',
        'color-contrast': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'image-alt': 'error',
        label: 'error',
        'link-name': 'error',
        list: 'error',
        listitem: 'error',
        'meta-viewport': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
