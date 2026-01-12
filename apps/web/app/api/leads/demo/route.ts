import { analytics } from '@madfam/analytics';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withCsrfProtection } from '@/lib/csrf';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { LeadSource, LeadStatus } from '@/lib/prisma-types';
import { withRateLimit } from '@/lib/rate-limit';

// Demo prep lead schema
const demoLeadSchema = z.object({
  product: z.enum(['dhanam', 'forge-sight', 'penny', 'cotiza']),
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  company: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  useCase: z.string().min(1, 'Use case is required'),
  teamSize: z.string().optional(),
  monthlyVolume: z.string().optional(),
  challenges: z.array(z.string()).optional(),
  timeline: z.string().optional(),
  budget: z.string().optional(),
  preferredLanguage: z.enum(['es', 'en', 'pt']).default('es'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type DemoLeadData = z.infer<typeof demoLeadSchema>;

// Calculate demo lead score based on qualification signals
function calculateDemoLeadScore(lead: DemoLeadData): number {
  let score = 30; // Base score for demo interest

  // Business email bonus
  if (lead.email) {
    const domain = lead.email.split('@')[1];
    if (
      domain &&
      !domain.includes('gmail') &&
      !domain.includes('hotmail') &&
      !domain.includes('yahoo') &&
      !domain.includes('outlook')
    ) {
      score += 15;
    }
  }

  // Company provided
  if (lead.company) {
    score += 10;
  }

  // Team size scoring
  if (lead.teamSize) {
    const size = lead.teamSize.toLowerCase();
    if (size.includes('500') || size.includes('1000') || size.includes('enterprise')) {
      score += 20;
    } else if (size.includes('200') || size.includes('100')) {
      score += 15;
    } else if (size.includes('50')) {
      score += 10;
    }
  }

  // Monthly volume (for Forge Sight)
  if (lead.monthlyVolume) {
    const volume = lead.monthlyVolume.toLowerCase();
    if (volume.includes('1000') || volume.includes('high')) {
      score += 15;
    } else if (volume.includes('500') || volume.includes('medium')) {
      score += 10;
    }
  }

  // Timeline urgency
  if (lead.timeline) {
    const timeline = lead.timeline.toLowerCase();
    if (
      timeline.includes('immediate') ||
      timeline.includes('asap') ||
      timeline.includes('1 month')
    ) {
      score += 15;
    } else if (timeline.includes('quarter') || timeline.includes('3 month')) {
      score += 10;
    }
  }

  // Budget indication
  if (lead.budget) {
    const budget = lead.budget.toLowerCase();
    if (budget.includes('100k') || budget.includes('enterprise')) {
      score += 20;
    } else if (budget.includes('50k') || budget.includes('growth')) {
      score += 15;
    } else if (budget.includes('10k') || budget.includes('starter')) {
      score += 5;
    }
  }

  // Multiple challenges = higher intent
  if (lead.challenges && lead.challenges.length > 2) {
    score += 10;
  }

  return Math.min(score, 100);
}

// Product-specific tags
function getProductTags(product: string, useCase: string): string[] {
  const tags = [`demo-prep`, `product:${product}`];

  switch (product) {
    case 'dhanam':
      tags.push('financial-wellness', 'b2b-hr');
      break;
    case 'forge-sight':
      tags.push('manufacturing', 'pricing-intelligence', 'quoting');
      break;
    case 'penny':
      tags.push('ai-assistant', 'customer-service');
      break;
    case 'cotiza':
      tags.push('quoting', 'estimation', 'saas');
      break;
  }

  if (useCase) {
    tags.push(`usecase:${useCase.toLowerCase().replace(/\s+/g, '-')}`);
  }

  return tags;
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = demoLeadSchema.parse(body);

    const score = calculateDemoLeadScore(validatedData);
    const tags = getProductTags(validatedData.product, validatedData.useCase);

    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined;

    // Split name if provided
    const nameParts = validatedData.name?.split(' ') || [];
    const firstName = nameParts[0] || validatedData.email.split('@')[0];
    const lastName = nameParts.slice(1).join(' ') || undefined;

    // Create lead in database
    const lead = await prisma.lead.create({
      data: {
        email: validatedData.email,
        firstName,
        lastName,
        company: validatedData.company,
        source: LeadSource.DEMO_REQUEST,
        score,
        status: LeadStatus.NEW,
        userAgent,
        ipAddress,
        tags,
        utmSource: (validatedData.metadata?.utm_source as string) || undefined,
        utmMedium: (validatedData.metadata?.utm_medium as string) || undefined,
        utmCampaign: (validatedData.metadata?.utm_campaign as string) || undefined,
        // Store demo-specific data in metadata
        metadata: {
          product: validatedData.product,
          role: validatedData.role,
          useCase: validatedData.useCase,
          teamSize: validatedData.teamSize,
          monthlyVolume: validatedData.monthlyVolume,
          challenges: validatedData.challenges,
          timeline: validatedData.timeline,
          budget: validatedData.budget,
          preferredLanguage: validatedData.preferredLanguage,
        },
      },
    });

    // Track analytics
    analytics.trackLeadCaptured({
      source: 'demo-prep',
      form: `demo-prep-${validatedData.product}`,
      product: validatedData.product,
    });

    // Track in database analytics
    await prisma.analyticsEvent.create({
      data: {
        event: 'demo_lead_captured',
        properties: {
          leadId: lead.id,
          score: lead.score,
          product: validatedData.product,
          role: validatedData.role,
          useCase: validatedData.useCase,
        },
        url: request.headers.get('referer') || undefined,
        userAgent,
        ipAddress,
      },
    });

    apiLogger.info('Demo lead captured', {
      leadId: lead.id,
      score: lead.score,
      product: validatedData.product,
    });

    // Queue product-specific welcome email
    await prisma.emailQueue.create({
      data: {
        to: [lead.email],
        subject: getEmailSubject(validatedData.product, validatedData.preferredLanguage),
        template: `demo-welcome-${validatedData.product}`,
        data: {
          name: firstName,
          product: validatedData.product,
          role: validatedData.role,
          useCase: validatedData.useCase,
          language: validatedData.preferredLanguage,
        },
      },
    });

    // Trigger CRM/n8n webhook with demo-specific data
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify({
          event: 'demo_lead.created',
          data: {
            id: lead.id,
            email: lead.email,
            name: validatedData.name || firstName,
            company: lead.company,
            score: lead.score,
            product: validatedData.product,
            role: validatedData.role,
            useCase: validatedData.useCase,
            teamSize: validatedData.teamSize,
            monthlyVolume: validatedData.monthlyVolume,
            timeline: validatedData.timeline,
            budget: validatedData.budget,
            tags,
          },
        }),
      }).catch(error => {
        apiLogger.error('Failed to trigger demo lead webhook', error, {
          leadId: lead.id,
        });
      });
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      score: lead.score,
      message: getSuccessMessage(validatedData.preferredLanguage),
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

    apiLogger.error('Demo lead creation error', error as Error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing request',
      },
      { status: 500 }
    );
  }
}

function getEmailSubject(product: string, lang: string): string {
  const subjects: Record<string, Record<string, string>> = {
    dhanam: {
      es: '¡Bienvenido a Dhanam! Tu demo está lista',
      en: 'Welcome to Dhanam! Your demo is ready',
      pt: 'Bem-vindo ao Dhanam! Sua demo está pronta',
    },
    'forge-sight': {
      es: '¡Bienvenido a Forge Sight! Tu demo está lista',
      en: 'Welcome to Forge Sight! Your demo is ready',
      pt: 'Bem-vindo ao Forge Sight! Sua demo está pronta',
    },
    penny: {
      es: '¡Bienvenido a PENNY! Tu demo está lista',
      en: 'Welcome to PENNY! Your demo is ready',
      pt: 'Bem-vindo ao PENNY! Sua demo está pronta',
    },
    cotiza: {
      es: '¡Bienvenido a Cotiza! Tu demo está lista',
      en: 'Welcome to Cotiza! Your demo is ready',
      pt: 'Bem-vindo ao Cotiza! Sua demo está pronta',
    },
  };

  return subjects[product]?.[lang] || subjects[product]?.['en'] || 'Welcome! Your demo is ready';
}

function getSuccessMessage(lang: string): string {
  const messages: Record<string, string> = {
    es: 'Gracias por tu interés. Tu demo personalizada está lista. Revisa tu correo para los próximos pasos.',
    en: 'Thank you for your interest. Your personalized demo is ready. Check your email for next steps.',
    pt: 'Obrigado pelo seu interesse. Sua demo personalizada está pronta. Verifique seu email para os próximos passos.',
  };

  return messages[lang] ?? messages['en'] ?? 'Thank you for your interest.';
}

const handlePOSTWithSecurity = async (request: NextRequest) => {
  return withCsrfProtection(request, () => handlePOST(request));
};

export const POST = withRateLimit(handlePOSTWithSecurity, {
  maxRequests: 10,
  windowMs: 60000,
});
