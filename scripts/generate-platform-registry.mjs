#!/usr/bin/env node

// Boundary checkpoint (2026-09-05, madfam-site): this file handles the PUBLIC
// projection of the product registry only — public product names, public
// product domains, SPDX licences and public repository names. The private
// registry's own fields (operator notes, billing plan prefixes, ports,
// namespaces, per-client tenancy) are stripped upstream and never reach this
// repo. Public sink. Policy: internal-devops/docs/repo-boundary-contract.md.
//
/**
 * Generate the site's platform catalog from the vendored ecosystem registry
 * projection.
 *
 * WHY THIS EXISTS
 * ===============
 * The 2026-09-04 cross-repo coherence audit found six hand-maintained product
 * lists disagreeing with one another, and always in the same direction: the
 * public ones claimed products were more live, more current and more
 * permissively licensed than the private record said. Three of those six lists
 * lived in this repo — `apps/web/lib/data/platforms.ts`, the footer block in
 * `packages/i18n/src/translations/<locale>/common.json`, and the product rows
 * in the search index.
 *
 * That is not a spelling problem, it is a shape problem. So the shape changes:
 * one registry owns every product fact, this repo vendors its PUBLIC-SAFE
 * projection, and the lists become generated files with a CI freshness check.
 * A wrong hostname, a retired brand or an invented product stops being
 * something a reviewer has to notice and becomes a check that fails.
 *
 * WHAT IT READS
 * =============
 * `apps/web/lib/data/projection.public.json` — a byte-identical copy of
 * `internal-devops/ecosystem/registry/projection.public.json`, itself generated
 * from the private registry by `generate-product-projections.py`. It is
 * public-safe by construction: private fields are stripped by allow-list,
 * `customer_facing: false` products are dropped entirely, and retired products
 * ship only as tombstones. It is listed in `.prettierignore` so that it stays
 * byte-identical to its source — the freshness hash depends on that.
 *
 * WHAT IT WRITES
 * ==============
 * 1. `apps/web/lib/data/platforms.generated.ts` — every registry fact the site
 *    renders (name, icon, category, layer, track, status, product URL, GitHub
 *    URL, license), keyed by the slug the site uses in its URLs, plus the
 *    retired tombstones and a `REGISTRY_SOURCE` stamp carrying the SHA-256 of
 *    the vendored projection.
 * 2. `packages/i18n/src/translations/{es,en,pt}/platforms.registry.json` — the
 *    same facts as an i18n bundle, for the surfaces that read strings through
 *    next-intl. The projection carries no localized copy (display names are
 *    brand marks and are not translated), so the three bundles are identical by
 *    construction and translation parity is preserved by construction too.
 *
 * WHAT IT DOES NOT WRITE
 * ======================
 * `apps/web/lib/data/platforms.presentation.ts` — the hand-kept overlay of
 * site-local presentation (accent colours, feature counts, which platforms have
 * a detail page, ecosystem relationships, CTA shape). Those are decisions of
 * this website, not facts about the product, so the registry must never carry
 * them. The overlay is also what decides which registry products this site
 * surfaces at all: a product needs marketing copy and an accent palette before
 * it can render, and inventing either is a marketing act, not a generation
 * step. The reverse direction IS enforced (see `scripts/__tests__`): every slug
 * in the overlay must exist in the registry and must not be retired.
 *
 * MODES
 * =====
 * `(bare)`    dry run: print a unified diff of every output and write NOTHING.
 * `--apply`   write the outputs.
 * `--check`   freshness: regenerate in memory and fail on any drift, and verify
 *             the vendored projection still hashes to the stamp in the
 *             generated file. This is the CI lane (`pnpm test:scripts`).
 *
 * Each mode prints a read-proof (`products_read=..`) alongside its verdict, so
 * that "I read nothing" and "I read everything and found nothing wrong" can
 * never produce the same output.
 *
 * Run:
 *     node scripts/generate-platform-registry.mjs            # diff, writes nothing
 *     node scripts/generate-platform-registry.mjs --apply
 *     node scripts/generate-platform-registry.mjs --check
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const PROJECTION_PATH = join(ROOT, 'apps/web/lib/data/projection.public.json');
export const GENERATED_TS_PATH = join(ROOT, 'apps/web/lib/data/platforms.generated.ts');
export const LOCALES = ['es', 'en', 'pt'];

export const registryJsonPath = locale =>
  join(ROOT, `packages/i18n/src/translations/${locale}/platforms.registry.json`);

// ─── Registry vocabulary → site vocabulary ───────────────────────────────────
// The registry closes each of these enums; anything outside a map is a hard
// error rather than a silent passthrough, so a new registry vocabulary shows up
// as a red check here instead of as an undefined rendering on the site.

const LAYER_BY_CATEGORY = {
  Infrastructure: 'infrastructure',
  Intelligence: 'intelligence',
  Standards: 'standards',
  Applications: 'applications',
};

const STATUS_BY_LIFECYCLE = {
  live: 'production',
  beta: 'production-beta',
  degraded: 'production-beta',
  incubating: 'coming-soon',
};

const TRACKS = ['self-serve', 'platform', 'ecosystem'];

// The registry's `commerce` block, key by key. It is an ALLOW-LIST on purpose:
// a key the registry starts carrying and this generator does not know about
// must fail loudly here rather than be dropped on the floor. That matters most
// for prices — ruling R9 amended D6 to "prices appear only on the value-ladder
// surface, sourced from the registry's `commerce` block, never hand-typed,
// never TBD", and ruling R11 is "publish no number that is not rendered from
// the registry". A silently-ignored price field would put the site back to
// publishing hand-typed numbers without anyone noticing.
const COMMERCE_KEYS = ['tiers', 'admin_tier', 'tier_labels', 'checkout_slug', 'prices'];

// ─── Derivation ──────────────────────────────────────────────────────────────

function fail(message) {
  throw new Error(message);
}

/** The slug this site uses in URLs and i18n keys. */
function siteSlug(product) {
  return product.site_slug ?? product.slug;
}

/**
 * The public commerce facts for one product: its tier vocabulary, the label the
 * registry gives each tier, whether that tier carries a ratified list price, and
 * the checkout slug.
 *
 * `pricing` is the load-bearing part. A tier is `listed` only when the
 * projection carries a price for it, and `pending` otherwise — there is no
 * third state and no place for the site to put a number of its own. As of
 * registry v4 the projection carries no price for any tier of any product, so
 * every tier here is `pending` and the site publishes no price at all. The day
 * the registry ratifies one, it renders; until then the surface says so in
 * words. That is R9 and R11 expressed as data instead of as a review comment.
 */
function deriveCommerce(slug, commerce) {
  if (!commerce) return undefined;

  for (const key of Object.keys(commerce)) {
    if (!COMMERCE_KEYS.includes(key)) {
      fail(
        `${slug}: unknown registry commerce key ${JSON.stringify(key)}. ` +
          `Teach scripts/generate-platform-registry.mjs what it means before vendoring it — ` +
          `a dropped price field is how hand-typed prices come back.`
      );
    }
  }

  const labels = commerce.tier_labels ?? {};
  const prices = commerce.prices ?? {};

  const tiers = (commerce.tiers ?? []).map(id => {
    const price = prices[id];
    if (!price) return { id, label: labels[id] ?? id, pricing: { state: 'pending' } };

    for (const field of ['amount', 'currency', 'unit']) {
      if (price[field] === undefined) {
        fail(`${slug}/${id}: registry price is missing ${field}`);
      }
    }
    return {
      id,
      label: labels[id] ?? id,
      pricing: {
        state: 'listed',
        amount: price.amount,
        currency: price.currency,
        unit: price.unit,
      },
    };
  });

  return {
    tiers,
    ...(commerce.checkout_slug ? { checkoutSlug: commerce.checkout_slug } : {}),
  };
}

function deriveProduct(product) {
  const site = product.site ?? {};
  const slug = siteSlug(product);

  const layer = LAYER_BY_CATEGORY[site.category];
  if (!layer) fail(`${slug}: unmapped registry site.category ${JSON.stringify(site.category)}`);

  const status = STATUS_BY_LIFECYCLE[product.lifecycle];
  if (!status) fail(`${slug}: unmapped registry lifecycle ${JSON.stringify(product.lifecycle)}`);

  if (!TRACKS.includes(site.track)) {
    fail(`${slug}: unmapped registry site.track ${JSON.stringify(site.track)}`);
  }

  const derived = {
    slug,
    registrySlug: product.slug,
    name: product.display_name,
    icon: site.icon ?? '',
    category: site.category,
    layer,
    track: site.track,
    status,
    lifecycle: product.lifecycle,
    license: product.license,
    order: site.order,
  };

  // A product's public front door is its primary domain. `infra_hosts` are
  // deliberately NOT eligible: they are operational endpoints, never a CTA.
  const primary = product.domains?.primary;
  if (primary) derived.externalUrl = `https://${primary}`;

  // Only a public repo gets a GitHub link. `visibility` is the registry's, not
  // a guess from the repo name.
  const repo = product.repo;
  if (repo && repo.visibility === 'public') {
    derived.githubUrl = `https://github.com/${repo.github_org}/${repo.name}`;
  }

  if (product.data_license) derived.dataLicense = product.data_license;

  const commerce = deriveCommerce(slug, product.commerce);
  if (commerce) derived.commerce = commerce;

  return derived;
}

export function readProjection() {
  const raw = readFileSync(PROJECTION_PATH, 'utf8');
  return { raw, sha256: createHash('sha256').update(raw).digest('hex'), data: JSON.parse(raw) };
}

export function deriveRegistry(projection) {
  const products = projection.data.products
    .map(deriveProduct)
    .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

  const seen = new Set();
  for (const product of products) {
    if (seen.has(product.slug)) fail(`duplicate site slug ${product.slug}`);
    seen.add(product.slug);
  }

  const retired = (projection.data.retired ?? []).map(entry => ({
    slug: entry.slug,
    name: entry.display_name,
    retiredOn: entry.retired_on,
    ...(entry.successor_slug ? { successorSlug: entry.successor_slug } : {}),
    ...(entry.redirect_to ? { redirectTo: entry.redirect_to } : {}),
  }));

  return { products, retired };
}

// ─── Emitters ────────────────────────────────────────────────────────────────
// Output is written to be Prettier-clean under this repo's .prettierrc
// (single quotes, es5 trailing commas, 100 columns). Objects are always emitted
// expanded, which Prettier preserves; keys are quoted only where required,
// which is Prettier's default `quoteProps: "as-needed"`.

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

function tsString(value) {
  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function tsKey(key) {
  return IDENT.test(key) ? key : tsString(key);
}

function tsValue(value, indent) {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const inner = value.map(item => `${indent}  ${tsValue(item, `${indent}  `)},`).join('\n');
    return `[\n${inner}\n${indent}]`;
  }
  if (value && typeof value === 'object') {
    const inner = Object.entries(value)
      .map(([key, item]) => `${indent}  ${tsKey(key)}: ${tsValue(item, `${indent}  `)},`)
      .join('\n');
    return `{\n${inner}\n${indent}}`;
  }
  return tsString(value);
}

export function renderGeneratedTs(projection, registry) {
  const { products, retired } = registry;
  const bySlug = Object.fromEntries(products.map(product => [product.slug, product]));

  const stamp = {
    schema: projection.data.schema,
    registryVersion: projection.data.registry_version,
    lastUpdated: projection.data.last_updated,
    generatedFrom: projection.data.generated_from,
    sha256: projection.sha256,
    productCount: products.length,
    retiredCount: retired.length,
  };

  return `// ─── GENERATED FILE — DO NOT EDIT ────────────────────────────────────────────
// Regenerate with: node scripts/generate-platform-registry.mjs --apply
//
// Every fact below comes from apps/web/lib/data/projection.public.json, the
// public-safe projection of the MADFAM product registry. Hand-editing either
// this file or the vendored projection turns \`pnpm test:scripts\` red — see
// scripts/__tests__/platform-registry.test.mjs.
//
// Site-local presentation (accent colours, feature counts, detail pages,
// ecosystem relationships, CTA shape) is NOT here: it is hand-kept in
// platforms.presentation.ts and merged at import time by platforms.ts.

/** Ecosystem layer a product sits in. Derived from the registry's site category. */
export type PlatformLayer = 'infrastructure' | 'intelligence' | 'standards' | 'applications';

/** Public status. Derived from the registry's \`lifecycle\`; \`retired\` never renders. */
export type PlatformStatus = 'production' | 'production-beta' | 'coming-soon' | 'in-development';

/** How a product is sold/consumed. Carried verbatim from the registry. */
export type EngagementTrack = 'self-serve' | 'platform' | 'ecosystem';

/** Registry lifecycle, carried through so guards can reason about it. */
export type RegistryLifecycle = 'incubating' | 'beta' | 'live' | 'degraded';

export interface RegistryProduct {
  /** Slug this site uses in URLs and i18n keys (the registry's \`site_slug\`). */
  slug: string;
  /** Slug the registry itself uses, when it differs from the site's. */
  registrySlug: string;
  name: string;
  icon: string;
  category: string;
  layer: PlatformLayer;
  track: EngagementTrack;
  status: PlatformStatus;
  lifecycle: RegistryLifecycle;
  license: string;
  dataLicense?: string;
  /** The product's public front door. Never an operational endpoint. */
  externalUrl?: string;
  /** Present only when the registry says the repository is public. */
  githubUrl?: string;
  /** Registry-owned catalog order. */
  order: number;
  /** Tier vocabulary and prices. Absent when the registry sells no tiers. */
  commerce?: RegistryCommerce;
}

/**
 * What a tier costs, as the registry states it.
 *
 * \`pending\` is not "unknown" and it is certainly not \`TBD\` — it is the
 * registry saying, on the record, that no list price is ratified for this tier
 * yet. Surfaces render the pending wording from the \`valueLadder\` i18n
 * namespace; they never render a number, an approximation or a placeholder.
 */
export type TierPricing =
  { state: 'listed'; amount: number; currency: string; unit: string } | { state: 'pending' };

export interface RegistryTier {
  /** The registry's tier id. */
  id: string;
  /** The registry's label for the tier, falling back to the tier id. */
  label: string;
  pricing: TierPricing;
}

export interface RegistryCommerce {
  /** Tier vocabulary, in the registry's own order. */
  tiers: RegistryTier[];
  /** Present only when the registry declares a checkout slug for the product. */
  checkoutSlug?: string;
}

export interface RetiredProduct {
  slug: string;
  name: string;
  retiredOn: string;
  successorSlug?: string;
  redirectTo?: string;
}

/** Every customer-facing product the registry knows, keyed by site slug. */
export const REGISTRY_PRODUCTS: Record<string, RegistryProduct> = ${tsValue(bySlug, '')};

/** Catalog order, as the registry declares it. */
export const REGISTRY_PRODUCT_ORDER: string[] = ${tsValue(
    products.map(product => product.slug),
    ''
  )};

/**
 * Tombstones. These brands exist so that a guard can say "this is a KNOWN
 * retired product and must not render" instead of "this is an unknown string" —
 * which is how one of them survived in eleven files.
 */
export const RETIRED_PRODUCTS: RetiredProduct[] = ${tsValue(retired, '')};

/**
 * Commerce facts only, keyed by site slug — the single source of tier
 * vocabulary and of every price the site is allowed to publish (ruling R9).
 * A surface that wants a tier label or a price reads it from here; a surface
 * that types one is a bug, and \`scripts/__tests__/no-hand-typed-prices.test.mjs\`
 * fails on it.
 */
export const REGISTRY_COMMERCE: Record<string, RegistryCommerce> = ${tsValue(
    Object.fromEntries(
      products.filter(product => product.commerce).map(product => [product.slug, product.commerce])
    ),
    ''
  )};

/**
 * How many tiers the registry currently prices, and how many it does not.
 * \`listed\` is 0 for as long as the registry ratifies no price, and that is the
 * whole reason the site shows pending wording instead of numbers.
 */
export const REGISTRY_PRICING_STATE = ${tsValue(
    (() => {
      let listed = 0;
      let pending = 0;
      for (const product of products) {
        for (const tier of product.commerce?.tiers ?? []) {
          if (tier.pricing.state === 'listed') listed += 1;
          else pending += 1;
        }
      }
      return { listed, pending };
    })(),
    ''
  )} as const;

/** Provenance of the vendored projection. The hash is the freshness check. */
export const REGISTRY_SOURCE = ${tsValue(stamp, '')} as const;
`;
}

export function renderRegistryJson(projection, registry) {
  const entries = {};
  for (const product of registry.products) {
    entries[product.slug] = {
      name: product.name,
      license: product.license,
      ...(product.dataLicense ? { dataLicense: product.dataLicense } : {}),
    };
  }

  return `${JSON.stringify(
    {
      $comment:
        'GENERATED — do not edit. Rendered from apps/web/lib/data/projection.public.json by ' +
        'scripts/generate-platform-registry.mjs. Display names are brand marks and are not ' +
        'translated, so all three locales are identical by construction.',
      ...entries,
    },
    null,
    2
  )}\n`;
}

export function renderAll() {
  const projection = readProjection();
  const registry = deriveRegistry(projection);
  const outputs = [[GENERATED_TS_PATH, renderGeneratedTs(projection, registry)]];
  const json = renderRegistryJson(projection, registry);
  for (const locale of LOCALES) outputs.push([registryJsonPath(locale), json]);
  return { projection, registry, outputs };
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

function unifiedDiff(path, before, after) {
  const a = before.split('\n');
  const b = after.split('\n');
  const lines = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    if (a[i] === b[i]) continue;
    if (a[i] !== undefined) lines.push(`- ${a[i]}`);
    if (b[i] !== undefined) lines.push(`+ ${b[i]}`);
  }
  return `--- ${path}\n${lines.join('\n')}`;
}

function main(argv) {
  const apply = argv.includes('--apply');
  const check = argv.includes('--check');
  const { projection, registry, outputs } = renderAll();

  const drifted = [];
  for (const [path, content] of outputs) {
    let current = null;
    try {
      current = readFileSync(path, 'utf8');
    } catch {
      current = null;
    }
    if (current === content) continue;
    drifted.push([path, current ?? '', content]);
  }

  const proof =
    `products_read=${registry.products.length} ` +
    `retired_read=${registry.retired.length} ` +
    `outputs=${outputs.length} drifted=${drifted.length} ` +
    `projection_sha256=${projection.sha256.slice(0, 12)}`;

  if (apply) {
    for (const [path, content] of outputs) writeFileSync(path, content, 'utf8');
    console.log(`platform-registry: WROTE ${outputs.length} file(s) — ${proof}`);
    return 0;
  }

  if (drifted.length > 0) {
    for (const [path, before, after] of drifted) {
      console.log(unifiedDiff(relative(ROOT, path), before, after));
    }
  }

  if (check) {
    if (drifted.length > 0) {
      console.error(
        `platform-registry: STALE — ${drifted.length} generated file(s) differ from the ` +
          `projection. Run: node scripts/generate-platform-registry.mjs --apply — ${proof}`
      );
      return 1;
    }
    console.log(`platform-registry: FRESH — ${proof}`);
    return 0;
  }

  console.log(
    drifted.length > 0
      ? `platform-registry: DRY RUN, wrote nothing — ${proof}`
      : `platform-registry: DRY RUN, already fresh — ${proof}`
  );
  return 0;
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`platform-registry: FAILED — ${error.message}`);
    process.exit(1);
  }
}
