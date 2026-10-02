// Permanent (308) redirects for the template and lead-magnet pages removed by
// ruling CX-3 (2026-10-01; findings L1-004, M1-012, M1-021, M1-022).
// CommonJS so next.config.js can require it and a unit test can assert it
// without loading the Next.js plugin chain
// (apps/web/lib/__tests__/removed-surfaces.test.ts).
//
// Destinations:
// - /docs, /api and /guides described developer surfaces MADFAM does not
//   offer: an API host that does not exist and SDKs that were never published.
//   Product documentation lives on each product's own front door, which
//   /platforms links, so that is where these visitors go.
// - /estimator, /calculator and /assessment were lead magnets with invented
//   prices and scores. Their visitors wanted to talk about a project; /contact
//   has the form and the discovery-call link.

/** Removed route → where it now lives (locale-relative). */
const REMOVED_SURFACES = {
  docs: '/platforms',
  api: '/platforms',
  guides: '/platforms',
  estimator: '/contact',
  calculator: '/contact',
  assessment: '/contact',
};

/** Localized slugs the i18n route table used to publish for those pages. */
const REMOVED_LOCALIZED_SLUGS = {
  '/es/documentacion': '/es/platforms',
  '/pt/documentacao': '/pt/platforms',
  '/pt/guias': '/pt/platforms',
  '/es/evaluacion': '/es/contact',
  '/pt/avaliacao': '/pt/contact',
  '/es/calculadora': '/es/contact',
  '/pt/calculadora': '/pt/contact',
  '/pt/estimador': '/pt/contact',
};

/** `:path*` also matches the bare index (e.g. `/es/docs`). */
function removedSurfaceRedirects() {
  return [
    ...Object.entries(REMOVED_SURFACES).map(([path, destination]) => ({
      source: `/:locale(es|en|pt)/${path}/:path*`,
      destination: `/:locale${destination}`,
      permanent: true,
    })),
    ...Object.entries(REMOVED_LOCALIZED_SLUGS).map(([source, destination]) => ({
      source: `${source}/:path*`,
      destination,
      permanent: true,
    })),
  ];
}

module.exports = { REMOVED_SURFACES, REMOVED_LOCALIZED_SLUGS, removedSurfaceRedirects };
