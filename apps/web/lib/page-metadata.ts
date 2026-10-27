import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { localizedAlternates } from '@/lib/seo';
import { DEFAULT_OG_IMAGE } from '@/lib/seo-urls';

/**
 * Title, description, canonical + hreflang for a simple route (finding C-023:
 * twelve routes shipped no <title>). Copy lives in the `seo.<key>` block of the
 * pages bundle (es/en/pt); `path` is the locale-less route path.
 */
export async function routeMetadata(
  locale: string,
  key: string,
  path: string,
  options: { noIndex?: boolean } = {}
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: `seo.${key}` });
  const title = t('title');
  const description = t('description');
  const alternates = localizedAlternates(locale, path);
  return {
    title,
    description,
    alternates,
    openGraph: {
      title,
      description,
      type: 'website',
      url: alternates.canonical,
      images: [DEFAULT_OG_IMAGE],
    },
    ...(options.noIndex ? { robots: { index: false, follow: true } } : {}),
  };
}
