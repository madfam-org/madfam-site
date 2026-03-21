import { getTranslations } from 'next-intl/server';
import { Container, Heading, Card } from '@/components/ui';

export default async function GuidesPage({ params }: { params: Promise<{ locale: string }> }) {
  await params; // Validate params exist
  const t = await getTranslations('guides');

  const guides = [
    {
      category: t('categories.gettingStarted'),
      icon: '🚀',
      guides: [
        {
          title: t('items.quickStart.title'),
          description: t('items.quickStart.description'),
          duration: t('items.quickStart.duration'),
          difficulty: t('difficulty.beginner'),
        },
        {
          title: t('items.platformOverview.title'),
          description: t('items.platformOverview.description'),
          duration: t('items.platformOverview.duration'),
          difficulty: t('difficulty.beginner'),
        },
        {
          title: t('items.authSetup.title'),
          description: t('items.authSetup.description'),
          duration: t('items.authSetup.duration'),
          difficulty: t('difficulty.intermediate'),
        },
      ],
    },
    {
      category: t('categories.integration'),
      icon: '🔗',
      guides: [
        {
          title: t('items.restApi.title'),
          description: t('items.restApi.description'),
          duration: t('items.restApi.duration'),
          difficulty: t('difficulty.intermediate'),
        },
        {
          title: t('items.webhookConfig.title'),
          description: t('items.webhookConfig.description'),
          duration: t('items.webhookConfig.duration'),
          difficulty: t('difficulty.intermediate'),
        },
        {
          title: t('items.sdkImpl.title'),
          description: t('items.sdkImpl.description'),
          duration: t('items.sdkImpl.duration'),
          difficulty: t('difficulty.advanced'),
        },
      ],
    },
    {
      category: t('categories.bestPractices'),
      icon: '✨',
      guides: [
        {
          title: t('items.securityBest.title'),
          description: t('items.securityBest.description'),
          duration: t('items.securityBest.duration'),
          difficulty: t('difficulty.advanced'),
        },
        {
          title: t('items.perfOptimization.title'),
          description: t('items.perfOptimization.description'),
          duration: t('items.perfOptimization.duration'),
          difficulty: t('difficulty.advanced'),
        },
        {
          title: t('items.errorHandling.title'),
          description: t('items.errorHandling.description'),
          duration: t('items.errorHandling.duration'),
          difficulty: t('difficulty.intermediate'),
        },
      ],
    },
    {
      category: t('categories.useCases'),
      icon: '💡',
      guides: [
        {
          title: t('items.aiChatbot.title'),
          description: t('items.aiChatbot.description'),
          duration: t('items.aiChatbot.duration'),
          difficulty: t('difficulty.advanced'),
        },
        {
          title: t('items.processAutomation.title'),
          description: t('items.processAutomation.description'),
          duration: t('items.processAutomation.duration'),
          difficulty: t('difficulty.intermediate'),
        },
        {
          title: t('items.analyticsDashboard.title'),
          description: t('items.analyticsDashboard.description'),
          duration: t('items.analyticsDashboard.duration'),
          difficulty: t('difficulty.advanced'),
        },
      ],
    },
  ];

  const difficultyColors: Record<string, string> = {
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
            <span className="inline-flex items-center text-lavender font-medium">
              {t('featured.startTutorial')} →
            </span>
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
                          className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[guide.difficulty] || ''}`}
                        >
                          {guide.difficulty}
                        </span>
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
              <a
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
              </a>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
