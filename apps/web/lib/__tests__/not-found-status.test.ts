import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A `loading.tsx` wraps its segment in a Suspense boundary, so the response
 * starts streaming with status 200 before a page below it can call
 * `notFound()`. Unknown URLs then answered 200 ("soft 404s"). These segments
 * contain routes that call `notFound()`, so none of them may have one.
 */
const app = join(__dirname, '../../app');
const translations = join(__dirname, '../../../../packages/i18n/src/translations');

describe('404s keep a 404 status', () => {
  it.each(['loading.tsx', '[locale]/loading.tsx', '[locale]/platforms/[slug]/loading.tsx'])(
    'has no %s above a route that calls notFound()',
    file => {
      expect(existsSync(join(app, file))).toBe(false);
    }
  );

  it('routes unknown locale paths to the localized not-found page', () => {
    const page = readFileSync(join(app, '[locale]/[...rest]/page.tsx'), 'utf8');
    expect(page).toContain('notFound()');
    expect(existsSync(join(app, '[locale]/not-found.tsx'))).toBe(true);
  });

  it.each(['es', 'en', 'pt'])('%s has the not-found copy the page renders', locale => {
    const system = JSON.parse(readFileSync(join(translations, locale, 'system.json'), 'utf8'));
    for (const key of [
      'title',
      'description',
      'goHome',
      'helpfulLinks',
      'products',
      'about',
      'contact',
    ]) {
      expect(system.notFound?.[key], `${locale} notFound.${key}`).toBeTruthy();
    }
  });
});
