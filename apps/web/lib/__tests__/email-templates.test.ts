import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailService } from '@madfam-site/email';
import { EmailSender } from '@madfam-site/email/sender';

/**
 * Finding M1-027, ruling R46 (sender), R37/R47 (entity line). Every email the
 * site renders must link the public site — never `localhost` or a Vercel host —
 * carry the entity line, avoid the retired consultancy copy, and go out as
 * `MADFAM <hola@madfam.io>`.
 */
const ENTITY_LINE = 'Innovaciones MADFAM S.A.S. de C.V. · Cuernavaca, Morelos, México';
const R46_FROM = 'MADFAM <hola@madfam.io>';
const RETIRED_COPY = [
  /socio en transformación digital/i,
  /digital transformation partner/i,
  /consulta gratuita/i,
  /free consultation/i,
  /Estrategia y Habilitación|Strategy & Enablement|Diseño y Fabricación|Design & Fabrication/,
  /Pilotos de Plataforma|Platform Pilots|Alianzas Estratégicas|Strategic Partnerships/,
];

const service = new EmailService();

const renders: Array<[string, () => ReturnType<EmailService['renderTemplate']>]> = (
  ['es', 'en', 'pt', 'es-MX', 'en-US'] as const
).flatMap(language => [
  [
    `welcome/${language}`,
    () => service.renderTemplate('welcome', { name: 'Ana', language, tier: 'STRATEGY_ENABLEMENT' }),
  ],
  [
    `assessment-results/${language}`,
    () =>
      service.renderTemplate('assessment-results', {
        assessmentId: 'a-1',
        score: 72,
        tier: 'STRATEGY_ENABLEMENT',
        strengths: ['Datos ordenados'],
        recommendations: ['Empieza con una plataforma'],
        language,
      }),
  ],
  [
    `roi-results/${language}`,
    () =>
      service.renderTemplate('roi-results', {
        calculationId: 'c-1',
        results: {
          roi: { percentage: 120, paybackMonths: 8, fiveYearNetSavings: 500000 },
          futureState: { annualSavings: 120000 },
          benefits: { productivityGain: '20%', hoursRecoveredMonthly: 40, costReduction: '15%' },
        },
        language,
      }),
  ],
]);

function hrefs(html: string): string[] {
  return [...html.matchAll(/(?:href|src)="([^"]+)"/g)].map(match => match[1]);
}

describe('email templates (M1-027)', () => {
  beforeEach(() => {
    vi.stubEnv('SITE_URL', '');
    // Neither of these may leak into an email any more.
    vi.stubEnv('NEXT_PUBLIC_BASE_URL', 'http://localhost:3000');
    vi.stubEnv('VERCEL_URL', 'some-preview.vercel.app');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(renders)(
    '%s links only the public site and carries the entity line',
    async (_, render) => {
      const { html, text, subject } = await render();
      expect(html).not.toMatch(/localhost|127\.0\.0\.1|vercel\.app/);
      for (const url of hrefs(html)) {
        expect(url, url).toMatch(/^https:\/\/(madfam\.io|kalya\.app)(\/|$)/);
      }
      expect(html).toContain('https://madfam.io/assets/brand/email/madfam-logo-112.png');
      expect(text).toContain(ENTITY_LINE);
      for (const retired of RETIRED_COPY) {
        expect(`${subject}\n${text}`).not.toMatch(retired);
      }
    }
  );

  it('renders Portuguese for pt and keeps the localized site path', async () => {
    const { html, subject } = await service.renderTemplate('welcome', {
      name: 'Ana',
      language: 'pt',
    });
    expect(subject).toBe('Recebemos sua mensagem — MADFAM');
    expect(html).toContain('lang="pt"');
    expect(html).toContain('https://madfam.io/pt/platforms');
  });

  it('builds links from SITE_URL when it is set', async () => {
    vi.stubEnv('SITE_URL', 'https://staging.example.org/');
    const { html } = await service.renderTemplate('welcome', { name: 'Ana', language: 'es' });
    expect(html).toContain('https://staging.example.org/es/platforms');
    expect(html).not.toContain('https://madfam.io/es/platforms');
  });

  it('refuses a localhost SITE_URL instead of mailing a dead link', async () => {
    vi.stubEnv('SITE_URL', 'http://localhost:3000');
    await expect(
      service.renderTemplate('welcome', { name: 'Ana', language: 'es' })
    ).rejects.toThrow(/public https origin/);
  });
});

describe('email sender (R46)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ id: 'msg-1' }) });
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('RESEND_API_KEY', 'test-key');
    vi.stubEnv('RESEND_FROM_EMAIL', '');
    vi.stubEnv('SITE_URL', '');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('sends as MADFAM <hola@madfam.io> by default', async () => {
    const result = await new EmailSender().sendEmail({
      to: ['ana@example.com'],
      template: 'welcome',
      data: { name: 'Ana', language: 'es' },
    });
    expect(result.success).toBe(true);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body.from).toBe(R46_FROM);
    expect(body.html).not.toMatch(/localhost/);
  });

  it('sends Janua-routed mail as hola@madfam.io / MADFAM by default', async () => {
    vi.stubEnv('JANUA_INTERNAL_API_KEY', 'test-key');
    vi.resetModules();
    const { sendEmailViaJanua } = await import('@madfam-site/email/janua-sender');
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    await sendEmailViaJanua({ to: ['ana@example.com'], subject: 's', html: '<p>x</p>' });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(`${body.from_name} <${body.from_email}>`).toBe(R46_FROM);
  });
});
