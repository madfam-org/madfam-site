#!/usr/bin/env node

// Boundary checkpoint (2026-09-23, madfam-site): this script compares two
// PUBLIC copies of the product-registry projection (this repo's vendored copy
// and solarpunk-foundry's, which is a public repo). It reads no private repo
// and needs no credential. Public sink. Policy:
// internal-devops/docs/repo-boundary-contract.md.
//
/**
 * Vendored-projection freshness (finding C-028; audit Phase 4 guard).
 *
 * `pnpm check:platforms` proves the generated catalog matches the VENDORED
 * projection. It cannot prove the vendored projection is current: on
 * 2026-09-23 it reported "FRESH drifted=0" while the copy was 18 days behind
 * the registry. This script closes that gap as far as a public repo can.
 *
 * The upstream projection lives in the private `internal-devops` repo, which a
 * public workflow cannot read without a credential. The foundry vendors the
 * same file into a public repo (`@madfam/core`), so the two downstream copies
 * are compared:
 *
 *   same sha256                         -> OK
 *   foundry `last_updated` newer        -> FAIL: this site is behind a public
 *                                          downstream; re-vendor (see AGENTS.md)
 *   otherwise (site newer / same date)  -> WARN: the foundry is the stale copy,
 *                                          or both changed the same day
 *
 * Every run prints a read-proof line with both hashes and dates, so "could not
 * read" never looks like "checked and fine". A fetch failure exits 2.
 *
 * Usage: node scripts/check-projection-freshness.mjs
 *        FOUNDRY_PROJECTION_URL=<url> node scripts/check-projection-freshness.mjs
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const SITE_PROJECTION_PATH = join(ROOT, 'apps/web/lib/data/projection.public.json');
export const FOUNDRY_PROJECTION_URL =
  'https://raw.githubusercontent.com/madfam-org/solarpunk-foundry/main/packages/core/src/products/projection.public.json';

export function describe(raw) {
  const sha256 = createHash('sha256').update(raw).digest('hex');
  const parsed = JSON.parse(raw);
  return { sha256, lastUpdated: String(parsed.last_updated ?? '') };
}

/**
 * @returns {{ verdict: 'ok' | 'behind' | 'ahead-or-ambiguous', message: string }}
 */
export function compareProjections(site, foundry) {
  if (site.sha256 === foundry.sha256) {
    return { verdict: 'ok', message: 'site and foundry vendor the same projection' };
  }
  if (foundry.lastUpdated > site.lastUpdated) {
    return {
      verdict: 'behind',
      message:
        `site projection (last_updated ${site.lastUpdated}) is older than the foundry's ` +
        `(${foundry.lastUpdated}); re-vendor apps/web/lib/data/projection.public.json`,
    };
  }
  return {
    verdict: 'ahead-or-ambiguous',
    message:
      `projections differ; site last_updated ${site.lastUpdated}, foundry ${foundry.lastUpdated} ` +
      '— the foundry copy is stale or both changed the same day',
  };
}

async function main() {
  const url = process.env.FOUNDRY_PROJECTION_URL || FOUNDRY_PROJECTION_URL;
  const site = describe(readFileSync(SITE_PROJECTION_PATH, 'utf8'));
  let foundry;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    foundry = describe(await response.text());
  } catch (error) {
    console.log(
      `projection-freshness: UNDETERMINED — could not read the foundry copy (${error.message}); ` +
        `site_sha256=${site.sha256.slice(0, 12)} site_last_updated=${site.lastUpdated}`
    );
    process.exit(2);
  }

  const result = compareProjections(site, foundry);
  console.log(
    `projection-freshness: ${result.verdict.toUpperCase()} — site_sha256=${site.sha256.slice(0, 12)} ` +
      `site_last_updated=${site.lastUpdated} foundry_sha256=${foundry.sha256.slice(0, 12)} ` +
      `foundry_last_updated=${foundry.lastUpdated} source=foundry`
  );
  console.log(result.message);
  if (result.verdict === 'behind') process.exit(1);
  if (result.verdict === 'ahead-or-ambiguous') console.log('::warning::' + result.message);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
