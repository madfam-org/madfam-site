import { environment } from './environment';
import type {
  ApiResponse,
  LeadData,
  LeadResponse,
  AssessmentData,
  AssessmentResponse,
  ROIData,
  ROIResponse,
  ProjectEstimateData,
  ProjectEstimateResponse,
} from '@/types/api';

// Mock data for staging
const mockLeadResponse = {
  success: true,
  leadId: 'mock-lead-123',
  score: 75,
  message: 'Thank you for your interest. This is a staging environment.',
};

const mockAssessmentResponse = {
  success: true,
  assessmentId: 'mock-assessment-123',
  results: {
    score: 68,
    tier: 'STRATEGY_ENABLEMENT',
    strengths: ['Strong technology foundation', 'Good strategic planning'],
    weaknesses: ['Process automation needs improvement'],
    recommendations: [
      'Implement workflow automation',
      'Upgrade data analytics capabilities',
      'Consider strategic consulting engagement',
    ],
  },
};

const mockCalculatorResponse = {
  success: true,
  calculationId: 'mock-calc-123',
  results: {
    currentState: {
      monthlyLaborCost: 50000,
      monthlyOperationalCost: 25000,
      totalMonthlyCost: 75000,
      annualCost: 900000,
    },
    futureState: {
      totalMonthlyCost: 45000,
      annualCost: 540000,
      monthlySavings: 30000,
      annualSavings: 360000,
    },
    roi: {
      percentage: 120,
      paybackMonths: 8,
      firstYearNetSavings: 200000,
      fiveYearNetSavings: 1600000,
    },
    benefits: {
      productivityGain: '40%',
      capacityIncrease: '60%',
      hoursRecoveredMonthly: 120,
      costReduction: '40%',
    },
  },
};

export class ApiClient {
  private baseUrl: string;
  private isMock: boolean;

  constructor() {
    this.baseUrl = environment.api.baseUrl;
    this.isMock = environment.isStaticExport;
  }

  async submitLead(data: LeadData): Promise<ApiResponse<LeadResponse>> {
    if (this.isMock) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockLeadResponse;
    }

    const response = await fetch(`${this.baseUrl}/leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async submitAssessment(data: AssessmentData): Promise<ApiResponse<AssessmentResponse>> {
    if (this.isMock) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      return mockAssessmentResponse;
    }

    const response = await fetch(`${this.baseUrl}/assessment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async getAssessmentQuestions() {
    if (this.isMock) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        questions: [
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
        ],
        totalQuestions: 5,
      };
    }

    const response = await fetch(`${this.baseUrl}/assessment`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async calculateROI(data: ROIData): Promise<ApiResponse<ROIResponse>> {
    if (this.isMock) {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return mockCalculatorResponse;
    }

    const response = await fetch(`${this.baseUrl}/calculator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, type: 'roi' }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }

  async calculateProjectEstimate(
    data: ProjectEstimateData
  ): Promise<ApiResponse<ProjectEstimateResponse>> {
    if (this.isMock) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        data: {
          estimateId: 'mock-estimate-123',
          summary: {
            totalHours: 800,
            totalCost: 232000,
            duration: 8,
            confidence: 85,
          },
          breakdown: {
            development: 120000,
            design: 40000,
            testing: 32000,
            deployment: 16000,
            projectManagement: 16000,
            contingency: 8000,
          },
          timeline: {
            phases: [
              {
                name: 'Discovery & Planning',
                duration: 2,
                deliverables: ['Requirements document', 'Project plan'],
              },
              {
                name: 'Implementation',
                duration: 4,
                deliverables: ['Core functionality', 'Testing'],
              },
              {
                name: 'Deployment & Launch',
                duration: 2,
                deliverables: ['Production deployment', 'Training'],
              },
            ],
            milestones: [
              {
                name: 'Project kickoff',
                date: '2024-04-01',
                dependencies: [],
              },
              {
                name: 'MVP completion',
                date: '2024-05-15',
                dependencies: ['Discovery phase'],
              },
            ],
          },
          recommendations: {
            alternativeApproaches: ['Phased approach', 'MVP first'],
            costOptimizations: ['Use existing templates', 'Reduce complexity'],
            riskMitigations: ['Regular checkpoints', 'Prototype validation'],
          },
          nextSteps: ['Schedule kickoff meeting', 'Sign contract', 'Begin discovery phase'],
        },
      };
    }

    const response = await fetch(`${this.baseUrl}/calculator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, type: 'project_estimate' }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
