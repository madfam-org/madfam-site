# Production Serving Diagnosis — 2026-07-07

Status: **DIAGNOSED — fixes require owner/operator console actions (documented below)**
Scope: why `https://www.madfam.io` serves a build that no longer matches `main`.
Related: [DEPLOYMENT.md](./DEPLOYMENT.md) · [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) ·
[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) · `.github/workflows/deploy-web.yml` · `k8s/production/`

---

## TL;DR

There are **two independent breaks**, and both must be fixed before the live
site can ever equal `main`:

1. **Production traffic never reaches the Enclii/GitOps stack.** DNS for
   `madfam.io` / `www.madfam.io` is Cloudflare-proxied to a **Vercel**
   deployment (every live response carries `x-vercel-id` / `x-vercel-cache`).
   That Vercel production deployment was built from a `main` commit dated
   **between 2025-11-14 and 2025-11-25** (~8 months stale). Fixing CI/CD,
   images, or ArgoCD therefore **cannot change the live site by itself**.
2. **The GitOps image pipeline is still broken at the publish step.** Deploys
   failed from 2026-04-27 (expired bot PAT — fixed 2026-07-06 in #249/#250)
   and now fail only at the GHCR image push: `403 Forbidden` because the
   `madfam-site/web` and `madfam-site/cms` GHCR packages do not grant the
   repository's `GITHUB_TOKEN` write access. The last image digest pinned in
   `k8s/production/kustomization.yaml` is from **2026-04-27**.

Order of operations: fix the GHCR ACL → get a green deploy + digest commit →
verify the cluster serves current `main` → repoint Cloudflare DNS from Vercel
to the cluster route → retire the Vercel project (decision D5).

---

## 1. Symptom

`https://www.madfam.io/es` (checked 2026-07-06 and again 2026-07-07 18:01 UTC)
serves the late-2025 "business units" site: English hero on the Spanish page
("Transform Operations with AI—From Strategy to Production"), Aureo Labs /
Primavera3D unit cards, literal "Client Logo 1…4" placeholders, "Trusted by
50+ LATAM enterprises", `/es/empresa` → 404, and a 2-product catalog. None of
that content exists in `main` today.

## 2. Evidence

### 2.1 The serving path is Cloudflare → Vercel (not the cluster)

Live probes, 2026-07-07 18:01 UTC (`curl` with a browser User-Agent;
plain-agent requests are bot-challenged by Cloudflare):

| Request                            | Result                         | Key headers                                                                                                                     |
| ---------------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `https://madfam.io`                | `307 → https://www.madfam.io/` | `server: cloudflare`, `x-vercel-id: iad1::…`, `cf-cache-status: DYNAMIC`                                                        |
| `https://www.madfam.io`            | `307 → /es`                    | `x-vercel-id: iad1::…`                                                                                                          |
| `https://www.madfam.io/es`         | `200`                          | `x-vercel-cache: MISS`, `x-vercel-id: iad1::iad1::…`, `x-matched-path: /[locale]`, `cache-control: private, no-cache, no-store` |
| `https://www.madfam.io/es/empresa` | `404`                          | `x-vercel-cache: HIT`, `x-matched-path: /404`, `age: 460145`                                                                    |

`x-vercel-id` / `x-vercel-cache` are added by Vercel's edge — they prove the
origin behind the Cloudflare proxy is a Vercel deployment. DNS (resolved via
DNS-over-HTTPS): `madfam.io` and `www.madfam.io` → Cloudflare anycast A
records (proxied), zone on Cloudflare nameservers.

The intended production origin (per the Enclii infra repo's expected
Cloudflare Tunnel configuration and this repo's `k8s/production/` manifests)
is `madfam-web.madfam-site.svc.cluster.local:80` behind the Enclii-managed
tunnel. Note `k8s/production/` contains **no Ingress** — public exposure is
tunnel-side, so nothing in this repo alone can repoint the domain.

### 2.2 Dating the live build (content-marker forensics)

| Marker                                                                           | Live site | Repo history                                                       |
| -------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------ |
| `<title>` "MADFAM \| Transformación Digital e Inteligencia Artificial en México" | present   | replaced 2026-03-05 (`4a359de`)                                    |
| "Trusted by 50+ LATAM enterprises"                                               | present   | removed 2026-03-04 (`3175c1c`)                                     |
| "Aureo Labs"                                                                     | present   | removed 2026-03-04 (`89f76d6`); final sweep 2026-04-17 (`bbeec47`) |
| "Client Logo 1… Replace with actual client logos"                                | present   | added 2025-11-14 (`5c88f8d`); removed 2026-03-04                   |
| Hero "Transform Operations with AI—From Strategy to Production"                  | present   | added 2025-11-14 (`220776b` persona-selector era)                  |
| `GET /api/health`                                                                | **404**   | route added 2025-11-26 (`1debc3f`)                                 |
| `GET /es/platforms`                                                              | **404**   | route present at `9f2f1894` (2026-04-27)                           |
| `GET /es/productos`, `/es/products`                                              | 200       | old-era routes                                                     |

The live build **has** everything added on 2025-11-14 and **lacks** the
`/api/health` route added 2025-11-26 → it was built from `main` between
**2025-11-14 and 2025-11-25**.

Corollary: the live build is **older than the last image the GitOps pipeline
ever shipped** (2026-04-27, commit `9f2f1894` — which contains zero "Aureo
Labs" strings and has `/api/health`). If the cluster had ever served this
domain since then, the Aureo-era content could not be what we see. The domain
has been pinned to the stale Vercel deployment the entire time — the
2026-07-06 assumption that "one green deploy makes www.madfam.io show the new
hero" was incomplete.

### 2.3 Pipeline state (GitHub Actions, checked 2026-07-07)

- `CI` on `main`: **green** since 2026-07-06 (`4e3406d`, `772889d`,
  `5e12704`, `564b18a` all success; PR #252 merged).
- `Deploy Web` latest run `28824947824` (2026-07-06T21:36Z, `main`@`4e3406d`):
  checkout ✅, full Next.js build ✅ (build completes; note non-fatal build-log
  noise: `MISSING_MESSAGE: platforms.coforma-studio.*` for es/en/pt and Prisma
  postinstall warning), GHCR login ✅, then:

  ```
  ERROR: failed to push ghcr.io/madfam-org/madfam-site/web:4e3406d…:
  unexpected status from HEAD request to
  https://ghcr.io/v2/madfam-org/madfam-site/web/blobs/sha256:3fb81e…: 403 Forbidden
  ```

- `Deploy CMS` latest run (2026-07-06T21:05Z): failure, same class.
- Five deploy attempts on 2026-07-06 (20:49–21:36 UTC) all failed at this
  exact step. **No deploy runs have happened since.**
- Last successful digest pins in `k8s/production/kustomization.yaml`:
  web `10e6ce9` (2026-04-27, source commit `9f2f1894`), cms `6950aab`
  (2026-04-28). Nothing newer has ever been pinned.
- Deploy history before 2026-07-06 fixes: every run 2026-04-27 → 2026-07-06
  failed at checkout (expired `MADFAM_BOT_PAT`); replaced by `GITHUB_TOKEN`
  in #249/#250.
- Side observation: the `Report lifecycle event` step returns
  `{"error":"Unauthorized"}` (empty `ENCLII_CALLBACK_TOKEN` org secret) —
  non-fatal, known, re-provision when convenient.

## 3. Root cause

1. **Serving-path drift (primary):** `madfam.io`/`www.madfam.io` DNS routes
   Cloudflare → Vercel, and Vercel production has not shipped a new
   deployment since ~2025-11. The Enclii/ArgoCD/K8s stack — the intended and
   actively maintained production path — receives no traffic for these
   hostnames. Why Vercel stopped deploying cannot be determined from outside;
   ranked hypotheses (discriminating test = the Vercel project dashboard's
   deployments list):
   - (a) Git integration disconnected/paused (most likely: repo-scoped
     integration broken during org/repo changes; the stale Vercel deploy
     workflows were removed from this repo 2026-03-03, `4f1d95d`).
   - (b) Vercel builds failing since late Nov 2025 (monorepo/pnpm changes),
     production stays on last READY deployment.
   - (c) Production domain manually pinned to a specific old deployment.
2. **Image publish blocked (secondary):** the GHCR packages
   `madfam-site/web` and `madfam-site/cms` were created by the old bot PAT;
   the repo's `GITHUB_TOKEN` has no write role on them, so `docker push`
   gets `403 Forbidden`. Everything else in the pipeline is verified working
   (checkout, build, registry logins, cosign + digest-commit steps are
   downstream of the failure).

## 4. Fix

### 4.1 Owner action — unblock GHCR pushes (~2 min, console)

On both GHCR packages (`madfam-site/web`, `madfam-site/cms`):
package settings → _Manage Actions access_ → add repository
`madfam-org/madfam-site` with role **Write** (or enable "Inherit access from
repository"). Also confirm the org-wide Actions→Packages policy is not
read-only.

Fallback if the ACL cannot be granted: change `IMAGE_NAME` in
`deploy-web.yml`/`deploy-cms.yml` (and the image refs in `k8s/production/`)
to fresh package names — a first push from Actions creates the package with
repo access. Caveats: new packages default to **private** (the cluster then
needs a pull secret or the package must be made public), and the ArgoCD app
picks up the manifest change only after the digest commit. Prefer the ACL fix.

### 4.2 Deploy and verify the cluster (dispatch + Enclii)

1. Dispatch `Deploy Web` and `Deploy CMS` on `main` (workflow_dispatch).
2. Green run = image pushed + cosign-signed + `deploy(web): update digest…`
   commit lands on `k8s/production/kustomization.yaml`.
3. ArgoCD (Enclii-managed, app `madfam-site`, path `k8s/production`) syncs;
   verify rollout + `/api/health` readiness via Enclii (web/CLI) — the pods
   have been running a 2026-04-27 image for 10 weeks, so watch the first
   rollout.

### 4.3 Operator action — repoint production traffic (Cloudflare)

Only after 4.2 is green:

1. In the Cloudflare zone for `madfam.io`, inspect the current records for
   `@` and `www` — they currently resolve to the Vercel origin. Repoint both
   to the Enclii-managed Cloudflare Tunnel (proxied CNAME to the tunnel
   endpoint), matching the expected tunnel config that already maps
   `madfam.io` and `www.madfam.io` → `madfam-web.madfam-site.svc:80`.
   Confirm the _live_ tunnel ingress actually contains those two hostname
   rules before flipping.
2. Verify from outside:
   - `curl -sSI -A "Mozilla/5.0 …" https://www.madfam.io/es` → no
     `x-vercel-id` header; `200`.
   - Page contains hero `Tecnología que devuelve más de lo que toma` and no
     "Aureo Labs" / "Client Logo" / "Trusted by 50+".
   - `https://www.madfam.io/api/health` → `200`.
   - `https://madfam.io` still redirects to `https://www.madfam.io` (the
     Next.js app/middleware must own this once Vercel's redirect is out of
     the path — verify, since today that 307 is served by Vercel).
3. Then execute decision **D5**: pause/delete the Vercel project so it can
   never shadow production again, and remove `vercel.json` +
   `vercel-minimal.json` from the repo (deliberately deferred until the
   Enclii pipeline is proven by one green production deploy).

Optional stopgap (only if the GHCR/tunnel work stalls): triggering a fresh
Vercel production deployment of `main` from the Vercel dashboard would
immediately replace the Aureo-era content with no infrastructure changes.
It contradicts the D5 direction, so treat it as a temporary mitigation, not
the fix.

### 4.4 Follow-ups (non-blocking)

- Re-provision `ENCLII_CALLBACK_TOKEN` (lifecycle events currently 401).
- Retire `MADFAM_BOT_PAT` once deploys are green (nothing references it).
- Add the missing `platforms.coforma-studio.*` i18n messages (es/en/pt) —
  build-time `MISSING_MESSAGE` noise in the deploy logs.
- Alerting: the plan's success criteria call for an alarm when production is
  > 7 days behind `main`; this incident went unnoticed for ~8 months.

## 5. Verification of this diagnosis

- All live probes reproduced twice (2026-07-06 snapshot in the revamp plan;
  2026-07-07 18:01 UTC this doc) with identical results.
- Marker dating cross-checked against `git log -S` for five independent
  strings plus two route-existence checks; all seven agree on the
  2025-11-14…2025-11-25 window.
- Pipeline evidence from GitHub Actions run logs (run `28824947824`) and
  `git log -- k8s/production/kustomization.yaml`.
