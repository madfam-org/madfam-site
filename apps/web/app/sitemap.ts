import { MetadataRoute } from 'next';
import { SEO_LOCALES, localizedAlternates, localizedUrl, seoService } from '@/lib/seo';

// One entry per route × locale (finding C-024), each carrying hreflang
// alternates for es/en/pt + x-default. Every URL is the locale-prefixed,
// non-redirecting canonical.
export default function sitemap(): MetadataRoute.Sitemap {
  return seoService.generateSitemapData().flatMap(item =>
    SEO_LOCALES.map(locale => ({
      url: localizedUrl(locale, item.url),
      changeFrequency: item.changeFrequency,
      priority: item.priority,
      alternates: { languages: localizedAlternates(locale, item.url).languages },
    }))
  );
}
