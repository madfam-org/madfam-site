'use client';

type Locale = 'es' | 'en' | 'pt';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Container,
  Heading,
  Assessment,
  LeadForm,
  Button,
  Card,
  CardContent,
  type AssessmentQuestion,
  type AssessmentResult,
  type LeadFormData,
} from '@/components/ui';
import { logServiceInquiry } from '@/lib/logger';

interface AssessmentClientProps {
  translations: {
    title: string;
    subtitle: string;
    strategicQuestions: string;
    minutes: string;
    instantResults: string;
    assessmentTitle: string;
    assessmentDescription: string;
    getPersonalizedStrategy: string;
    strategySubtitle: string;
    requestSession: string;
    sessionDescription: string;
    scheduleSession: string;
    whyAssessment: string;
    whySubtitle: string;
    identifyGaps: string;
    identifyGapsDesc: string;
    benchmarkProgress: string;
    benchmarkDesc: string;
    getRecommendations: string;
    recommendationsDesc: string;
    readyToTransform: string;
    ctaSubtitle: string;
    startAssessment: string;
    scheduleConsultation: string;
  };
  assessmentQuestions: AssessmentQuestion[];
}

export function AssessmentClient({ translations, assessmentQuestions }: AssessmentClientProps) {
  const params = useParams();
  const locale = params?.locale as string;
  const currentLocale = locale as Locale;
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setAssessmentResult(result);
    setShowLeadForm(true);
    logServiceInquiry('ai_transformation', 'ai-readiness-assessment', {
      result,
      locale: currentLocale,
    });
  };

  if (showLeadForm) {
    return (
      <main className="min-h-screen">
        <section className="section">
          <Container>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <Heading level={2} className="mb-4">
                  {translations.getPersonalizedStrategy}
                </Heading>
                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {translations.strategySubtitle}
                </p>
              </div>

              <LeadForm
                variant="progressive"
                source="ai-readiness-assessment"
                title={translations.requestSession}
                description={translations.sessionDescription}
                submitText={translations.scheduleSession}
                onSubmit={async (data: LeadFormData) => {
                  logServiceInquiry('ai_transformation', 'assessment-strategy-request', {
                    ...data,
                    assessmentResult,
                    locale: currentLocale,
                  });
                  await fetch('/api/leads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: data.name,
                      email: data.email,
                      company: data.company,
                      phone: data.phone,
                      message: data.message || 'Strategy session request after AI assessment',
                      source: 'ai-readiness-assessment',
                      preferredLanguage: currentLocale,
                      metadata: { assessmentResult },
                    }),
                  });
                }}
              />
            </div>
          </Container>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-obsidian/5 to-lavender/10">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <Heading level={1} className="mb-6">
              {translations.title}
            </Heading>
            <p className="text-xl text-obsidian/70 mb-8">{translations.subtitle}</p>
            <div className="flex items-center justify-center gap-8 text-sm text-obsidian/60">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-leaf" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{translations.strategicQuestions}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-sun" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{translations.minutes}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-lavender" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{translations.instantResults}</span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Assessment Section */}
      <section className="section" id="assessment">
        <Container>
          <Assessment
            title={translations.assessmentTitle}
            description={translations.assessmentDescription}
            questions={assessmentQuestions}
            locale={currentLocale as 'es' | 'en' | 'pt'}
            onComplete={handleAssessmentComplete}
          />
        </Container>
      </section>

      {/* Benefits Section */}
      <section className="section bg-pearl">
        <Container>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Heading level={2} className="mb-4">
                {translations.whyAssessment}
              </Heading>
              <p className="text-lg text-obsidian/70">{translations.whySubtitle}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="font-heading text-lg mb-2">{translations.identifyGaps}</h3>
                  <p className="text-obsidian/70 text-sm">{translations.identifyGapsDesc}</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="font-heading text-lg mb-2">{translations.benchmarkProgress}</h3>
                  <p className="text-obsidian/70 text-sm">{translations.benchmarkDesc}</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-8">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="font-heading text-lg mb-2">{translations.getRecommendations}</h3>
                  <p className="text-obsidian/70 text-sm">{translations.recommendationsDesc}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="section">
        <Container>
          <div className="bg-gradient-to-r from-obsidian to-lavender rounded-3xl p-12 text-center text-white">
            <Heading level={2} className="text-white mb-4">
              {translations.readyToTransform}
            </Heading>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {translations.ctaSubtitle}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                variant="secondary"
                size="lg"
                onClick={() =>
                  document.getElementById('assessment')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                {translations.startAssessment}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-obsidian"
              >
                {translations.scheduleConsultation}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
