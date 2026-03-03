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

// Mock @madfam/analytics (package not yet implemented)
vi.mock('@madfam/analytics', () => ({
  analytics: {
    trackLeadFormSubmitted: vi.fn(),
    trackPageView: vi.fn(),
    trackEvent: vi.fn(),
  },
  useFormTracking: vi.fn(() => ({
    trackFormStart: vi.fn(),
    trackFormSubmit: vi.fn(),
    trackFormError: vi.fn(),
  })),
  useConversionTracking: vi.fn(() => ({
    trackConversion: vi.fn(),
  })),
  useErrorTracking: vi.fn(() => ({
    trackError: vi.fn(),
  })),
}));

// Mock @madfam/core (package not yet implemented)
vi.mock('@madfam/core', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
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
