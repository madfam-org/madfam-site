export interface AssessmentQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    text: string;
    score: number;
  }[];
  category: 'strategy' | 'technology' | 'data' | 'culture' | 'processes';
}

export interface AssessmentResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  categoryScores: {
    strategy: number;
    technology: number;
    data: number;
    culture: number;
    processes: number;
  };
  recommendations: string[];
  recommendedTier:
    | 'DESIGN_FABRICATION'
    | 'STRATEGY_ENABLEMENT'
    | 'PLATFORM_PILOTS'
    | 'STRATEGIC_PARTNERSHIPS';
}

export interface AssessmentProps {
  title?: string;
  description?: string;
  questions: AssessmentQuestion[];
  onComplete?: (result: AssessmentResult) => void;
  className?: string;
  locale?: 'es' | 'en' | 'pt';
  translations?: {
    resultTitle: string;
    levelLabel: string;
    scoreLabel: string;
    recommendationsTitle: string;
    serviceRecommendationTitle: string;
    tierDescriptions: {
      DESIGN_FABRICATION: string;
      STRATEGY_ENABLEMENT: string;
      PLATFORM_PILOTS: string;
      STRATEGIC_PARTNERSHIPS: string;
    };
    startButton: string;
    nextButton: string;
    previousButton: string;
    completeButton: string;
    restartButton: string;
    categoryLabels: {
      strategy: string;
      technology: string;
      data: string;
      culture: string;
      processes: string;
    };
    levels: {
      beginner: string;
      intermediate: string;
      advanced: string;
      expert: string;
    };
  };
}
