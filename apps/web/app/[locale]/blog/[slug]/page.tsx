import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Container, Heading } from '@/components/ui';
import { cmsClient, getPublishedBlogPosts, type BlogPost } from '@/lib/cms';
import { environment } from '@/lib/environment';
import type { RichTextDocument, RichTextNode } from '@/types/content';

// Enable ISR with 1 hour revalidation
export const revalidate = 3600; // 1 hour

// Configure static generation behavior
export const dynamicParams = true; // Allow dynamic params not generated at build time
export const dynamic = 'force-static'; // Force static generation where possible

interface BlogPostPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

interface GenerateStaticParamsProps {
  locale: string;
  slug: string;
}

// Enhanced fallback post data with better content structure
const getFallbackPosts = (): BlogPost[] => [
  {
    id: '1',
    title: 'The Future of AI in Business Transformation',
    excerpt:
      'Explore how artificial intelligence is reshaping the business landscape and creating new opportunities for growth and innovation.',
    publishedDate: '2024-03-15T10:00:00.000Z',
    author: { id: '1', name: 'MADFAM Team', email: 'team@madfam.io' },
    slug: 'future-ai-business-transformation',
    status: 'published',
    tags: [{ tag: 'AI & Innovation' }],
    createdAt: '2024-03-15T10:00:00.000Z',
    updatedAt: '2024-03-15T10:00:00.000Z',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Artificial Intelligence is no longer a futuristic concept—it's here, and it's transforming businesses across every industry. From automating routine tasks to providing deep insights through data analysis, AI is becoming an essential tool for companies looking to stay competitive in today's fast-paced market.",
            },
          ],
        },
      ],
    },
  },
  {
    id: '2',
    title: 'Building Scalable Digital Platforms: A Technical Guide',
    excerpt:
      'Learn the key architectural principles and best practices for building platforms that can grow with your business.',
    publishedDate: '2024-03-10T10:00:00.000Z',
    author: { id: '2', name: 'MADFAM Engineering', email: 'engineering@madfam.io' },
    slug: 'building-scalable-digital-platforms',
    status: 'published',
    tags: [{ tag: 'Technical' }],
    createdAt: '2024-03-10T10:00:00.000Z',
    updatedAt: '2024-03-10T10:00:00.000Z',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: "Building scalable digital platforms requires careful planning, robust architecture, and a deep understanding of both current needs and future growth. In this comprehensive guide, we'll explore the key principles and best practices that have helped us build platforms that serve millions of users.",
            },
          ],
        },
      ],
    },
  },
  {
    id: '3',
    title: 'Customer Success Story: Transforming Operations with Automation',
    excerpt:
      'How we helped a leading manufacturer reduce operational costs by 40% through intelligent automation solutions.',
    publishedDate: '2024-03-05T10:00:00.000Z',
    author: { id: '3', name: 'MADFAM Team', email: 'team@madfam.io' },
    slug: 'customer-success-automation',
    status: 'published',
    tags: [{ tag: 'Case Studies' }],
    createdAt: '2024-03-05T10:00:00.000Z',
    updatedAt: '2024-03-05T10:00:00.000Z',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'When a leading manufacturing company approached us with challenges around operational efficiency and rising costs, we knew that intelligent automation could be the solution. Through a comprehensive 6-month transformation project, we helped them achieve remarkable results.',
            },
          ],
        },
      ],
    },
  },
];

const getFallbackPost = (slug: string): BlogPost | null => {
  const fallbackPosts = getFallbackPosts();
  return fallbackPosts.find(post => post.slug === slug) || null;
};

// Generate static parameters for all blog posts
export async function generateStaticParams(): Promise<GenerateStaticParamsProps[]> {
  try {
    // Always include fallback posts
    const fallbackPosts = getFallbackPosts();
    const fallbackSlugs = fallbackPosts.map(post => ({
      locale: 'en' as const,
      slug: post.slug,
    }));

    if (!environment.cms.enabled) {
      // In static export mode, only use fallback data
      return [
        ...fallbackSlugs,
        // Generate for all locales
        ...fallbackPosts.flatMap(post => [
          { locale: 'es', slug: post.slug },
          { locale: 'pt', slug: post.slug },
        ]),
      ];
    }

    // In CMS-enabled environments, fetch all published posts
    const cmsResults = await Promise.allSettled([
      getPublishedBlogPosts('en', 100, fallbackPosts),
      getPublishedBlogPosts('es', 100, fallbackPosts),
      getPublishedBlogPosts('pt', 100, fallbackPosts),
    ]);

    const allParams = new Set<string>();

    // Add fallback posts first
    fallbackPosts.forEach(post => {
      ['en', 'es', 'pt'].forEach(locale => {
        allParams.add(`${locale}:${post.slug}`);
      });
    });

    // Add CMS posts
    cmsResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.source === 'cms') {
        const locale = ['en', 'es', 'pt'][index];
        result.value.docs.forEach(post => {
          allParams.add(`${locale}:${post.slug}`);
        });
      }
    });

    // Convert back to array format
    return Array.from(allParams).map(param => {
      const [locale, slug] = param.split(':');
      return { locale: locale ?? 'en', slug: slug ?? '' };
    });
  } catch (error) {
    console.error('Error generating static params for blog posts:', error);
    // Fallback to static posts only
    const fallbackPosts = getFallbackPosts();
    return [
      ...fallbackPosts.map(post => ({ locale: 'en' as const, slug: post.slug })),
      ...fallbackPosts.flatMap(post => [
        { locale: 'es', slug: post.slug },
        { locale: 'pt', slug: post.slug },
      ]),
    ];
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  let post: BlogPost | null = null;

  // Try to fetch from CMS first
  if (environment.cms.enabled) {
    try {
      post = await cmsClient.getBlogPost(slug, locale);
    } catch (error) {
      console.warn('Failed to fetch blog post for metadata:', error);
    }
  }

  // Fallback to static post
  if (!post) {
    post = getFallbackPost(slug);
  }

  if (!post) {
    return {
      title: 'Blog Post Not Found',
      description: 'The requested blog post could not be found.',
    };
  }

  const authorName = typeof post.author === 'string' ? post.author : post.author.name;

  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: authorName }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedDate,
      modifiedTime: post.updatedAt,
      authors: [authorName],
      tags: post.tags?.map(tag => tag.tag) || [],
      ...(post.featuredImage && {
        images: [
          {
            url: post.featuredImage.url,
            alt: post.featuredImage.alt || post.title,
            width: post.featuredImage.width,
            height: post.featuredImage.height,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(post.featuredImage && {
        images: [post.featuredImage.url],
      }),
    },
  };
}

// Simple rich text renderer for the content
function renderRichText(content: RichTextDocument | undefined): string {
  if (!content || !content.content) return '';

  return content.content
    .map((block: RichTextNode) => {
      if (block.type === 'paragraph' && block.content) {
        return block.content.map((item: RichTextNode) => item.text || '').join('');
      }
      return '';
    })
    .join('\n\n');
}

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { locale, slug } = await params;
  const t = await getTranslations('blog');

  // Fetch blog post with enhanced fallback handling
  let post: BlogPost | null = null;
  let dataSource: 'cms' | 'fallback' = 'fallback';

  if (environment.cms.enabled) {
    try {
      post = await cmsClient.getBlogPost(slug, locale);
      if (post) {
        dataSource = 'cms';
      }
    } catch (error) {
      console.warn('Failed to fetch blog post from CMS, trying fallback:', error);
    }
  }

  // If CMS fetch failed or CMS is disabled, try fallback
  if (!post) {
    post = getFallbackPost(slug);
  }

  // If no post found at all, return 404
  if (!post) {
    console.error(`Blog post not found: ${slug} (locale: ${locale})`);
    notFound();
  }

  const content = renderRichText(post.content);
  const readTime = calculateReadTime(content);
  const category = post.tags?.[0]?.tag || 'General';
  const authorName = typeof post.author === 'object' ? post.author.name : post.author;

  // Add structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    author: {
      '@type': 'Organization',
      name: authorName,
    },
    publisher: {
      '@type': 'Organization',
      name: 'MADFAM',
      logo: {
        '@type': 'ImageObject',
        url: 'https://madfam.io/logo.png',
      },
    },
    datePublished: post.publishedDate,
    dateModified: post.updatedAt,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://madfam.io/${locale}/blog/${slug}`,
    },
    ...(post.featuredImage && {
      image: {
        '@type': 'ImageObject',
        url: post.featuredImage.url,
        width: post.featuredImage.width,
        height: post.featuredImage.height,
      },
    }),
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="min-h-screen py-20">
        <Container>
          <article className="max-w-4xl mx-auto">
            {/* Development indicator */}
            {environment.isDevelopment && (
              <div className="mb-4 p-2 bg-yellow-100 text-yellow-800 text-sm rounded">
                Data source: {dataSource}
              </div>
            )}

            {/* Header */}
            <header className="mb-12">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
                <span className="px-3 py-1 bg-lavender/10 text-lavender rounded-full">
                  {category}
                </span>
                <time dateTime={post.publishedDate}>
                  {new Date(post.publishedDate).toLocaleDateString(locale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <span>{readTime}</span>
              </div>

              <Heading level={1} className="mb-6">
                {post.title}
              </Heading>

              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">{post.excerpt}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                <span>
                  {t('by')} {authorName}
                </span>
              </div>
            </header>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-12">
                <Image
                  src={post.featuredImage.url}
                  alt={post.featuredImage.alt || post.title}
                  width={post.featuredImage.width || 800}
                  height={post.featuredImage.height || 400}
                  className="w-full h-auto rounded-lg"
                  priority
                />
              </div>
            )}

            {/* Content */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              {content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-6 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tagObj: { tag: string }, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      {tagObj.tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
              <a
                href={`/${locale}/blog`}
                className="text-lavender hover:text-lavender/80 font-medium transition-colors inline-flex items-center gap-2"
              >
                <span>←</span> {t('backToBlog') || 'Back to Blog'}
              </a>
            </div>
          </article>
        </Container>
      </main>
    </>
  );
}
