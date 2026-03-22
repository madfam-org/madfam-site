'use client';

import { useEffect, useState, useCallback } from 'react';
import { Assessment, AssessmentProps, AssessmentResult } from '@/components/ui';
import { useFeatureTracking, useConversionTracking } from '@madfam/analytics';
import { logBusinessEvent } from '@/lib/logger';

interface AssessmentWithAnalyticsProps extends AssessmentProps {
  source?: string;
}

export function AssessmentWithAnalytics({
  onComplete,
  source = 'assessment',
  ...props
}: AssessmentWithAnalyticsProps) {
  const { trackFeatureUsage } = useFeatureTracking();
  const { trackServiceFunnelStep, trackPurchaseIntent } = useConversionTracking();
  const [startTime, setStartTime] = useState<number>();

  const trackFeature = useCallback(() => {
    trackFeatureUsage('assessment', { source });
  }, [trackFeatureUsage, source]);

  useEffect(() => {
    // Track assessment start
    trackFeature();
    setStartTime(Date.now());
  }, [trackFeature]);

  const handleComplete = (result: AssessmentResult) => {
    const completionTime = startTime ? Date.now() - startTime : 0;

    // Track assessment completion
    logBusinessEvent('assessment_complete', {
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
