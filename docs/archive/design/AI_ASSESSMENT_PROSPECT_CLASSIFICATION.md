> **ARCHIVED — historical record, not current guidance** (banner added 2026-09-23).
> Names, hosts, products and procedures below may be retired — e.g. PENNY, SPARK,
> penny.onl, forgesight.quest, and Vercel / Railway / GitHub Pages hosting. Current
> sources: [`AGENTS.md`](/AGENTS.md), [`ECOSYSTEM.md`](/ECOSYSTEM.md) and
> [`docs/deployment/DEPLOYMENT.md`](/docs/deployment/DEPLOYMENT.md).

# AI Assessment Prospect Classification System

## Strategic Design Document

### Executive Summary

Transform the AI Assessment from a simple readiness evaluator into a comprehensive prospect identification and classification system that intelligently routes leads to the appropriate MADFAM engagement model.

---

## 1. System Architecture

### 1.1 Classification Categories

```typescript
enum ProspectType {
  INVESTOR = 'investor', // Seeking investment opportunities
  STRATEGIC_PARTNER = 'strategic_partner', // Partnership/collaboration potential
  CUSTOMER = 'customer', // Product/service buyers
}

enum CustomerSegment {
  ENTERPRISE = 'enterprise', // Large corporations
  SCALE_UP = 'scale_up', // Growing companies
  STARTUP = 'startup', // Early-stage companies
  GOVERNMENT = 'government', // Public sector
}

enum ProductFit {
  PENNY = 'penny', // AI assistant
  DHANAM = 'dhanam', // Financial wellness
  COTIZA_STUDIO = 'cotiza_studio', // Quoting tool
  FORGE_SIGHT = 'forge_sight', // Analytics platform
  AVALA = 'avala', // Training & certification platform
  FACTLAS = 'factlas', // Geographic intelligence platform
  CUSTOM_SOLUTION = 'custom_solution', // Requires consultation
}
```

### 1.2 Multi-Dimensional Assessment Framework

```typescript
interface AssessmentDimensions {
  // Business Profile
  organizationType: OrganizationType;
  companySize: CompanySize;
  industry: Industry;
  annualRevenue: RevenueRange;

  // AI Maturity
  aiReadiness: number; // 0-100 score
  dataMaturity: number; // 0-100 score
  techCapability: number; // 0-100 score

  // Intent Signals
  primaryGoal: PrimaryGoal;
  timeframe: ImplementationTimeframe;
  budget: BudgetRange;
  decisionRole: DecisionRole;

  // Partnership Indicators
  investmentInterest: boolean;
  portfolioCompanies: number;
  previousInvestments: InvestmentHistory;

  // Strategic Fit
  complementaryCapabilities: string[];
  marketPresence: MarketPresence;
  innovationFocus: InnovationArea[];
}
```

---

## 2. Intelligent Question Flow

### 2.1 Progressive Disclosure Strategy

```typescript
interface QuestionFlow {
  phases: {
    screening: Question[]; // 3-4 quick qualifier questions
    profiling: Question[]; // 5-6 business profile questions
    technical: Question[]; // 4-5 AI/tech maturity questions
    intent: Question[]; // 3-4 goal/budget questions
    classification: Question[]; // 2-3 targeted follow-ups
  };

  branchingLogic: BranchingRule[];
  skipLogic: SkipRule[];
}
```

### 2.2 Key Screening Questions

```typescript
const screeningQuestions = [
  {
    id: 'org_type',
    question: 'Which best describes your organization?',
    options: [
      {
        value: 'corporation',
        label: 'Corporation/Enterprise',
        weight: { customer: 0.8, partner: 0.2 },
      },
      {
        value: 'investment_firm',
        label: 'Investment Firm/VC',
        weight: { investor: 0.9, partner: 0.1 },
      },
      { value: 'startup', label: 'Startup/Scale-up', weight: { customer: 0.7, partner: 0.3 } },
      {
        value: 'consultancy',
        label: 'Consultancy/Agency',
        weight: { partner: 0.8, customer: 0.2 },
      },
      {
        value: 'government',
        label: 'Government/Public Sector',
        weight: { customer: 0.9, partner: 0.1 },
      },
    ],
    category: 'profile',
  },

  {
    id: 'primary_interest',
    question: 'What brings you to MADFAM?',
    options: [
      { value: 'implement_ai', label: 'Implement AI solutions', weight: { customer: 0.9 } },
      { value: 'invest', label: 'Investment opportunities', weight: { investor: 0.9 } },
      { value: 'partnership', label: 'Strategic partnership', weight: { partner: 0.9 } },
      {
        value: 'explore',
        label: 'Exploring options',
        weight: { customer: 0.4, partner: 0.3, investor: 0.3 },
      },
    ],
    category: 'intent',
  },

  {
    id: 'decision_role',
    question: 'What is your role in this initiative?',
    options: [
      { value: 'decision_maker', label: 'Decision Maker', score: 100 },
      { value: 'influencer', label: 'Key Influencer', score: 75 },
      { value: 'evaluator', label: 'Evaluating Solutions', score: 50 },
      { value: 'researcher', label: 'Researching Options', score: 25 },
    ],
    category: 'qualification',
  },
];
```

### 2.3 Dynamic Follow-Up Questions

```typescript
// If INVESTOR profile detected
const investorQuestions = [
  {
    id: 'investment_stage',
    question: 'What investment stage do you typically focus on?',
    options: ['Seed', 'Series A', 'Series B+', 'Growth', 'All stages'],
  },
  {
    id: 'portfolio_size',
    question: 'How many companies are in your portfolio?',
    options: ['1-10', '11-50', '51-100', '100+'],
  },
  {
    id: 'ai_focus',
    question: 'Do you have a specific focus on AI/ML companies?',
    options: [
      'Yes, AI-focused fund',
      'Yes, significant portion',
      'Some investments',
      'Exploring AI',
    ],
  },
];

// If STRATEGIC_PARTNER profile detected
const partnerQuestions = [
  {
    id: 'partnership_type',
    question: 'What type of partnership are you interested in?',
    options: [
      'Technology integration',
      'Channel partnership',
      'Joint ventures',
      'White-label solutions',
    ],
  },
  {
    id: 'market_reach',
    question: 'What is your primary market reach?',
    options: ['Local/Regional', 'National', 'Multi-national', 'Global'],
  },
];

// If CUSTOMER profile detected
const customerQuestions = [
  {
    id: 'implementation_timeline',
    question: 'When are you looking to implement a solution?',
    options: ['Immediately', '1-3 months', '3-6 months', '6-12 months', 'Exploring'],
  },
  {
    id: 'budget_range',
    question: 'What is your estimated annual budget for AI initiatives?',
    options: ['< $50k', '$50k-$250k', '$250k-$1M', '$1M-$5M', '> $5M'],
  },
];
```

---

## 3. Classification Algorithm

### 3.1 Scoring Engine

```typescript
class ProspectClassifier {
  private weights = {
    investor: {
      org_type: 0.3,
      primary_interest: 0.3,
      investment_history: 0.2,
      portfolio_size: 0.1,
      decision_role: 0.1,
    },
    strategic_partner: {
      org_type: 0.25,
      complementary_capabilities: 0.25,
      market_presence: 0.2,
      partnership_interest: 0.2,
      decision_role: 0.1,
    },
    customer: {
      org_type: 0.2,
      primary_interest: 0.2,
      budget: 0.2,
      timeline: 0.15,
      ai_readiness: 0.15,
      decision_role: 0.1,
    },
  };

  classify(responses: AssessmentResponses): ClassificationResult {
    const scores = {
      investor: this.calculateInvestorScore(responses),
      strategic_partner: this.calculatePartnerScore(responses),
      customer: this.calculateCustomerScore(responses),
    };

    const primary = this.getPrimaryClassification(scores);
    const secondary = this.getSecondaryClassification(scores, primary);
    const confidence = this.calculateConfidence(scores);

    return {
      primaryType: primary,
      secondaryType: secondary,
      confidence,
      scores,
      recommendations: this.generateRecommendations(primary, responses),
    };
  }

  private calculateInvestorScore(responses: AssessmentResponses): number {
    let score = 0;

    // Heavy weight on investment firm identification
    if (responses.org_type === 'investment_firm') score += 40;
    if (responses.primary_interest === 'invest') score += 30;
    if (responses.portfolio_companies > 0) score += 15;
    if (responses.investment_focus?.includes('AI')) score += 15;

    return Math.min(score, 100);
  }

  private calculateCustomerScore(responses: AssessmentResponses): number {
    let score = 0;

    // Customer indicators
    if (['corporation', 'startup', 'government'].includes(responses.org_type)) score += 25;
    if (responses.primary_interest === 'implement_ai') score += 25;
    if (responses.budget && responses.budget !== 'exploring') score += 20;
    if (responses.timeline && responses.timeline !== 'exploring') score += 15;
    if (responses.decision_role === 'decision_maker') score += 15;

    return Math.min(score, 100);
  }
}
```

### 3.2 Product Matching Algorithm

```typescript
class ProductMatcher {
  matchProducts(
    classification: ClassificationResult,
    profile: ProspectProfile
  ): ProductRecommendation[] {
    if (classification.primaryType === ProspectType.CUSTOMER) {
      return this.matchCustomerToProducts(profile);
    }

    return [];
  }

  private matchCustomerToProducts(profile: ProspectProfile): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = [];

    // AVALA - Training & Certification Platform
    if (profile.primaryGoal === 'training' || profile.industryType === 'education') {
      recommendations.push({
        product: ProductFit.AVALA,
        fitScore: 90,
        reasoning: 'Ideal for competency-based training and certification needs',
      });
    }

    // PENNY - AI Assistant
    if (profile.primaryGoal === 'productivity' || profile.budget < BudgetRange.MEDIUM) {
      recommendations.push({
        product: ProductFit.PENNY,
        fitScore: 85,
        reasoning: 'Quick AI adoption with immediate ROI',
      });
    }

    // Dhanam - Financial Wellness
    if (
      profile.industry === Industry.FINANCIAL_SERVICES ||
      profile.primaryGoal === 'employee_wellness'
    ) {
      recommendations.push({
        product: ProductFit.DHANAM,
        fitScore: 80,
        reasoning: 'Specialized financial wellness platform',
      });
    }

    // Custom Solution - Complex needs
    if (
      profile.aiReadiness < 30 ||
      profile.requirements.includes('custom') ||
      recommendations.length === 0
    ) {
      recommendations.push({
        product: ProductFit.CUSTOM_SOLUTION,
        fitScore: 70,
        reasoning: 'Requires tailored consultation',
      });
    }

    return recommendations.sort((a, b) => b.fitScore - a.fitScore);
  }
}
```

---

## 4. Database Schema

```prisma
model ProspectAssessment {
  id                String            @id @default(cuid())
  sessionId         String            @unique

  // Classification
  primaryType       ProspectType
  secondaryType     ProspectType?
  confidence        Float

  // Profile
  organizationType  String
  companySize       String
  industry          String
  annualRevenue     String?

  // Contact
  email             String?
  name              String?
  role              String?
  company           String?

  // Scores
  aiReadiness       Int
  investorScore     Int
  partnerScore      Int
  customerScore     Int

  // Recommendations
  productMatches    Json              // ProductRecommendation[]
  nextSteps         Json              // string[]

  // Tracking
  completedAt       DateTime?
  leadScore         Int?
  routedTo          String?           // Business unit or product

  // Relations
  lead              Lead?             @relation(fields: [leadId], references: [id])
  leadId            String?

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
}

model ProspectResponse {
  id                String            @id @default(cuid())
  assessmentId      String
  assessment        ProspectAssessment @relation(fields: [assessmentId], references: [id])

  questionId        String
  questionText      String
  answer            String
  answerValue       Json?
  category          String

  createdAt         DateTime          @default(now())
}
```

---

## 5. Routing & Integration

### 5.1 Automated Routing Rules

```typescript
interface RoutingRule {
  condition: (classification: ClassificationResult) => boolean;
  action: RoutingAction;
  priority: number;
}

const routingRules: RoutingRule[] = [
  {
    condition: c => c.primaryType === ProspectType.INVESTOR && c.confidence > 80,
    action: {
      type: 'notify',
      target: 'investor_relations',
      urgency: 'high',
      template: 'investor_interest',
    },
    priority: 1,
  },
  {
    condition: c => c.primaryType === ProspectType.STRATEGIC_PARTNER && c.confidence > 70,
    action: {
      type: 'notify',
      target: 'partnerships_team',
      urgency: 'medium',
      template: 'partner_inquiry',
    },
    priority: 2,
  },
  {
    condition: c => c.primaryType === ProspectType.CUSTOMER && c.scores.customer > 80,
    action: {
      type: 'route',
      target: 'sales_team',
      assignmentLogic: 'round_robin',
      includeProductMatch: true,
    },
    priority: 3,
  },
];
```

### 5.2 CRM Integration

```typescript
class CRMIntegration {
  async syncProspect(assessment: ProspectAssessment): Promise<void> {
    const crmPayload = {
      type: assessment.primaryType,
      confidence: assessment.confidence,
      scores: {
        ai_readiness: assessment.aiReadiness,
        investor_potential: assessment.investorScore,
        partner_potential: assessment.partnerScore,
        customer_potential: assessment.customerScore,
      },
      tags: this.generateTags(assessment),
      custom_fields: {
        assessment_id: assessment.id,
        product_matches: assessment.productMatches,
        next_steps: assessment.nextSteps,
      },
    };

    await this.crmClient.createOrUpdateLead(crmPayload);
  }

  private generateTags(assessment: ProspectAssessment): string[] {
    const tags = [assessment.primaryType];

    if (assessment.confidence > 80) tags.push('high_confidence');
    if (assessment.aiReadiness > 70) tags.push('ai_ready');
    if (assessment.investorScore > 60) tags.push('investor_potential');

    return tags;
  }
}
```

---

## 6. Analytics & Reporting

### 6.1 Key Metrics

```typescript
interface AssessmentMetrics {
  // Conversion Metrics
  completionRate: number;
  qualificationRate: number;
  routingAccuracy: number;

  // Classification Distribution
  prospectTypeDistribution: {
    investor: number;
    strategic_partner: number;
    customer: number;
  };

  // Quality Metrics
  averageConfidence: number;
  highQualityLeadRate: number;
  productMatchRate: number;

  // Business Impact
  leadToOpportunityRate: number;
  averageDealSize: number;
  timeToContact: number;
}
```

### 6.2 Dashboard Views

```typescript
interface DashboardViews {
  executive: {
    totalAssessments: number;
    qualifiedLeads: number;
    prospectDistribution: Chart;
    conversionFunnel: Chart;
  };

  sales: {
    newCustomerLeads: Lead[];
    productMatches: ProductMatch[];
    leadScores: LeadScore[];
    followUpQueue: Task[];
  };

  partnerships: {
    potentialPartners: Partner[];
    partnershipTypes: Distribution;
    marketCoverage: Map;
  };

  investors: {
    investorLeads: Investor[];
    investmentReadiness: Score;
    portfolioAlignment: Analysis;
  };
}
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Implement new question set with branching logic
- [ ] Build classification algorithm
- [ ] Create database schema
- [ ] Basic routing rules

### Phase 2: Intelligence (Week 3-4)

- [ ] Product matching algorithm
- [ ] Confidence scoring
- [ ] Dynamic follow-up questions
- [ ] A/B testing framework

### Phase 3: Integration (Week 5-6)

- [ ] CRM integration
- [ ] Email automation
- [ ] Analytics dashboard
- [ ] Notification system

### Phase 4: Optimization (Ongoing)

- [ ] Machine learning model training
- [ ] Conversion optimization
- [ ] Routing refinement
- [ ] Performance tuning

---

## 8. Success Metrics

### Primary KPIs

- **Classification Accuracy**: >85% correct primary type
- **Qualified Lead Rate**: >40% of completions
- **Time to Contact**: <15 minutes for high-value prospects
- **Conversion Rate**: >25% lead to opportunity

### Secondary KPIs

- **Completion Rate**: >70% of started assessments
- **Product Match Accuracy**: >80% acceptance rate
- **Partner Identification**: 5+ qualified partners/month
- **Investor Engagement**: 2+ qualified investors/quarter

---

## 9. Technical Requirements

### Performance

- Page load: <2 seconds
- Question transition: <200ms
- Classification calculation: <500ms
- API response: <1 second

### Scalability

- Support 1000+ concurrent assessments
- Process 10,000+ assessments/month
- Store 1M+ response records
- Real-time analytics updates

### Security

- SOC 2 compliant data handling
- GDPR/CCPA compliance
- Encrypted data at rest and in transit
- Role-based access control

---

## 10. Risk Mitigation

### Identified Risks

1. **Misclassification**: Incorrect prospect type assignment
   - _Mitigation_: Confidence thresholds, human review for edge cases
2. **Data Quality**: Incomplete or false information
   - _Mitigation_: Progressive profiling, validation rules
3. **Over-automation**: Missing high-value prospects
   - _Mitigation_: Manual review queue, alert system
4. **Technical Debt**: System complexity growth
   - _Mitigation_: Modular architecture, regular refactoring

---

## Appendix A: Question Bank

[Full question set with weights and branching logic - 50+ questions]

## Appendix B: API Specification

[OpenAPI 3.0 specification for assessment API]

## Appendix C: Integration Mappings

[Detailed field mappings for CRM, email, and analytics systems]
