// JSON-LD builders (finding C-025; P2 SEO/GEO scorecard item 1).
//
// Every fact comes from the registry (via platforms.generated.ts / PLATFORMS)
// or from the copy bundle; nothing product-specific is typed here. No `offers`
// and no prices: prices live only on the value-ladder surface, from the
// registry, and the registry ratifies none yet (R9/R25). Validated by
// apps/web/lib/__tests__/structured-data.test.ts, which runs in CI.

import { REGISTRY_COMMERCE } from '@/lib/data/platforms.generated';
import type { Platform } from '@/lib/data/platforms';
const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://madfam.io';
const localizedUrl = (locale: string, path: string): string => `${SITE_URL}/${locale}${path}`;

export type JsonLd = Record<string, unknown> & { '@context': string; '@type': string };

const CONTEXT = 'https://schema.org';

/** The publisher block every product carries (entity per R37/R47). */
export const MADFAM_PUBLISHER = {
  '@type': 'Organization',
  name: 'MADFAM',
  legalName: 'Innovaciones MADFAM S.A.S. de C.V.',
  url: SITE_URL,
} as const;

/** SPDX identifiers that have a canonical SPDX licence page. */
function licenseUrl(license: string): string | undefined {
  if (!license || license === 'Proprietary' || license === 'UNLICENSED') return undefined;
  return `https://spdx.org/licenses/${license}.html`;
}

/** Registry-backed only: true when the registry lists a `free` tier. */
function isAccessibleForFree(slug: string): boolean | undefined {
  const tiers = REGISTRY_COMMERCE[slug]?.tiers;
  if (!tiers) return undefined;
  return tiers.some(tier => tier.id === 'free') ? true : undefined;
}

export function softwareApplicationLd(
  platform: Platform,
  copy: { description: string },
  locale: string
): JsonLd {
  const url = platform.externalUrl ?? localizedUrl(locale, `/platforms/${platform.slug}`);
  const ld: JsonLd = {
    '@context': CONTEXT,
    '@type': 'SoftwareApplication',
    name: platform.name,
    description: copy.description,
    url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    inLanguage: locale,
    publisher: MADFAM_PUBLISHER,
  };
  const license = licenseUrl(platform.license);
  if (license) ld.license = license;
  if (platform.githubUrl) ld.sameAs = [platform.githubUrl];
  const free = isAccessibleForFree(platform.slug);
  if (free) ld.isAccessibleForFree = true;
  return ld;
}

export function faqPageLd(items: Array<{ question: string; answer: string }>): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function breadcrumbLd(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
