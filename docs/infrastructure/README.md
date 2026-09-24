# Infrastructure

> **Boundary checkpoint (2026-09-23, madfam-site).** Public-safe pointer page: topology _shape_
> only; node identity, capacity, costs and credentials live in the private `internal-devops`
> repo (private sink). Policy: `internal-devops/docs/repo-boundary-contract.md`.

madfam.io runs as a container on the MADFAM k3s cluster, deployed by **Enclii** with ArgoCD
GitOps. The deployment pipeline, manifests, secrets handling and rollback are documented in
[`docs/deployment/DEPLOYMENT.md`](../deployment/DEPLOYMENT.md); the public topology shape is in
[`AGENTS.md`](../../AGENTS.md) and [`ECOSYSTEM.md`](../../ECOSYSTEM.md).

The earlier Vercel + Railway infrastructure analysis and migration guide are retired and kept in
[`docs/archive/infrastructure/`](../archive/infrastructure/) for history only.
