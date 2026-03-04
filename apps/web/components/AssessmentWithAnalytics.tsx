'use client';

import { Assessment, AssessmentProps, AssessmentResult } from '@/components/ui';
import { useEffect, useState, useCallback } from 'react';

// Stub analytics hooks - replace with actual implementation when available
function useFeatureTracking() {
  return {
    trackAssessmentComplete: (data: { score: number; recommendation: string }) => {
      console.log('[Analytics] Assessment complete:', data);
    },
    trackFeatureUsed: (feature: string, source: string) => {
      console.log('[Analytics] Feature used:', feature, source);
    },
  };
}

function useConversionTracking() {
  return {
    trackServiceFunnelStep: (step: string, tier: string, metadata: Record<string, string>) => {
      console.log('[Analytics] Funnel step:', step, tier, metadata);
    },
    trackPurchaseIntent: (tier: string) => {
      console.log('[Analytics] Purchase intent:', tier);
    },
  };
}

interface AssessmentWithAnalyticsProps extends AssessmentProps {
  source?: string;
}

export function AssessmentWithAnalytics({
  onComplete,
  source = 'assessment',
  ...props
}: AssessmentWithAnalyticsProps) {
  const { trackAssessmentComplete, trackFeatureUsed } = useFeatureTracking();
  const { trackServiceFunnelStep, trackPurchaseIntent } = useConversionTracking();
  const [startTime, setStartTime] = useState<number>();

  const trackFeature = useCallback(() => {
    trackFeatureUsed('assessment', source);
  }, [trackFeatureUsed, source]);

  useEffect(() => {
    // Track assessment start
    trackFeature();
    setStartTime(Date.now());
  }, [trackFeature]);

  const handleComplete = (result: AssessmentResult) => {
    const completionTime = startTime ? Date.now() - startTime : 0;

    // Track assessment completion
    trackAssessmentComplete({
      score: result.percentage,
      recommendation: result.recommendedTier,
    });

    // Track service funnel step based on result
    trackServiceFunnelStep('interest', result.recommendedTier, {
      source: 'assessment',
      score: result.percentage.toString(),
      completion_time: (completionTime / 1000).toString(),
    });

    // Track purchase intent for higher-tier recommendations
    if (['PLATFORM_PILOTS', 'STRATEGIC_PARTNERSHIPS'].includes(result.recommendedTier)) {
      trackPurchaseIntent(result.recommendedTier);
    }

    // Call original onComplete handler
    onComplete?.(result);
  };

  return <Assessment {...props} onComplete={handleComplete} />;
}
