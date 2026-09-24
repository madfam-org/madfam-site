<!-- Boundary checkpoint (public-safe): summary only. Incident evidence, console actions and infrastructure identifiers live in the private sink (internal-devops). Policy: internal-devops/docs/repo-boundary-contract.md -->

# Production Serving Diagnosis — 2026-07-07 (public summary)

Status: **RESOLVED.** Production is served from the cluster via Enclii.
Scope: why `https://www.madfam.io` served a build that no longer matched `main`.
Related: [DEPLOYMENT.md](./DEPLOYMENT.md) · [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) ·
[VERCEL_DEPLOYMENT.md](../archive/deployment/VERCEL_DEPLOYMENT.md) · `.github/workflows/deploy-web.yml` · `k8s/production/`

---

In July 2026 `www.madfam.io` served a build that no longer matched `main`. Two
independent breaks: a container-registry permission failure in the image
pipeline (fixed 2026-07-08) and DNS still pointing at the retired hosting
provider (repoint required owner console actions).

Full diagnosis, console actions and image evidence are private:
`internal-devops/incidents/2026-07-07-madfam-site-production-serving.md`.

## Why this file is a stub

The original 265-line document was a dated production incident diagnosis
carrying owner and operator console actions, image digests, container-registry
ACL failure detail and an internal cluster service DNS target. The repo-boundary
contract forbids copying incident notes and incident evidence trails into public
repositories; the sanctioned public form is a short summary plus a pointer to the
private record, which is what this file now is.

The four sibling cross-links above are kept so that documents referencing this
path continue to resolve.
