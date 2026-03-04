import type { AssessmentProps } from './types';

export function getDefaultTranslations(
  locale: 'es' | 'en' | 'pt' = 'es'
): AssessmentProps['translations'] {
  const translations = {
    es: {
      resultTitle: 'Resultados de la Evaluación',
      levelLabel: 'Nivel',
      scoreLabel: 'Puntuación Total',
      recommendationsTitle: 'Recomendaciones',
      serviceRecommendationTitle: 'Servicio Recomendado',
      tierDescriptions: {
        DESIGN_FABRICATION:
          'Diseño y Fabricación - Ideal para empresas que necesitan prototipado y fabricación digital',
        STRATEGY_ENABLEMENT:
          'Estrategia y Habilitación - Transformación integral con IA y consultoría estratégica',
        PLATFORM_PILOTS:
          'Pilotos de Plataforma - Soluciones escalables de IA y plataformas enterprise',
        STRATEGIC_PARTNERSHIPS: 'Alianzas Estratégicas - Innovación continua y liderazgo en IA',
      },
      startButton: 'Comenzar Evaluación',
      nextButton: 'Siguiente',
      previousButton: 'Anterior',
      completeButton: 'Completar',
      restartButton: 'Realizar Nueva Evaluación',
      categoryLabels: {
        strategy: 'Estrategia',
        technology: 'Tecnología',
        data: 'Datos',
        culture: 'Cultura',
        processes: 'Procesos',
      },
      levels: {
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
        expert: 'Experto',
      },
    },
    en: {
      resultTitle: 'Assessment Results',
      levelLabel: 'Level',
      scoreLabel: 'Total Score',
      recommendationsTitle: 'Recommendations',
      serviceRecommendationTitle: 'Recommended Service',
      tierDescriptions: {
        DESIGN_FABRICATION:
          'Design & Fabrication - Ideal for companies needing prototyping and digital manufacturing',
        STRATEGY_ENABLEMENT:
          'Strategy & Enablement - Comprehensive AI transformation and strategic consulting',
        PLATFORM_PILOTS: 'Platform Pilots - Scalable AI solutions and enterprise platforms',
        STRATEGIC_PARTNERSHIPS: 'Strategic Partnerships - Continuous innovation and AI leadership',
      },
      startButton: 'Start Assessment',
      nextButton: 'Next',
      previousButton: 'Previous',
      completeButton: 'Complete',
      restartButton: 'Take New Assessment',
      categoryLabels: {
        strategy: 'Strategy',
        technology: 'Technology',
        data: 'Data',
        culture: 'Culture',
        processes: 'Processes',
      },
      levels: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
        expert: 'Expert',
      },
    },
    pt: {
      resultTitle: 'Resultados da Avaliação',
      levelLabel: 'Nível',
      scoreLabel: 'Pontuação Total',
      recommendationsTitle: 'Recomendações',
      serviceRecommendationTitle: 'Serviço Recomendado',
      tierDescriptions: {
        DESIGN_FABRICATION:
          'Design e Fabricação - Ideal para empresas que precisam de prototipagem e fabricação digital',
        STRATEGY_ENABLEMENT:
          'Estratégia e Habilitação - Transformação integral com IA e consultoria estratégica',
        PLATFORM_PILOTS:
          'Pilotos de Plataforma - Soluções escaláveis de IA e plataformas enterprise',
        STRATEGIC_PARTNERSHIPS: 'Parcerias Estratégicas - Inovação contínua e liderança em IA',
      },
      startButton: 'Iniciar Avaliação',
      nextButton: 'Próximo',
      previousButton: 'Anterior',
      completeButton: 'Completar',
      restartButton: 'Fazer Nova Avaliação',
      categoryLabels: {
        strategy: 'Estratégia',
        technology: 'Tecnologia',
        data: 'Dados',
        culture: 'Cultura',
        processes: 'Processos',
      },
      levels: {
        beginner: 'Iniciante',
        intermediate: 'Intermediário',
        advanced: 'Avançado',
        expert: 'Especialista',
      },
    },
  };

  return translations[locale];
}
