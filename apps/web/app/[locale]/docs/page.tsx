import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading, Card } from '@/components/ui';

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations('docs');

  const documentationSections = [
    {
      title: t('categories.gettingStarted.title'),
      description: t('categories.gettingStarted.description'),
      items: [
        { title: 'Introduction to MADFAM', href: '/docs/intro' },
        { title: 'Service Overview', href: '/docs/services' },
        { title: 'Platform Architecture', href: '/docs/architecture' },
        { title: 'Security & Compliance', href: '/docs/security' },
      ],
    },
    {
      title: t('categories.api.title'),
      description: t('categories.api.description'),
      items: [
        { title: 'API Reference', href: '/api' },
        { title: 'Authentication', href: '/docs/auth' },
        { title: 'Rate Limiting', href: '/docs/rate-limits' },
        { title: 'Webhooks', href: '/docs/webhooks' },
      ],
    },
    {
      title: t('categories.guides.title'),
      description: t('categories.guides.description'),
      items: [
        { title: 'Integration Guides', href: '/guides' },
        { title: 'Best Practices', href: '/docs/best-practices' },
        { title: 'Migration Guide', href: '/docs/migration' },
        { title: 'Troubleshooting', href: '/docs/troubleshooting' },
      ],
    },
    {
      title: t('categories.resources.title'),
      description: t('categories.resources.description'),
      items: [
        { title: 'Case Studies', href: '/case-studies' },
        { title: 'Blog & Updates', href: '/blog' },
        { title: 'Support Center', href: '/docs/support' },
        { title: 'Community Forum', href: '/docs/community' },
      ],
    },
  ];

  return (
    <main className="min-h-screen py-20">
      <Container>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Heading level={1} className="mb-4">
              {t('title')}
            </Heading>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t('subtitle')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <input
                type="search"
                placeholder={t('searchPlaceholder')}
                className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-lavender"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Documentation Sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {documentationSections.map((section, index) => (
              <Card key={index} className="p-6">
                <Heading level={3} className="mb-2">
                  {section.title}
                </Heading>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        href={item.href}
                        className="text-lavender hover:text-lavender/80 transition-colors flex items-center"
                      >
                        <span className="mr-2">→</span>
                        {item.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          {/* Popular Topics */}
          <div className="mt-16">
            <Heading level={2} className="mb-8 text-center">
              {t('popularTopics')}
            </Heading>
            <div className="flex flex-wrap gap-3 justify-center">
              {[
                'Authentication',
                'API Keys',
                'Webhooks',
                'Rate Limits',
                'Error Handling',
                'Data Security',
                'Integration',
                'Migration',
              ].map(topic => (
                <Link
                  key={topic}
                  href={`/docs/${topic.toLowerCase().replace(' ', '-')}`}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-lavender/10 transition-colors"
                >
                  {topic}
                </Link>
              ))}
            </div>
          </div>

          {/* Help Section */}
          <Card className="mt-16 p-8 text-center bg-gradient-to-br from-lavender/10 to-sun/10">
            <Heading level={3} className="mb-4">
              {t('needHelp.title')}
            </Heading>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('needHelp.subtitle')}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="px-6 py-3 bg-lavender text-white rounded-lg hover:bg-lavender/90 transition-colors"
              >
                {t('needHelp.contactSupport')}
              </Link>
              <Link
                href="/docs/faq"
                className="px-6 py-3 border border-lavender text-lavender rounded-lg hover:bg-lavender/10 transition-colors"
              >
                {t('needHelp.viewFaq')}
              </Link>
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
