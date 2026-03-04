import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading } from '@/components/ui';
import { getPublishedBlogPosts, type BlogPost } from '@/lib/cms';
import { environment } from '@/lib/environment';

// Common blog post interface for consistency
type CommonBlogPost = {
  id: string;
  title: string;
  excerpt: string;
  publishedDate: string;
  author: { name: string; id?: string; email?: string } | string;
  slug: string;
  tags?: { tag: string }[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  content?: string | Record<string, unknown> | import('@/types/content').RichTextDocument;
};

// Fallback blog data for static exports or when CMS is unavailable
const fallbackBlogPosts: CommonBlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI in Business Transformation',
    excerpt:
      'Explore how artificial intelligence is reshaping the business landscape and creating new opportunities for growth and innovation.',
    publishedDate: '2024-03-15',
    author: { name: 'MADFAM Team', id: '1', email: 'team@madfam.io' },
    slug: 'future-ai-business-transformation',
    tags: [{ tag: 'AI & Innovation' }],
    status: 'published' as const,
    createdAt: '2024-03-15',
    updatedAt: '2024-03-15',
    content: 'Artificial Intelligence is transforming businesses...',
  },
  {
    id: '2',
    title: 'Building Scalable Digital Platforms: A Technical Guide',
    excerpt:
      'Learn the key architectural principles and best practices for building platforms that can grow with your business.',
    publishedDate: '2024-03-10',
    author: { name: 'MADFAM Engineering', id: '2', email: 'engineering@madfam.io' },
    slug: 'building-scalable-digital-platforms',
    tags: [{ tag: 'Technical' }],
    status: 'published' as const,
    createdAt: '2024-03-10',
    updatedAt: '2024-03-10',
    content: 'Building scalable platforms requires careful planning...',
  },
  {
    id: '3',
    title: 'Customer Success Story: Transforming Operations with Automation',
    excerpt:
      'How we helped a leading manufacturer reduce operational costs by 40% through intelligent automation solutions.',
    publishedDate: '2024-03-05',
    author: { name: 'MADFAM Team', id: '1', email: 'team@madfam.io' },
    slug: 'customer-success-automation',
    tags: [{ tag: 'Case Studies' }],
    status: 'published' as const,
    createdAt: '2024-03-05',
    updatedAt: '2024-03-05',
    content: 'When a leading manufacturing company approached us...',
  },
];

function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('blog');

  // Fetch blog posts from CMS or use fallback data
  let blogPosts: CommonBlogPost[] = fallbackBlogPosts;

  if (environment.cms.enabled) {
    try {
      const cmsData = await getPublishedBlogPosts(locale, 10);
      if (cmsData.docs.length > 0) {
        // Transform CMS data to common interface
        blogPosts = cmsData.docs.map(
          (post: BlogPost): CommonBlogPost => ({
            id: post.id,
            title: post.title,
            excerpt: post.excerpt,
            publishedDate: post.publishedDate,
            author: post.author,
            slug: post.slug,
            tags: post.tags,
            status: post.status,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            content: post.content,
          })
        );
      }
    } catch (error) {
      console.warn('Failed to fetch blog posts from CMS, using fallback data:', error);
    }
  }

  return (
    <main className="min-h-screen py-20">
      <Container>
        <div className="max-w-4xl mx-auto">
          <Heading level={1} className="mb-4">
            {t('title')}
          </Heading>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">{t('subtitle')}</p>

          {blogPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('noPosts') || 'No blog posts available at the moment.'}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {blogPosts.map(post => {
                const category = post.tags?.[0]?.tag || 'General';
                const readTime = post.content
                  ? calculateReadTime(JSON.stringify(post.content))
                  : '5 min read';
                const authorName = typeof post.author === 'object' ? post.author.name : post.author;

                return (
                  <article
                    key={post.id}
                    className="border-b border-gray-200 dark:border-gray-800 pb-12 last:border-0"
                  >
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <span className="px-3 py-1 bg-lavender/10 text-lavender rounded-full">
                        {category}
                      </span>
                      <time dateTime={post.publishedDate}>
                        {new Date(post.publishedDate).toLocaleDateString()}
                      </time>
                      <span>{readTime.replace('min read', t('minRead'))}</span>
                    </div>

                    <h2 className="text-2xl font-bold mb-3 hover:text-lavender transition-colors">
                      <Link href={`/${locale}/blog/${post.slug}`}>{post.title}</Link>
                    </h2>

                    <p className="text-gray-600 dark:text-gray-400 mb-4">{post.excerpt}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {t('by')} {authorName}
                      </span>
                      <Link
                        href={`/${locale}/blog/${post.slug}`}
                        className="text-lavender hover:text-lavender/80 font-medium transition-colors"
                      >
                        {t('readMore')} →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
