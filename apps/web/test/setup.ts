import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
    };
  },
  usePathname() {
    return '/';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Janua auth
vi.mock('@janua/nextjs', () => ({
  useJanua: () => ({ client: { getAccessToken: () => null } }),
  useUser: () => ({ user: null }),
  useAuth: () => ({ isAuthenticated: false, isLoading: false, signOut: vi.fn() }),
}));

// Mock @madfam/analytics — aligned with packages/analytics/src/index.ts exports
vi.mock('@madfam/analytics', () => ({
  analytics: {
    track: vi.fn(),
    identify: vi.fn(),
    page: vi.fn(),
    trackAssessmentComplete: vi.fn(),
    trackCalculatorUsed: vi.fn(),
    trackLeadCaptured: vi.fn(),
    trackLanguageChanged: vi.fn(),
    trackEngagement: vi.fn(),
    trackError: vi.fn(),
    trackSessionQuality: vi.fn(),
    trackROICalculated: vi.fn(),
  },
  useAnalytics: vi.fn(() => ({
    track: vi.fn(),
    identify: vi.fn(),
    page: vi.fn(),
    trackAssessmentComplete: vi.fn(),
    trackCalculatorUsed: vi.fn(),
    trackLeadCaptured: vi.fn(),
    trackLanguageChanged: vi.fn(),
    trackEngagement: vi.fn(),
    trackError: vi.fn(),
    trackSessionQuality: vi.fn(),
    trackROICalculated: vi.fn(),
  })),
  useFormTracking: vi.fn(() => ({
    trackFieldInteraction: vi.fn(),
    trackFormStart: vi.fn(),
    trackFormComplete: vi.fn(),
    trackFormError: vi.fn(),
    trackContactStarted: vi.fn(),
    trackContactCompleted: vi.fn(),
    trackLeadCaptured: vi.fn(),
  })),
  useConversionTracking: vi.fn(() => ({
    trackConversion: vi.fn(),
    trackLeadCapture: vi.fn(),
    trackServiceFunnelStep: vi.fn(),
    trackPurchaseIntent: vi.fn(),
  })),
  useErrorTracking: vi.fn(() => ({
    trackError: vi.fn(),
  })),
  useFeatureTracking: vi.fn(() => ({
    trackFeatureUsage: vi.fn(),
    trackCalculatorUsed: vi.fn(),
    trackPurchaseIntent: vi.fn(),
  })),
}));

// Mock @madfam/core — aligned with packages/core/src/index.ts exports
vi.mock('@madfam/core', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    withContext: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  FeatureFlagProvider: vi.fn().mockImplementation(() => ({
    isEnabled: vi.fn().mockReturnValue(false),
    getAllFlags: vi.fn().mockReturnValue({}),
  })),
  featureFlags: {},
}));

// Mock environment variables
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
process.env.NEXT_PUBLIC_ENV = 'test';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
