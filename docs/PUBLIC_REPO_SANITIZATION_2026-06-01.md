# MADFAM Site Public Repo Sanitization Contract

Date: 2026-06-01
Status: launch-blocking for brand, buyer-entry, CTA, pricing, and public proof readiness

## Position

`madfam-site` is the primary buyer-visible entry surface. Public repo sanitization must align site code, docs, CTA examples, pricing references, webhook examples, CMS config, and deployment docs with Tulana readiness truth.

## Current remediation posture

- `apps/cms/.env.sqlite-backup` has been rewritten as a synthetic public-safe SQLite fallback example.
- No repo-level pass is granted until current-tree scan, history scan, public artifact review, and owner approval are recorded in Tulana.

## Launch-blocking checks

A site-linked platform/SKU cannot pass Product/Offer GA public-repo sanitization until evidence confirms:

- Public CTAs do not route visitors to unready offers.
- Pricing, product, and platform claims match Tulana Product/Offer GA and Commercial GA status.
- CMS and deployment examples do not contain real database URLs, webhook URLs, tenant identifiers, or production-only operations.
- Public docs clearly separate local development, staging, preview, and production.
- Public brand claims do not imply unsupported guarantees.

## Required Tulana evidence

Use `PUBLIC_GITHUB_REPO_SANITIZED` evidence attached to `P0`, `P4`, `P8`, and `P9` for any SKU whose buyer journey uses `madfam.io` or the MADFAM site repo as proof.
