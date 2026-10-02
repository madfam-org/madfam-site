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
 * Copy bundles outside the value ladder that still carry currency amounts —
 * competitor comparison tables, budget-range form options — are a separate
 * cleanup and are deliberately out of this guard's scope. Naming that here is
 * the point: a green run of this test is not a claim that the repo publishes no
 * hand-typed number anywhere.
 *
 * WIDENED SCOPE (finding M1-018, 2026-10-01)
 * ==========================================
 * A dead module under `apps/web/lib/data/` hand-typed a vCTO price list
 * ("Desde $8,000/mes") one import away from rendering, and nothing failed. So
 * the guard now also walks every source file under `apps/web/lib/**` and
 * `apps/web/components/**` (tests excluded: they never reach a reader, and the
 * planted-amount test below needs to write one). `DEMO_SAMPLE_FILES` lists the
 * only exemptions — interactive product demos whose figures are sample data,
 * not a MADFAM price — and each exemption must still match, so a stale one
 * fails too.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
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
  { file: 'apps/web/components/ecosystem/MembershipWaitlist.tsx' },
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

/** Source trees walked in full (finding M1-018). */
export const GUARDED_TREES = ['apps/web/lib', 'apps/web/components'];

/**
 * Product demos ("tastes") that show sample figures in an interactive widget:
 * a sample material price range, a sample quote, a sample account balance.
 * They are illustrations of what the product does, not prices MADFAM charges.
 * Labelling them as examples is tracked separately (finding M1-023). Adding a
 * file here is a reviewable act; nothing else under the guarded trees may hold
 * a currency amount.
 */
export const DEMO_SAMPLE_FILES = [
  'apps/web/components/platforms/tastes/CotizaTaste.tsx',
  'apps/web/components/platforms/tastes/DhanamTaste.tsx',
  'apps/web/components/platforms/tastes/ForgeSightTaste.tsx',
];

const SOURCE_FILE = /\.(?:[cm]?[jt]sx?)$/;
/** A path inside a `__tests__` directory (anywhere in the path). */
const TEST_DIRECTORY = /(?:^|\/)__tests__\//;
/** A `*.test.*` / `*.spec.*` source file name (anchored at the end). */
const TEST_SUFFIX = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

function isTestFile(relative) {
  return TEST_DIRECTORY.test(relative) || TEST_SUFFIX.test(relative);
}

/**
 * Every source file under the guarded trees, relative to `root`, minus the
 * generated module, tests and the demo exemptions.
 */
export function treeEntries(root = repoRoot) {
  const entries = [];
  const walk = relative => {
    const absolute = path.join(root, relative);
    if (!fs.existsSync(absolute)) return;
    for (const dirent of fs.readdirSync(absolute, { withFileTypes: true })) {
      const child = path.posix.join(relative, dirent.name);
      if (dirent.isDirectory()) {
        if (dirent.name !== 'node_modules') walk(child);
      } else if (
        SOURCE_FILE.test(child) &&
        !isTestFile(child) &&
        child !== GENERATED_MODULE &&
        !DEMO_SAMPLE_FILES.includes(child)
      ) {
        entries.push({ file: child });
      }
    }
  };
  for (const tree of GUARDED_TREES) walk(tree);
  return entries;
}

/** Currency-amount hits for a set of entries under `root`. */
export function currencyHits(entries, root = repoRoot) {
  const hits = [];
  for (const entry of entries) {
    for (const { name, re } of CURRENCY_PATTERNS) {
      for (const line of offendingLines(entry, re, root)) hits.push(`[${name}] ${line}`);
    }
  }
  return hits;
}

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

function read(relative, root = repoRoot) {
  return fs.readFileSync(path.join(root, relative), 'utf8');
}

/**
 * What actually reaches a reader: for a copy bundle, the translated strings
 * (optionally only one sub-tree); for a source file, the code with its comments
 * removed. Comments are excluded deliberately — this very file, and the modules
 * it guards, have to be able to spell out the rule they enforce.
 */
function scannable({ file, scope }, root = repoRoot) {
  if (file.endsWith('.json')) {
    let node = JSON.parse(read(file, root));
    for (const key of scope ?? []) node = node?.[key];
    const strings = [];
    const walk = value => {
      if (typeof value === 'string') strings.push(value);
      else if (value && typeof value === 'object') Object.values(value).forEach(walk);
    };
    walk(node);
    return strings;
  }

  return read(file, root)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .map(line => line.replace(/(^|\s)\/\/.*$/, '$1'))
    .filter(line => line.trim() !== '');
}

function offendingLines(entry, pattern, root = repoRoot) {
  return scannable(entry, root)
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
  const hits = currencyHits(GUARDED_FILES);

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

test('no currency amount is hand-typed anywhere under apps/web/lib or apps/web/components', () => {
  const entries = treeEntries();
  assert.ok(entries.length >= 50, `the tree walk found too few files (${entries.length})`);
  const hits = currencyHits(entries);
  assert.deepEqual(
    hits,
    [],
    'A currency amount is written by hand in site source. Ruling R25/R9: prices come from ' +
      `the registry via ${GENERATED_MODULE}. Offending lines:\n${hits.join('\n')}`
  );
});

test('every demo exemption exists and still carries the sample figures it is exempted for', () => {
  for (const file of DEMO_SAMPLE_FILES) {
    assert.ok(fs.existsSync(path.join(repoRoot, file)), `stale exemption: ${file} is gone`);
    assert.ok(
      currencyHits([{ file }]).length > 0,
      `stale exemption: ${file} no longer holds a currency amount — remove it from DEMO_SAMPLE_FILES`
    );
  }
});

test('the guard fails on a planted $8,000 under lib/ and components/', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'no-hand-typed-prices-'));
  try {
    const planted = [
      ['apps/web/lib/data/engagement-models/planted.ts', "export const price = 'Desde $8,000/mes';\n"],
      ['apps/web/components/Planted.tsx', 'export const P = () => <span>8,000 MXN</span>;\n'],
      // Comments and tests are not scanned; these must NOT be reported.
      ['apps/web/lib/commented.ts', '// Desde $8,000/mes\nexport const ok = 1;\n'],
      ['apps/web/lib/__tests__/fixture.test.ts', "const amount = '$8,000';\n"],
    ];
    for (const [file, body] of planted) {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), body);
    }
    const hits = currencyHits(treeEntries(root), root);
    assert.equal(hits.length, 2, `expected exactly the two planted amounts, got:\n${hits.join('\n')}`);
    assert.ok(hits.some(hit => hit.includes('engagement-models/planted.ts') && hit.includes('$8,000')));
    assert.ok(hits.some(hit => hit.includes('components/Planted.tsx') && hit.includes('8,000 MXN')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
