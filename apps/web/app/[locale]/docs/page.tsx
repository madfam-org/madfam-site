import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading, Card } from '@/components/ui';

export default async function DocsPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations('docs');

  const documentationSections = [
    {
      id: 'getting-started',
      title: t('categories.gettingStarted.title'),
      description: t('categories.gettingStarted.description'),
      items: [
        { title: t('categories.gettingStarted.items.intro'), href: '#getting-started' },
        { title: t('categories.gettingStarted.items.services'), href: '/programs' },
        { title: t('categories.gettingStarted.items.architecture'), href: '#getting-started' },
        { title: t('categories.gettingStarted.items.security'), href: '#getting-started' },
      ],
    },
    {
      id: 'api',
      title: t('categories.api.title'),
      description: t('categories.api.description'),
      items: [
        { title: t('categories.api.items.reference'), href: '/api' },
        { title: t('categories.api.items.authentication'), href: '#api' },
        { title: t('categories.api.items.rateLimiting'), href: '#api' },
        { title: t('categories.api.items.webhooks'), href: '#api' },
      ],
    },
    {
      id: 'guides',
      title: t('categories.guides.title'),
      description: t('categories.guides.description'),
      items: [
        { title: t('categories.guides.items.integrationGuides'), href: '/guides' },
        { title: t('categories.guides.items.bestPractices'), href: '#guides' },
        { title: t('categories.guides.items.migration'), href: '#guides' },
        { title: t('categories.guides.items.troubleshooting'), href: '#guides' },
      ],
    },
    {
      id: 'resources',
      title: t('categories.resources.title'),
      description: t('categories.resources.description'),
      items: [
        { title: t('categories.resources.items.caseStudies'), href: '/case-studies' },
        { title: t('categories.resources.items.blog'), href: '/blog' },
        { title: t('categories.resources.items.support'), href: '/contact' },
        { title: t('categories.resources.items.community'), href: 'https://github.com/madfam-org' },
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
              <Card key={index} id={section.id} className="p-6">
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
              {(
                [
                  'authentication',
                  'apiKeys',
                  'webhooks',
                  'rateLimits',
                  'errorHandling',
                  'dataSecurity',
                  'integration',
                  'migration',
                ] as const
              ).map(key => (
                <span
                  key={key}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-lavender/10 transition-colors"
                >
                  {t(`popularTopicLabels.${key}`)}
                </span>
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
                href="/contact"
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
