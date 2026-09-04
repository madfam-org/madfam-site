# syntax=docker/dockerfile:1
#
# Payload v3 runs as a Next.js app: the admin panel and the REST/GraphQL API are
# route handlers, so this image is a standard Next standalone image.
#
# Constraints it has to satisfy (k8s/production/madfam-cms-deployment.yaml):
#   - runs as UID/GID 1001, non-root
#   - readOnlyRootFilesystem: true, with /tmp as the only writable mount
#   - probes hit GET /api/health on port 3000
#   - no TypeScript source and no ts-node in the runtime image

# Base stage — shared tooling
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
# Pinned to the repo's packageManager (root package.json), never `latest`.
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Dependencies stage — install everything the build needs
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cms/package.json ./apps/cms/package.json
RUN pnpm install --frozen-lockfile --filter=@madfam/cms...

# Builder stage — next build (standalone output)
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cms/node_modules ./apps/cms/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cms ./apps/cms
# No PAYLOAD_SECRET here on purpose: payload.config.ts skips the secret check
# during `next build` (NEXT_PHASE=phase-production-build) and enforces it at
# runtime, so no placeholder secret is ever baked into a layer.
RUN cd apps/cms && pnpm exec next build

# Runner stage — no package manager, no source, no compiler
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1
# Nothing outside /tmp is writable in the cluster.
ENV HOME=/tmp
ENV NODE_OPTIONS="--max-old-space-size=384"

# Matches the pod securityContext (runAsUser 1001 / runAsGroup 1001).
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --ingroup nodejs payload

COPY --from=builder --chown=1001:1001 /app/apps/cms/.next/standalone ./
COPY --from=builder --chown=1001:1001 /app/apps/cms/.next/static ./apps/cms/.next/static

# Next writes its incremental cache under .next/cache; redirect it to the /tmp
# emptyDir so the image runs with readOnlyRootFilesystem: true.
RUN ln -s /tmp/next-cache /app/apps/cms/.next/cache && \
    chown -h 1001:1001 /app/apps/cms/.next/cache

USER 1001

EXPOSE 3000

# Database migrations are applied on boot (postgresAdapter prodMigrations), so
# the runtime needs neither the Payload CLI nor a writable filesystem.
CMD ["node", "apps/cms/server.js"]
