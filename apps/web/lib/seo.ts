import { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'service';
  locale?: 'es' | 'en' | 'pt';
  alternateLocales?: string[];
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
    this.baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://madfam.io';
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
      alternateLocales = [],
      publishedTime,
      modifiedTime,
      author,
      section,
      tags = [],
      noIndex = false,
      noFollow = false,
    } = config;

    const fullTitle = title.includes('MADFAM') ? title : `${title} | MADFAM`;
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
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
      alternates: {
        canonical: fullUrl,
        languages: this.generateLanguageAlternates(url, alternateLocales),
      },
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
    serviceTier: string,
    locale: 'es' | 'en' | 'pt' = 'es'
  ): Metadata {
    const content = {
      es: {
        title: `${serviceName} | Servicios ${serviceTier} | MADFAM`,
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
        title: `${serviceName} | ${serviceTier} Services | MADFAM`,
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
        title: `${serviceName} | Serviços ${serviceTier} | MADFAM`,
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
          'Penny',
          'Dhanam',
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
          'Penny',
          'Dhanam',
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
          'Penny',
          'Dhanam',
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
        title: 'MADFAM | Transformación Digital e Inteligencia Artificial en México',
        description:
          'Especialistas en transformación digital, automatización inteligente y desarrollo de software empresarial. Desde diseño 3D hasta vCTO estratégico. Programas especializados en México y LATAM.',
        keywords: [
          'transformación digital México',
          'inteligencia artificial LATAM',
          'automatización empresarial',
          'consultoría tecnológica',
          'desarrollo software México',
          'vCTO',
          'Penny',
          'Dhanam',
          'diseño 3D',
          'consultoría estratégica',
        ],
      },
      en: {
        title: 'MADFAM | Digital Transformation & AI Solutions in Mexico',
        description:
          'Specialists in digital transformation, intelligent automation, and enterprise software development. From 3D design to strategic vCTO services. Specialized programs in Mexico and LATAM.',
        keywords: [
          'digital transformation Mexico',
          'artificial intelligence LATAM',
          'enterprise automation',
          'technology consulting',
          'software development Mexico',
          'vCTO',
          'Penny',
          'Dhanam',
          '3D design',
          'strategic consulting',
        ],
      },
      pt: {
        title: 'MADFAM | Transformação Digital e Soluções de IA no México',
        description:
          'Especialistas em transformação digital, automação inteligente e desenvolvimento de software empresarial. Do design 3D aos serviços estratégicos de vCTO. Programas especializados no México e LATAM.',
        keywords: [
          'transformação digital México',
          'inteligência artificial LATAM',
          'automação empresarial',
          'consultoria tecnológica',
          'desenvolvimento software México',
          'vCTO',
          'Penny',
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

  private generateLanguageAlternates(
    url: string,
    alternateLocales: string[]
  ): Record<string, string> {
    const alternates: Record<string, string> = {};

    alternateLocales.forEach(locale => {
      alternates[locale] = `${this.baseUrl}/${locale}${url}`;
    });

    return alternates;
  }

  generateStructuredData(type: string, data: Record<string, unknown>): object {
    const baseData = {
      '@context': 'https://schema.org',
      '@type': type,
    };

    switch (type) {
      case 'Organization':
        return {
          ...baseData,
          name: 'MADFAM',
          description: 'Transformación digital e inteligencia artificial en México y LATAM',
          url: this.baseUrl,
          logo: `${this.baseUrl}/logo.png`,
          contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+52-55-3410-6519',
            contactType: 'Customer Service',
            availableLanguage: ['Spanish', 'English'],
          },
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
            addressLocality: 'Mexico City',
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
              url: `${this.baseUrl}/logo.png`,
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

  generateSitemapData(): Array<{
    url: string;
    lastModified: Date;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
  }> {
    const now = new Date();

    return [
      {
        url: '/',
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 1.0,
      },
      {
        url: '/programs',
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: '/products',
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.9,
      },
      {
        url: '/about',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: '/contact',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: '/calculator',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: '/assessment',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: '/estimator',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.7,
      },
      {
        url: '/services/level-1',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: '/services/level-2',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: '/services/level-3',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: '/services/level-4',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
      {
        url: '/services/level-5',
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.8,
      },
    ];
  }
}

export const seoService = new SEOService();
