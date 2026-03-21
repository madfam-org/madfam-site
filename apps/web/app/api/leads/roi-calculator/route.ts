import { analytics } from '@madfam/analytics';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withCsrfProtection } from '@/lib/csrf';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { LeadSource, LeadStatus } from '@prisma/client';
import { withRateLimit } from '@/lib/rate-limit';

// ROI Calculator lead schema
const roiLeadSchema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().optional(),
  company: z.string().optional(),
  // ROI calculation inputs
  currentCosts: z.number().min(0),
  employeeCount: z.number().min(1).optional(),
  employeeHours: z.number().min(0).optional(),
  additionalRevenue: z.number().min(0).optional(),
  serviceTier: z.string(),
  // ROI calculation results
  results: z.object({
    monthlySavings: z.number(),
    timeSavedHours: z.number(),
    roiPercentage: z.number(),
    paybackMonths: z.number(),
    annualBenefit: z.number(),
  }),
  industry: z.string().optional(),
  preferredLanguage: z.enum(['es', 'en', 'pt']).default('es'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type ROILeadData = z.infer<typeof roiLeadSchema>;

// Calculate lead score based on ROI results and company info
function calculateROILeadScore(lead: ROILeadData): number {
  let score = 25; // Base score for ROI calculator engagement

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

  // High ROI = high intent
  if (lead.results.roiPercentage > 200) {
    score += 20;
  } else if (lead.results.roiPercentage > 100) {
    score += 15;
  } else if (lead.results.roiPercentage > 50) {
    score += 10;
  }

  // Higher current costs = larger opportunity
  if (lead.currentCosts > 100000) {
    score += 20;
  } else if (lead.currentCosts > 50000) {
    score += 15;
  } else if (lead.currentCosts > 20000) {
    score += 10;
  }

  // Higher tier interest
  const tierScores: Record<string, number> = {
    STRATEGIC_PARTNERSHIPS: 20,
    PLATFORM_PILOTS: 15,
    STRATEGY_ENABLEMENT: 10,
    DESIGN_FABRICATION: 5,
  };
  score += tierScores[lead.serviceTier] || 0;

  // Short payback = good fit
  if (lead.results.paybackMonths <= 3) {
    score += 10;
  } else if (lead.results.paybackMonths <= 6) {
    score += 5;
  }

  return Math.min(score, 100);
}

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = roiLeadSchema.parse(body);

    const score = calculateROILeadScore(validatedData);

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
        source: LeadSource.ROI_CALCULATOR,
        score,
        status: LeadStatus.NEW,
        userAgent,
        ipAddress,
        tags: [
          'roi-calculator',
          `tier:${validatedData.serviceTier}`,
          `roi:${Math.round(validatedData.results.roiPercentage)}%`,
          validatedData.industry ? `industry:${validatedData.industry}` : null,
        ].filter(Boolean) as string[],
        utmSource: (validatedData.metadata?.utm_source as string) || undefined,
        utmMedium: (validatedData.metadata?.utm_medium as string) || undefined,
        utmCampaign: (validatedData.metadata?.utm_campaign as string) || undefined,
        // Store ROI-specific data
        metadata: {
          roiCalculation: {
            inputs: {
              currentCosts: validatedData.currentCosts,
              employeeCount: validatedData.employeeCount,
              employeeHours: validatedData.employeeHours,
              additionalRevenue: validatedData.additionalRevenue,
              serviceTier: validatedData.serviceTier,
            },
            results: validatedData.results,
          },
          industry: validatedData.industry,
          preferredLanguage: validatedData.preferredLanguage,
        },
      },
    });

    // Track analytics
    analytics.trackLeadCaptured({
      source: 'roi-calculator',
      form: 'roi-calculator',
      tier: validatedData.serviceTier,
    });

    // Track ROI calculation event
    analytics.trackROICalculated({
      tier: validatedData.serviceTier,
      roiPercentage: validatedData.results.roiPercentage,
      paybackMonths: validatedData.results.paybackMonths,
    });

    // Track in database analytics
    await prisma.analyticsEvent.create({
      data: {
        event: 'roi_lead_captured',
        properties: {
          leadId: lead.id,
          score: lead.score,
          serviceTier: validatedData.serviceTier,
          roiPercentage: validatedData.results.roiPercentage,
          paybackMonths: validatedData.results.paybackMonths,
          currentCosts: validatedData.currentCosts,
          annualBenefit: validatedData.results.annualBenefit,
        },
        url: request.headers.get('referer') || undefined,
        userAgent,
        ipAddress,
      },
    });

    apiLogger.info('ROI calculator lead captured', {
      leadId: lead.id,
      score: lead.score,
      tier: validatedData.serviceTier,
      roiPercentage: validatedData.results.roiPercentage,
    });

    // Queue ROI results email
    await prisma.emailQueue.create({
      data: {
        to: [lead.email],
        subject: getEmailSubject(
          validatedData.preferredLanguage,
          validatedData.results.roiPercentage
        ),
        template: 'roi-results',
        data: {
          name: firstName,
          company: lead.company,
          language: validatedData.preferredLanguage,
          results: validatedData.results,
          tier: validatedData.serviceTier,
          currentCosts: validatedData.currentCosts,
        },
      },
    });

    // Trigger CRM/n8n webhook with ROI data
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify({
          event: 'roi_lead.created',
          data: {
            id: lead.id,
            email: lead.email,
            name: validatedData.name || firstName,
            company: lead.company,
            score: lead.score,
            industry: validatedData.industry,
            serviceTier: validatedData.serviceTier,
            roiCalculation: {
              currentCosts: validatedData.currentCosts,
              monthlySavings: validatedData.results.monthlySavings,
              roiPercentage: validatedData.results.roiPercentage,
              paybackMonths: validatedData.results.paybackMonths,
              annualBenefit: validatedData.results.annualBenefit,
            },
          },
        }),
      }).catch(error => {
        apiLogger.error('Failed to trigger ROI lead webhook', error, {
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

    apiLogger.error('ROI lead creation error', error as Error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing request',
      },
      { status: 500 }
    );
  }
}

function getEmailSubject(lang: string, roiPercentage: number): string {
  const roiFormatted = Math.round(roiPercentage);

  const subjects: Record<string, string> = {
    es: `Tu análisis ROI: ${roiFormatted}% de retorno potencial`,
    en: `Your ROI Analysis: ${roiFormatted}% potential return`,
    pt: `Sua análise de ROI: ${roiFormatted}% de retorno potencial`,
  };

  return subjects[lang] ?? subjects['en'] ?? `Your ROI Analysis: ${roiFormatted}% potential return`;
}

function getSuccessMessage(lang: string): string {
  const messages: Record<string, string> = {
    es: 'Gracias. Hemos enviado tu análisis ROI completo a tu correo. Un especialista te contactará pronto.',
    en: "Thank you. We've sent your complete ROI analysis to your email. A specialist will contact you soon.",
    pt: 'Obrigado. Enviamos sua análise de ROI completa para seu email. Um especialista entrará em contato em breve.',
  };

  return (
    messages[lang] ??
    messages['en'] ??
    "Thank you. We've sent your complete ROI analysis to your email."
  );
}

const handlePOSTWithSecurity = async (request: NextRequest) => {
  return withCsrfProtection(request, () => handlePOST(request));
};

export const POST = withRateLimit(handlePOSTWithSecurity, {
  maxRequests: 10,
  windowMs: 60000,
});
