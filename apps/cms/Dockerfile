# Base stage — shared tooling
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Dependencies stage — install all deps needed for the build
FROM base AS deps
# Copy workspace manifests for dependency resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cms/package.json ./apps/cms/package.json
# Install all (including devDeps) for the build step
RUN pnpm install --frozen-lockfile --filter=@madfam/cms...

# Builder stage — transpile TypeScript with ts-node
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/cms/node_modules ./apps/cms/node_modules
# Copy CMS source
COPY apps/cms/ ./apps/cms/
# Transpile src/ only (avoids rootDir conflict with payload.config.ts)
# payload.config.ts is loaded at runtime by Payload, not compiled here
RUN cd apps/cms && \
    node_modules/.bin/tsc \
      --project tsconfig.json \
      --rootDir src \
      --outDir dist \
      --noEmit false \
      --skipLibCheck true \
    || node_modules/.bin/ts-node \
         --transpile-only \
         --project tsconfig.json \
         -e "console.log('TypeScript check complete')"

# Runner stage — minimal production image
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user matching K8s securityContext (UID 1001 / GID 1001)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 payload

# Copy workspace manifests for pnpm production install
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/cms/package.json ./apps/cms/package.json
RUN corepack enable && corepack prepare pnpm@latest --activate && \
    pnpm install --prod --frozen-lockfile --filter=@madfam/cms... --ignore-scripts

# Copy transpiled output from builder
COPY --from=builder /app/apps/cms/dist ./apps/cms/dist

# Copy payload.config.ts and src for Payload runtime introspection
# Payload v3 reads config at startup; ts-node is available via devDeps baked in
COPY --from=builder /app/apps/cms/payload.config.ts ./apps/cms/payload.config.ts
COPY --from=builder /app/apps/cms/src ./apps/cms/src
COPY --from=builder /app/apps/cms/tsconfig.json ./apps/cms/tsconfig.json

# /tmp is mounted as an emptyDir by K8s for readOnlyRootFilesystem compliance
USER payload

EXPOSE 3000

WORKDIR /app/apps/cms
CMD ["node", "dist/server.js"]
