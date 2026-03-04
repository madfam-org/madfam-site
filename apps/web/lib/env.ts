import { z } from 'zod';

/**
 * Environment variable validation schema
 * Ensures all required environment variables are present and valid at startup
 */

// Server-side environment variables
const serverEnvSchema = z.object({
  // Database
  DATABASE_URL: z.string().url().min(1),

  // Authentication (Janua)
  JANUA_URL: z.string().url().optional(),
  JANUA_SECRET: z.string().min(32),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),

  // API Keys
  API_SECRET: z.string().min(32),
  N8N_API_KEY: z.string().min(16).optional(),
  N8N_WEBHOOK_URL: z.string().url().optional(),

  // Email Service
  RESEND_API_KEY: z.string().startsWith('re_').optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // External APIs (optional)
  OPENAI_API_KEY: z.string().startsWith('sk-').optional(),
  CLEARBIT_API_KEY: z.string().optional(),

  // Analytics (optional)
  PLAUSIBLE_API_KEY: z.string().optional(),

  // Error Tracking (optional)
  SENTRY_DSN: z.string().url().optional(),

  // Redis Cache (optional)
  REDIS_URL: z.string().url().optional(),

  // File Storage (optional)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // reCAPTCHA (optional)
  RECAPTCHA_SECRET_KEY: z.string().optional(),

  // Slack Notifications (optional)
  SLACK_WEBHOOK_URL: z.string().url().optional(),

  // Cloudflare (optional)
  CLOUDFLARE_ZONE_ID: z.string().optional(),
  CLOUDFLARE_API_TOKEN: z.string().optional(),

  // Rate Limiting (optional with defaults)
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().optional().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().optional().default(100),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
});

// Client-side environment variables (must be prefixed with NEXT_PUBLIC_)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_ENV: z
    .enum(['development', 'staging', 'production'])
    .optional()
    .default('development'),
  NEXT_PUBLIC_FEATURE_FLAGS_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform(val => val === 'true'),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_VERSION: z.string().optional(),
});

/**
 * Validate server environment variables
 * Should be called at server startup
 */
export function validateServerEnv() {
  try {
    const parsed = serverEnvSchema.parse(process.env);
    return { success: true as const, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map(err => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      console.error('❌ Invalid server environment variables:');
      console.error(missingVars);
      console.error('\nPlease check your .env file and ensure all required variables are set.');

      return { success: false as const, error: error.issues };
    }
    throw error;
  }
}

/**
 * Validate client environment variables
 * Should be called at build time
 */
export function validateClientEnv() {
  try {
    const parsed = clientEnvSchema.parse(process.env);
    return { success: true as const, data: parsed };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues
        .map(err => `  - ${err.path.join('.')}: ${err.message}`)
        .join('\n');

      console.error('❌ Invalid client environment variables:');
      console.error(missingVars);

      return { success: false as const, error: error.issues };
    }
    throw error;
  }
}

/**
 * Get validated server environment variables
 * Throws if validation fails
 */
export function getServerEnv() {
  const result = validateServerEnv();
  if (!result.success) {
    throw new Error('Invalid server environment variables');
  }
  return result.data;
}

/**
 * Get validated client environment variables
 * Throws if validation fails
 */
export function getClientEnv() {
  const result = validateClientEnv();
  if (!result.success) {
    throw new Error('Invalid client environment variables');
  }
  return result.data;
}

/**
 * Type-safe environment variable access
 * Use this instead of process.env for better type safety
 */
export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Typed environment variable export
 */
export const env = {
  ...process.env,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || '',
  API_SECRET: process.env.API_SECRET || '',
  JANUA_SECRET: process.env.JANUA_SECRET || '',
} as ServerEnv;

// Validate environment variables at module load time (server-side only)
if (typeof window === 'undefined') {
  const result = validateServerEnv();
  if (!result.success) {
    console.warn('⚠️  Server started with invalid environment variables.');
    console.warn('⚠️  Some features may not work correctly.');
  } else {
    // eslint-disable-next-line no-console
    console.log('✅ Server environment variables validated successfully');
  }
}
