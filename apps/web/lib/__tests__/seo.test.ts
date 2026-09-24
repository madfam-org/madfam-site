import { describe, it, expect, beforeEach } from 'vitest';
import { SEOService } from '../seo';

describe('SEO Service', () => {
  let seoService: SEOService;

  beforeEach(() => {
    seoService = new SEOService();
  });

  describe('generateMetadata', () => {
    it('should generate basic metadata correctly', () => {
      const metadata = seoService.generateMetadata({
        title: 'Test Page',
        description: 'Test description',
      });

      expect(metadata.title).toBe('Test Page | MADFAM');
      expect(metadata.description).toBe('Test description');
      expect(metadata.openGraph?.title).toBe('Test Page | MADFAM');
      expect(metadata.openGraph?.description).toBe('Test description');
    });

    it('should not duplicate MADFAM in title if already present', () => {
      const metadata = seoService.generateMetadata({
        title: 'Services | MADFAM',
        description: 'Our services',
      });

      expect(metadata.title).toBe('Services | MADFAM');
    });

    it('should handle keywords properly', () => {
      const metadata = seoService.generateMetadata({
        title: 'Test',
        description: 'Test',
        keywords: ['AI', 'automation', 'consulting'],
      });

      expect(metadata.keywords).toBe('AI, automation, consulting');
    });

    it('should set robots meta correctly', () => {
      const indexable = seoService.generateMetadata({
        title: 'Test',
        description: 'Test',
      });

      const noIndex = seoService.generateMetadata({
        title: 'Test',
        description: 'Test',
        noIndex: true,
        noFollow: true,
      });

      expect(indexable.robots?.index).toBe(true);
      expect(indexable.robots?.follow).toBe(true);
      expect(noIndex.robots?.index).toBe(false);
      expect(noIndex.robots?.follow).toBe(false);
    });
  });

  describe('generateServiceMetadata', () => {
    it('should generate Spanish service metadata', () => {
      const metadata = seoService.generateServiceMetadata(
        'Consultoría Digital',
        'Transformación digital completa',
        'Strategy & Enablement',
        'es'
      );

      expect(metadata.title).toBe('Consultoría Digital | Servicios Strategy & Enablement | MADFAM');
      expect(metadata.description).toBe('Transformación digital completa');
      expect(metadata.openGraph?.locale).toBe('es');
    });

    it('should generate English service metadata', () => {
      const metadata = seoService.generateServiceMetadata(
        'Digital Consulting',
        'Complete digital transformation',
        'Strategy & Enablement',
        'en'
      );

      expect(metadata.title).toBe('Digital Consulting | Strategy & Enablement Services | MADFAM');
      expect(metadata.description).toBe('Complete digital transformation');
      expect(metadata.openGraph?.locale).toBe('en');
    });
  });

  describe('generateStructuredData', () => {
    it('should generate Organization structured data', () => {
      const data = seoService.generateStructuredData('Organization', {});

      expect(data['@context']).toBe('https://schema.org');
      expect(data['@type']).toBe('Organization');
      expect(data).toHaveProperty('name', 'MADFAM');
      expect(data).toHaveProperty('legalName', 'Innovaciones MADFAM S.A.S. de C.V.');
      // R47: no public phone line on the entity.
      expect(data).not.toHaveProperty('contactPoint');
      expect(data).toHaveProperty('address.addressLocality', 'Cuernavaca');
      expect(data).toHaveProperty('address.addressRegion', 'Morelos');
    });

    it('should generate Service structured data', () => {
      const data = seoService.generateStructuredData('Service', {
        name: 'AI Consulting',
        description: 'AI transformation services',
        serviceType: 'Consulting',
      });

      expect(data['@type']).toBe('Service');
      expect(data).toHaveProperty('name', 'AI Consulting');
      expect(data).toHaveProperty('provider');
      expect(data).toHaveProperty('serviceType', 'Consulting');
    });

    it('should generate Article structured data', () => {
      const data = seoService.generateStructuredData('Article', {
        title: 'AI in 2024',
        description: 'Trends and predictions',
        author: 'MADFAM Team',
        publishedTime: '2024-01-01',
        slug: 'ai-in-2024',
      });

      expect(data['@type']).toBe('Article');
      expect(data).toHaveProperty('headline', 'AI in 2024');
      expect(data).toHaveProperty('author');
      expect(data).toHaveProperty('publisher');
      expect(data).toHaveProperty('datePublished', '2024-01-01');
    });
  });

  describe('generateSitemapData', () => {
    it('lists locale-less routes with no fragments and no off-site canonicals', () => {
      const sitemap = seoService.generateSitemapData();
      const urls = sitemap.map(entry => entry.url);

      expect(urls[0]).toBe('/');
      expect(sitemap[0].priority).toBe(1.0);
      // C-024: fragments are not sitemap URLs; /value-ladder was missing;
      // /nauta canonicalizes to nauta.quest (R30) so it is not listed.
      expect(urls.some(url => url.includes('#'))).toBe(false);
      expect(urls).toContain('/value-ladder');
      expect(urls).not.toContain('/nauta');
      expect(new Set(urls).size).toBe(urls.length);

      // Avala keeps an in-site detail page, so it is part of the sitemap.
      expect(urls).toContain('/platforms/avala');
      const platformsIndex = sitemap.find(entry => entry.url === '/platforms');
      expect(platformsIndex?.priority).toBe(0.9);
    });

    it('sets change frequencies and no build-time lastModified', () => {
      const sitemap = seoService.generateSitemapData();
      expect(sitemap.find(entry => entry.url === '/')?.changeFrequency).toBe('weekly');
      expect(sitemap.find(entry => entry.url === '/privacy')?.changeFrequency).toBe('yearly');
      expect(sitemap.every(entry => !('lastModified' in entry))).toBe(true);
    });
  });
});
