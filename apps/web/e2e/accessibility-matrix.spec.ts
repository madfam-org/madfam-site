import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '@playwright/test';

/**
 * Blocking accessibility gate: axe (WCAG 2.2 A/AA) on the main routes, in
 * light and dark, at desktop (1440) and phone (390) widths.
 *
 * It fails on any serious or critical violation that is not in
 * `a11y-baseline.json`, and on a known one that grows. The baseline records
 * the violations the site had when the gate was introduced, so the gate can
 * block regressions from day one; entries come out as they are fixed and must
 * never be added to make a red run green.
 *
 * Refresh after a fix: `A11Y_WRITE_BASELINE=1 pnpm test:a11y --project=chromium`
 * rewrites the file from the current results (review the diff: it may only
 * shrink).
 */
const ROUTES = [
  '/es',
  '/en',
  '/es/products',
  '/es/platforms',
  '/es/platforms/enclii',
  '/es/ecosystem',
  '/es/value-ladder',
  '/es/contact',
  '/es/about',
  '/es/careers',
  '/es/solutions/maker-node',
  '/es/privacy',
];

const VARIANTS = [
  { scheme: 'light', width: 1440, height: 900 },
  { scheme: 'dark', width: 1440, height: 900 },
  { scheme: 'light', width: 390, height: 844 },
  { scheme: 'dark', width: 390, height: 844 },
] as const;

const BASELINE_PATH = join(__dirname, 'a11y-baseline.json');
const baseline: Record<string, number> = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
const observed: Record<string, number> = {};

test.describe('Accessibility matrix @accessibility', () => {
  test.describe.configure({ mode: 'serial' });

  for (const variant of VARIANTS) {
    test.describe(`${variant.scheme} ${variant.width}px`, () => {
      test.use({
        colorScheme: variant.scheme,
        viewport: { width: variant.width, height: variant.height },
      });

      for (const route of ROUTES) {
        test(route, async ({ page }) => {
          await page.goto(route, { waitUntil: 'networkidle' });
          // Let the cookie notice and client-only chrome mount before scanning.
          await page.waitForTimeout(1500);

          const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze();

          const regressions: string[] = [];
          for (const violation of results.violations) {
            if (violation.impact !== 'serious' && violation.impact !== 'critical') continue;
            const key = `${route}|${variant.scheme}|${variant.width}|${violation.id}`;
            observed[key] = violation.nodes.length;
            const allowed = baseline[key] ?? 0;
            if (violation.nodes.length > allowed) {
              regressions.push(
                `${violation.id} (${violation.impact}): ${violation.nodes.length} node(s), baseline ${allowed} — ${violation.nodes
                  .slice(0, 3)
                  .map(node => node.target.join(' '))
                  .join(' | ')}`
              );
            }
          }

          if (!process.env.A11Y_WRITE_BASELINE) {
            expect(regressions, `${route} ${variant.scheme} ${variant.width}px`).toEqual([]);
          }
        });
      }
    });
  }

  test.afterAll(() => {
    if (process.env.A11Y_WRITE_BASELINE) {
      const sorted = Object.fromEntries(Object.entries(observed).sort());
      writeFileSync(BASELINE_PATH, `${JSON.stringify(sorted, null, 2)}\n`);
    }
  });
});
