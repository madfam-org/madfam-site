import { Metadata } from 'next';
import { SITE_URL, localizedAlternates, localizedUrl } from './seo-urls';
import { getPlatformsWithDetailPages, isComingSoon } from '@/lib/data/platforms';

export * from './seo-urls';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'service';
  locale?: 'es' | 'en' | 'pt';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  noIndex?: boolean;
  noFollow?: boolean;
}

export class SEOService {
  private baseUrl: string;
  private defaultImage: string;
  private defaultLocale: string;
  private siteName: string;
  private twitterHandle: string;

  constructor() {
    this.baseUrl = SITE_URL;
    this.defaultImage = `${this.baseUrl}/images/og-default.jpg`;
    this.defaultLocale = 'es';
    this.siteName = 'MADFAM';
    this.twitterHandle = '@madfam_io';
  }

  generateMetadata(config: SEOConfig): Metadata {
    const {
      title,
      description,
      keywords = [],
      image = this.defaultImage,
      url = this.baseUrl,
      type = 'website',
      locale = this.defaultLocale,
      publishedTime,
      modifiedTime,
      author,
      section,
      tags = [],
      noIndex = false,
      noFollow = false,
    } = config;

    const fullTitle = title.includes('MADFAM') ? title : `${title} | MADFAM`;
    const fullUrl = url.startsWith('http') ? url : localizedUrl(locale, url);
    const fullImage = image.startsWith('http') ? image : `${this.baseUrl}${image}`;

    const metadata: Metadata = {
      title: fullTitle,
      description,
      keywords: keywords.join(', '),
      authors: author ? [{ name: author }] : undefined,
      robots: {
        index: !noIndex,
        follow: !noFollow,
        googleBot: {
          index: !noIndex,
          follow: !noFollow,
        },
      },
      alternates: url.startsWith('http')
        ? { canonical: fullUrl }
        : localizedAlternates(locale, url),
      openGraph: {
        type: type as 'website' | 'article',
        title: fullTitle,
        description,
        url: fullUrl,
        images: [
          {
            url: fullImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        siteName: this.siteName,
        locale,
        publishedTime,
        modifiedTime,
        section,
        tags,
      },
      twitter: {
        card: 'summary_large_image',
        site: this.twitterHandle,
        creator: this.twitterHandle,
        title: fullTitle,
        description,
        images: [fullImage],
      },
    };

    return metadata;
  }

  generateServiceMetadata(
    serviceName: string,
    serviceDescription: string,
    serviceCategory: string,
    locale: 'es' | 'en' | 'pt' = 'es'
  ): Metadata {
    const content = {
      es: {
        title: `${serviceName} | Servicios ${serviceCategory} | MADFAM`,
        description: serviceDescription,
        keywords: [
          'transformación digital',
          'automatización',
          'inteligencia artificial',
          'consultoría tecnológica',
          'desarrollo de software',
          'México',
          'LATAM',
        ],
      },
      en: {
        title: `${serviceName} | ${serviceCategory} Services | MADFAM`,
        description: serviceDescription,
        keywords: [
          'digital transformation',
          'automation',
          'artificial intelligence',
          'technology consulting',
          'software development',
          'Mexico',
          'LATAM',
        ],
      },
      pt: {
        title: `${serviceName} | Serviços ${serviceCategory} | MADFAM`,
        description: serviceDescription,
        keywords: [
          'transformação digital',
          'automação',
          'inteligência artificial',
          'consultoria tecnológica',
          'desenvolvimento de software',
          'México',
          'Brasil',
          'LATAM',
        ],
      },
    };

    const t = content[locale];

    return this.generateMetadata({
      title: t.title,
      description: t.description,
      keywords: t.keywords,
      type: 'website',
      locale,
      url: `/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  generateProductMetadata(
    productName: string,
    productDescription: string,
    locale: 'es' | 'en' | 'pt' = 'es'
  ): Metadata {
    const content = {
      es: {
        title: `${productName} | Productos MADFAM`,
        description: productDescription,
        keywords: [
          'software empresarial',
          'plataformas digitales',
          'automatización de procesos',
          'inteligencia artificial',
          'transformación digital',
          'Selva',
          'Dhanam',
          'Enclii',
          'Janua',
          'Forgesight',
          'Yantra4D',
          'Cotiza',
        ],
      },
      en: {
        title: `${productName} | MADFAM Products`,
        description: productDescription,
        keywords: [
          'enterprise software',
          'digital platforms',
          'process automation',
          'artificial intelligence',
          'digital transformation',
          'Selva',
          'Dhanam',
          'Enclii',
          'Janua',
          'Forgesight',
          'Yantra4D',
          'Cotiza',
        ],
      },
      pt: {
        title: `${productName} | Produtos MADFAM`,
        description: productDescription,
        keywords: [
          'software empresarial',
          'plataformas digitais',
          'automação de processos',
          'inteligência artificial',
          'transformação digital',
          'Selva',
          'Dhanam',
          'Enclii',
          'Janua',
          'Forgesight',
          'Yantra4D',
          'Cotiza',
        ],
      },
    };

    const t = content[locale];

    return this.generateMetadata({
      title: t.title,
      description: t.description,
      keywords: t.keywords,
      type: 'website',
      locale,
      url: `/products/${productName.toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  generateBlogMetadata(
    title: string,
    description: string,
    author: string,
    publishedTime: string,
    tags: string[],
    locale: 'es' | 'en' | 'pt' = 'es'
  ): Metadata {
    return this.generateMetadata({
      title,
      description,
      type: 'article',
      locale,
      author,
      publishedTime,
      tags,
      keywords: tags,
      url: `/blog/${title.toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  generateHomeMetadata(locale: string = 'es'): Metadata {
    // Ensure locale is valid, fallback to 'es' if not
    const validLocale = ['es', 'en', 'pt'].includes(locale) ? locale : 'es';

    const content = {
      es: {
        title: 'MADFAM | Plataformas Abiertas para Creadores, Makers y Emprendedores',
        description:
          'Ecosistema de plataformas digitales y fabricación física para creadores, makers y emprendedores en LATAM. Una membresía, acceso coordinado.',
        keywords: [
          'ecosistema digital LATAM',
          'plataformas abiertas',
          'fabricación digital México',
          'impresión 3D',
          'CNC',
          'corte láser',
          'diseño paramétrico',
          'open source',
          'solarpunk',
          'makers LATAM',
        ],
      },
      en: {
        title: 'MADFAM | Open Platforms for Creators, Makers, and Entrepreneurs',
        description:
          'Ecosystem of digital platforms and physical fabrication for creators, makers, and entrepreneurs building the future of LATAM. One membership, coordinated access.',
        keywords: [
          'digital ecosystem LATAM',
          'open platforms',
          'digital fabrication Mexico',
          '3D printing',
          'CNC machining',
          'laser cutting',
          'parametric design',
          'open source',
          'solarpunk',
          'makers LATAM',
        ],
      },
      pt: {
        title: 'MADFAM | Plataformas Abertas para Criadores, Makers e Empreendedores',
        description:
          'Ecossistema de plataformas digitais e fabricação física para criadores, makers e empreendedores construindo o futuro da LATAM. Uma assinatura, acesso coordenado.',
        keywords: [
          'ecossistema digital LATAM',
          'plataformas abertas',
          'fabricação digital México',
          'impressão 3D',
          'CNC',
          'corte a laser',
          'design paramétrico',
          'open source',
          'solarpunk',
          'Selva',
          'Dhanam',
          'design 3D',
          'consultoria estratégica',
        ],
      },
    };

    const t = content[validLocale as 'es' | 'en' | 'pt'];

    return this.generateMetadata({
      title: t.title,
      description: t.description,
      keywords: t.keywords,
      type: 'website',
      locale: validLocale as 'es' | 'en' | 'pt',
      url: '/',
    });
  }

  generateStructuredData(type: string, data: Record<string, unknown>): object {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
    };

    switch (type) {
      case 'Organization':
        // Entity facts per ruling R37/R47: legal name and Cuernavaca, Morelos
        // domicile; no public phone line.
        return {
          ...baseData,
          name: 'MADFAM',
          legalName: 'Innovaciones MADFAM S.A.S. de C.V.',
          description:
            'Estudio mexicano con sede en Cuernavaca, Morelos, que construye y opera un ecosistema de plataformas abiertas e interconectadas para creadores, makers y negocios de América Latina.',
          url: this.baseUrl,
          logo: `${this.baseUrl}/assets/brand/madfam-logo.svg`,
          sameAs: [
            'https://x.com/madfam_io',
            'https://linkedin.com/company/madfam',
            'https://instagram.com/madfam.io',
            'https://www.facebook.com/people/Madfam/61578707019539/',
            'https://tiktok.com/@madfam.io',
            'https://github.com/madfam-org',
            'https://www.youtube.com/@innovacionesmadfam',
          ],
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'MX',
            addressRegion: 'Morelos',
            addressLocality: 'Cuernavaca',
          },
        };

      case 'Service':
        return {
          ...baseData,
          name: data.name,
          description: data.description,
          provider: {
            '@type': 'Organization',
            name: 'MADFAM',
          },
          serviceType: data.serviceType,
          areaServed: {
            '@type': 'Country',
            name: 'Mexico',
          },
          availableChannel: {
            '@type': 'ServiceChannel',
            serviceUrl: `${this.baseUrl}/contact`,
          },
        };

      case 'Product':
        return {
          ...baseData,
          name: data.name,
          description: data.description,
          manufacturer: {
            '@type': 'Organization',
            name: 'MADFAM',
          },
          category: data.category,
          url: `${this.baseUrl}/products/${data.slug}`,
        };

      case 'Article':
        return {
          ...baseData,
          headline: data.title,
          description: data.description,
          author: {
            '@type': 'Person',
            name: data.author,
          },
          publisher: {
            '@type': 'Organization',
            name: 'MADFAM',
            logo: {
              '@type': 'ImageObject',
              url: `${this.baseUrl}/assets/brand/madfam-logo.svg`,
            },
          },
          datePublished: data.publishedTime,
          dateModified: data.modifiedTime,
          image: data.image,
          url: `${this.baseUrl}/blog/${data.slug}`,
        };

      default:
        return baseData;
    }
  }

  /**
   * Locale-less routes for the sitemap (finding C-024). `app/sitemap.ts`
   * expands each into one entry per locale with hreflang alternates. No
   * `#fragment` URLs, no redirecting unprefixed URLs, and no page whose
   * canonical lives elsewhere (`/nauta` canonicalizes to nauta.quest, R30).
   * No `lastModified`: the site has no per-page modification date, and a
   * build timestamp on every URL is a false signal.
   */
  generateSitemapData(): Array<{
    url: string;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
  }> {
    const route = (
      url: string,
      priority: number,
      changeFrequency: 'weekly' | 'monthly' | 'yearly' = 'monthly'
    ) => ({ url, priority, changeFrequency });

    const staticEntries = [
      route('/', 1.0, 'weekly'),
      route('/platforms', 0.9, 'weekly'),
      route('/ecosystem', 0.9, 'weekly'),
      route('/value-ladder', 0.9, 'weekly'),
      route('/products', 0.8, 'weekly'),
      route('/solutions', 0.8),
      route('/solutions/maker-node', 0.8),
      route('/solutions/colabs', 0.7),
      route('/programs', 0.8),
      route('/impact', 0.7),
      route('/about', 0.7),
      route('/contact', 0.8),
      route('/blog', 0.6, 'weekly'),
      route('/careers', 0.5),
      route('/case-studies', 0.5),
      route('/guides', 0.5),
      route('/calculator', 0.5),
      route('/estimator', 0.5),
      route('/assessment', 0.5),
      route('/privacy', 0.3, 'yearly'),
      route('/terms', 0.3, 'yearly'),
      route('/cookies', 0.3, 'yearly'),
    ];

    // Every catalog platform with an in-site detail page. Platforms whose
    // canonical landing is their own domain are not madfam.io URLs.
    const platformEntries = getPlatformsWithDetailPages()
      .filter(p => !isComingSoon(p))
      .map(p => route(`/platforms/${p.slug}`, 0.8));

    return [...staticEntries, ...platformEntries];
  }
}

export const seoService = new SEOService();
