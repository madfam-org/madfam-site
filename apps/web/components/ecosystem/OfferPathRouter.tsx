'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import type { Locale } from '@madfam/i18n';
import { Container } from '@/components/ui';
import { getOfferPaths } from '@/lib/data/offer-paths';

export function OfferPathRouter(): React.ReactElement {
  const locale = useLocale() as Locale;
  const t = useTranslations('ecosystem.offerPaths');
  const paths = getOfferPaths(locale);

  return (
    <section
      data-section="offer-path-router"
      aria-labelledby="offer-path-router-heading"
      className="relative overflow-hidden bg-obsidian py-24 text-white"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(107,203,119,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(255,217,61,0.16),transparent_30%),radial-gradient(circle_at_60%_85%,rgba(155,89,182,0.2),transparent_34%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      <Container className="relative z-10">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.32em] text-sun">
            {t('section.eyebrow')}
          </p>
          <h2
            id="offer-path-router-heading"
            className="text-3xl font-bold leading-tight md:text-5xl"
          >
            {t('section.title')}
          </h2>
          <p className="mt-5 text-base leading-relaxed text-white/70 md:text-lg">
            {t('section.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {paths.map((path, index) => (
            <Link
              key={path.id}
              href={path.href}
              className={`group relative flex min-h-[420px] flex-col overflow-hidden rounded-3xl border ${path.accent.ring} bg-white/[0.035] p-6 shadow-2xl shadow-black/10 transition-all duration-300 hover:-translate-y-1 ${path.accent.glow} focus:outline-none focus-visible:ring-2 focus-visible:ring-sun focus-visible:ring-offset-2 focus-visible:ring-offset-obsidian`}
            >
              <div
                aria-hidden="true"
                className={`absolute inset-0 bg-gradient-to-br ${path.accent.gradient} opacity-80 transition-opacity duration-300 group-hover:opacity-100`}
              />
              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-8 flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold uppercase tracking-[0.24em] ${path.accent.text}`}
                  >
                    {t(`${path.id}.eyebrow`)}
                  </span>
                  <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60">
                    0{index + 1}
                  </span>
                </div>

                <h3 className="text-2xl font-bold leading-tight text-white">
                  {t(`${path.id}.title`)}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  {t(`${path.id}.description`)}
                </p>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">
                    {t('section.bestFor')}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-white/75">
                    {t(`${path.id}.recommendedFor`)}
                  </p>
                </div>

                <ul className="mt-6 space-y-2" aria-label={`${t(`${path.id}.title`)} proof points`}>
                  {(['proof1', 'proof2', 'proof3'] as const).map(proofKey => (
                    <li key={proofKey} className="flex items-start gap-2 text-sm text-white/70">
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 h-1.5 w-1.5 rounded-full ${path.accent.dot}`}
                      />
                      <span>{t(`${path.id}.${proofKey}`)}</span>
                    </li>
                  ))}
                </ul>

                <span className="mt-auto inline-flex items-center gap-2 pt-8 text-sm font-semibold text-white">
                  {t(`${path.id}.cta`)}
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:translate-x-1"
                  >
                    -&gt;
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
