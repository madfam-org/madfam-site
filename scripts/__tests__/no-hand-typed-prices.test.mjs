// Boundary checkpoint (2026-09-05, madfam-site): public repo (Lane C). This file names
// repo paths and check names only; no hosts, credentials or identifiers.
// Policy: internal-devops/docs/repo-boundary-contract.md.
/**
 * No currency amount may be typed by hand on the value-ladder surface.
 *
 * Ruling R9 (2026-09-04 coherence docket) amended D6 to: "prices appear only on
 * the value-ladder surface, sourced from the registry's `commerce` block, never
 * hand-typed, never `TBD`". Ruling R11: "publish no number that is not rendered
 * from the registry."
 *
 * Before this guard, `apps/web/lib/data/value-ladder.ts` carried six MXN
 * amounts and six tier names written by hand, under a comment asserting they
 * were "REAL and benchmarked" — and the ecosystem membership card shipped a
 * literal "TBD" as its price. Neither was in the registry. A reviewer had to
 * notice; now a check fails.
 *
 * WHAT IS SCANNED
 * ===============
 * The value-ladder surface: the ladder's data module, its page, the
 * self-selector, the Nauta product front door (the same rungs under a second
 * brand), the ecosystem membership card, and the copy bundles those read, in
 * all three locales. These are the only files R9 lets carry a price at all, so
 * they are the files where a hand-typed one is worth failing a build over.
 *
 * WHAT IS NOT SCANNED, AND WHY
 * ============================
 * `apps/web/lib/data/platforms.generated.ts` — the generated module is where a
 * registry price is SUPPOSED to land. Scanning it would fail the moment the
 * registry ratifies a price, which is the outcome this guard exists to enable.
 * It is asserted to be generated instead (its header says DO NOT EDIT, and
 * `platform-registry.test.mjs` re-derives it from the vendored projection).
 *
 * Surfaces outside the value ladder that still carry currency amounts —
 * competitor comparison tables, budget-range form options, case-study figures —
 * are a separate cleanup and are deliberately out of this guard's scope. Naming
 * that here is the point: a green run of this test is not a claim that the repo
 * publishes no hand-typed number anywhere.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The value-ladder surface, relative to the repo root. `scope` narrows a copy
 * bundle to the sub-tree this surface renders: `ecosystem.json` also holds the
 * competitor-comparison metrics strip, which is a different cleanup.
 */
export const GUARDED_FILES = [
  { file: 'apps/web/lib/data/value-ladder.ts' },
  { file: 'apps/web/app/[locale]/value-ladder/page.tsx' },
  { file: 'apps/web/components/ValueLadderSelector.tsx' },
  { file: 'apps/web/components/ecosystem/PricingCards.tsx' },
  { file: 'apps/web/lib/data/nauta-product.ts' },
  { file: 'apps/web/app/[locale]/nauta/page.tsx' },
  ...['es', 'en', 'pt'].flatMap(locale => [
    { file: `packages/i18n/src/translations/${locale}/valueLadder.json` },
    { file: `packages/i18n/src/translations/${locale}/nauta.json` },
    { file: `packages/i18n/src/translations/${locale}/ecosystem.json`, scope: ['pricing'] },
  ]),
];

/** The one module allowed to hold a price, because it is generated from the registry. */
const GENERATED_MODULE = 'apps/web/lib/data/platforms.generated.ts';

/**
 * A currency amount, in the shapes this repo actually writes them:
 * `$99`, `$1,200`, `MX$405`, `R$3.600`, `US$ 55`, `99 MXN`, `1,200 USD`.
 */
const CURRENCY_PATTERNS = [
  { name: 'symbol-prefixed amount', re: /(?:MX|US|R|A|C)?\$\s?\d/ },
  { name: 'amount with a currency code', re: /\d[\d.,]*\s?(?:MXN|USD|BRL|EUR)\b/i },
];

/** `TBD` as a price, which R9 names explicitly. */
const TBD = /(?<![A-Za-z])TBD(?![A-Za-z])/;

function read(relative) {
  return fs.readFileSync(path.join(repoRoot, relative), 'utf8');
}

/**
 * What actually reaches a reader: for a copy bundle, the translated strings
 * (optionally only one sub-tree); for a source file, the code with its comments
 * removed. Comments are excluded deliberately — this very file, and the modules
 * it guards, have to be able to spell out the rule they enforce.
 */
function scannable({ file, scope }) {
  if (file.endsWith('.json')) {
    let node = JSON.parse(read(file));
    for (const key of scope ?? []) node = node?.[key];
    const strings = [];
    const walk = value => {
      if (typeof value === 'string') strings.push(value);
      else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk(node);
    return strings;
  }

  return read(file)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => line.replace(/(^|\s)\/\/.*$/, '$1'))
    .filter(line => line.trim() !== '');
}

function offendingLines(entry, pattern) {
  return scannable(entry)
    .map((line, index) => [index + 1, line])
    .filter(([, line]) => pattern.test(line))
    .map(([number, line]) => `${entry.file} (scanned line ${number}): ${line.trim()}`);
}

test('the guarded file list points at files that exist', () => {
  assert.ok(GUARDED_FILES.length >= 10, 'the value-ladder surface lost files without notice');
  for (const { file } of [...GUARDED_FILES, { file: GENERATED_MODULE }]) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `guarded file is missing: ${file}`);
  }
});

test('no currency amount is hand-typed on the value-ladder surface', () => {
  const hits = [];
  for (const entry of GUARDED_FILES) {
    for (const { name, re } of CURRENCY_PATTERNS) {
      for (const line of offendingLines(entry, re)) hits.push(`[${name}] ${line}`);
    }
  }

  assert.deepEqual(
    hits,
    [],
    'A currency amount is written by hand on the value-ladder surface. Ruling R9: prices come ' +
      'from the registry\'s `commerce` block via REGISTRY_COMMERCE in ' +
      `${GENERATED_MODULE}, never from source or copy. Offending lines:\n${hits.join('\n')}`
  );
});

test('no price renders as TBD on the value-ladder surface', () => {
  const hits = GUARDED_FILES.flatMap(entry => offendingLines(entry, TBD));
  assert.deepEqual(
    hits,
    [],
    `Ruling R9 forbids a price rendering as "TBD". A tier the registry has not priced renders ` +
      `the pending wording instead. Offending lines:\n${hits.join('\n')}`
  );
});

test('the generated module is the only place a price may live, and it is generated', () => {
  const header = read(GENERATED_MODULE).slice(0, 400);
  assert.match(
    header,
    /GENERATED FILE — DO NOT EDIT/,
    `${GENERATED_MODULE} must stay generated: it is the exemption this guard grants.`
  );
  assert.match(
    read(GENERATED_MODULE),
    /export const REGISTRY_COMMERCE/,
    `${GENERATED_MODULE} must export REGISTRY_COMMERCE — it is where every price is read from.`
  );
});
