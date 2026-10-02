// Bundle budgets for the production build (run from the repo root after
// `pnpm build`). Per-file gzip budgets, set 2026-10-01 from the measured build
// with ~10-15% headroom (finding S1-004). The old config watched only
// `main-app-*.js` (231 B), so it could never fail.
//
// Measured (gzip): largest shared chunk in chunks/ 114.3 kB, largest route
// chunk in chunks/app/ 10.0 kB, largest stylesheet 26.4 kB. Raise a budget
// only in the PR that explains why the bundle grew.
module.exports = {
  files: [
    {
      // Shared and framework chunks (the "First Load JS shared by all" set
      // and the lazily loaded shared chunks).
      path: 'apps/web/.next/static/chunks/*.js',
      maxSize: '125kB',
      compression: 'gzip',
    },
    {
      // Per-route App Router chunks.
      path: 'apps/web/.next/static/chunks/app/**/*.js',
      maxSize: '15kB',
      compression: 'gzip',
    },
    {
      path: 'apps/web/.next/static/css/*.css',
      maxSize: '30kB',
      compression: 'gzip',
    },
  ],
  normalizeFilenames: /-[a-z0-9]{6,}\./,
  ci: {
    trackBranches: ['main'],
    repoBranchBase: 'main',
  },
};
