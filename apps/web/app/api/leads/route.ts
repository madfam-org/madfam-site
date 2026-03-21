import { analytics } from '@madfam/analytics';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withCsrfProtection } from '@/lib/csrf';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { LeadSource, LeadStatus } from '@prisma/client';
import { withRateLimit } from '@/lib/rate-limit';
import { validateBearerToken } from '@/lib/security';

// Lead schema validation
const leadSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  company: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().optional(),
  source: z.string().default('website'),
  preferredLanguage: z.enum(['es', 'en']).default('es'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type LeadData = z.infer<typeof leadSchema>;

// Simple lead scoring algorithm
function calculateLeadScore(lead: LeadData): number {
  let score = 0;

  // Email domain scoring
  if (lead.email) {
    const domain = lead.email.split('@')[1];
    if (
      domain &&
      !domain.includes('gmail') &&
      !domain.includes('hotmail') &&
      !domain.includes('yahoo')
    ) {
      score += 20; // Business email
    }
  }

  // Company provided
  if (lead.company) {
    score += 15;
  }

  // Phone provided
  if (lead.phone) {
    score += 10;
  }

  // Message interest shows engagement
  if (lead.message && lead.message.length > 20) {
    score += 25; // Additional points for detailed inquiry
  }

  // Message length (shows engagement)
  if (lead.message && lead.message.length > 50) {
    score += 15;
  }

  return Math.min(score, 100); // Cap at 100
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = leadSchema.parse(body);

    // Calculate lead score
    const score = calculateLeadScore(validatedData);

    // Extract user agent and IP for tracking
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined;

    // Split name into firstName and lastName with null safety
    const nameParts = validatedData.name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || undefined;

    // Create lead in database
    const lead = await prisma.lead.create({
      data: {
        email: validatedData.email,
        firstName,
        lastName,
        company: validatedData.company,
        phone: validatedData.phone,
        message: validatedData.message,
        source: LeadSource.WEBSITE,
        score,
        status: LeadStatus.NEW,
        userAgent,
        ipAddress,
        // Store additional metadata
        utmSource: (validatedData.metadata?.utm_source as string) || undefined,
        utmMedium: (validatedData.metadata?.utm_medium as string) || undefined,
        utmCampaign: (validatedData.metadata?.utm_campaign as string) || undefined,
      },
    });

    // Track analytics
    analytics.trackLeadCaptured({
      source: validatedData.source,
      form: 'main-lead-form',
    });

    // Track in database analytics
    await prisma.analyticsEvent.create({
      data: {
        event: 'lead_captured',
        properties: {
          leadId: lead.id,
          score: lead.score,
          source: lead.source,
        },
        url: request.headers.get('referer') || undefined,
        userAgent,
        ipAddress,
      },
    });

    apiLogger.info('Lead captured successfully', {
      leadId: lead.id,
      score: lead.score,
      source: lead.source,
    });

    // Queue welcome email
    await prisma.emailQueue.create({
      data: {
        to: [lead.email],
        subject:
          validatedData.preferredLanguage === 'es' ? 'Bienvenido a MADFAM' : 'Welcome to MADFAM',
        template: 'welcome',
        data: {
          name: validatedData.name,
          language: validatedData.preferredLanguage,
        },
      },
    });

    // Trigger n8n webhook
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify({
          event: 'lead.created',
          data: {
            id: lead.id,
            email: lead.email,
            name: validatedData.name,
            company: lead.company,
            score: lead.score,
            source: lead.source,
          },
        }),
      }).catch(error => {
        apiLogger.error('Failed to trigger n8n webhook', error, {
          leadId: lead.id,
        });
      });
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      score: lead.score,
      message:
        validatedData.preferredLanguage === 'es'
          ? 'Gracias por tu interés. Nos pondremos en contacto pronto.'
          : 'Thank you for your interest. We will contact you soon.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    apiLogger.error('Lead creation error', error as Error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al procesar la solicitud',
      },
      { status: 500 }
    );
  }
}

// Get leads (protected endpoint)
async function handleGET(request: NextRequest) {
  try {
    // Check authentication with timing-safe comparison
    const authHeader = request.headers.get('authorization');
    const apiSecret = process.env.API_SECRET;

    if (!apiSecret) {
      apiLogger.error('API_SECRET not configured', new Error('Missing API_SECRET'));
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!validateBearerToken(authHeader, apiSecret)) {
      apiLogger.warn('Unauthorized leads API access attempt', {
        ip:
          request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip'),
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as LeadStatus | null;

    // Build where clause
    const where = {
      ...(status && { status }),
    };

    // Fetch leads with pagination
    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          notes: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    apiLogger.error('Error fetching leads', error as Error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

// Compose POST handler with CSRF protection and rate limiting
const handlePOSTWithSecurity = async (request: NextRequest) => {
  return withCsrfProtection(request, () => handlePOST(request));
};

// Apply rate limiting to exports
export const POST = withRateLimit(handlePOSTWithSecurity, { maxRequests: 10, windowMs: 60000 }); // 10 requests per minute
export const GET = withRateLimit(handleGET, { maxRequests: 100, windowMs: 60000 }); // 100 requests per minute
