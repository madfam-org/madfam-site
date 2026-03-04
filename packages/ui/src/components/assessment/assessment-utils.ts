import type { AssessmentQuestion, AssessmentResult } from './types';

export function calculateResult(
  answers: Record<string, string>,
  questions: AssessmentQuestion[]
): AssessmentResult {
  let totalScore = 0;
  const maxScore = questions.length * 100;

  const categoryScores: Record<string, { score: number; count: number }> = {
    strategy: { score: 0, count: 0 },
    technology: { score: 0, count: 0 },
    data: { score: 0, count: 0 },
    culture: { score: 0, count: 0 },
    processes: { score: 0, count: 0 },
  };

  questions.forEach(q => {
    const answer = answers[q.id];
    const option = q.options.find(opt => opt.value === answer);
    if (option) {
      totalScore += option.score;
      const categoryScore = categoryScores[q.category];
      if (categoryScore) {
        categoryScore.score += option.score;
        categoryScore.count += 1;
      }
    }
  });

  // Normalize category scores
  const normalizedCategoryScores = Object.fromEntries(
    Object.entries(categoryScores).map(([key, value]) => [
      key,
      value.count > 0 ? Math.round(value.score / value.count) : 0,
    ])
  ) as AssessmentResult['categoryScores'];

  const percentage = Math.round((totalScore / maxScore) * 100);

  let level: AssessmentResult['level'];
  if (percentage >= 75) level = 'expert';
  else if (percentage >= 50) level = 'advanced';
  else if (percentage >= 25) level = 'intermediate';
  else level = 'beginner';

  let recommendedTier: AssessmentResult['recommendedTier'];
  if (percentage >= 75) recommendedTier = 'STRATEGIC_PARTNERSHIPS';
  else if (percentage >= 50) recommendedTier = 'PLATFORM_PILOTS';
  else if (percentage >= 25) recommendedTier = 'STRATEGY_ENABLEMENT';
  else recommendedTier = 'DESIGN_FABRICATION';

  const recommendations = generateRecommendations(normalizedCategoryScores, level);

  return {
    totalScore,
    maxScore,
    percentage,
    level,
    categoryScores: normalizedCategoryScores,
    recommendations,
    recommendedTier,
  };
}

export function generateRecommendations(
  categoryScores: AssessmentResult['categoryScores'],
  level: AssessmentResult['level']
): string[] {
  const recommendations: string[] = [];

  // Strategy recommendations
  if (categoryScores.strategy < 50) {
    recommendations.push(
      'Desarrollar una estrategia clara de IA alineada con objetivos de negocio'
    );
  }

  // Technology recommendations
  if (categoryScores.technology < 50) {
    recommendations.push(
      'Modernizar la infraestructura tecnológica para soportar iniciativas de IA'
    );
  }

  // Data recommendations
  if (categoryScores.data < 50) {
    recommendations.push('Implementar una estrategia de gobernanza de datos');
  }

  // Culture recommendations
  if (categoryScores.culture < 50) {
    recommendations.push('Desarrollar programas de capacitación en IA para el equipo');
  }

  // Processes recommendations
  if (categoryScores.processes < 50) {
    recommendations.push('Identificar y automatizar procesos clave del negocio');
  }

  // Level-specific recommendations
  if (level === 'beginner') {
    recommendations.push('Comenzar con proyectos piloto de IA de bajo riesgo y alto impacto');
  } else if (level === 'intermediate') {
    recommendations.push('Escalar las iniciativas exitosas de IA a través de la organización');
  } else if (level === 'advanced') {
    recommendations.push('Establecer un Centro de Excelencia de IA');
  }

  return recommendations;
}
