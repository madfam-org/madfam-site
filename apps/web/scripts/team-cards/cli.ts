/**
 * Teammate networking cards, one command per step. Runbook:
 * docs/guides/TEAM_CARDS.md. Run from the repo root:
 *
 *   pnpm --filter @madfam-site/web team-cards mint <code> [--to <card-slug>] [--confirm]
 *       Mint the permanent marca code madf.am/<code> → madfam.io/es/c/<card-slug>.
 *       Prints the request unless --confirm; needs MARCA_ADMIN_TOKEN in the env.
 *   pnpm --filter @madfam-site/web team-cards [--only <slug>] [--no-posters]
 *       Write public/c/{slug}.vcf + public/c/{short}-qr.svg from lib/team-cards.ts,
 *       render the phone posters to apps/web/out/team-cards/ (gitignored) and
 *       check that every QR decodes back to its payload at 240–640 px.
 *   pnpm --filter @madfam-site/web team-cards --check
 *       Write nothing; exit 1 if a generated file drifted from lib/team-cards.ts.
 *   pnpm --filter @madfam-site/web team-cards smoke <slug> [--base <origin>] [--skip-marca]
 *       After deploy: the marca redirect, card page, vCard, presenter, manifest, QR.
 */
/* eslint-disable no-console -- a CLI: stdout is its interface */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { TEAM_CARDS, type TeamCard, findTeamCard, qrSrc, shortSlug } from '../../lib/team-cards';
import { SITE_ORIGIN, cardUrl, shortUrl, teamCardFiles, validateCard } from './files';
import { type DecodeResult, PosterRenderer } from './posters';

const WEB_ROOT = join(__dirname, '../..');
const PUBLIC_DIR = join(WEB_ROOT, 'public');
const POSTER_DIR = join(WEB_ROOT, 'out/team-cards');
const MARCA_API = 'https://madf.am/api/v1/codes';

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const positional = args.filter(
  (a, i) => !a.startsWith('--') && !args[i - 1]?.match(/^--(only|to|base)$/)
);

function fail(message: string): never {
  console.error(`team-cards: ${message}`);
  process.exit(1);
}

function validateAll(): void {
  const problems = TEAM_CARDS.flatMap(validateCard);
  for (const key of [(c: TeamCard) => c.slug, shortSlug]) {
    const seen = new Set<string>();
    for (const card of TEAM_CARDS) {
      if (seen.has(key(card)))
        problems.push(`${card.slug}: "${key(card)}" is used by another card`);
      seen.add(key(card));
    }
  }
  if (problems.length > 0) fail(`invalid lib/team-cards.ts entry:\n  ${problems.join('\n  ')}`);
}

function writeFiles(check: boolean): number {
  let drift = 0;
  for (const file of teamCardFiles(TEAM_CARDS)) {
    const target = join(PUBLIC_DIR, file.path);
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null;
    if (current === file.contents) {
      console.log(`  ok       public/${file.path}`);
      continue;
    }
    drift += 1;
    if (check) {
      console.log(`  DRIFT    public/${file.path}`);
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.contents);
      console.log(`  ${current === null ? 'created ' : 'updated '} public/${file.path}`);
    }
  }
  return drift;
}

function report(result: DecodeResult): boolean {
  const ok = result.reads.every(r => r.ok);
  const cells = result.reads.map(
    r => `${r.width}:${r.ok ? 'OK' : r.got === null ? '--' : 'WRONG'}`
  );
  console.log(`  ${ok ? 'decodes ' : 'FAILS   '} ${result.label}  ${cells.join(' ')}`);
  return ok;
}

async function renderPosters(only?: string): Promise<boolean> {
  const cards = only
    ? TEAM_CARDS.filter(c => c.slug === only || shortSlug(c) === only)
    : TEAM_CARDS;
  if (cards.length === 0) fail(`no card "${only}" in lib/team-cards.ts`);
  mkdirSync(POSTER_DIR, { recursive: true });
  const renderer = await PosterRenderer.launch(WEB_ROOT);
  let ok = true;
  try {
    for (const card of cards) {
      const short = shortSlug(card);
      const svg = readFileSync(join(PUBLIC_DIR, qrSrc(card)), 'utf8');
      const svgSrc = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      ok =
        report(await renderer.decode(`public${qrSrc(card)}`, svgSrc, shortUrl(card), true)) && ok;
      for (const poster of await renderer.render(card, short)) {
        const out = join(POSTER_DIR, poster.file);
        writeFileSync(out, poster.png);
        const src = `data:image/png;base64,${poster.png.toString('base64')}`;
        ok = report(await renderer.decode(relative(WEB_ROOT, out), src, poster.payload)) && ok;
      }
    }
  } finally {
    await renderer.close();
  }
  return ok;
}

async function mint(): Promise<void> {
  const code = positional[1] ?? '';
  const to = option('--to') ?? code;
  if (!/^[a-z0-9-]{3,64}$/.test(code))
    fail('usage: team-cards mint <code> [--to <card-slug>] [--confirm]');
  if (!/^[a-z0-9-]{3,64}$/.test(to))
    fail(`card slug "${to}" must be 3-64 chars of a-z, 0-9, hyphen`);
  const body = {
    url: `${SITE_ORIGIN}/es/c/${to}`,
    slug: code,
    label: `Tarjeta de contacto · ${code}`,
  };
  console.log(`POST ${MARCA_API}\n${JSON.stringify(body, null, 2)}`);
  console.log('A marca code is permanent: it cannot be repointed or re-issued.');
  if (!flag('--confirm')) {
    console.log('Dry run. Check the code and the target, then re-run with --confirm.');
    return;
  }
  const token = process.env.MARCA_ADMIN_TOKEN;
  if (!token) fail('MARCA_ADMIN_TOKEN is not set (ask the owner; it is never committed)');
  const res = await fetch(MARCA_API, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { shortUrl?: string; error?: string };
  if (res.status !== 201) fail(`marca answered HTTP ${res.status}: ${json.error ?? 'no body'}`);
  console.log(`minted ${json.shortUrl} → ${body.url}`);
}

async function smoke(): Promise<void> {
  const card = findTeamCard(positional[1] ?? '');
  if (!card) fail('usage: team-cards smoke <card-slug> [--base <origin>] [--skip-marca]');
  const base = (option('--base') ?? SITE_ORIGIN).replace(/\/$/, '');
  const checks: [string, () => Promise<string | null>][] = [];
  const get = (path: string, expectType: RegExp, expectBody?: string) => async () => {
    const res = await fetch(`${base}${path}`);
    const type = res.headers.get('content-type') ?? '';
    if (res.status !== 200) return `HTTP ${res.status}`;
    if (!expectType.test(type)) return `content-type ${type}`;
    if (expectBody && !(await res.text()).includes(expectBody)) return `body lacks ${expectBody}`;
    return null;
  };
  if (!flag('--skip-marca')) {
    checks.push([
      `${shortUrl(card)} redirects to ${cardUrl(card)}`,
      async () => {
        const res = await fetch(shortUrl(card), { redirect: 'manual' });
        const location = res.headers.get('location');
        return res.status >= 300 && res.status < 400 && location === cardUrl(card)
          ? null
          : `HTTP ${res.status} → ${location}`;
      },
    ]);
  }
  for (const locale of ['es', 'en', 'pt']) {
    checks.push([
      `/${locale}/c/${card.slug}`,
      get(`/${locale}/c/${card.slug}`, /text\/html/, card.email),
    ]);
  }
  checks.push([
    `/es/c/${card.slug}/qr`,
    get(`/es/c/${card.slug}/qr`, /text\/html/, card.shortLink),
  ]);
  checks.push([
    `/c/${card.slug}.vcf`,
    get(`/c/${card.slug}.vcf`, /text\/vcard/, `EMAIL;TYPE=INTERNET,WORK:${card.email}`),
  ]);
  checks.push([
    `/c/${card.slug}/manifest.webmanifest`,
    get(`/c/${card.slug}/manifest.webmanifest`, /manifest\+json/),
  ]);
  checks.push([qrSrc(card), get(qrSrc(card), /image\/svg\+xml/, 'crispEdges')]);
  let failed = 0;
  for (const [label, run] of checks) {
    const problem = await run().catch((e: Error) => e.message);
    if (problem) failed += 1;
    console.log(`  ${problem ? 'FAIL' : 'ok  '}  ${label}${problem ? `  (${problem})` : ''}`);
  }
  if (failed > 0) fail(`${failed} smoke check(s) failed against ${base}`);
  console.log(`smoke: all ${checks.length} checks pass against ${base}`);
}

async function main(): Promise<void> {
  if (positional[0] === 'mint') return mint();
  if (positional[0] === 'smoke') return smoke();
  if (positional[0]) fail(`unknown command "${positional[0]}"`);

  validateAll();
  const check = flag('--check');
  console.log(check ? 'Checking generated files:' : 'Generating from lib/team-cards.ts:');
  const drift = writeFiles(check);
  if (check) {
    if (drift > 0) fail(`${drift} file(s) drifted; run without --check to regenerate`);
    return;
  }
  if (flag('--no-posters')) return;
  console.log(`Posters → ${relative(process.cwd(), POSTER_DIR) || '.'}:`);
  if (!(await renderPosters(option('--only'))))
    fail('a QR did not decode at every size; do not ship it');
  console.log('All QRs decode at 240, 320, 480 and 640 px.');
}

main().catch((error: Error) => fail(error.stack ?? error.message));
