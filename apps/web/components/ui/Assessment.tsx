'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { cn } from './utils';

export interface AssessmentQuestionOption {
  value: string;
  text: string;
  score: number;
}

export interface AssessmentQuestion {
  id: string | number;
  question: string;
  options: string[] | AssessmentQuestionOption[];
  category?: string;
}

export interface AssessmentResult {
  score: number;
  percentage: number; // alias for score
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  recommendedTier: string;
  answers?: Record<string, number>;
}

export interface AssessmentProps {
  title?: string;
  description?: string;
  questions?: AssessmentQuestion[];
  locale?: 'es' | 'en' | 'pt' | string;
  onComplete?: (result: AssessmentResult) => void;
  className?: string;
}

const defaultQuestions: AssessmentQuestion[] = [
  {
    id: 1,
    question: 'How would you rate your current digital transformation progress?',
    options: ['Just starting', 'Making progress', 'Well advanced', 'Industry leader'],
  },
  {
    id: 2,
    question: 'What is your biggest challenge with AI adoption?',
    options: [
      'Understanding use cases',
      'Technical implementation',
      'Team skills',
      'Budget constraints',
    ],
  },
  {
    id: 3,
    question: 'How important is innovation to your business strategy?',
    options: ['Not a priority', 'Somewhat important', 'Very important', 'Critical'],
  },
];

export function Assessment({
  title,
  description,
  questions = defaultQuestions,
  locale: _locale,
  onComplete,
  className,
}: AssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result
      const maxPossibleScore = questions.length * 3;
      const score = Math.round((newAnswers.reduce((a, b) => a + b, 0) / maxPossibleScore) * 100);

      // Determine recommended tier based on score
      let recommendedTier = 'DESIGN_FABRICATION';
      if (score >= 75) recommendedTier = 'STRATEGIC_PARTNERSHIPS';
      else if (score >= 50) recommendedTier = 'PLATFORM_PILOTS';
      else if (score >= 25) recommendedTier = 'STRATEGY_ENABLEMENT';

      const result: AssessmentResult = {
        score,
        percentage: score,
        recommendedTier,
        strengths:
          score > 50
            ? ['Innovation mindset', 'Digital readiness', 'Strategic vision']
            : ['Growth potential', 'Learning orientation'],
        weaknesses:
          score < 50
            ? ['Technical implementation', 'AI expertise', 'Resource allocation']
            : ['Scaling challenges', 'Process optimization'],
        recommendations: [
          'Consider AI integration strategy',
          'Invest in team upskilling',
          'Partner with innovation experts',
          'Develop a digital roadmap',
        ].slice(0, score > 50 ? 2 : 4),
        answers: questions.reduce((acc, q, i) => ({ ...acc, [q.id]: newAnswers[i] }), {}),
      };
      onComplete?.(result);
    }
  };

  const question = questions[currentQuestion];

  if (!question) {
    return null;
  }

  return (
    <Card className={cn('max-w-2xl mx-auto', className)}>
      <CardContent className="p-8">
        {title && <h2 className="text-2xl font-bold mb-2">{title}</h2>}
        {description && <p className="text-gray-600 mb-6">{description}</p>}

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span>{Math.round((currentQuestion / questions.length) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentQuestion / questions.length) * 100}%` }}
            />
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-6">{question.question}</h3>

        <div className="space-y-3">
          {question.options.map((option, index) => {
            const optionText = typeof option === 'string' ? option : option.text;
            const optionScore = typeof option === 'string' ? index : option.score;
            return (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left py-4"
                onClick={() => handleAnswer(optionScore)}
              >
                {optionText}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
