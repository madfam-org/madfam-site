import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading, Card } from '@/components/ui';

const guides = [
  {
    category: 'Getting Started',
    icon: '🚀',
    guides: [
      {
        title: 'Quick Start Guide',
        description: 'Get up and running with MADFAM services in under 10 minutes',
        duration: '10 min',
        difficulty: 'Beginner',
      },
      {
        title: 'Platform Overview',
        description: "Understanding MADFAM's service architecture and capabilities",
        duration: '15 min',
        difficulty: 'Beginner',
      },
      {
        title: 'Authentication Setup',
        description: 'Configure authentication for your applications',
        duration: '20 min',
        difficulty: 'Intermediate',
      },
    ],
  },
  {
    category: 'Integration Guides',
    icon: '🔗',
    guides: [
      {
        title: 'REST API Integration',
        description: 'Complete guide to integrating with our REST APIs',
        duration: '30 min',
        difficulty: 'Intermediate',
      },
      {
        title: 'Webhook Configuration',
        description: 'Set up webhooks for real-time event notifications',
        duration: '25 min',
        difficulty: 'Intermediate',
      },
      {
        title: 'SDK Implementation',
        description: 'Using our SDKs for JavaScript, Python, and Java',
        duration: '45 min',
        difficulty: 'Advanced',
      },
    ],
  },
  {
    category: 'Best Practices',
    icon: '✨',
    guides: [
      {
        title: 'Security Best Practices',
        description: 'Ensure your integration follows security standards',
        duration: '30 min',
        difficulty: 'Advanced',
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize your API calls and reduce latency',
        duration: '40 min',
        difficulty: 'Advanced',
      },
      {
        title: 'Error Handling Strategies',
        description: 'Build resilient applications with proper error handling',
        duration: '35 min',
        difficulty: 'Intermediate',
      },
    ],
  },
  {
    category: 'Use Cases',
    icon: '💡',
    guides: [
      {
        title: 'Building an AI Chatbot',
        description: 'Step-by-step guide to create an intelligent chatbot',
        duration: '60 min',
        difficulty: 'Advanced',
      },
      {
        title: 'Process Automation',
        description: 'Automate business processes with our workflow engine',
        duration: '45 min',
        difficulty: 'Intermediate',
      },
      {
        title: 'Data Analytics Dashboard',
        description: 'Create real-time analytics dashboards',
        duration: '50 min',
        difficulty: 'Advanced',
      },
    ],
  },
];

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations('guides');

  const difficultyColors = {
    [t('difficulty.beginner')]:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    [t('difficulty.intermediate')]:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    [t('difficulty.advanced')]: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  };

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

          {/* Featured Guide */}
          <Card className="mb-12 p-8 bg-gradient-to-br from-lavender/10 to-sun/10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⭐</span>
              <span className="text-sm font-semibold text-lavender">{t('featured.badge')}</span>
            </div>
            <Heading level={3} className="mb-2">
              {t('featured.title')}
            </Heading>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{t('featured.description')}</p>
            <Link
              href="/guides/complete-integration"
              className="inline-flex items-center text-lavender hover:text-lavender/80 font-medium"
            >
              {t('featured.startTutorial')} →
            </Link>
          </Card>

          {/* Guide Categories */}
          <div className="space-y-12">
            {guides.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-3xl">{category.icon}</span>
                  <Heading level={2}>{category.category}</Heading>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {category.guides.map((guide, guideIndex) => (
                    <Card key={guideIndex} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg">{guide.title}</h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">{guide.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-gray-500">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {guide.duration}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[guide.difficulty as keyof typeof difficultyColors]}`}
                          >
                            {guide.difficulty}
                          </span>
                        </div>
                        <Link
                          href={`/guides/${guide.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-lavender hover:text-lavender/80"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Video Tutorials */}
          <div className="mt-16">
            <Heading level={2} className="mb-8 text-center">
              {t('videoTutorials.title')}
            </Heading>
            <Card className="p-8 text-center">
              <div className="mb-4 text-5xl">🎥</div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('videoTutorials.description')}
              </p>
              <Link
                href="https://www.youtube.com/@innovacionesmadfam"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-lavender hover:text-lavender/80 font-medium"
              >
                {t('videoTutorials.watchYoutube')}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </Link>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
