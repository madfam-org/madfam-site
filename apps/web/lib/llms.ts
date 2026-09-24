// Site-level llms.txt / llms-full.txt (finding C-020; P2 "GEO" item: a
// site-level llms.txt). Generated at request time from the vendored registry
// projection (via platforms.generated.ts) and the English copy bundle, so it
// cannot drift from the catalog the site renders. No prices, no counts.

import { messages } from '@madfam-site/i18n';
import {
  REGISTRY_PRODUCTS,
  REGISTRY_PRODUCT_ORDER,
  RETIRED_PRODUCTS,
  type RegistryLifecycle,
  type RegistryProduct,
} from '@/lib/data/platforms.generated';
import { PLATFORMS } from '@/lib/data/platforms';
import { KALYA_DISCOVERY_CALL_URL } from '@/lib/data/value-ladder';
import { SITE_URL, localizedUrl } from '@/lib/seo-urls';

const ENTITY = 'Innovaciones MADFAM S.A.S. de C.V.';

const LIFECYCLE_LABEL: Record<RegistryLifecycle, string> = {
  live: 'live',
  beta: 'beta',
  degraded: 'live, degraded',
  incubating: 'in development',
};

/** i18n keys that differ from the site slug (historical camelCase keys). */
const I18N_KEY: Record<string, string> = {
  'forge-sight': 'forgeSight',
  'cotiza-studio': 'cotizaStudio',
  'pravara-mes': 'pravaraMes',
};

type PlatformCopy = { tagline?: string; valueProp?: string };

function copyFor(slug: string): PlatformCopy {
  const bundle = (messages.en as unknown as { platforms: Record<string, PlatformCopy> }).platforms;
  return bundle[I18N_KEY[slug] ?? slug] ?? {};
}

const INTRO = [
  '# MADFAM',
  '',
  `> ${ENTITY} (MADFAM) is a Mexican studio based in Cuernavaca, Morelos, that builds and operates an ecosystem of open, interconnected software platforms on its own infrastructure, for creators, makers and businesses in Latin America.`,
  '',
  `- Legal entity: ${ENTITY}, Cuernavaca, Morelos, Mexico.`,
  `- Site languages: Spanish (default) ${localizedUrl('es')}, English ${localizedUrl('en')}, Portuguese ${localizedUrl('pt')}.`,
  '- Each platform lives on its own domain; the catalog below is generated from the MADFAM product registry.',
  `- Prices: published only on ${localizedUrl('en', '/value-ladder')}, and only where the registry has ratified them.`,
  `- How to start: sign up on a platform's own domain, or book a discovery call at ${KALYA_DISCOVERY_CALL_URL}.`,
  `- Contact: ${localizedUrl('en', '/contact')}`,
];

const PAGES: Array<[string, string, string]> = [
  ['Platforms', '/platforms', 'the catalog with each platform status'],
  ['Ecosystem', '/ecosystem', 'how the platforms connect'],
  ['Value ladder', '/value-ladder', 'where to start and how offers are tiered'],
  ['About', '/about', 'who MADFAM is'],
  ['Primavera Maker Node', '/solutions/maker-node', 'physical fabrication'],
  ['Privacy policy', '/privacy', 'data controller and rights'],
];

function catalogProducts(): RegistryProduct[] {
  const surfaced = new Set(PLATFORMS.map(p => p.slug));
  const products: RegistryProduct[] = [];
  for (const slug of REGISTRY_PRODUCT_ORDER) {
    const product = REGISTRY_PRODUCTS[slug];
    if (product && (surfaced.has(product.slug) || product.lifecycle === 'incubating')) {
      products.push(product);
    }
  }
  return products;
}

export function buildLlmsTxt(): string {
  const lines = [...INTRO, '', '## Platforms', ''];
  for (const product of catalogProducts()) {
    if (product.lifecycle === 'incubating') continue;
    const url = product.externalUrl ?? localizedUrl('en', `/platforms/${product.slug}`);
    const { tagline } = copyFor(product.slug);
    lines.push(
      `- [${product.name}](${url}): ${tagline ? `${tagline} — ` : ''}${LIFECYCLE_LABEL[product.lifecycle]}; licence ${product.license}`
    );
  }
  lines.push('', '## Pages', '');
  for (const [title, path, note] of PAGES) {
    lines.push(`- [${title}](${localizedUrl('en', path)}): ${note}`);
  }
  lines.push('', '## Optional', '', `- [Full context](${SITE_URL}/llms-full.txt)`, '');
  return lines.join('\n');
}

export function buildLlmsFullTxt(): string {
  const lines = [...INTRO, '', '## Platforms', ''];
  for (const product of catalogProducts()) {
    if (product.lifecycle === 'incubating') continue;
    const copy = copyFor(product.slug);
    lines.push(`### ${product.name}`, '');
    if (copy.tagline) lines.push(copy.tagline, '');
    if (copy.valueProp) lines.push(copy.valueProp, '');
    lines.push(`- Status: ${LIFECYCLE_LABEL[product.lifecycle]}`);
    lines.push(`- Category: ${product.category}`);
    lines.push(`- Licence: ${product.license}`);
    if (product.externalUrl) lines.push(`- Website: ${product.externalUrl}`);
    if (product.githubUrl) lines.push(`- Source: ${product.githubUrl}`);
    lines.push('');
  }
  const incubating = catalogProducts().filter(p => p.lifecycle === 'incubating');
  if (incubating.length > 0) {
    lines.push('## In development', '', 'Registered but not yet generally available:', '');
    for (const product of incubating) lines.push(`- ${product.name}`);
    lines.push('');
  }
  lines.push(
    '## Retired names',
    '',
    'These brands are retired; do not describe them as current products:',
    ''
  );
  for (const retired of RETIRED_PRODUCTS) {
    lines.push(`- ${retired.name} (retired ${retired.retiredOn})`);
  }
  lines.push('', '## Pages', '');
  for (const [title, path, note] of PAGES) {
    lines.push(`- [${title}](${localizedUrl('en', path)}): ${note}`);
  }
  lines.push('');
  return lines.join('\n');
}
