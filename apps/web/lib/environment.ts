// Environment type definitions
export type EnvironmentType = 'development' | 'staging' | 'production';
export type DeployTarget = 'vercel' | 'github-pages' | 'aws' | 'cloudflare';

// Environment configuration interface
interface EnvironmentConfig {
  // Environment detection
  type: EnvironmentType;
  isStaging: boolean;
  isProduction: boolean;
  isDevelopment: boolean;
  isStaticExport: boolean;
  deployTarget: DeployTarget;

  // Build information
  build: {
    timestamp: string;
    commit: string;
    branch: string;
    version: string;
  };

  // Features configuration
  features: {
    database: boolean;
    authentication: boolean;
    emailQueue: boolean;
    webhooks: boolean;
    analytics: boolean;
    featureFlags: boolean;
    cms: boolean;
    errorReporting: boolean;
    performanceMonitoring: boolean;
  };

  // API configuration
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };

  // CMS configuration
  cms: {
    url: string;
    enabled: boolean;
    timeout: number;
    cacheEnabled: boolean;
    cacheTtl: number;
  };

  // External services
  services: {
    plausible: {
      domain: string;
      enabled: boolean;
    };
    n8n: {
      enabled: boolean;
      webhookUrl?: string;
    };
    sentry: {
      enabled: boolean;
      dsn?: string;
      environment: string;
    };
  };

  // Performance configuration
  performance: {
    enableServiceWorker: boolean;
    enablePreloading: boolean;
    imageOptimization: boolean;
    bundleAnalysis: boolean;
    performanceMonitoring: boolean;
  };
}

// Get environment type with fallback
function getEnvironmentType(): EnvironmentType {
  if (process.env.NODE_ENV === 'development') return 'development';
  if (process.env.NEXT_PUBLIC_ENV === 'staging') return 'staging';
  if (process.env.NEXT_PUBLIC_ENV === 'production') return 'production';
  return 'development'; // Default fallback
}

// Get deploy target with fallback
function getDeployTarget(): DeployTarget {
  const target = process.env.DEPLOY_TARGET;
  if (target === 'github-pages') return 'github-pages';
  if (target === 'aws') return 'aws';
  if (target === 'cloudflare') return 'cloudflare';
  return 'vercel'; // Default
}

// Build configuration from environment variables
function createEnvironmentConfig(): EnvironmentConfig {
  const envType = getEnvironmentType();
  const deployTarget = getDeployTarget();
  const isStaticExport = deployTarget === 'github-pages';
  const isDev = envType === 'development';
  const isProd = envType === 'production';

  return {
    // Environment detection
    type: envType,
    isStaging: envType === 'staging',
    isProduction: isProd,
    isDevelopment: isDev,
    isStaticExport,
    deployTarget,

    // Build information
    build: {
      timestamp: process.env.BUILD_TIMESTAMP || new Date().toISOString(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'unknown',
      branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || 'unknown',
      version: process.env.npm_package_version || '1.0.0',
    },

    // Features configuration based on environment
    features: {
      database: !isStaticExport && process.env.DATABASE_URL !== undefined,
      authentication: !isStaticExport,
      emailQueue: !isStaticExport,
      webhooks: !isStaticExport,
      analytics: true, // Always enabled
      featureFlags: process.env.NEXT_PUBLIC_FEATURE_FLAGS_ENABLED === 'true',
      cms: !isStaticExport && !!process.env.NEXT_PUBLIC_CMS_URL,
      errorReporting: isProd || process.env.SENTRY_DSN !== undefined,
      performanceMonitoring: isProd,
    },

    // API configuration
    api: {
      baseUrl:
        process.env.NEXT_PUBLIC_API_URL || (isStaticExport ? 'https://api.madfam.io' : '/api'),
      timeout: isDev ? 10000 : 30000, // 10s dev, 30s prod
      retries: isDev ? 1 : 3,
    },

    // CMS configuration
    cms: {
      url:
        process.env.NEXT_PUBLIC_CMS_URL ||
        (isStaticExport ? 'https://cms.madfam.io' : 'http://localhost:3001'),
      enabled: !isStaticExport && !!process.env.NEXT_PUBLIC_CMS_URL, // Only enable CMS if URL is explicitly provided
      timeout: 30000,
      cacheEnabled: true,
      cacheTtl: isDev ? 300 : 3600, // 5 min dev, 1 hour prod
    },

    // External services
    services: {
      plausible: {
        domain: process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || 'madfam.io',
        enabled: !isDev || process.env.ENABLE_ANALYTICS_IN_DEV === 'true',
      },
      n8n: {
        enabled: !isStaticExport,
        webhookUrl: process.env.N8N_WEBHOOK_URL,
      },
      sentry: {
        enabled: isProd || process.env.SENTRY_DSN !== undefined,
        dsn: process.env.SENTRY_DSN,
        environment: envType,
      },
    },

    // Performance configuration
    performance: {
      enableServiceWorker: isProd,
      enablePreloading: !isDev,
      imageOptimization: true,
      bundleAnalysis: process.env.ANALYZE === 'true',
      performanceMonitoring: isProd || isDev,
    },
  };
}

export const environment = createEnvironmentConfig();

// Legacy exports for backward compatibility
export const { isStaging, isProduction, isDevelopment, isStaticExport } = environment;

// Utility functions
export function getEnvironmentInfo() {
  return {
    ...environment.build,
    environment: environment.type,
    deployTarget: environment.deployTarget,
    features: Object.entries(environment.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
  };
}

export function isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
  return environment.features[feature] ?? false;
}

export function getApiUrl(path = ''): string {
  const { api } = environment;
  return path ? `${api.baseUrl}${path.startsWith('/') ? '' : '/'}${path}` : api.baseUrl;
}

export function getCmsUrl(path = ''): string {
  const baseUrl = environment.cms.url;
  return path ? `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}` : baseUrl;
}

// Environment validation
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required environment variables
  if (environment.isProduction) {
    if (!process.env.DATABASE_URL && environment.features.database) {
      errors.push('DATABASE_URL is required in production when database feature is enabled');
    }

    if (!process.env.JANUA_SECRET && environment.features.authentication) {
      errors.push('JANUA_SECRET is required in production when authentication is enabled');
    }

    if (!environment.services.sentry.dsn && environment.services.sentry.enabled) {
      errors.push('SENTRY_DSN is recommended in production for error tracking');
    }
  }

  // Check CMS configuration
  if (environment.cms.enabled && !environment.cms.url) {
    errors.push('CMS_URL is required when CMS is enabled');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Debug information (only in development)
if (environment.isDevelopment) {
  // eslint-disable-next-line no-console
  console.log('🔧 Environment Configuration:', {
    type: environment.type,
    deployTarget: environment.deployTarget,
    features: Object.entries(environment.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature),
    cms: environment.cms.enabled ? 'enabled' : 'disabled',
    build: environment.build,
  });

  const validation = validateEnvironment();
  if (!validation.valid) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Environment validation warnings:', validation.errors);
  }
}
