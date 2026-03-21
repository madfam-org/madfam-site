// Core exports - All code consolidated to avoid module resolution issues

// Logger
export * from './logger';

// Feature Flags
export interface FeatureFlag {
  key: string;
  name: string;
  description: string;
  defaultValue: boolean;
  environments: {
    development: boolean;
    staging: boolean;
    production: boolean;
  };
  rolloutPercentage?: number;
  userGroups?: string[];
}

export const featureFlags: Record<string, FeatureFlag> = {
  NEW_LEAD_SCORING: {
    key: 'new_lead_scoring',
    name: 'AI Lead Scoring v2',
    description: 'Enhanced AI-powered lead scoring algorithm',
    defaultValue: false,
    environments: {
      development: true,
      staging: true,
      production: false,
    },
    rolloutPercentage: 10,
  },
  INTERACTIVE_CALCULATOR: {
    key: 'interactive_calculator',
    name: 'ROI Calculator',
    description: 'Interactive ROI calculator for services',
    defaultValue: false,
    environments: {
      development: true,
      staging: true,
      production: true,
    },
  },
  CHAT_SUPPORT: {
    key: 'chat_support',
    name: 'Live Chat Support',
    description: 'Real-time chat with support team',
    defaultValue: false,
    environments: {
      development: true,
      staging: false,
      production: false,
    },
  },
  PORTUGUESE_LOCALE: {
    key: 'portuguese_locale',
    name: 'Portuguese Language',
    description: 'Full Portuguese (BR) translation',
    defaultValue: false,
    environments: {
      development: true,
      staging: true,
      production: true,
    },
  },
  ADVANCED_ANALYTICS: {
    key: 'advanced_analytics',
    name: 'Advanced Analytics Dashboard',
    description: 'Enhanced analytics with AI insights',
    defaultValue: false,
    environments: {
      development: true,
      staging: true,
      production: false,
    },
  },
  N8N_WORKFLOWS: {
    key: 'n8n_workflows',
    name: 'n8n Workflow Integration',
    description: 'Automated workflows with n8n',
    defaultValue: true,
    environments: {
      development: true,
      staging: true,
      production: true,
    },
  },
};

export type Environment = 'development' | 'staging' | 'production';

export class FeatureFlagProvider {
  private environment: Environment;
  private userId?: string;

  constructor(environment?: string, userId?: string) {
    this.environment = (environment as Environment) || 'development';
    this.userId = userId;
  }

  isEnabled(flagKey: string): boolean {
    const flag = featureFlags[flagKey];
    if (!flag) return false;

    // Check environment-specific setting
    const envEnabled = flag.environments[this.environment];
    if (!envEnabled) return false;

    // Check rollout percentage if in production
    if (this.environment === 'production' && flag.rolloutPercentage) {
      return this.checkRolloutPercentage(flagKey, flag.rolloutPercentage);
    }

    return true;
  }

  getAllFlags(): Record<string, boolean> {
    const flags: Record<string, boolean> = {};

    Object.keys(featureFlags).forEach(key => {
      flags[key] = this.isEnabled(key);
    });

    return flags;
  }

  private checkRolloutPercentage(flagKey: string, percentage: number): boolean {
    if (!this.userId) return false;

    // Create a stable hash based on user ID and flag key
    const hash = this.hashString(`${this.userId}-${flagKey}`);
    return hash % 100 < percentage;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
