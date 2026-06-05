# MADFAM Site Strategic Redesign Audit

**Date:** 2026-06-04
**Scope:** `madfam-site` corporate/business website, public communication strategy, information architecture, conversion paths, and UI/UX readiness.

## Executive diagnosis

The current site has a strong solarpunk visual foundation and a materially richer ecosystem story than a normal agency site, but it is still organized too much like a platform catalog. It asks visitors to understand MADFAM's internal ecosystem map before it gives them a clear reason to act.

The business site should not lead with an inventory of platforms. It should lead with the operating promise:

> MADFAM helps LATAM builders turn ideas, products, data, and physical production into launchable ventures through an integrated ecosystem of software platforms, AI intelligence, maker infrastructure, and white-glove venture-building services.

The platform map is proof and leverage. The primary experience should be a conversion router that helps a visitor choose the right path quickly.

## Current strengths

- The live homepage already centers the ecosystem more than the older corporate and vision-first homepage variants.
- The registry in `apps/web/lib/data/platforms.ts` is a useful public-facing product source of truth.
- The design system has distinctive brand primitives: solarpunk gradients, MADFAM color tokens, dark/light theming, and accessibility-oriented semantic tokens.
- The footer already handles external product URLs more truthfully than several other components.
- There are useful raw ingredients for conversion: products, ecosystem, maker node, programs, assessment, calculator, contact, and case studies.

## Critical gaps

### 1. The message is fragmented

The site currently alternates between these frames:

- AI consultancy and product studio.
- Solarpunk ecosystem.
- Open platforms.
- Ecosystem membership.
- Maker node.
- Corporate programs.

Each is valid, but the site does not explain their hierarchy. Visitors should not need to infer whether MADFAM is a SaaS company, agency, venture studio, fabrication node, or ecosystem operator. The answer is: MADFAM is an ecosystem operator with multiple engagement channels.

### 2. The offer model is oversimplified

Several public copy paths claim every platform has Free and Pro tiers, or that one membership unlocks Pro everywhere. That does not match the registry reality. Current platforms include self-serve software, infrastructure, standards, white-glove applications, and coming-soon products. These should not share one entitlement claim.

Correct model:

- Self-serve products may have direct public onboarding and product-specific access tiers.
- Infrastructure and standards products may expose limited public surfaces, partner access, or managed implementation.
- Ecosystem applications may require MADFAM involvement, tenant setup, or operational qualification.
- Membership can unlock eligible platform capabilities and coordinated support, not necessarily every internal or partner capability.

### 3. Navigation is too inventory-heavy

The top-level experience should route intent, not only display categories. The current IA gives visitors many adjacent concepts: Products, Platforms, Ecosystem, Maker Node, Solutions, Programs, Assessment, Calculator, Contact. This makes the site feel broad but not decisive.

Recommended primary navigation:

1. `Start` - a path selector for visitors who want to use a platform, request a build, join the ecosystem, or partner.
2. `Platforms` - a filtered product map, with truthful access models and external links where no MADFAM detail page exists.
3. `Build with MADFAM` - programs, venture-building, AI/product strategy, fabrication, and enterprise implementation.
4. `Ecosystem` - membership, maker node, standards, community, and integrated value.
5. `Proof` - case studies, impact, demos, and public progress.
6. `Contact` - segmented lead capture.

### 4. The homepage is not yet a business-grade conversion surface

The live homepage is directionally correct but still behaves like an explainer. It should become a high-intent decision surface.

Recommended homepage order:

1. Hero: a sharp promise and one-sentence scope of the ecosystem.
2. Visitor path router: `Use a platform`, `Build/launch with MADFAM`, `Join the ecosystem`, `Partner or invest`.
3. Current momentum: active launches, ready-to-use products, maker-node capacity, and ecosystem signals.
4. Platform proof: four-layer map with truthful access states.
5. Example journeys: idea-to-quote-to-fabrication, data-to-ARR, identity-to-compliance, operations-to-dashboard.
6. Business outcomes: faster launch, lower integration cost, better operational truth, monetizable bundles.
7. Proof: case studies, product demos, public metrics, testimonials when available.
8. Segmented CTA: route the visitor into the right form, product, or calendar path.

### 5. Lead capture is underqualified

`LeadForm` only captures name, email, and message. That is too weak for a multi-channel ecosystem.

Minimum viable lead schema:

- Visitor intent: platform user, founder/operator, maker/fabrication, enterprise, investor/partner, press/community, support.
- Relevant platform or offer path.
- Organization and role.
- Budget or expected commercial scale when relevant.
- Timeline.
- Region.
- Current problem or desired outcome.
- Consent and preferred follow-up channel.

This allows MADFAM to route leads into product onboarding, white-glove sales, maker-node operations, partnerships, or internal support without manual triage.

### 6. Truthfulness and public scrutiny need tighter controls

Because the repo is public, the site should avoid internal-only operational claims and avoid stale exact counts unless generated from the registry. Public docs should describe the ecosystem at a sanitized strategic level. Internal operating details belong in `internal-devops`.

Public-safe principle:

- Say what exists, what it does, who it serves, and how to engage.
- Avoid unreleased private mechanics, privileged customer data, hidden ARR assumptions, secret operational processes, and exact capabilities that are not public or launch-ready.

## Target public communication architecture

### Positioning

MADFAM is an ecosystem operator for LATAM builders: part software platform network, part AI product studio, part maker infrastructure, part venture-building partner.

### Core promise

Turn creative, operational, and entrepreneurial work into launchable products and measurable business outcomes using one integrated ecosystem.

### Offer pathways

1. **Use a platform**
   For visitors ready to try or adopt a specific product. Route to self-serve products, external product URLs, demos, or waitlists.

2. **Build or launch with MADFAM**
   For companies, founders, and operators who need strategy, AI/product delivery, data systems, commerce, or fabrication support.

3. **Join the ecosystem**
   For creators, makers, entrepreneurs, and members who benefit from eligible platform access, coordination, maker-node advantages, community, and priority support.

4. **Partner, integrate, or invest**
   For institutions, enterprises, ecosystem partners, and investors. Route to higher-touch discovery.

### Platform presentation model

Every platform card should expose:

- Layer: infrastructure, intelligence, standards, or application.
- Status: production, beta, in development, coming soon.
- Access model: self-serve, managed, partner, ecosystem, waitlist, or internal/private where appropriate.
- Best next step: launch app, view details, request access, join waitlist, or talk to MADFAM.

The site should never assume all platforms share the same CTA or entitlement model.

## UI/UX redesign principles

- Lead with decisions, not taxonomy.
- Make the first screen useful to a buyer, founder, partner, or maker without requiring ecosystem knowledge.
- Use progressive disclosure: promise first, path second, ecosystem depth third.
- Preserve MADFAM's distinctive solarpunk identity, but reduce generic gradient-card repetition.
- Design mobile first for path selection, CTA clarity, and short-form lead capture.
- Use large visual wayfinding: four paths, four ecosystem layers, current momentum, proof.
- Treat accessibility as a product requirement: high contrast, keyboard-safe dropdowns, descriptive links, reduced-motion fallbacks, and readable responsive type.

## Implementation roadmap

### Phase 0 - Truth and routing hardening

- Remove stale exact platform counts from public copy unless generated from the platform registry.
- Remove universal Free/Pro and “Pro everywhere” claims.
- Ensure platform cards link to detail pages only when `hasDetailPage` is true; otherwise use the platform's external URL or product map fallback.
- Localize hardcoded route CTAs.
- Add this audit as the strategic redesign source of truth.

### Phase 1 - Conversion architecture

- Define an `offerPaths` data source with path labels, personas, qualification questions, CTAs, and destination URLs.
- Replace the homepage's early catalog emphasis with a visitor path router.
- Add segmented lead capture with intent, offer path, platform, timeline, budget, region, and follow-up preference.
- Route submitted leads with explicit `source`, `intent`, and `offerPath` metadata.

### Phase 2 - Homepage redesign

- Rebuild the live homepage around promise, path router, current momentum, example journeys, ecosystem proof, and segmented CTAs.
- Move full platform inventory lower on the page or to the platform map.
- Add proof modules: case studies, public launches, demos, measurable impact, and readiness states.
- Make the `/dashboard` concept irrelevant to public site visitors; the corporate site should route them before they ever need operational context.

### Phase 3 - IA consolidation

- Decide whether `products` and `platforms` should remain separate. Recommended: keep `platforms` as the canonical product map and make `products` a buyer-friendly landing page or redirect once content converges.
- Fold `solutions` and `programs` into `Build with MADFAM` unless they need independent SEO pages.
- Keep `ecosystem` for membership, maker node, standards, and community-level value.
- Keep `proof` or equivalent for case studies, impact, demos, and public progress.

### Phase 4 - Measurement and operations

- Instrument path-router clicks, lead-form intent, platform CTA clicks, external app launches, calendar starts, and abandoned forms.
- Build weekly conversion reporting by path and source.
- Feed qualified lead metadata into the CRM or internal ops system.
- Review public claims monthly against the platform registry and launch readiness data.

## ROI priority order

1. Fix false claims and broken routes.
2. Add segmented lead capture and path metadata.
3. Redesign homepage around visitor decisions.
4. Consolidate overlapping IA.
5. Add proof modules and current momentum.
6. Add measurement, CRM routing, and public-claim governance.

## Definition of done for the redesigned site

- A first-time visitor can understand what MADFAM does in under 10 seconds.
- A qualified visitor can choose the right path in one click.
- Every platform CTA is truthful and routes correctly.
- The site captures enough lead context to route follow-up without manual guessing.
- Public copy does not overclaim platform count, entitlement scope, or launch readiness.
- Mobile navigation and CTAs are as usable as desktop.
- The site makes MADFAM look like an ecosystem operator with operational leverage, not a generic agency or disconnected app catalog.

## First remediation pass validation

The 2026-06-04 implementation pass added the offer-path router, segmented lead
capture metadata, truthful access copy, localized route fixes, and test coverage
for lead submission and offer-path destinations.

Validation completed:

- `corepack pnpm --filter @madfam/web test -- --run` passed: `19` files, `238` tests.
- `corepack pnpm typecheck` passed across the workspace.
- `corepack pnpm --filter @madfam/web lint` passed with existing warnings outside the touched files.
- `corepack pnpm validate:translations` passed across all modular locale files.
- `corepack pnpm find:missing-translations` passed after restoring source-key coverage for legacy homepage components.
