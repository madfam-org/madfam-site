# madfam-site — Ecosystem Context

> [!IMPORTANT]
> MADFAM-ENCLII-FIRST-LEGACY-RAW v1: This document contains legacy raw infrastructure command examples.
> Routine production operations must use Enclii web, API, or CLI. Treat raw
> `kubectl`, `helm`, SSH, provider CLI/API, `docker exec`, and direct container
> access as platform bootstrap or documented break-glass only, and record any
> missing Enclii adapter gap.

> **Last updated:** 2026-09-04
> **Verification anchors:**
>
> - Repo roles, product names and visibility — `internal-devops/ecosystem/repo-registry.md`, _Last Verified 2026-08-24_.
> - Routes and domains — `internal-devops/ecosystem/domain-map.md`, _Last Verified 2026-08-24_ (live HTTP probes).
> - Topology _shape_ — `internal-devops/infrastructure/nodes.md` (_Last Updated 2026-08-05_; 4-node cluster since 2026-08-06).
> - GitOps app count — live `enclii ops apps status` control-plane read, 2026-08-24.
> - Image-policy posture — `internal-devops/ECOSYSTEM.md` and the Kyverno manifests in the `enclii` repo (2026-05-04 to 2026-07-11).
>
> This document runs no probes of its own. Where something is documented but unverified, it
> says so rather than picking a winner.

> **Boundary checkpoint (2026-09-04, madfam-site).** This is a public repo (Lane C, public
> corporate site). Node hostnames, IP addresses, hardware models and capacity figures, the
> Cloudflare tunnel identifier, Vault paths, cost ledgers and break-glass procedures live
> **only** in the private `internal-devops` repo. What follows is the public-safe shape:
> roles, classes and dated counts, never identities. Canonical policy:
> `internal-devops/docs/repo-boundary-contract.md` (2026-06-14). Public checklist:
> [`docs/PUBLIC_REPO_BOUNDARY.md`](docs/PUBLIC_REPO_BOUNDARY.md).

This file is intended to stand alone: an agent on a fresh machine can operate this service by
reading only this document. The one thing it cannot give you is current operational state —
for that, use Enclii or the private repo.

---

## 1. What this repo is

The public face of MADFAM: platform map, ecosystem vision, blog, and investor-facing
material. Next.js monorepo. It separately ships a Payload CMS that editors use to manage
content.

**Pillar**: Brand / Corporate
**Type**: site
**Status**: production for `madfam.io`; the CMS is retired (see below).

### Deployed services

| Service      | Public domain | Container port | Status                                                                                                               |
| ------------ | ------------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `madfam-web` | madfam.io     | 3000           | live                                                                                                                 |
| `madfam-cms` | cms.madfam.io | —              | **retired 2026-09-23 (ruling R52)**: no longer deployed; the multi-tenant CMS (Publica) moves to its own public repo |

The `madfam-cms` workload (Payload, `apps/cms`) is no longer deployed: ruling R52
(2026-09-23) moves the multi-tenant CMS (Publica) to its own public repo. The site does not
depend on it: `apps/web/lib/environment.ts` enables the CMS integration only when
`NEXT_PUBLIC_CMS_URL` is set (production does not set it), and the blog and case-study routes
render shipped i18n content.

**Kubernetes namespace**: `madfam-site`
**Cluster**: bare-metal k3s — shape only, in §3 below.

### Upstream dependencies (this repo consumes)

- Cloudflare (CDN + ingress)
- CMS database (PostgreSQL)
- PhyndCRM (contact form → lead webhook)

### Downstream consumers (this repo is consumed by)

- public visitors
- PhyndCRM (inbound leads)

### Key environment variables

- `DATABASE_URL` — CMS
- `CRM_WEBHOOK_URL` / `CRM_WEBHOOK_SECRET` — lead routing

Values are never in this repo. See `apps/web/.env.example` for the shape, and Enclii secrets
for the source.

---

## 2. MADFAM ecosystem map — public-safe

MADFAM runs a portfolio of products on sovereign bare-metal infrastructure. The **canonical**
ecosystem map — repository names, per-repo visibility, and the cross-repo contract — lives in
the public ecosystem-contract repo, `madfam-org/solarpunk-foundry` (`ECOSYSTEM.md` there).
This corporate-site repo deliberately carries only the product-level view below: role and
public surface, no repository topology.

| Platform        | Role                                                               | Public surface |
| --------------- | ------------------------------------------------------------------ | -------------- |
| **Enclii**      | PaaS control plane — every deploy goes through it                  | enclii.dev     |
| **Janua**       | OIDC / OAuth 2.0 provider — RS256 JWKS                             | janua.dev      |
| **Dhanam**      | Billing, entitlements and payment gateways                         | dhan.am        |
| **Selva**       | LLM inference routing + agent orchestration                        | selva.town     |
| **Karafiel**    | Operational compliance — CFDI, NOM-151, e.firma, SAT-adjacent      | karafiel.mx    |
| **Tezca**       | Mexican regulatory intelligence (informational; feeds Karafiel)    | tezca.mx       |
| **Cotiza**      | Quoting engine (fabrication + services)                            | cotiza.studio  |
| **Forgesight**  | Digital-fabrication industry intelligence (pricing feed to Cotiza) | forgesight.app |
| **Pravara MES** | Fabrication-node routing and dispatch (physical jobs)              | mes.madfam.io  |
| **PhyndCRM**    | CRM — consent, campaigns, attribution                              | phynd.app      |
| **Fortuna**     | Problem intelligence / zeitgeist analysis                          | fortuna.tube   |
| **Avala**       | Learning and competency verification                               | avala.studio   |
| **Yantra4D**    | Parametric design platform                                         | yantra4d.com   |

Names and roles follow `internal-devops/ecosystem/repo-registry.md` (_Last Verified
2026-08-24_). A dash in the last column means the product has no public self-serve surface —
not that it does not exist.

### Cross-repo conventions

- **Auth**: every authenticated service verifies Janua JWTs via JWKS at
  `https://auth.madfam.io/.well-known/jwks.json`. RS256 only — HS256 is fail-closed after the
  2026-04-23 audit (H3/H4).
- **Billing**: credit metering and entitlements flow through Dhanam.
- **Inference**: every LLM call routes through Selva's OpenAI-compatible `/v1` surface at
  `https://inference.selva.town` (2026-07-07 cutover). Service code must not call model
  providers directly. **The GitHub repository is still named `selva-office`; the rename to
  `selva` is pending** (`internal-devops/ecosystem/repo-registry.md`, 2026-08-24). Earlier
  editions of this file asserted the rename had already happened, and one line read
  "formerly `selva-office`" about `selva-office` itself.
- **CORS**: explicit allowlist per service; wildcards are banned (audit 2026-04-23 H2/H5/H6).
- **Images**: first-party images in active production overlays _should_ be pinned by
  `@sha256:` digest, and CI enforces that on infrastructure manifests. **Admission control is
  weaker than earlier editions of this file claimed.** Of the three Kyverno image-tag
  policies recorded at the 2026-05-04 snapshot, only `block-latest-ifnotpresent` is
  **Enforce**, and only for `:latest` _combined with_ `imagePullPolicy: IfNotPresent`;
  `disallow-latest-tag` and `require-image-digest` are **Audit**. A pod using `:latest` with
  `imagePullPolicy: Always` therefore passes admission. Digest pinning is the goal, not a
  uniform fact. Verify current state in `internal-devops/ECOSYSTEM.md` and the Kyverno
  manifests in the `enclii` repo before making any enforcement claim.
- **Onboarding**: a single admin onboarding call provisions namespace, ArgoCD app, tunnel
  routes, Janua client and NetworkPolicies. See `enclii/docs/guides/ONBOARDING_GUIDE.md`.

---

## 3. Infrastructure — shape only

> Boundary checkpoint: node hostnames, IP addresses, hardware models, capacity figures, costs
> and the Cloudflare tunnel identifier are documented **only** in `internal-devops`. This
> section keeps the shape, by class, and dates every count.

**Cluster.** Bare-metal k3s, **4 nodes** since 2026-08-06, stated by class:

- one control-plane node — control plane plus primary workload
- one worker node — workloads plus the second Longhorn replica
- two CI builder nodes — the second added 2026-08-06, removing the single-builder SPOF; both
  tainted and labelled so that only ARC GitHub Actions runners schedule there

No node names, models or capacity figures belong in this file. Source:
`internal-devops/infrastructure/nodes.md` (_Last Updated 2026-08-05_).

**Ingress.** Internet → Cloudflare edge → cloudflared pods → Kubernetes Service → container
port. TLS terminates at the Cloudflare edge. A single named Cloudflare Tunnel carries all
ingress; its identifier is private. Zero exposed node ports for application traffic.

**Storage.** Longhorn CSI in 2-replica mode across the two non-builder nodes. Object storage
is Cloudflare R2 (zero egress). The Longhorn _version_ appears in exactly one undated place
across the ecosystem and should be treated as unverified.

**GitOps.** ArgoCD App-of-Apps with self-heal. A live `enclii ops apps status` read on
**2026-08-24** returned **81 Applications** (71 Healthy / 7 Degraded / 2 Progressing /
1 Missing; 73 Synced). That is an _Application_ count, not a per-container service count. The
older "~28 apps across ~22 namespaces" and "~40 services" figures were the 2026-05-04 snapshot
and a pre-2026 round number respectively; both are retired. Name the measurement when quoting
a number.

Push to `main` → CI builds → GHCR → digest commit into `k8s/production` → ArgoCD syncs.

**Operational access** (SSH, kubeconfigs, node identity, capacity data, cost ledger): private
repo `madfam-org/internal-devops`. Not in any public repo.

---

## 4. Enclii CLI — DevOps reference

**Strong preference: use `enclii` over `kubectl`** for all operational tasks. The CLI routes
through the Switchyard API, which gives audit logging, lifecycle event tracking, and
service-scoped context. Escape to raw tooling only for the documented break-glass cases at the
end of this section.

### Install

```bash
# macOS
brew install enclii/tap/enclii

# Linux
curl -sSL https://get.enclii.dev | bash

# From source (in the enclii repo)
make build-cli && ./bin/enclii --version
```

### Auth

```bash
enclii login                  # browser SSO (Janua)
enclii whoami                 # verify active session
enclii logout                 # clear local creds
```

Env vars: `ENCLII_API_URL` (default `https://api.enclii.dev`), `ENCLII_TOKEN` (alternative to
interactive login), `ENCLII_PROJECT`, `ENCLII_ENV`.

### Day-to-day for madfam-web

The commands below default to `madfam-web` — the primary service name for this repo as
registered in Switchyard. For any other service, swap the name.

```bash
# Status + where the pods are running
enclii ps --wide
enclii ps madfam-web --env production

# Logs (tail, filter, history)
enclii logs madfam-web -f                          # live tail
enclii logs madfam-web --since 1h --level error    # last hour, errors only
enclii logs madfam-web --env staging -f

# Deploy (preview, staging, production)
enclii deploy --env preview                       # from current branch
enclii deploy --env staging
enclii deploy --env production --strategy canary --canary-percent 10

# Rollback
enclii rollback madfam-web                         # previous release
enclii rollback madfam-web --to-revision 5

# Releases + history
enclii releases madfam-web                          # list builds
enclii releases madfam-web --latest --output json

# Secrets (routed through Lockbox → Vault → ESO → K8s)
enclii secrets list madfam-web
enclii secrets set MY_KEY=value --service madfam-web --secret
enclii secrets rm MY_KEY --service madfam-web

# Domains, tunnel routes, DNS
enclii domains list madfam-web
enclii domains add madfam-web my.example.com       # auto-provisions tunnel route + DNS

# Scheduled jobs (cron + one-off)
enclii jobs list
enclii jobs run <job-name>                         # trigger one-off

# Routing (ingress + TLS)
enclii junctions list madfam-web

# Serverless (scale-to-zero functions)
enclii functions list

# Local dev environment
enclii local up         # spin up dependent services (postgres, redis, …)
enclii local logs
enclii local down
```

### Full onboarding (only when adding a brand-new service)

```bash
# One-shot: namespace + ArgoCD app + tunnel routes + Janua client + netpol
enclii onboard --repo madfam-org/<name> --db-name <db> --secrets-file .env
```

### Enclii-first production operations

Enclii is the required control plane for routine production operations. Use the web UI, API,
or CLI before reaching for raw infrastructure tools:

- ArgoCD sync / diff / rollback — `enclii ops apps ...`
- Pod logs, diagnosis, and safe restarts — `enclii ops pods ...`
- Longhorn / PVC / PV inspection and repair planning — `enclii ops storage ...`
- Kyverno violations and time-bound waivers — `enclii ops policy ...`
- ExternalSecrets and Vault readiness — `enclii ops secrets ...`
- ARC runner inspection and drain workflows — `enclii ops runners ...`
- DNS, tunnels, SaaS hostnames, providers, and repo automation — `enclii providers ...`
- Service lifecycle, domains, secrets, jobs, and observability — `enclii deploy`,
  `enclii rollback`, `enclii logs`, `enclii observe`, `enclii domains`, `enclii secrets`,
  `enclii jobs`

### Break-glass-only access

Raw `kubectl`, `helm`, SSH, provider CLIs/APIs, `docker exec`, and direct container access are
allowed only for platform bootstrap or documented break-glass emergencies when Enclii is
unavailable or lacks an implemented adapter. Record the actor, reason, target
service/environment, commands executed, result, and the follow-up Enclii adapter gap or
incident link.

### Cluster access

Credentials for bootstrap and break-glass use live in the private `madfam-org/internal-devops`
repository and are named there, never here. Routine production operations must go through
Enclii web, API, or CLI.

### Exit codes (scripting against the CLI)

| Code | Meaning          |
| ---- | ---------------- |
| 0    | success          |
| 10   | validation error |
| 20   | build failed     |
| 30   | deploy failed    |
| 40   | timeout          |
| 50   | auth error       |

---

## Document provenance

Originally generated 2026-04-23 as part of the "each repo stands alone" docs sweep, and never
hand-corrected until **2026-09-04**, when it was rewritten against the sanitized shape of
`solarpunk-foundry/ECOSYSTEM.md` and the 2026-08-24 private-registry reads. That rewrite
removed a production node roster with hardware models and capacity figures from a public
repository, corrected the cluster to 4 nodes, replaced the 2026-05-04 ArgoCD snapshot with the
2026-08-24 control-plane read, withdrew a false claim that Kyverno fail-closes on mutable
image tags, fixed the CMS port and added its 404 caveat, and corrected the Selva rename status.

If the ecosystem map or CLI reference drifts again, fix the generator at
`madfam-org/enclii/docs/templates/ecosystem/generator.py` and re-render — **note that the path
this document previously cited (`enclii/docs/templates/ECOSYSTEM.md.template`) does not
exist**, checked 2026-07-25. Do not edit per-repo copies in isolation, and do not let the
generator re-introduce the corrections above.
