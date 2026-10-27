/**
 * Lighthouse at phone width (390x844), alongside the desktop run in
 * lighthouserc.js. Blocking on accessibility and SEO; performance is
 * reported, not enforced, because the lab mobile numbers on shared CI
 * runners vary run to run. Colour contrast is enforced element by element
 * by the axe matrix (apps/web/e2e/accessibility-matrix.spec.ts) in light and
 * dark, so here it is a warning.
 */
const desktop = require('./lighthouserc.js');

module.exports = {
  ci: {
    collect: {
      url: [
        'http://127.0.0.1:3000/es',
        'http://127.0.0.1:3000/es/products',
        'http://127.0.0.1:3000/es/contact',
      ],
      startServerCommand: desktop.ci.collect.startServerCommand,
      startServerReadyPattern: desktop.ci.collect.startServerReadyPattern,
      startServerReadyTimeout: desktop.ci.collect.startServerReadyTimeout,
      numberOfRuns: 3,
      settings: {
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 390,
          height: 844,
          deviceScaleFactor: 3,
          disabled: false,
        },
      },
    },
    assert: {
      assertions: {
        ...desktop.ci.assert.assertions,
        'categories:performance': ['warn', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'color-contrast': 'warn',
      },
    },
    upload: desktop.ci.upload,
  },
};
