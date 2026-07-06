module.exports = {
  // Paths are relative to the repo root; the web app builds into
  // apps/web/.next (App Router — there is no pages/_app chunk).
  files: [
    {
      path: 'apps/web/.next/static/chunks/main-app-*.js',
      maxSize: '250kb',
      compression: 'gzip',
    },
    {
      path: 'apps/web/.next/static/css/*.css',
      maxSize: '60kb',
      compression: 'gzip',
    },
  ],
  normalizeFilenames: /-[a-z0-9]{6,}\./,
  ci: {
    trackBranches: ['main'],
    repoBranchBase: 'main',
  },
};
