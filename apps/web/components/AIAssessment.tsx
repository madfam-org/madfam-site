'use client';

import { analytics } from '@madfam/analytics';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button, Card, CardContent, Heading } from '@/components/ui';

interface Question {
  id: string;
  question: string;
  options: {
    value: string;
    label: string;
    points: number;
  }[];
}

interface TranslationFunction {
  (key: string, values?: Record<string, string | number>): string;
}

const getAssessmentQuestions = (t: TranslationFunction): Question[] => [
  {
    id: 'current_tech',
    question: t('questions.currentTech.question'),
    options: [
      { value: 'basic', label: t('questions.currentTech.basic'), points: 0 },
      { value: 'intermediate', label: t('questions.currentTech.intermediate'), points: 25 },
      { value: 'advanced', label: t('questions.currentTech.advanced'), points: 50 },
      { value: 'cutting_edge', label: t('questions.currentTech.cuttingEdge'), points: 75 },
    ],
  },
  {
    id: 'team_size',
    question: t('questions.teamSize.question'),
    options: [
      { value: 'small', label: t('questions.teamSize.small'), points: 10 },
      { value: 'medium', label: t('questions.teamSize.medium'), points: 20 },
      { value: 'large', label: t('questions.teamSize.large'), points: 30 },
      { value: 'enterprise', label: t('questions.teamSize.enterprise'), points: 40 },
    ],
  },
  {
    id: 'ai_interest',
    question: t('questions.aiInterest.question'),
    options: [
      { value: 'automation', label: t('questions.aiInterest.automation'), points: 30 },
      { value: 'analytics', label: t('questions.aiInterest.analytics'), points: 35 },
      { value: 'customer', label: t('questions.aiInterest.customer'), points: 25 },
      { value: 'operations', label: t('questions.aiInterest.operations'), points: 40 },
    ],
  },
  {
    id: 'timeline',
    question: t('questions.timeline.question'),
    options: [
      { value: 'immediate', label: t('questions.timeline.immediate'), points: 50 },
      { value: 'short', label: t('questions.timeline.short'), points: 35 },
      { value: 'medium', label: t('questions.timeline.medium'), points: 20 },
      { value: 'long', label: t('questions.timeline.long'), points: 10 },
    ],
  },
  {
    id: 'budget',
    question: t('questions.budget.question'),
    options: [
      { value: 'low', label: t('questions.budget.low'), points: 10 },
      { value: 'medium', label: t('questions.budget.medium'), points: 25 },
      { value: 'high', label: t('questions.budget.high'), points: 40 },
      { value: 'enterprise', label: t('questions.budget.enterprise'), points: 60 },
    ],
  },
];

export function AIAssessment() {
  const t = useTranslations('assessment');
  const assessmentQuestions = getAssessmentQuestions(t);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const handleAnswer = (questionId: string, value: string, points: number) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    const newScore = score + points;
    setScore(newScore);

    if (currentQuestion < assessmentQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Assessment complete
      showAssessmentResults(newScore);
    }
  };

  const showAssessmentResults = (finalScore: number) => {
    setShowResults(true);

    // Track completion
    analytics.trackAssessmentComplete({
      score: finalScore,
      recommendation: getRecommendation(finalScore).tier,
    });
  };

  const getRecommendation = (assessmentScore: number) => {
    if (assessmentScore >= 200) {
      return {
        tier: 'Strategic Partnerships',
        title: t('recommendations.strategicPartnerships.title'),
        description: t('recommendations.strategicPartnerships.description'),
        color: 'obsidian',
      };
    } else if (assessmentScore >= 150) {
      return {
        tier: 'Platform Pilots',
        title: t('recommendations.platformPilots.title'),
        description: t('recommendations.platformPilots.description'),
        color: 'creative',
      };
    } else if (assessmentScore >= 100) {
      return {
        tier: 'Strategy & Enablement',
        title: t('recommendations.strategyEnablement.title'),
        description: t('recommendations.strategyEnablement.description'),
        color: 'lavender',
      };
    } else if (assessmentScore >= 50) {
      return {
        tier: 'Design & Fabrication',
        title: t('recommendations.designFabrication.title'),
        description: t('recommendations.designFabrication.description'),
        color: 'sun',
      };
    } else {
      return {
        tier: 'Design & Fabrication',
        title: t('recommendations.designFabrication.title'),
        description: t('recommendations.designFabrication.description'),
        color: 'leaf',
      };
    }
  };

  const resetAssessment = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setScore(0);
    setShowResults(false);
  };

  if (showResults) {
    const recommendation = getRecommendation(score);

    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Heading level={2} className="mb-4">
            {t('results.title')}
          </Heading>
          <div className="flex justify-center mb-6">
            <div className="text-6xl font-bold text-lavender">{score}</div>
            <div className="text-2xl text-gray-500 self-end mb-2">/280</div>
          </div>
        </div>

        <Card variant="elevated" className="mb-8">
          <CardContent className="p-8 text-center">
            <div
              className={`inline-block px-4 py-2 rounded-full bg-${recommendation.color}/20 text-${recommendation.color} font-medium mb-4`}
            >
              {recommendation.tier}
            </div>
            <h3 className="font-heading text-2xl mb-4">{recommendation.title}</h3>
            <p className="text-lg text-gray-600 mb-6">{recommendation.description}</p>
            <Button variant="creative" size="lg">
              {t('results.learnMore')} {recommendation.tier}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="ghost" onClick={resetAssessment}>
            {t('results.retake')}
          </Button>
        </div>
      </div>
    );
  }

  const question = assessmentQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / assessmentQuestions.length) * 100;

  if (!question) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            {t('progress.question')} {currentQuestion + 1} {t('progress.of')}{' '}
            {assessmentQuestions.length}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(progress)}% {t('progress.completed')}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-lavender rounded-full h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Card variant="default">
        <CardContent className="p-8">
          <h3 className="font-heading text-xl mb-6">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map(option => (
              <button
                key={option.value}
                onClick={() => handleAnswer(question.id, option.value, option.points)}
                className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-lavender hover:bg-lavender/5 transition-all"
              >
                {option.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
