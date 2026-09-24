import { createHash } from 'crypto';
import { FeatureFlagProvider } from '@madfam-site/core';
import { NextRequest, NextResponse } from 'next/server';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

/**
 * Generate a stable rollout percentage for a given identifier and flag key.
 * Uses SHA-256 hash so the same user always gets the same result.
 */
function stableRolloutHash(flagKey: string, identifier: string): number {
  const hash = createHash('sha256').update(`${flagKey}:${identifier}`).digest();
  const uint32 = hash.readUInt32BE(0);
  return uint32 % 100;
}

// GET /api/feature-flags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const flag = searchParams.get('flag');
    const environment = searchParams.get('env') || process.env.NEXT_PUBLIC_ENV || 'development';

    // Stable identifier for rollout: prefer userId query param, fall back to IP
    const identifier =
      searchParams.get('userId') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous';

    if (flag) {
      // Get specific flag — wrap in try-catch so we gracefully fall back
      // when the database is unavailable (no DATABASE_URL configured)
      let featureFlag = null;
      try {
        featureFlag = await prisma.featureFlag.findUnique({
          where: { key: flag },
        });
      } catch {
        // Database unavailable — fall through to provider
      }

      if (!featureFlag) {
        // Fallback to core provider if not in database
        const provider = new FeatureFlagProvider();
        const isEnabled = provider.isEnabled(flag);

        return NextResponse.json({
          key: flag,
          enabled: isEnabled,
          environment,
          source: 'provider',
        });
      }

      // Check if enabled for the current environment
      let isEnabled = false;
      switch (environment) {
        case 'development':
          isEnabled = featureFlag.enabledDev;
          break;
        case 'staging':
          isEnabled = featureFlag.enabledStaging;
          break;
        case 'production':
          isEnabled = featureFlag.enabledProd;
          break;
        default:
          isEnabled = featureFlag.enabled;
      }

      // Check rollout percentage if applicable
      let finalEnabled = isEnabled;
      if (isEnabled && environment === 'production' && featureFlag.rolloutPercentage) {
        const hash = stableRolloutHash(featureFlag.key, identifier);
        finalEnabled = hash < featureFlag.rolloutPercentage;
      }

      return NextResponse.json({
        key: featureFlag.key,
        enabled: finalEnabled,
        environment,
        source: 'database',
        metadata: {
          name: featureFlag.name,
          description: featureFlag.description,
          rolloutPercentage: featureFlag.rolloutPercentage,
        },
      });
    } else {
      // Get all flags — wrap in try-catch for database unavailability
      let flags: Awaited<ReturnType<typeof prisma.featureFlag.findMany>> = [];
      try {
        flags = await prisma.featureFlag.findMany({
          where: { enabled: true },
        });
      } catch {
        // Database unavailable — continue with provider-only flags
      }

      // Merge with provider flags
      const provider = new FeatureFlagProvider();
      const providerFlags = [
        'NEW_LEAD_SCORING',
        'INTERACTIVE_CALCULATOR',
        'CHAT_SUPPORT',
        'PORTUGUESE_LOCALE',
        'ADVANCED_ANALYTICS',
        'N8N_WORKFLOWS',
      ];

      const allFlags: Record<string, boolean> = {};

      // Add database flags
      for (const dbFlag of flags) {
        let isEnabled = false;
        switch (environment) {
          case 'development':
            isEnabled = dbFlag.enabledDev;
            break;
          case 'staging':
            isEnabled = dbFlag.enabledStaging;
            break;
          case 'production':
            isEnabled = dbFlag.enabledProd;
            break;
          default:
            isEnabled = dbFlag.enabled;
        }

        // Check rollout percentage
        if (isEnabled && environment === 'production' && dbFlag.rolloutPercentage) {
          const hash = stableRolloutHash(dbFlag.key, identifier);
          isEnabled = hash < dbFlag.rolloutPercentage;
        }

        allFlags[dbFlag.key] = isEnabled;
      }

      // Add provider flags not in database
      for (const flagKey of providerFlags) {
        if (!(flagKey in allFlags)) {
          allFlags[flagKey] = provider.isEnabled(flagKey);
        }
      }

      return NextResponse.json({
        flags: allFlags,
        environment,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    apiLogger.error('Error fetching feature flags', error as Error);
    return NextResponse.json({ error: 'Failed to fetch feature flags' }, { status: 500 });
  }
}

// Admin writes (POST/PATCH) were removed with the /dashboard surface: they were
// gated on a signed-in admin session, and madfam.io no longer has sign-in
// (finding C-003 / R42). Flags are managed in the database directly.
