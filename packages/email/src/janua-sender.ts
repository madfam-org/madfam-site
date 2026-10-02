/**
 * Janua Email Sender for madfam-site
 *
 * Centralized email delivery via Janua's Resend integration.
 * Can be used as primary sender or fallback alongside direct Resend.
 *
 * Benefits:
 * - Centralized email templates across MADFAM
 * - Unified analytics and logging
 * - Shared domain reputation
 */

import { SENDER_ADDRESS, SENDER_NAME, siteUrl } from './brand';

interface JanuaEmailResult {
  success: boolean;
  message_id?: string;
  error?: string;
}

interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  from_email?: string;
  from_name?: string;
  tags?: Record<string, string>;
}

interface SendTemplateEmailOptions {
  to: string[];
  template: string;
  variables: Record<string, any>;
  subject?: string;
  from_email?: string;
  from_name?: string;
  tags?: Record<string, string>;
}

// Template constants matching Janua's registry
export const JANUA_TEMPLATES = {
  AUTH_WELCOME: 'auth/welcome',
  TRANSACTIONAL_ASSESSMENT_RESULTS: 'transactional/assessment-results',
  NOTIFICATION_ALERT: 'notification/alert',
} as const;

const JANUA_API_URL = process.env.JANUA_API_URL || 'https://api.janua.dev';
const JANUA_INTERNAL_API_KEY = process.env.JANUA_INTERNAL_API_KEY || '';
const SOURCE_APP = 'madfam-site';

/**
 * Check if Janua email service is available
 */
export async function checkJanuaHealth(): Promise<boolean> {
  if (!JANUA_INTERNAL_API_KEY) {
    return false;
  }

  try {
    const response = await fetch(`${JANUA_API_URL}/api/v1/internal/email/health`, {
      method: 'GET',
      headers: {
        'X-Internal-API-Key': JANUA_INTERNAL_API_KEY,
      },
    });

    const data = await response.json();
    return data?.status === 'healthy';
  } catch (error) {
    console.warn('Janua email health check failed:', error);
    return false;
  }
}

/**
 * Send email via Janua's centralized service
 */
export async function sendEmailViaJanua(
  options: SendEmailOptions,
  sourceType: string = 'notification'
): Promise<JanuaEmailResult> {
  if (!JANUA_INTERNAL_API_KEY) {
    console.warn('JANUA_INTERNAL_API_KEY not configured');
    return { success: false, error: 'Janua API key not configured' };
  }

  try {
    const payload = {
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      // Ruling R46: platform sender `MADFAM <hola@madfam.io>` unless the caller
      // names another.
      from_email: options.from_email || SENDER_ADDRESS,
      from_name: options.from_name || SENDER_NAME,
      tags: {
        ...options.tags,
        source_app: SOURCE_APP,
        source_type: sourceType,
      },
      source_app: SOURCE_APP,
      source_type: sourceType,
    };

    const response = await fetch(`${JANUA_API_URL}/api/v1/internal/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': JANUA_INTERNAL_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`Email sent via Janua: to=${options.to.join(',')}, type=${sourceType}`);
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send email via Janua: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send template email via Janua's centralized service
 */
export async function sendTemplateEmailViaJanua(
  options: SendTemplateEmailOptions,
  sourceType: string = 'notification'
): Promise<JanuaEmailResult> {
  if (!JANUA_INTERNAL_API_KEY) {
    console.warn('JANUA_INTERNAL_API_KEY not configured');
    return { success: false, error: 'Janua API key not configured' };
  }

  try {
    const payload = {
      to: options.to,
      template: options.template,
      variables: options.variables,
      subject: options.subject,
      // Ruling R46: platform sender `MADFAM <hola@madfam.io>` unless the caller
      // names another.
      from_email: options.from_email || SENDER_ADDRESS,
      from_name: options.from_name || SENDER_NAME,
      tags: options.tags,
      source_app: SOURCE_APP,
      source_type: sourceType,
    };

    const response = await fetch(`${JANUA_API_URL}/api/v1/internal/email/send-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': JANUA_INTERNAL_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      console.log(
        `Template email sent via Janua: to=${options.to.join(',')}, template=${options.template}`
      );
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to send template email via Janua: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// Convenience methods for madfam-site specific emails
// ============================================================================

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(to: string[], userName: string): Promise<JanuaEmailResult> {
  return sendTemplateEmailViaJanua(
    {
      to,
      template: JANUA_TEMPLATES.AUTH_WELCOME,
      variables: {
        user_name: userName,
        app_name: 'MADFAM',
        // madfam.io has no sign-in (R42); the link is the public site.
        login_url: siteUrl(),
        support_email: 'hello@madfam.io',
      },
    },
    'onboarding'
  );
}

/**
 * Send assessment results email
 */
export async function sendAssessmentResults(
  to: string[],
  data: {
    assessmentType: string;
    score: number;
    recommendations?: string[];
    detailedReportUrl?: string;
  }
): Promise<JanuaEmailResult> {
  return sendTemplateEmailViaJanua(
    {
      to,
      template: JANUA_TEMPLATES.TRANSACTIONAL_ASSESSMENT_RESULTS,
      variables: {
        assessment_type: data.assessmentType,
        score: data.score,
        recommendations: data.recommendations,
        detailed_report_url: data.detailedReportUrl,
      },
    },
    'assessment'
  );
}

/**
 * Send ROI calculation results
 */
export async function sendROIResults(
  to: string[],
  data: {
    estimatedROI: number;
    paybackPeriod: string;
    assumptions: Record<string, any>;
    detailedReportUrl?: string;
  }
): Promise<JanuaEmailResult> {
  return sendTemplateEmailViaJanua(
    {
      to,
      template: JANUA_TEMPLATES.TRANSACTIONAL_ASSESSMENT_RESULTS,
      subject: 'Your ROI Calculation Results - MADFAM',
      variables: {
        assessment_type: 'ROI Calculation',
        score: data.estimatedROI,
        recommendations: [
          `Estimated ROI: ${data.estimatedROI}%`,
          `Payback Period: ${data.paybackPeriod}`,
        ],
        detailed_report_url: data.detailedReportUrl,
      },
    },
    'roi-calculation'
  );
}

/**
 * Send project estimate results
 */
export async function sendProjectEstimate(
  to: string[],
  data: {
    projectType: string;
    estimatedCost: number;
    estimatedDuration: string;
    breakdown?: Record<string, number>;
    detailedReportUrl?: string;
  }
): Promise<JanuaEmailResult> {
  return sendTemplateEmailViaJanua(
    {
      to,
      template: JANUA_TEMPLATES.TRANSACTIONAL_ASSESSMENT_RESULTS,
      subject: 'Your Project Estimate - MADFAM',
      variables: {
        assessment_type: `Project Estimate: ${data.projectType}`,
        score: data.estimatedCost,
        recommendations: [
          `Estimated Cost: $${data.estimatedCost.toLocaleString()}`,
          `Estimated Duration: ${data.estimatedDuration}`,
        ],
        detailed_report_url: data.detailedReportUrl,
      },
    },
    'project-estimate'
  );
}

/**
 * JanuaEmailSender class - compatible with existing EmailSender interface
 */
export class JanuaEmailSender {
  private isAvailable: boolean = false;

  async init(): Promise<void> {
    this.isAvailable = await checkJanuaHealth();
  }

  get available(): boolean {
    return this.isAvailable;
  }

  async sendWelcomeEmail(to: string[], data: { userName: string }): Promise<JanuaEmailResult> {
    return sendWelcomeEmail(to, data.userName);
  }

  async sendAssessmentResults(to: string[], data: any): Promise<JanuaEmailResult> {
    return sendAssessmentResults(to, data);
  }

  async sendROIResults(to: string[], data: any): Promise<JanuaEmailResult> {
    return sendROIResults(to, data);
  }

  async sendProjectEstimate(to: string[], data: any): Promise<JanuaEmailResult> {
    return sendProjectEstimate(to, data);
  }
}

export const januaEmailSender = new JanuaEmailSender();
