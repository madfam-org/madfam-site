import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AssessmentClient } from '@/components/AssessmentClient';

interface AssessmentPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: AssessmentPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'assessment' });

  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function AssessmentPage({ params }: AssessmentPageProps) {
  const { locale } = await params;
  const t = await getTranslations('assessment');
  const tCommon = await getTranslations('common');

  const translations = {
    title: t('title'),
    subtitle: t('subtitle'),
    strategicQuestions: t('page.strategicQuestions'),
    minutes: t('page.minutes'),
    instantResults: t('page.instantResults'),
    assessmentTitle: t('title'),
    assessmentDescription: t('intro'),
    getPersonalizedStrategy: t('page.getPersonalizedStrategy'),
    strategySubtitle: t('page.strategySubtitle'),
    requestSession: t('page.requestSession'),
    sessionDescription: t('page.sessionDescription'),
    scheduleSession: t('page.scheduleSession'),
    whyAssessment: t('page.whyAssessment'),
    whySubtitle: t('page.whySubtitle'),
    identifyGaps: t('page.identifyGaps'),
    identifyGapsDesc: t('page.identifyGapsDesc'),
    benchmarkProgress: t('page.benchmarkProgress'),
    benchmarkDesc: t('page.benchmarkDesc'),
    getRecommendations: t('page.getRecommendations'),
    recommendationsDesc: t('page.recommendationsDesc'),
    readyToTransform: t('page.readyToTransform'),
    ctaSubtitle: t('page.ctaSubtitle'),
    startAssessment: t('start'),
    scheduleConsultation: tCommon('cta.scheduleConsultation'),
  };

  const questionIds = [
    'digital_strategy',
    'technology_infrastructure',
    'data_analytics',
    'innovation_culture',
    'process_automation',
    'ai_experience',
    'team_skills',
    'budget_commitment',
    'efficiency_urgency',
    'competitive_position',
  ] as const;

  const questionCategories: Record<
    string,
    'strategy' | 'technology' | 'data' | 'culture' | 'processes'
  > = {
    digital_strategy: 'strategy',
    technology_infrastructure: 'technology',
    data_analytics: 'data',
    innovation_culture: 'culture',
    process_automation: 'processes',
    ai_experience: 'technology',
    team_skills: 'culture',
    budget_commitment: 'strategy',
    efficiency_urgency: 'processes',
    competitive_position: 'strategy',
  };

  const questionOptions: Record<string, Array<{ value: string; score: number }>> = {
    digital_strategy: [
      { value: 'none', score: 0 },
      { value: 'basic', score: 1 },
      { value: 'developing', score: 2 },
      { value: 'implemented', score: 3 },
    ],
    technology_infrastructure: [
      { value: 'outdated', score: 0 },
      { value: 'mixed', score: 1 },
      { value: 'modern', score: 2 },
      { value: 'advanced', score: 3 },
    ],
    data_analytics: [
      { value: 'no_data', score: 0 },
      { value: 'basic_data', score: 1 },
      { value: 'some_analytics', score: 2 },
      { value: 'advanced_analytics', score: 3 },
    ],
    innovation_culture: [
      { value: 'resistant', score: 0 },
      { value: 'cautious', score: 1 },
      { value: 'adaptive', score: 2 },
      { value: 'innovative', score: 3 },
    ],
    process_automation: [
      { value: 'manual', score: 0 },
      { value: 'partially', score: 1 },
      { value: 'mostly', score: 2 },
      { value: 'fully', score: 3 },
    ],
    ai_experience: [
      { value: 'none', score: 0 },
      { value: 'basic', score: 1 },
      { value: 'pilot', score: 2 },
      { value: 'advanced', score: 3 },
    ],
    team_skills: [
      { value: 'basic', score: 0 },
      { value: 'intermediate', score: 1 },
      { value: 'good', score: 2 },
      { value: 'expert', score: 3 },
    ],
    budget_commitment: [
      { value: 'minimal', score: 0 },
      { value: 'moderate', score: 1 },
      { value: 'significant', score: 2 },
      { value: 'substantial', score: 3 },
    ],
    efficiency_urgency: [
      { value: 'low', score: 0 },
      { value: 'moderate', score: 1 },
      { value: 'high', score: 2 },
      { value: 'critical', score: 3 },
    ],
    competitive_position: [
      { value: 'behind', score: 0 },
      { value: 'catching_up', score: 1 },
      { value: 'competitive', score: 2 },
      { value: 'leading', score: 3 },
    ],
  };

  const assessmentQuestions = questionIds.map(id => ({
    id,
    question: t(`assessmentQuestions.${id}.question`),
    category: questionCategories[id],
    options: questionOptions[id].map(opt => ({
      ...opt,
      text: t(`assessmentQuestions.${id}.${opt.value}`),
    })),
  }));

  return <AssessmentClient translations={translations} assessmentQuestions={assessmentQuestions} />;
}
