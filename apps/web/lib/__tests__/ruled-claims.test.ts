import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PLATFORMS, lifecycleLabelKey, primaryCtaLabelKey } from '@/lib/data/platforms';

/**
 * Batch S3 — ruled-claims residue. Rulings R29/MH-10 (membership = one waitlist
 * sentence), MH-5 (lifecycle labels), CX-4 (no Enclii SLA / deploy figure),
 * CX-5 (residency wording), R11 (no unowned numbers), R12 (Maker Node
 * discounts "próximamente"). Findings L1-006, L1-007, L1-017, L1-028, M1-006,
 * M1-007, M1-008, M1-016, M1-017.
 */
const LOCALES = ['es', 'en', 'pt'] as const;
const root = join(__dirname, '../../../..');
const bundlePath = (locale: string, name: string) =>
  join(root, `packages/i18n/src/translations/${locale}/${name}.json`);
const bundle = (locale: string, name: string) =>
  JSON.parse(readFileSync(bundlePath(locale, name), 'utf8'));
const raw = (locale: string, name: string) => readFileSync(bundlePath(locale, name), 'utf8');

function lookup(tree: unknown, key: string): unknown {
  return key
    .split('.')
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined,
      tree
    );
}

/** Everything a page can ship: these bundles go to the client whole. */
const SURFACE_BUNDLES = ['ecosystem', 'platforms', 'common'] as const;

const STOP_LIST = [
  /soporte prioritario|priority support|suporte prioritário/i,
  /comunidad de miembros|member community|comunidade de membros/i,
  /una membresía|one membership|uma assinatura/i,
  /assinatura/i,
  /acceso anticipado|early access|acesso antecipado/i,
  /99\.95/,
  /<\s?90\s?s/,
  /residencia total|full data residency|residência total/i,
  /\b236\b/,
  // Forgesight's "1,000+" vendor line is registry product copy (M1-024), so it
  // stays; the hand-typed "200+ materials" metric does not.
  /200\+ (materiales|materials|materiais)/,
  /descuento para miembros|member discount|desconto para membros/i,
  /miembros obtienen|members get discounted|membros recebem/i,
];

describe('ruled-claims stop-list (S3)', () => {
  for (const locale of LOCALES) {
    for (const name of SURFACE_BUNDLES) {
      it(`${locale}/${name}.json carries no ruled-out claim`, () => {
        const text = raw(locale, name);
        for (const pattern of STOP_LIST) expect(text, String(pattern)).not.toMatch(pattern);
      });
    }

    it(`${locale}: the residency line is the CX-5 wording`, () => {
      const sovereign = lookup(bundle(locale, 'corporate'), 'whyMadfam.sovereign.description');
      const cx5 = {
        es: 'Datos alojados en infraestructura que operamos',
        en: 'Data hosted on infrastructure we operate',
        pt: 'Dados hospedados em infraestrutura que operamos',
      }[locale];
      expect(sovereign).toContain(cx5);
      expect(String(sovereign)).not.toMatch(
        /residencia total|full data residency|residência total/i
      );
    });

    it(`${locale}: membership is one waitlist sentence, with no benefit list`, () => {
      const ecosystem = bundle(locale, 'ecosystem');
      expect(lookup(ecosystem, 'pricing.features')).toBeUndefined();
      expect(lookup(ecosystem, 'offerPaths.ecosystem.proof1')).toBeUndefined();
      const sentence = lookup(ecosystem, 'pricing.subtitle');
      expect(lookup(ecosystem, 'homepage.membershipValue.subtitle')).toBe(sentence);
      expect(lookup(ecosystem, 'offerPaths.ecosystem.description')).toBe(sentence);
      expect(lookup(bundle(locale, 'platforms'), 'index.ctaSubtitle')).toBe(sentence);
      expect(
        String(sentence)
          .split(/[.!?](\s|$)/)
          .filter(s => s && s.trim()).length
      ).toBe(1);
    });
  }

  it('the /ecosystem title and the home meta carry no membership slogan', () => {
    const ecosystemPage = readFileSync(
      join(__dirname, '../../app/[locale]/ecosystem/page.tsx'),
      'utf8'
    );
    expect(ecosystemPage).toContain("namespace: 'ecosystem.meta'");
    const seo = readFileSync(join(__dirname, '../seo.ts'), 'utf8');
    for (const text of [ecosystemPage, seo]) {
      expect(text).not.toMatch(/una membresía|one membership|uma assinatura/i);
    }
  });

  it('the home page no longer server-renders zero counters', () => {
    expect(existsSync(join(__dirname, '../../components/ecosystem/MetricsBar.tsx'))).toBe(false);
    const home = readFileSync(join(__dirname, '../../components/EcosystemHomePage.tsx'), 'utf8');
    expect(home).not.toContain('MetricsBar');
  });
});

/**
 * SITE-01 (front-door audit 2026-10-03, P0): /pt/about said "Junte-se a centenas
 * de empresas…", a client count nobody can source (R9/R11). The stop-list above
 * reads three bundles; this scans EVERY bundle of every locale, pages.json
 * included, for the shapes an invented count takes.
 */
const INVENTED_COUNTS =
  /centenas de (empresas|clientes|negócios)|cientos de (empresas|clientes|negocios)|hundreds of (companies|businesses|clients|customers)|miles de (empresas|clientes)|milhares de (empresas|clientes)|thousands of (companies|businesses|clients|customers)/i;

describe('no invented client counts (SITE-01)', () => {
  for (const locale of LOCALES) {
    const dir = join(root, `packages/i18n/src/translations/${locale}`);
    for (const file of readdirSync(dir).filter(name => name.endsWith('.json'))) {
      it(`${locale}/${file} claims no client count`, () => {
        expect(readFileSync(join(dir, file), 'utf8')).not.toMatch(INVENTED_COUNTS);
      });
    }
  }
});

describe('lifecycle badge and CTA (MH-5)', () => {
  const EXPECTED = {
    es: {
      live: 'En producción',
      degraded: 'Disponible — servicio degradado',
      beta: 'Beta',
      incubating: 'Próximamente',
    },
    en: {
      live: 'In production',
      degraded: 'Available — degraded service',
      beta: 'Beta',
      incubating: 'Coming soon',
    },
    pt: {
      live: 'Em produção',
      degraded: 'Disponível — serviço degradado',
      beta: 'Beta',
      incubating: 'Em breve',
    },
  } as const;

  for (const locale of LOCALES) {
    const platforms = bundle(locale, 'platforms');

    it(`${locale}: the four lifecycle labels are the ruled ones`, () => {
      expect(lookup(platforms, 'shared.lifecycle')).toEqual(EXPECTED[locale]);
    });

    it(`${locale}: every catalog badge and primary CTA resolves from lifecycle`, () => {
      const visit = lookup(platforms, 'shared.visitPlatform');
      for (const platform of PLATFORMS) {
        expect(lookup(platforms, lifecycleLabelKey(platform)), platform.slug).toBe(
          EXPECTED[locale][platform.lifecycle]
        );
        const cta = lookup(platforms, primaryCtaLabelKey(platform));
        expect(typeof cta, platform.slug).toBe('string');
        expect(String(cta), platform.slug).not.toMatch(/anticipad|early access|antecipad/i);
        if (platform.lifecycle === 'live' && platform.primaryCTA.type === 'external') {
          expect(cta, platform.slug).toBe(visit);
        }
      }
    });
  }

  it('degraded products are not labelled like beta ones', () => {
    const degraded = PLATFORMS.filter(p => p.lifecycle === 'degraded');
    expect(degraded.length).toBeGreaterThan(0);
    for (const platform of degraded) {
      expect(lifecycleLabelKey(platform)).toBe('shared.lifecycle.degraded');
    }
  });
});
