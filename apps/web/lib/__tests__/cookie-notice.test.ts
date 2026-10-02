import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Finding M1-030. The cookie notice must say what the site's own cookie policy
 * says: necessary and preference cookies only, no analytics or advertising
 * cookies, and no implied consent ("by continuing you consent").
 */
const LOCALES = ['es', 'en', 'pt'] as const;
const STOP_LIST = [
  /analizar el tráfico|analyze site traffic|analisar o tráfego/i,
  /anuncios|advertisements|anúncios|rastrear|track visitors/i,
  /al continuar|by continuing|ao continuar/i,
  /consientes|you consent|você consente/i,
  /aceptar todas|accept all|aceitar todos/i,
  /google analytics/i,
];

function strings(node: unknown): string[] {
  if (typeof node === 'string') return [node];
  if (node && typeof node === 'object') return Object.values(node).flatMap(strings);
  return [];
}

describe('cookie notice copy (M1-030)', () => {
  for (const locale of LOCALES) {
    const bundle = JSON.parse(
      fs.readFileSync(
        path.resolve(
          __dirname,
          `../../../../packages/i18n/src/translations/${locale}/cookies.json`
        ),
        'utf8'
      )
    );

    it(`${locale}: banner and footer carry no analytics, ad or implied-consent wording`, () => {
      const text = [...strings(bundle.banner), ...strings(bundle.footer)].join('\n');
      for (const pattern of STOP_LIST) expect(text).not.toMatch(pattern);
    });

    it(`${locale}: there are no analytics or marketing toggles left to render`, () => {
      expect(bundle.settings).toBeUndefined();
      expect(Object.keys(bundle.banner).sort()).toEqual(
        ['closeAriaLabel', 'description', 'dismiss', 'necessary', 'preference', 'title'].sort()
      );
    });
  }

  it('the component has no analytics or marketing preference state', () => {
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../components/CookieConsent.tsx'),
      'utf8'
    );
    expect(source).not.toMatch(/Google Analytics/i);
    expect(source).not.toMatch(/analytics:\s*(true|false)|marketing:\s*(true|false)/);
  });
});
