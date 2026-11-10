import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The privacy notice and the cookie policy state that no analytics runs on
 * madfam.io. That is true only while production builds withhold
 * NEXT_PUBLIC_PLAUSIBLE_DOMAIN: without it the root layout renders no
 * analytics script and the beacon in @madfam-site/analytics sends nothing.
 *
 * Mexican privacy law requires the notice to name the tracking technologies
 * actually in use, so the build and the words have to change together. If this
 * test fails because analytics is being enabled, first update the privacy
 * notice (`legal.json` → `privacy`) and the cookie policy (`cookies.json`) in
 * every locale through counsel review, then update this test.
 */
const REPO = path.resolve(__dirname, '../../../..');
const LOCALES = ['es', 'en', 'pt'] as const;

function read(relative: string): string {
  return fs.readFileSync(path.join(REPO, relative), 'utf8');
}

function strings(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (node && typeof node === 'object') return Object.values(node).flatMap(strings);
  return [];
}

/** Lines that are not YAML/Dockerfile comments. */
function activeLines(source: string): string[] {
  return source.split('\n').filter(line => !line.trim().startsWith('#'));
}

describe('analytics stays off while the notices say it is off', () => {
  it('the production workflow passes no NEXT_PUBLIC_PLAUSIBLE_DOMAIN build-arg', () => {
    const active = activeLines(read('.github/workflows/deploy-web.yml'));
    expect(active.some(line => /NEXT_PUBLIC_PLAUSIBLE_DOMAIN\s*[=:]/.test(line))).toBe(false);
  });

  it('the Dockerfile defaults NEXT_PUBLIC_PLAUSIBLE_DOMAIN to empty', () => {
    const active = activeLines(read('apps/web/Dockerfile'));
    const arg = active.find(line => /^\s*ARG\s+NEXT_PUBLIC_PLAUSIBLE_DOMAIN\b/.test(line));
    expect(arg?.trim()).toMatch(/^ARG\s+NEXT_PUBLIC_PLAUSIBLE_DOMAIN=?$/);
  });

  for (const locale of LOCALES) {
    const base = `packages/i18n/src/translations/${locale}`;
    const { privacy } = JSON.parse(read(`${base}/legal.json`));
    const cookies = JSON.parse(read(`${base}/cookies.json`));

    it(`${locale}: neither notice names an analytics tool as running`, () => {
      const text = [...strings(privacy), ...strings(cookies)].join('\n');
      expect(text).not.toMatch(/plausible|posthog|google analytics|matomo|umami/i);
      expect(text).not.toMatch(/analizar el tráfico|analyze site traffic|analisar o tráfego/i);
    });

    it(`${locale}: both notices say no analytics runs and that they change first`, () => {
      expect(privacy.cookies.note).toMatch(
        /no usamos herramientas de analítica|use no web analytics|não usamos ferramentas de análise/i
      );
      expect(cookies.sections.howWeUse.analyticsDescription).toMatch(
        /no usamos cookies analíticas|do not use analytics cookies|não usamos cookies analíticos/i
      );
      // The promise to update the notice before enabling analytics.
      for (const sentence of [
        privacy.cookies.note,
        cookies.sections.howWeUse.analyticsDescription,
      ]) {
        expect(sentence).toMatch(/antes de hacerlo|before we do|antes de fazê-lo/i);
      }
    });
  }
});
