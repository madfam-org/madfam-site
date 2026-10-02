import { DEFAULT_FROM } from './brand';
import { emailService } from './index';

interface EmailOptions {
  to: string[];
  template: string;
  data: any;
  from?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailSender {
  private apiKey: string;
  private apiUrl: string;
  private defaultFrom: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
    this.apiUrl = 'https://api.resend.com/emails';
    // Ruling R46: the platform sender is `MADFAM <hola@madfam.io>`. An
    // operator may override it per environment; the code default is the ruling.
    this.defaultFrom = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM;
  }

  async sendEmail({ to, template, data, from }: EmailOptions): Promise<EmailResult> {
    try {
      if (!this.apiKey) {
        console.warn('RESEND_API_KEY not configured, email not sent');
        return { success: false, error: 'API key not configured' };
      }

      // Render the email template
      const emailTemplate = await emailService.renderTemplate(template, data);

      // Send email using Resend API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: from || this.defaultFrom,
          to,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Email sending failed:', result);
        return { success: false, error: result.message || 'Unknown error' };
      }

      return { success: true, messageId: result.id };
    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendWelcomeEmail(to: string[], data: any): Promise<EmailResult> {
    return this.sendEmail({ to, template: 'welcome', data });
  }

  async sendAssessmentResults(to: string[], data: any): Promise<EmailResult> {
    return this.sendEmail({ to, template: 'assessment-results', data });
  }

  async sendROIResults(to: string[], data: any): Promise<EmailResult> {
    return this.sendEmail({ to, template: 'roi-results', data });
  }

  async sendProjectEstimate(to: string[], data: any): Promise<EmailResult> {
    return this.sendEmail({ to, template: 'project-estimate-results', data });
  }
}

export const emailSender = new EmailSender();
