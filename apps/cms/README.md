# MADFAM CMS

Payload CMS v3 for MADFAM content, deployed as `madfam-cms` in the production
cluster. Wave 0 of the multi-tenant CMS track: this app serves MADFAM's own
content. Tenancy is not implemented yet — see [Roadmap](#roadmap).

## Shape

Payload v3 is a Next.js app, not an Express server. There is no `src/server.ts`
and no `payload.init({ express })`; the admin panel and the REST/GraphQL API are
Next route handlers mounted from `@payloadcms/next`:

```
apps/cms
├── payload.config.ts             # buildConfig: collections, localization, db, storage, CORS
├── next.config.mjs               # withPayload + output: 'standalone'
├── src/
│   ├── app/(payload)/
│   │   ├── layout.tsx            # Payload RootLayout + server functions
│   │   ├── admin/[[...segments]] # /admin
│   │   ├── api/[...slug]         # Payload REST API
│   │   ├── api/graphql           # GraphQL endpoint + playground
│   │   ├── api/health            # GET /api/health — k8s probes
│   │   └── health                # GET /health — external monitors
│   ├── access/                   # shared access-control functions
│   ├── collections/              # 8 collections
│   ├── hooks/                    # rebuild webhook, draft-status mirror
│   └── migrations/               # generated SQL migrations
└── scripts/smoke-health.mjs      # probe-surface smoke test
```

Port **3000** and the probe path **`/api/health`** are contract with the
deployment manifests; do not move them. `/api/health` never touches the
database, because the startup probe has to pass before migrations finish.

## Collections

`products`, `case-studies`, `blog-posts`, `resources`, `team-members`,
`testimonials`, `media`, `users`.

- **Localization**: `es` (default), `en`, `pt`, with fallback on. The ~20
  `localized: true` fields resolve against this; `?locale=en` works on the REST
  API.
- **Drafts**: `versions: { drafts: true }` on `products`, `case-studies`,
  `blog-posts`, `resources`. Unauthenticated reads see published documents only.
  `blog-posts` and `case-studies` keep a hidden `status` field mirrored from
  `_status` so the site's existing `where[status][equals]=published` query keeps
  working; new consumers should filter on `_status`.
- **Access**: `users` is authenticated-read (it used to be world-readable);
  creates/updates/deletes require a logged-in user everywhere, and admin role for
  `users`.
- **Rebuild webhook**: every content collection POSTs
  `{ collection, operation, id }` with an `x-webhook-secret` header to
  `CMS_REBUILD_WEBHOOK_URL` on change and delete. Failures are logged and never
  block an editor's save.

## Environment variables

Names only — values come from the cluster secret. See `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PAYLOAD_SECRET` | yes | Payload signing secret |
| `DATABASE_URL` | yes | Postgres connection string |
| `PAYLOAD_PUBLIC_SERVER_URL` | recommended | Absolute URL of this CMS |
| `PORT` | no (3000) | HTTP port |
| `CMS_ALLOWED_ORIGINS` | no | Comma-separated CORS/CSRF allow-list; defaults to `http://localhost:3000,https://madfam.io,https://staging.madfam.io` |
| `CMS_REBUILD_WEBHOOK_URL` | no | Consumer cache-invalidation endpoint; the webhook is skipped when unset |
| `CMS_WEBHOOK_SECRET` | with the above | Shared secret sent as `x-webhook-secret` |
| `R2_BUCKET` | for uploads | S3-compatible bucket name |
| `R2_ENDPOINT` | for uploads | S3 API endpoint for the bucket |
| `R2_ACCESS_KEY_ID` | for uploads | Access key |
| `R2_SECRET_ACCESS_KEY` | for uploads | Secret key |

All four `R2_*` variables must be present or the storage adapter stays off and
uploads fall back to local disk — which cannot work in the cluster, where the
root filesystem is read-only.

## Local development

```bash
pnpm install
cp apps/cms/.env.example apps/cms/.env   # then fill it in locally
pnpm --filter @madfam/cms dev            # http://localhost:3000/admin
```

The first user is created from the admin panel's first-run screen.

## Migrations

The Postgres adapter runs with `push: false`: schema changes ship as reviewed
migrations in `src/migrations`, never as a dev-time push.

```bash
pnpm --filter @madfam/cms migrate:create <name>   # generate from config changes
pnpm --filter @madfam/cms migrate                 # apply
pnpm --filter @madfam/cms migrate:status          # inspect
```

Two things to know when generating a migration:

- `migrate:create` rewrites `src/migrations/index.ts` with an extensionless
  import. Add the `.ts` extension back — the Payload CLI loads the config through
  an ESM loader that requires it.
- Change the generated `import { MigrateUpArgs, MigrateDownArgs, sql }` to a
  type-only import for the two `Migrate*Args` types, for the same reason.

In production, migrations are applied automatically on boot
(`postgresAdapter.prodMigrations`), so the runtime image needs neither the CLI
nor a writable filesystem.

## Build, image, checks

```bash
pnpm --filter @madfam/cms build       # next build; no DB or secret needed
pnpm --filter @madfam/cms typecheck
pnpm --filter @madfam/cms smoke [url] # asserts /api/health, the REST API and /admin
docker build -f apps/cms/Dockerfile . # from the repo root
```

The image is `node:20-alpine`, pnpm pinned to the repo's `packageManager`,
multi-stage with Next standalone output, non-root (UID 1001), no TypeScript
source and no `ts-node` in the runner, and `.next/cache` symlinked into `/tmp`
so it runs with `readOnlyRootFilesystem: true`.

## Roadmap

Wave 0 (this app) is single-tenant: MADFAM content only. Multi-tenancy —
a `tenants` collection, a `tenant` field on every content collection,
tenant-scoped access with **Postgres row-level security underneath it**, dynamic
CORS from tenant domains, a dedicated database, Janua OIDC on the admin, and a
tenant-scoped export — is Wave 2+ of the plan *"Multi-tenant CMS — implementation
and integration plan"* (MADFAM internal strategy record). Do not assume tenant
isolation from this app: there is none yet.
