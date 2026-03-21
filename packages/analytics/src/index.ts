/**
 * @madfam/analytics - Local Analytics Package
 *
 * Provides analytics utilities for the MADFAM web app.
 * This is a stub implementation - apps should implement their own analytics
 * based on their specific needs (PostHog, Mixpanel, etc.)
 */

// Helper to log in development
const devLog = (category: string, event: string, ...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics:${category}]`, event, ...args);
  }
};

// Send events to Plausible via sendBeacon when configured
function sendPlausibleEvent(eventName: string, props?: Record<string, unknown>): void {
  const domain =
    typeof window !== 'undefined'
      ? (window as any).__PLAUSIBLE_DOMAIN__
      : process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return;

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    const payload = JSON.stringify({
      name: eventName,
      url: typeof window !== 'undefined' ? window.location.href : '',
      domain,
      props: props || {},
    });
    navigator.sendBeacon('https://plausible.io/api/event', payload);
  }
}

// Analytics singleton for server-side tracking
export const analytics = {
  track: (event: string, properties?: Record<string, unknown>) => {
    devLog('Track', event, properties);
    sendPlausibleEvent(event, properties);
  },
  identify: (userId: string, traits?: Record<string, unknown>) => {
    devLog('Identify', userId, traits);
    sendPlausibleEvent('identify', { userId, ...traits });
  },
  page: (name: string, properties?: Record<string, unknown>) => {
    devLog('Page', name, properties);
    sendPlausibleEvent('pageview', { page: name, ...properties });
  },
  // Extended tracking methods used throughout the app
  trackAssessmentComplete: (properties?: Record<string, unknown>) => {
    devLog('Track', 'assessment_complete', properties);
    sendPlausibleEvent('assessment_complete', properties);
  },
  trackCalculatorUsed: (properties?: Record<string, unknown>) => {
    devLog('Track', 'calculator_used', properties);
    sendPlausibleEvent('calculator_used', properties);
  },
  trackLeadCaptured: (properties?: Record<string, unknown>) => {
    devLog('Track', 'lead_captured', properties);
    sendPlausibleEvent('lead_captured', properties);
  },
  trackLanguageChanged: (oldLocale: string, newLocale: string) => {
    devLog('Track', 'language_changed', { from: oldLocale, to: newLocale });
    sendPlausibleEvent('language_changed', { from: oldLocale, to: newLocale });
  },
  trackEngagement: (type: string, action: string, timestamp?: number) => {
    devLog('Track', 'engagement', { type, action, timestamp });
    sendPlausibleEvent('engagement', { type, action, timestamp });
  },
  trackError: (message: string, location?: string, severity?: string) => {
    devLog('Track', 'error', { message, location, severity });
    sendPlausibleEvent('error', { message, location, severity });
  },
  trackSessionQuality: (score: number, metadata?: Record<string, unknown>) => {
    devLog('Track', 'session_quality', { score, ...metadata });
    sendPlausibleEvent('session_quality', { score, ...metadata });
  },
  trackROICalculated: (properties?: Record<string, unknown>) => {
    devLog('Track', 'roi_calculated', properties);
    sendPlausibleEvent('roi_calculated', properties);
  },
};

// React hooks for client-side tracking
export function useAnalytics() {
  return {
    track: analytics.track,
    identify: analytics.identify,
    page: analytics.page,
    trackAssessmentComplete: analytics.trackAssessmentComplete,
    trackCalculatorUsed: analytics.trackCalculatorUsed,
    trackLeadCaptured: analytics.trackLeadCaptured,
    trackLanguageChanged: analytics.trackLanguageChanged,
    trackEngagement: analytics.trackEngagement,
    trackError: analytics.trackError,
    trackSessionQuality: analytics.trackSessionQuality,
    trackROICalculated: analytics.trackROICalculated,
  };
}

export function useFormTracking() {
  return {
    trackFieldInteraction: (field: string) => {
      analytics.track('form_field_interaction', { field });
    },
    trackFormStart: (formName: string) => {
      analytics.track('form_start', { formName });
    },
    trackFormComplete: (formName: string) => {
      analytics.track('form_complete', { formName });
    },
    trackFormError: (formName: string, error: string) => {
      analytics.track('form_error', { formName, error });
    },
    trackContactStarted: (formName: string) => {
      analytics.track('contact_started', { formName });
    },
    trackContactCompleted: (formName: string) => {
      analytics.track('contact_completed', { formName });
    },
    trackLeadCaptured: (properties?: Record<string, unknown>) => {
      analytics.track('lead_captured', properties);
    },
  };
}

export function useConversionTracking() {
  return {
    trackConversion: (type: string, value?: number) => {
      analytics.track('conversion', { type, value });
    },
    trackLeadCapture: (source: string) => {
      analytics.track('lead_capture', { source });
    },
    trackServiceFunnelStep: (
      step: string,
      funnelType: string,
      properties?: Record<string, unknown>
    ) => {
      analytics.track('service_funnel_step', { step, funnelType, ...properties });
    },
    trackPurchaseIntent: (type: string, value?: number) => {
      analytics.track('purchase_intent', { type, value });
    },
  };
}

export function useErrorTracking() {
  return {
    trackError: (message: string, location?: string, severity?: string) => {
      analytics.track('error', { message, location, severity });
    },
  };
}

export function useFeatureTracking() {
  return {
    trackFeatureUsage: (feature: string, properties?: Record<string, unknown>) => {
      analytics.track('feature_usage', { feature, ...properties });
    },
    trackCalculatorUsed: (properties?: Record<string, unknown>) => {
      analytics.track('calculator_used', properties);
    },
    trackPurchaseIntent: (properties?: Record<string, unknown>) => {
      analytics.track('purchase_intent', properties);
    },
  };
}
