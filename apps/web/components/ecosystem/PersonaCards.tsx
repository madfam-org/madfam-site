'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { getPlatformBySlug, type Platform } from '@/lib/data/platforms';

interface Persona {
  id: string;
  icon: string;
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackCta: string;
  platformSlugs: string[];
  href: (locale: string) => string;
}

const PERSONAS: Persona[] = [
  {
    id: 'makers',
    icon: '\uD83C\uDFA8',
    fallbackTitle: 'Makers & Designers',
    fallbackDescription:
      'Design parametric models, get instant quotes, and track production from a single workflow.',
    fallbackCta: 'Explore Products',
    platformSlugs: ['yantra4d', 'cotiza-studio', 'pravara-mes'],
    href: (locale: string) => `/${locale}/products`,
  },
  {
    id: 'founders',
    icon: '\uD83D\uDE80',
    fallbackTitle: 'Founders & Startups',
    fallbackDescription:
      'Launch on sovereign cloud, manage finances, and own your identity infrastructure from day one.',
    fallbackCta: 'Explore Ecosystem',
    platformSlugs: ['dhanam', 'enclii', 'janua'],
    href: (locale: string) => `/${locale}/ecosystem`,
  },
  {
    id: 'enterprises',
    icon: '\uD83C\uDFE2',
    fallbackTitle: 'Enterprises',
    fallbackDescription:
      'Pricing intelligence, regulatory compliance, and competency-based training at scale.',
    fallbackCta: 'Contact Us',
    platformSlugs: ['forge-sight', 'tezca', 'avala'],
    href: (locale: string) => `/${locale}/contact`,
  },
];

function PlatformPill({ platform }: { platform: Platform }): React.ReactElement {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${platform.accentColor.border} ${platform.accentColor.bg}`}
    >
      <span aria-hidden="true">{platform.icon}</span>
      <span className={platform.accentColor.text}>{platform.name}</span>
    </span>
  );
}

function PersonaCard({
  persona,
  locale,
  t,
}: {
  persona: Persona;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}): React.ReactElement {
  // Attempt to read translations with fallback to hardcoded strings
  let title = persona.fallbackTitle;
  let description = persona.fallbackDescription;
  let cta = persona.fallbackCta;

  try {
    const translatedTitle = t(`personas.${persona.id}.title`);
    if (translatedTitle) title = translatedTitle;
  } catch {
    // Fall back to hardcoded value
  }
  try {
    const translatedDesc = t(`personas.${persona.id}.description`);
    if (translatedDesc) description = translatedDesc;
  } catch {
    // Fall back to hardcoded value
  }
  try {
    const translatedCta = t(`personas.${persona.id}.cta`);
    if (translatedCta) cta = translatedCta;
  } catch {
    // Fall back to hardcoded value
  }

  const platforms = persona.platformSlugs
    .map(slug => getPlatformBySlug(slug))
    .filter((p): p is Platform => p != null);

  return (
    <div className="flex flex-col p-6 md:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Persona icon */}
      <div
        className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl mb-5"
        aria-hidden="true"
      >
        {persona.icon}
      </div>

      {/* Title and description */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 flex-1">
        {description}
      </p>

      {/* Platform pills */}
      <div className="flex flex-wrap gap-2 mb-6" aria-label="Highlighted platforms">
        {platforms.map(platform => (
          <PlatformPill key={platform.slug} platform={platform} />
        ))}
      </div>

      {/* CTA link */}
      <Link
        href={persona.href(locale)}
        className="inline-flex items-center gap-1 text-sm font-semibold text-leaf hover:text-leaf/80 transition-colors min-h-[44px]"
      >
        {cta}
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

export function PersonaCards({ locale }: { locale: string }): React.ReactElement {
  const t = useTranslations('ecosystem.homepage');

  return (
    <section
      className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900"
      aria-labelledby="persona-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PERSONAS.map(persona => (
            <PersonaCard key={persona.id} persona={persona} locale={locale} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
