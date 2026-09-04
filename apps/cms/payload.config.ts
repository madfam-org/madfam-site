import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { slateEditor } from '@payloadcms/richtext-slate';
import { s3Storage } from '@payloadcms/storage-s3';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { BlogPosts } from './src/collections/BlogPosts.ts';
import { CaseStudies } from './src/collections/CaseStudies.ts';
import { Media } from './src/collections/Media.ts';
import { Products } from './src/collections/Products.ts';
import { Resources } from './src/collections/Resources.ts';
import { TeamMembers } from './src/collections/TeamMembers.ts';
import { Testimonials } from './src/collections/Testimonials.ts';
import { Users } from './src/collections/Users.ts';
import { withRebuildWebhook } from './src/hooks/notifyRebuild.ts';
import { migrations } from './src/migrations/index.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// `next build` evaluates this config to compile the route handlers; it must not
// require the runtime secret to be present in the build environment.
const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';

const payloadSecret = process.env.PAYLOAD_SECRET ?? '';
if (!payloadSecret && !isNextBuild) {
  throw new Error('PAYLOAD_SECRET environment variable is required');
}

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://madfam.io',
  'https://staging.madfam.io',
];

// Wave 0: one env-driven list. Per-tenant origins resolved from tenant domains
// are Wave 2, together with the tenancy model.
const allowedOrigins = (
  process.env.CMS_ALLOWED_ORIGINS
    ? process.env.CMS_ALLOWED_ORIGINS.split(',')
    : DEFAULT_ALLOWED_ORIGINS
)
  .map((origin) => origin.trim())
  .filter(Boolean);

// R2 is S3-compatible. Without all four values the adapter stays off and uploads
// fall back to local disk, which only works outside the cluster: the pod runs
// with readOnlyRootFilesystem.
const r2Configured = Boolean(
  process.env.R2_BUCKET &&
    process.env.R2_ENDPOINT &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY
);

const storagePlugins = r2Configured
  ? [
      s3Storage({
        collections: {
          media: true,
        },
        bucket: process.env.R2_BUCKET as string,
        config: {
          endpoint: process.env.R2_ENDPOINT,
          // R2 has no regions; the S3 client still requires the field.
          region: 'auto',
          forcePathStyle: true,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
          },
        },
      }),
    ]
  : [];

const contentCollections = [
  Products,
  CaseStudies,
  BlogPosts,
  Resources,
  TeamMembers,
  Testimonials,
  Media,
];

export default buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000',
  secret: payloadSecret,
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname, 'src/app/(payload)'),
    },
  },
  editor: slateEditor({}),
  // Every content collection calls the site's cache-invalidation webhook on
  // change and delete; Users deliberately does not.
  collections: [...contentCollections.map(withRebuildWebhook), Users],
  // The ~20 `localized: true` fields across the collections bind to these.
  localization: {
    locales: ['es', 'en', 'pt'],
    defaultLocale: 'es',
    fallback: true,
  },
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
  graphQL: {
    schemaOutputFile: path.resolve(dirname, 'src/generated-schema.graphql'),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/payload_cms',
    },
    // Schema changes ship as reviewed migrations, never as a dev-time push.
    push: false,
    migrationDir: path.resolve(dirname, 'src/migrations'),
    // Applied on boot in production: the runtime image carries no CLI and the
    // root filesystem is read-only.
    prodMigrations: migrations,
  }),
  plugins: storagePlugins,
  cors: allowedOrigins,
  csrf: allowedOrigins,
});
