import { render } from '@react-email/render';
import { WelcomeEmail } from './templates/WelcomeEmail';
import { AssessmentResultsEmail } from './templates/AssessmentResultsEmail';
import { ROIResultsEmail } from './templates/ROIResultsEmail';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface WelcomeEmailData {
  name: string;
  language: 'es-MX' | 'en-US';
  tier: string;
}

export interface AssessmentResultsEmailData {
  assessmentId: string;
  score: number;
  tier: string;
  strengths: string[];
  recommendations: string[];
  language?: 'es-MX' | 'en-US';
}

export interface ROIResultsEmailData {
  calculationId: string;
  results: {
    roi: {
      percentage: number;
      paybackMonths: number;
      fiveYearNetSavings: number;
    };
    futureState: {
      annualSavings: number;
    };
    benefits: {
      productivityGain: string;
      hoursRecoveredMonthly: number;
      costReduction: string;
    };
  };
  language?: 'es-MX' | 'en-US';
}

export class EmailService {
  private getSubject(template: string, data: any): string {
    const subjects = {
      'es-MX': {
        welcome: 'Bienvenido a MADFAM - Tu socio en transformación digital',
        'assessment-results': 'Resultados de tu evaluación de preparación para IA',
        'roi-results': 'Resultados de tu análisis de ROI',
        'project-estimate-results': 'Estimación de tu proyecto - MADFAM',
      },
      'en-US': {
        welcome: 'Welcome to MADFAM - Your digital transformation partner',
        'assessment-results': 'Your AI Readiness Assessment Results',
        'roi-results': 'Your ROI Analysis Results',
        'project-estimate-results': 'Your Project Estimate - MADFAM',
      },
    };

    const language: 'es-MX' | 'en-US' = data.language || 'es-MX';
    const subjectMap = subjects[language];
    return subjectMap[template as keyof typeof subjectMap] || 'MADFAM Notification';
  }

  async renderWelcomeEmail(data: WelcomeEmailData): Promise<EmailTemplate> {
    const html = await render(<WelcomeEmail {...data} />);
    const text = this.htmlToText(html);
    const subject = this.getSubject('welcome', data);

    return { subject, html, text };
  }

  async renderAssessmentResultsEmail(data: AssessmentResultsEmailData): Promise<EmailTemplate> {
    const html = await render(<AssessmentResultsEmail {...data} />);
    const text = this.htmlToText(html);
    const subject = this.getSubject('assessment-results', data);

    return { subject, html, text };
  }

  async renderROIResultsEmail(data: ROIResultsEmailData): Promise<EmailTemplate> {
    const html = await render(<ROIResultsEmail {...data} />);
    const text = this.htmlToText(html);
    const subject = this.getSubject('roi-results', data);

    return { subject, html, text };
  }

  async renderProjectEstimateEmail(data: any): Promise<EmailTemplate> {
    // For now, use a simple template
    const html = `
      <h1>Project Estimate Results</h1>
      <p>Thank you for using our project estimator.</p>
      <p>Total estimate: ${data.results.pricing.total} ${data.results.pricing.currency}</p>
      <p>Timeline: ${data.results.timeline.minWeeks}-${data.results.timeline.maxWeeks} weeks</p>
      <p>We'll contact you soon to discuss your project in detail.</p>
    `;
    const text = this.htmlToText(html);
    const subject = this.getSubject('project-estimate-results', data);

    return { subject, html, text };
  }

  async renderTemplate(template: string, data: any): Promise<EmailTemplate> {
    switch (template) {
      case 'welcome':
        return this.renderWelcomeEmail(data);
      case 'assessment-results':
        return this.renderAssessmentResultsEmail(data);
      case 'roi-results':
        return this.renderROIResultsEmail(data);
      case 'project-estimate-results':
        return this.renderProjectEstimateEmail(data);
      default:
        throw new Error(`Unknown email template: ${template}`);
    }
  }

  /**
   * Convert HTML to a plain-text representation suitable for email clients
   * that fall back to text/plain. Used only on email bodies we ourselves
   * render via @react-email/render — there is no untrusted HTML path here,
   * but we still sanitise carefully to satisfy CodeQL:
   *   - js/incomplete-multi-character-sanitization: tag-stripping is
   *     iterated to a fixed point so injected `<scr<script>ipt>` patterns
   *     cannot survive a single pass.
   *   - js/double-escaping: entity decoding runs once, AFTER tag removal,
   *     so the resulting `&` characters are not re-fed to a tag stripper.
   *   - js/polynomial-redos: the tag regex is bounded (no nested
   *     quantifiers / alternation backtracking) and we cap iterations.
   */
  private htmlToText(html: string): string {
    // 1. Strip tags. Iterate up to a small bound so that constructs like
    //    `<scr<script>ipt>` (where naive single-pass removal would leave
    //    `<script>`) are fully cleaned. The regex is linear: `[^<>]*`
    //    cannot backtrack catastrophically because `<` and `>` are
    //    excluded character-class members.
    let stripped = html;
    for (let i = 0; i < 5; i++) {
      const next = stripped.replace(/<[^<>]*>/g, '');
      if (next === stripped) break;
      stripped = next;
    }
    // Remove any stray angle brackets that remained after tag stripping
    // (e.g. unbalanced `<` from malformed input).
    stripped = stripped.replace(/[<>]/g, '');

    // 2. Decode entities exactly once. Order matters: decode `&amp;` LAST
    //    so that an input of `&amp;lt;` yields `&lt;` (text), not `<`.
    const decoded = stripped
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&');

    return decoded.replace(/\s+/g, ' ').trim();
  }
}

// Export template components
export { WelcomeEmail, AssessmentResultsEmail, ROIResultsEmail };

// Export service instance
export const emailService = new EmailService();

// Export Janua email sender for centralized email delivery
export {
  JanuaEmailSender,
  januaEmailSender,
  sendEmailViaJanua,
  sendTemplateEmailViaJanua,
  checkJanuaHealth,
  JANUA_TEMPLATES,
} from './janua-sender';
