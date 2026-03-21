import { analytics } from '@madfam/analytics';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerAuth } from '@/lib/auth';
import { withCsrfProtection } from '@/lib/csrf';
import { apiLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { AssessmentStatus } from '@prisma/client';
import { withRateLimit } from '@/lib/rate-limit';

// Assessment question types
interface AssessmentQuestion {
  id: string;
  question: string;
  category: 'technology' | 'process' | 'team' | 'strategy';
  weight: number;
}

// Assessment questions
const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'q1',
    question: 'What is your current level of AI/automation adoption?',
    category: 'technology',
    weight: 3,
  },
  {
    id: 'q2',
    question: 'How would you describe your data management practices?',
    category: 'process',
    weight: 2,
  },
  {
    id: 'q3',
    question: "What is your team's technical expertise level?",
    category: 'team',
    weight: 2,
  },
  {
    id: 'q4',
    question: 'How clear is your digital transformation strategy?',
    category: 'strategy',
    weight: 3,
  },
  {
    id: 'q5',
    question: 'What is your budget for technology initiatives?',
    category: 'strategy',
    weight: 2,
  },
  {
    id: 'q6',
    question: 'How automated are your current business processes?',
    category: 'process',
    weight: 2,
  },
  {
    id: 'q7',
    question: 'What is your timeline for implementing new solutions?',
    category: 'strategy',
    weight: 1,
  },
  {
    id: 'q8',
    question: 'How do you currently handle customer data and analytics?',
    category: 'technology',
    weight: 2,
  },
  {
    id: 'q9',
    question: "What is your organization's change readiness?",
    category: 'team',
    weight: 2,
  },
  {
    id: 'q10',
    question: 'How integrated are your current systems?',
    category: 'technology',
    weight: 2,
  },
];

// Schema for assessment submission
const assessmentSchema = z.object({
  email: z.string().email(),
  answers: z.record(z.string(), z.number().min(1).max(5)), // Answer values 1-5
  leadId: z.string().optional(),
});

// Schema for getting assessment questions (removed - unused)

// Calculate assessment score and recommendations
function calculateAssessmentResults(answers: Record<string, number>) {
  let totalScore = 0;
  let totalWeight = 0;
  const categoryScores: Record<string, { score: number; weight: number }> = {
    technology: { score: 0, weight: 0 },
    process: { score: 0, weight: 0 },
    team: { score: 0, weight: 0 },
    strategy: { score: 0, weight: 0 },
  };

  // Calculate scores
  assessmentQuestions.forEach(question => {
    const answer = answers[question.id] || 0;
    const weightedScore = answer * question.weight;

    totalScore += weightedScore;
    totalWeight += question.weight;

    const categoryData = categoryScores[question.category];
    if (categoryData) {
      categoryData.score += weightedScore;
      categoryData.weight += question.weight;
    }
  });

  // Normalize score to 0-100
  const normalizedScore = Math.round((totalScore / (totalWeight * 5)) * 100);

  // Identify strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  Object.entries(categoryScores).forEach(([category, data]) => {
    const categoryScore = (data.score / (data.weight * 5)) * 100;

    if (categoryScore >= 70) {
      strengths.push(`Strong ${category} foundation`);
    } else if (categoryScore < 40) {
      weaknesses.push(`${category.charAt(0).toUpperCase() + category.slice(1)} needs improvement`);

      // Add specific recommendations based on weaknesses
      switch (category) {
        case 'technology':
          recommendations.push('Consider upgrading your technology infrastructure');
          recommendations.push('Implement modern data analytics tools');
          break;
        case 'process':
          recommendations.push('Automate repetitive business processes');
          recommendations.push('Establish clear workflows and documentation');
          break;
        case 'team':
          recommendations.push('Invest in team training and upskilling');
          recommendations.push('Build a culture of innovation');
          break;
        case 'strategy':
          recommendations.push('Develop a clear digital transformation roadmap');
          recommendations.push('Align technology initiatives with business goals');
          break;
      }
    }
  });

  // Add general recommendations based on score
  if (normalizedScore < 30) {
    recommendations.push('Consider starting with basic digital transformation initiatives');
  } else if (normalizedScore < 60) {
    recommendations.push('Focus on improving existing processes with automation');
  } else {
    recommendations.push('Explore strategic partnerships for advanced transformation');
  }

  return {
    score: normalizedScore,
    strengths: strengths.slice(0, 3), // Top 3 strengths
    weaknesses: weaknesses.slice(0, 3), // Top 3 weaknesses
    recommendations: recommendations.slice(0, 5), // Top 5 recommendations
  };
}

// GET endpoint - Get assessment questions or results
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');

    if (assessmentId) {
      // Get session for authorization
      const session = await getServerAuth();

      // Fetch existing assessment results
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessmentId },
        include: {
          lead: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
              company: true,
            },
          },
        },
      });

      if (!assessment) {
        return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
      }

      // Authorization: Verify user owns this assessment or is an admin
      if (!session) {
        apiLogger.warn('Unauthorized assessment access attempt', {
          assessmentId,
          ip: request.headers.get('x-forwarded-for')?.split(',')[0],
        });
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }

      // Check if user owns this assessment (via lead email) or is admin
      const userEmail = session.user?.email;
      const isAdmin = session.user?.role === 'ADMIN';
      const ownsAssessment = assessment.lead?.email === userEmail;

      if (!ownsAssessment && !isAdmin) {
        apiLogger.warn('Forbidden assessment access attempt', {
          assessmentId,
          userEmail,
          leadEmail: assessment.lead?.email,
        });
        return NextResponse.json(
          { error: 'You do not have permission to access this assessment' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        assessment,
        questions: assessmentQuestions,
      });
    }

    // Return assessment questions for new assessment
    return NextResponse.json({
      questions: assessmentQuestions,
      totalQuestions: assessmentQuestions.length,
    });
  } catch (error) {
    apiLogger.error('Error fetching assessment', error as Error);
    return NextResponse.json({ error: 'Failed to fetch assessment' }, { status: 500 });
  }
}

// POST endpoint - Submit assessment
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = assessmentSchema.parse(body);

    // Calculate results
    const results = calculateAssessmentResults(validatedData.answers);

    // Create assessment record
    const assessment = await prisma.assessment.create({
      data: {
        email: validatedData.email,
        leadId: validatedData.leadId,
        status: AssessmentStatus.COMPLETED,
        answers: validatedData.answers,
        score: results.score,
        strengths: results.strengths,
        weaknesses: results.weaknesses,
        recommendations: results.recommendations,
        completedAt: new Date(),
      },
    });

    // Track analytics
    analytics.trackAssessmentComplete({
      score: results.score,
    });

    // Track in database analytics
    await prisma.analyticsEvent.create({
      data: {
        event: 'assessment_completed',
        properties: {
          assessmentId: assessment.id,
          score: results.score,
        },
        url: request.headers.get('referer') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    });

    // Queue follow-up email
    await prisma.emailQueue.create({
      data: {
        to: [validatedData.email],
        subject: 'Your MADFAM AI Readiness Assessment Results',
        template: 'assessment-results',
        data: {
          assessmentId: assessment.id,
          score: results.score,
          strengths: results.strengths,
          recommendations: results.recommendations,
        },
      },
    });

    // If associated with a lead, update the lead
    if (validatedData.leadId) {
      await prisma.lead.update({
        where: { id: validatedData.leadId },
        data: {
          score: Math.max(results.score, 50), // Minimum score of 50 for completing assessment
        },
      });

      // Create lead activity
      await prisma.leadActivity.create({
        data: {
          leadId: validatedData.leadId,
          type: 'assessment_completed',
          description: `Completed AI readiness assessment with score ${results.score}`,
          metadata: {
            assessmentId: assessment.id,
            score: results.score,
          },
        },
      });
    }

    // Trigger n8n webhook if configured
    if (process.env.N8N_WEBHOOK_URL) {
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.N8N_API_KEY || '',
        },
        body: JSON.stringify({
          event: 'assessment.completed',
          data: {
            assessmentId: assessment.id,
            email: validatedData.email,
            score: results.score,
          },
        }),
      }).catch(error => {
        apiLogger.error('Failed to trigger n8n webhook for assessment', error, {
          assessmentId: assessment.id,
        });
      });
    }

    return NextResponse.json({
      success: true,
      assessmentId: assessment.id,
      results: {
        score: results.score,
        strengths: results.strengths,
        weaknesses: results.weaknesses,
        recommendations: results.recommendations,
      },
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

    apiLogger.error('Assessment submission error', error as Error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing assessment',
      },
      { status: 500 }
    );
  }
}

// Compose POST handler with CSRF protection and rate limiting
const handlePOSTWithSecurity = async (request: NextRequest) => {
  return withCsrfProtection(request, () => handlePOST(request));
};

// Apply rate limiting
export const POST = withRateLimit(handlePOSTWithSecurity, { maxRequests: 5, windowMs: 60000 }); // 5 assessments per minute
