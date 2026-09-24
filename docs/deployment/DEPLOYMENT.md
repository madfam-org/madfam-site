# Deployment Guide

> [!IMPORTANT]
> Routine production operations must use Enclii web, API, or CLI. Treat raw
> `kubectl`, `helm`, SSH, provider CLI/API, `docker exec`, and direct container
> access as platform bootstrap or documented break-glass only, and record any
> missing Enclii adapter gap.

> **Boundary checkpoint (2026-09-23, madfam-site).** Public-safe: pipeline shape, file paths
> and variable _names_ only. Node identity, IPs, credentials, tunnel identifiers, costs and
> incident evidence live only in the private `internal-devops` repo (private sink). Policy:
> `internal-devops/docs/repo-boundary-contract.md`.

_Rewritten 2026-09-23 (coherence audit finding C-014). The previous edition described Vercel as
a "preview/fallback" and GitHub Pages as staging; both are retired (owner confirmation
2026-09-04) and their guides now live in [`docs/archive/`](../archive/)._

## Overview

| Environment | How it runs                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------ |
| Development | `pnpm dev` on your machine (Next.js dev server, hot reload)                                            |
| Production  | `madfam.io` — container image on the MADFAM k3s cluster, deployed by **Enclii** with **ArgoCD** GitOps |

There is no Vercel deployment, no Railway service and no GitHub Pages staging site. Enclii is the
only deployment path.

## Prerequisites

- Node.js 22 (see `.nvmrc`) and pnpm 9.15.0 (`packageManager` in `package.json`)
- Enclii CLI access for any production operation
- Docker, only if you want to build the image locally

## How a change reaches production

1. A pull request merges to `main`.
2. If it touches `apps/web/**` or `packages/**`, the **Deploy Web** workflow
   (`.github/workflows/deploy-web.yml`) runs:
   - builds the multi-stage `apps/web/Dockerfile` image,
   - pushes it to `ghcr.io/madfam-org/madfam-site/web`,
   - signs it with cosign (keyless OIDC),
   - commits the new image **digest** into `k8s/production/kustomization.yaml`
     (`deploy(web): update digest to <sha>`),
   - reports the lifecycle event to Enclii.
3. ArgoCD watches `k8s/production` (see `infra/argocd/config.json`) with automated sync, prune and
   self-heal, and rolls the Deployment to the new digest.

Changes that touch only `k8s/production/**` deploy through step 3 alone (no image build). Changes
that touch only docs or non-deploy workflows do not deploy.

One deploying merge at a time: wait for Deploy Web **and** its digest commit before merging the
next change that deploys.

## Manifests (`k8s/production/`)

```
kustomization.yaml          # Kustomize entrypoint; image digests are written here by CI
namespace.yaml              # madfam-site namespace
madfam-web-deployment.yaml  # Next.js web app
madfam-web-service.yaml     # ClusterIP service (80 -> 3000)
madfam-web-hpa.yaml         # Horizontal Pod Autoscaler
network-policies.yaml       # default-deny + explicit allow rules
resource-quota.yaml         # ResourceQuota + LimitRange
secrets-template.yaml       # key NAMES for reference; not applied by ArgoCD
```

The `madfam-cms` workload (Payload) is retired (ruling R52, 2026-09-23); the multi-tenant CMS
moves to its own repository.

Hardening in the manifests: non-root user, read-only root filesystem with an `/tmp` emptyDir,
`seccompProfile: RuntimeDefault`, all capabilities dropped, default-deny network policies, signed
images.

## Configuration and secrets

- Variable names and placeholder values: [`apps/web/.env.example`](../../apps/web/.env.example).
  Keep examples placeholder-only.
- The app validates `DATABASE_URL`, `ENCRYPTION_KEY` and `API_SECRET` at start
  (`apps/web/lib/env.ts`); everything else is optional and switches a service on when set.
- Values are managed with Enclii (backed by the secret store), never committed and never pasted
  into chat, issues or PRs:

  ```bash
  enclii secrets set madfam-web <KEY>
  ```

- Retired keys (no code reads them): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `JANUA_CLIENT_ID`,
  `JANUA_SECRET` (ruling R42 — madfam.io has no sign-in of its own), `PAYLOAD_SECRET` (R52).

## Verifying a deploy

- The Deploy Web run is green and the `deploy(web): update digest to <sha>` commit is on `main`.
- `https://madfam.io/api/health` answers, and the page you changed shows the change.
- Enclii shows the new revision healthy.

## Rolling back

Roll back through Enclii. In GitOps terms a rollback is restoring the previous image digest in
`k8s/production/kustomization.yaml` on `main` (revert the digest commit); ArgoCD then converges the
cluster to it. Do not `kubectl set image` in production — self-heal reverts it.

## Local production build

```bash
pnpm install --frozen-lockfile
NODE_ENV=production SKIP_ENV_VALIDATION=true pnpm build
pnpm --filter @madfam/web start
```

## Related

- [`AGENTS.md`](../../AGENTS.md) — agent operating guide (Enclii-first doctrine)
- [`ECOSYSTEM.md`](../../ECOSYSTEM.md) — where this repo sits in the ecosystem
- [`docs/PUBLIC_REPO_BOUNDARY.md`](../PUBLIC_REPO_BOUNDARY.md) — what may be published here
