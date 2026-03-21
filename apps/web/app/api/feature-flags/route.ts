import { createHash } from 'crypto';
import { FeatureFlagProvider } from '@madfam/core';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerAuth } from '@/lib/auth';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

/**
 * Generate a stable rollout percentage for a given identifier and flag key.
 * Uses SHA-256 hash so the same user always gets the same result.
 */
function stableRolloutHash(flagKey: string, identifier: string): number {
  const hash = createHash('sha256').update(`${flagKey}:${identifier}`).digest();
  const uint32 = hash.readUInt32BE(0);
  return uint32 % 100;
}

// Input validation schemas
const CreateFlagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[A-Z_][A-Z0-9_]*$/, 'Key must be uppercase with underscores'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  enabledDev: z.boolean().optional(),
  enabledStaging: z.boolean().optional(),
  enabledProd: z.boolean().optional(),
  rolloutPercentage: z.number().min(0).max(100).optional(),
  userGroups: z.array(z.string()).optional(),
});

const ToggleFlagSchema = z.object({
  key: z.string().min(1).max(50),
  enabled: z.boolean(),
  environment: z.enum(['development', 'staging', 'production']).optional(),
});

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
      // Get specific flag
      const featureFlag = await prisma.featureFlag.findUnique({
        where: { key: flag },
      });

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
      // Get all flags
      const flags = await prisma.featureFlag.findMany({
        where: { enabled: true },
      });

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

// POST /api/feature-flags (admin only)
export async function POST(request: NextRequest) {
  try {
    // Authentication check - admin only
    const session = await getServerAuth();
    if (!session?.user) {
      apiLogger.warn('Unauthorized feature flag creation attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      apiLogger.warn('Unauthorized feature flag creation attempt', {
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validated = CreateFlagSchema.parse(body);

    const featureFlag = await prisma.featureFlag.upsert({
      where: { key: validated.key },
      update: {
        name: validated.name,
        description: validated.description,
        enabledDev: validated.enabledDev ?? true,
        enabledStaging: validated.enabledStaging ?? false,
        enabledProd: validated.enabledProd ?? false,
        rolloutPercentage: validated.rolloutPercentage,
        userGroups: validated.userGroups || [],
        enabled: true,
      },
      create: {
        key: validated.key,
        name: validated.name,
        description: validated.description,
        enabledDev: validated.enabledDev ?? true,
        enabledStaging: validated.enabledStaging ?? false,
        enabledProd: validated.enabledProd ?? false,
        rolloutPercentage: validated.rolloutPercentage,
        userGroups: validated.userGroups || [],
        enabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      flag: featureFlag,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    apiLogger.error('Error creating/updating feature flag', error as Error);
    return NextResponse.json({ error: 'Failed to create/update feature flag' }, { status: 500 });
  }
}

// PATCH /api/feature-flags (toggle flag)
export async function PATCH(request: NextRequest) {
  try {
    // Authentication check - admin only
    const session = await getServerAuth();
    if (!session?.user) {
      apiLogger.warn('Unauthorized feature flag toggle attempt - no session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      apiLogger.warn('Unauthorized feature flag toggle attempt', {
        userId: session.user.id,
        role: session.user.role,
      });
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validated = ToggleFlagSchema.parse(body);

    const featureFlag = await prisma.featureFlag.findUnique({
      where: { key: validated.key },
    });

    if (!featureFlag) {
      return NextResponse.json({ error: 'Feature flag not found' }, { status: 404 });
    }

    // Update environment-specific setting
    const updateData: {
      enabled?: boolean;
      enabledDev?: boolean;
      enabledStaging?: boolean;
      enabledProd?: boolean;
    } = {};
    switch (validated.environment || 'development') {
      case 'development':
        updateData.enabledDev = validated.enabled;
        break;
      case 'staging':
        updateData.enabledStaging = validated.enabled;
        break;
      case 'production':
        updateData.enabledProd = validated.enabled;
        break;
      default:
        updateData.enabled = validated.enabled;
    }

    const updated = await prisma.featureFlag.update({
      where: { key: validated.key },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      flag: updated,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
    }
    apiLogger.error('Error toggling feature flag', error as Error);
    return NextResponse.json({ error: 'Failed to toggle feature flag' }, { status: 500 });
  }
}
