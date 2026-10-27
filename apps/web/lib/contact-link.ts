import { getLocalizedUrl, type Locale } from '@madfam-site/i18n';
import { PLATFORMS } from '@/lib/data/platforms';

/**
 * A link to the contact page that carries what the visitor was looking at, so
 * the lead form preselects the intent and the lead records the product.
 * `intent` must be one of the LeadForm intents; `product` a catalog slug.
 */
export function contactHref(
  locale: Locale,
  context: { intent?: string; product?: string } = {}
): string {
  const params = new URLSearchParams();
  if (context.intent) params.set('intent', context.intent);
  if (context.product) params.set('product', context.product);
  const query = params.toString();
  return `${getLocalizedUrl('contact', locale)}${query ? `?${query}` : ''}`;
}

/** The `product` query value, only when it names a catalog platform. */
export function catalogProductSlug(value: string | undefined): string | undefined {
  return value && PLATFORMS.some(p => p.slug === value) ? value : undefined;
}
