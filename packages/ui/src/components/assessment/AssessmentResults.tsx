'use client';
import { cn } from '../../lib/utils';
import { Button } from '../Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card';
import type { AssessmentResult, AssessmentProps } from './types';

interface AssessmentResultsProps {
  result: AssessmentResult;
  translations: AssessmentProps['translations'];
  onRestart: () => void;
}

export function AssessmentResults({ result, translations, onRestart }: AssessmentResultsProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    if (percentage >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const tierColors: Record<string, string> = {
    DESIGN_FABRICATION: 'from-blue-500 to-blue-600',
    STRATEGY_ENABLEMENT: 'from-indigo-500 to-indigo-600',
    PLATFORM_PILOTS: 'from-violet-500 to-violet-600',
    STRATEGIC_PARTNERSHIPS: 'from-pink-500 to-pink-600',
  };

  // Get score interpretation
  const getScoreInterpretation = () => {
    const { level } = result;
    const interpretations = {
      beginner: {
        title: 'Early Stage - Foundation Building',
        description:
          "You're at the beginning of your AI transformation journey. This is a great starting point! Focus on building foundational understanding and establishing clear AI use cases that align with your business goals.",
        icon: '🌱',
      },
      intermediate: {
        title: 'Growing - Expanding Capabilities',
        description:
          "You've established solid foundations and are ready to scale. Your organization shows readiness for more advanced AI implementations and can benefit from strategic guidance to maximize ROI.",
        icon: '🚀',
      },
      advanced: {
        title: 'Mature - Optimization Phase',
        description:
          "You're operating at an advanced level with strong AI capabilities. Focus on optimizing existing systems, exploring cutting-edge technologies, and driving innovation across your organization.",
        icon: '⚡',
      },
      expert: {
        title: 'Leading Edge - Innovation Driver',
        description:
          "You're an AI leader! Your organization is well-positioned to pioneer new solutions, share best practices, and leverage AI as a strategic competitive advantage.",
        icon: '🏆',
      },
    };
    return interpretations[level];
  };

  // Get personalized product recommendations
  const getProductRecommendations = () => {
    const { level, categoryScores } = result;
    const recommendations: Array<{
      name: string;
      description: string;
      url: string;
      fit: string;
      icon: string;
    }> = [];

    // Find weakest categories to target
    const sortedCategories = Object.entries(categoryScores).sort(([, a], [, b]) => a - b);
    const weakestCategory = sortedCategories[0]?.[0];

    // Recommend products based on level and weak areas
    if (level === 'beginner' || level === 'intermediate') {
      if (weakestCategory === 'data' || categoryScores.data < 50) {
        recommendations.push({
          name: 'Dhanam',
          description:
            'Financial wellness platform to start building data-driven insights for your organization',
          url: 'https://www.dhan.am',
          fit: 'Perfect for building data foundations',
          icon: '💰',
        });
      }

      if (weakestCategory === 'processes' || categoryScores.processes < 50) {
        recommendations.push({
          name: 'Forge Sight',
          description:
            'Pricing intelligence for digital fabrication - optimize your operational processes',
          url: 'https://www.forgesight.quest',
          fit: 'Ideal for process optimization',
          icon: '🏭',
        });
      }
    }

    if (level === 'advanced' || level === 'expert') {
      recommendations.push({
        name: 'PENNY',
        description:
          'Advanced AI assistant for enterprise-wide automation and intelligent workflows',
        url: '/products/penny',
        fit: 'Scales with your maturity',
        icon: '🤖',
      });
    }

    // Always offer strategic consulting if strategy is weak
    if (categoryScores.strategy < 60) {
      recommendations.push({
        name: 'Strategic Consulting',
        description: 'Work with our team to develop a comprehensive AI transformation roadmap',
        url: '/contact',
        fit: 'Accelerate your journey',
        icon: '📋',
      });
    }

    return recommendations.slice(0, 3); // Max 3 recommendations
  };

  const scoreInterpretation = getScoreInterpretation();
  const productRecommendations = getProductRecommendations();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{translations?.resultTitle || 'Resultados de la Evaluación'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Score */}
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">
                {translations?.scoreLabel || 'Puntuación Total'}
              </span>
              <span className="text-sm font-medium">
                {result.percentage}% - {translations?.levels?.[result.level] || result.level}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={cn(
                  'h-3 rounded-full transition-all',
                  getProgressColor(result.percentage)
                )}
                style={{ width: `${result.percentage}%` }}
              />
            </div>
          </div>

          {/* Score Interpretation */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-5xl">{scoreInterpretation.icon}</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-neutral-900 mb-2">
                  {scoreInterpretation.title}
                </h3>
                <p className="text-neutral-700 leading-relaxed">
                  {scoreInterpretation.description}
                </p>
              </div>
            </div>
          </div>

          {/* Personalized Product Recommendations */}
          {productRecommendations.length > 0 && (
            <div>
              <h3 className="font-bold text-lg text-neutral-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Recommended Solutions for You
              </h3>
              <div className="grid gap-4">
                {productRecommendations.map((product, index) => (
                  <a
                    key={index}
                    href={product.url}
                    target={product.url.startsWith('http') ? '_blank' : undefined}
                    rel={product.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group block p-5 border-2 border-neutral-200 rounded-xl hover:border-green-400 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-3xl flex-shrink-0">{product.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-neutral-900 group-hover:text-green-700">
                            {product.name}
                          </h4>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            {product.fit}
                          </span>
                        </div>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {product.description}
                        </p>
                        <div className="mt-3 flex items-center text-green-600 text-sm font-medium">
                          Explore {product.name}
                          <svg
                            className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Category Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(result.categoryScores).map(([category, score]) => (
              <CategoryScoreCard
                key={category}
                score={score}
                label={
                  translations?.categoryLabels?.[category as keyof typeof result.categoryScores] ||
                  category
                }
              />
            ))}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">
                {translations?.recommendationsTitle || 'Recomendaciones'}
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Service Recommendation */}
          <div
            className={cn(
              'p-4 rounded-lg bg-gradient-to-r text-white',
              tierColors[result.recommendedTier]
            )}
          >
            <h3 className="font-semibold mb-2">
              {translations?.serviceRecommendationTitle || 'Servicio Recomendado'}
            </h3>
            <p className="text-sm">
              {translations?.tierDescriptions?.[result.recommendedTier] ||
                `Nivel recomendado: ${result.recommendedTier}`}
            </p>
          </div>

          {/* Conversion CTA */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🚀</div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-neutral-900 mb-2">
                  Ready to turn these insights into action?
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Schedule a free 30-minute strategy session with our team. We'll review your
                  results, answer questions, and create a customized roadmap for your AI
                  transformation journey.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://calendly.com/madfam/strategy-call"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                Book Free Strategy Call
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </a>
              <a
                href="/contact"
                className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-white border-2 border-green-600 text-green-700 rounded-lg font-semibold hover:bg-green-50 transition-colors"
              >
                Contact Our Team
              </a>
            </div>
            <p className="text-xs text-neutral-500 text-center">
              No commitment required • Typical response time: 24 hours
            </p>
          </div>

          {/* Restart Button */}
          <Button onClick={onRestart} variant="outline" className="w-full">
            {translations?.restartButton || 'Realizar Nueva Evaluación'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function CategoryScoreCard({ score, label }: { score: number; label: string }) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-blue-500';
    if (score >= 25) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <span className="text-sm font-medium capitalize">{label}</span>
      <span className={cn('text-lg font-bold', getScoreColor(score))}>{score}%</span>
    </div>
  );
}
