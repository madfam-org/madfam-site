import path from 'path';
import { fileURLToPath } from 'url';

import { withPayload } from '@payloadcms/next/withPayload';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone keeps the runtime image free of TypeScript source and of a
  // second pnpm install; see apps/cms/Dockerfile.
  output: 'standalone',
  // The monorepo root, so pnpm's symlinked dependencies are traced correctly.
  outputFileTracingRoot: path.resolve(dirname, '../..'),
  reactStrictMode: true,
  poweredByHeader: false,
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
