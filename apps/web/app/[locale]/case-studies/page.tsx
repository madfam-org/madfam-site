import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Container, Heading, Card } from '@/components/ui';
import { getPublishedCaseStudies, type CaseStudy } from '@/lib/cms';
import { environment } from '@/lib/environment';

// Common case study interface for consistency
type CommonCaseStudy = {
  id: string;
  title: string;
  client: string;
  industry: string;
  challenge: string;
  solution: string | Record<string, unknown> | import('@/types/content').RichTextDocument;
  results: Array<{ metric: string; value: string; description: string }> | string[];
  slug: string;
  status?: string;
  publishedDate: string;
  createdAt?: string;
  updatedAt?: string;
  featuredImage?: {
    id: string;
    url: string;
    alt?: string;
  };
};

// Fallback case studies for when CMS is unavailable
const fallbackCaseStudies: CommonCaseStudy[] = [
  {
    id: '1',
    title: 'Digital Transformation: From Legacy to Cloud-Native',
    client: 'Global Manufacturing Corp',
    industry: 'Manufacturing',
    challenge: 'Outdated systems limiting growth and operational efficiency',
    solution: 'Complete digital overhaul with cloud migration and AI-powered analytics',
    results: [
      { metric: 'Cost Reduction', value: '40%', description: 'reduction in operational costs' },
      { metric: 'Speed', value: '3x', description: 'faster time-to-market' },
      { metric: 'Uptime', value: '99.9%', description: 'system uptime achieved' },
    ],
    slug: 'global-manufacturing-digital-transformation',
    status: 'published' as const,
    publishedDate: '2024-03-01',
    createdAt: '2024-03-01',
    updatedAt: '2024-03-01',
    featuredImage: undefined,
  },
  {
    id: '2',
    title: 'Building a Next-Gen Trading Platform',
    client: 'FinTech Innovations',
    industry: 'Financial Services',
    challenge: 'Need for real-time processing and regulatory compliance',
    solution: 'Custom platform with ML-driven insights and automated compliance',
    results: [
      { metric: 'Latency', value: '10ms', description: 'average latency' },
      { metric: 'Compliance', value: '100%', description: 'regulatory compliance' },
      { metric: 'Savings', value: '$2M', description: 'saved annually' },
    ],
    slug: 'fintech-trading-platform',
    status: 'published' as const,
    publishedDate: '2024-02-15',
    createdAt: '2024-02-15',
    updatedAt: '2024-02-15',
    featuredImage: undefined,
  },
  {
    id: '3',
    title: 'AI-Powered Patient Care System',
    client: 'Healthcare Plus',
    industry: 'Healthcare',
    challenge: 'Fragmented patient data and inefficient care coordination',
    solution: 'Unified healthcare platform with predictive analytics',
    results: [
      { metric: 'Outcomes', value: '30%', description: 'improvement in patient outcomes' },
      { metric: 'Efficiency', value: '50%', description: 'reduction in administrative time' },
      { metric: 'Satisfaction', value: '2x', description: 'increase in patient satisfaction' },
    ],
    slug: 'healthcare-ai-patient-care',
    status: 'published' as const,
    publishedDate: '2024-02-01',
    createdAt: '2024-02-01',
    updatedAt: '2024-02-01',
    featuredImage: undefined,
  },
];

export default async function CaseStudiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('caseStudies');

  // Fetch case studies from CMS or use fallback data
  let caseStudies: CommonCaseStudy[] = fallbackCaseStudies;

  if (environment.cms.enabled) {
    try {
      const cmsData = await getPublishedCaseStudies(locale, 10);
      if (cmsData.docs.length > 0) {
        // Transform CMS data to common interface
        caseStudies = cmsData.docs.map(
          (study: CaseStudy): CommonCaseStudy => ({
            id: study.id,
            title: study.title,
            client: study.client,
            industry: study.industry,
            challenge: study.challenge,
            solution: study.solution,
            results: study.results,
            slug: study.slug,
            status: study.status,
            publishedDate: study.publishedDate,
            createdAt: study.createdAt,
            updatedAt: study.updatedAt,
            featuredImage: study.featuredImage,
          })
        );
      }
    } catch (error) {
      console.warn('Failed to fetch case studies from CMS, using fallback data:', error);
    }
  }

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

          {caseStudies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('noCaseStudies') || 'No case studies available at the moment.'}
              </p>
            </div>
          ) : (
            <div className="grid gap-8 md:gap-12">
              {caseStudies.map(study => (
                <Card key={study.id} className="overflow-hidden">
                  <div className="md:grid md:grid-cols-2 md:gap-8">
                    <div className="p-8">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="text-sm font-medium text-lavender">{study.industry}</span>
                        <span className="text-sm text-gray-500">{study.client}</span>
                      </div>

                      <h2 className="text-2xl font-bold mb-4">{study.title}</h2>

                      <div className="space-y-4 mb-6">
                        <div>
                          <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                            {t('challenge')}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">{study.challenge}</p>
                        </div>

                        <div>
                          <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                            {t('solution')}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            {typeof study.solution === 'string'
                              ? study.solution
                              : 'Custom solution implementation'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-6">
                        <h3 className="font-semibold text-sm uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-3">
                          {t('results')}
                        </h3>
                        <ul className="space-y-2">
                          {study.results.map((result, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-sun mr-2">✓</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {typeof result === 'string'
                                  ? result
                                  : `${result.value} ${result.description}`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link
                        href={`/${locale}/case-studies/${study.slug}`}
                        className="inline-flex items-center text-lavender hover:text-lavender/80 font-medium transition-colors"
                      >
                        {t('readFullCase')} →
                      </Link>
                    </div>

                    <div className="bg-gray-100 dark:bg-gray-900 h-64 md:h-auto relative">
                      {study.featuredImage ? (
                        <Image
                          src={study.featuredImage.url}
                          alt={study.featuredImage.alt || study.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          [Case Study Image]
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </main>
  );
}
