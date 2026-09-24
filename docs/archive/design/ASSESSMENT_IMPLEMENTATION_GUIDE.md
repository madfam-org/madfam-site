> **ARCHIVED — historical record, not current guidance** (banner added 2026-09-23).
> Names, hosts, products and procedures below may be retired — e.g. PENNY, SPARK,
> penny.onl, forgesight.quest, and Vercel / Railway / GitHub Pages hosting. Current
> sources: [`AGENTS.md`](/AGENTS.md), [`ECOSYSTEM.md`](/ECOSYSTEM.md) and
> [`docs/deployment/DEPLOYMENT.md`](/docs/deployment/DEPLOYMENT.md).

# Assessment Implementation Guide

## Code Examples & Patterns

### Quick Start Implementation

```typescript
// 1. Core Types & Interfaces
// types/assessment.ts

export enum ProspectType {
  INVESTOR = 'investor',
  STRATEGIC_PARTNER = 'strategic_partner',
  CUSTOMER = 'customer',
}

export interface AssessmentContext {
  sessionId: string;
  startedAt: Date;
  locale: string;
  responses: Map<string, any>;
  classification?: Classification;
  currentPhase: AssessmentPhase;
}

export interface Classification {
  primaryType: ProspectType;
  secondaryType?: ProspectType;
  confidence: number;
  scores: {
    investor: number;
    strategic_partner: number;
    customer: number;
  };
}
```

---

## Frontend Implementation

### 1. Smart Assessment Component

```tsx
// components/SmartAssessment.tsx

import { useState, useEffect, useCallback } from 'react';
import { useAssessmentEngine } from '@/hooks/useAssessmentEngine';
import { AnimatePresence, motion } from 'framer-motion';

export function SmartAssessment() {
  const { session, currentQuestion, progress, classification, submitAnswer, isLoading } =
    useAssessmentEngine();

  const [answer, setAnswer] = useState<any>(null);

  // Real-time classification updates
  useEffect(() => {
    if (classification?.confidence > 60) {
      // Show partial classification to build excitement
      showClassificationHint(classification);
    }
  }, [classification]);

  const handleSubmit = useCallback(async () => {
    if (!answer) return;

    const result = await submitAnswer(currentQuestion.id, answer, {
      timeSpent: calculateTimeSpent(),
      confidence: getUserConfidence(),
    });

    if (result.nextQuestions) {
      // Smooth transition to next question
      transitionToNext(result.nextQuestions[0]);
    } else if (result.complete) {
      // Show results
      navigateToResults(result.classification);
    }

    setAnswer(null);
  }, [answer, currentQuestion]);

  return (
    <div className="assessment-container">
      {/* Progress Indicator */}
      <AssessmentProgress
        current={progress.current}
        total={progress.total}
        classification={classification}
      />

      {/* Question Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <QuestionCard
            question={currentQuestion}
            answer={answer}
            onChange={setAnswer}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </motion.div>
      </AnimatePresence>

      {/* Smart Hints */}
      {classification && (
        <ClassificationHint
          type={classification.primaryType}
          confidence={classification.confidence}
        />
      )}
    </div>
  );
}
```

### 2. Assessment Engine Hook

```typescript
// hooks/useAssessmentEngine.ts

import { useState, useEffect, useRef } from 'react';
import { AssessmentAPI } from '@/lib/api/assessment';
import { ClassificationEngine } from '@/lib/classification';

export function useAssessmentEngine() {
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [currentPhase, setCurrentPhase] = useState<AssessmentPhase>('screening');
  const [responses, setResponses] = useState<Map<string, any>>(new Map());
  const [classification, setClassification] = useState<Classification | null>(null);

  const engine = useRef(new ClassificationEngine());
  const api = useRef(new AssessmentAPI());

  // Initialize session
  useEffect(() => {
    initializeSession();
  }, []);

  // Real-time classification
  useEffect(() => {
    if (responses.size > 2) {
      const partialClassification = engine.current.classify(responses);
      setClassification(partialClassification);
    }
  }, [responses]);

  const initializeSession = async () => {
    const session = await api.current.startSession({
      locale: navigator.language.split('-')[0],
      referrer: document.referrer,
      utm_source: getUTMParam('utm_source'),
    });

    setSession(session);
    setupWebSocket(session.sessionId);
  };

  const submitAnswer = async (questionId: string, answer: any, metadata?: any) => {
    // Store locally for real-time classification
    responses.set(questionId, answer);
    setResponses(new Map(responses));

    // Submit to API
    const result = await api.current.submitAnswer(session!.sessionId, {
      questionId,
      answer,
      metadata,
    });

    // Handle branching logic
    if (result.nextQuestions) {
      return {
        nextQuestions: result.nextQuestions,
        progress: result.progress,
      };
    }

    // Check if complete
    if (result.progress.current === result.progress.total) {
      const finalResult = await completeAssessment();
      return {
        complete: true,
        classification: finalResult.classification,
        recommendations: finalResult.recommendations,
      };
    }

    return result;
  };

  const completeAssessment = async () => {
    const result = await api.current.completeAssessment(session!.sessionId, {
      contact: getContactInfo(),
      consent: getConsent(),
    });

    // Track completion
    analytics.track('Assessment Completed', {
      classification: result.classification.primaryType,
      confidence: result.classification.confidence,
      duration: calculateDuration(),
    });

    return result;
  };

  return {
    session,
    currentQuestion: getCurrentQuestion(),
    progress: getProgress(),
    classification,
    submitAnswer,
    isLoading: api.current.isLoading,
  };
}
```

---

## Backend Implementation

### 3. Classification Algorithm

```typescript
// lib/classification/ProspectClassifier.ts

export class ProspectClassifier {
  private readonly weights = {
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

  classify(responses: Map<string, any>): Classification {
    // Calculate scores for each type
    const scores = {
      investor: this.calculateInvestorScore(responses),
      strategic_partner: this.calculatePartnerScore(responses),
      customer: this.calculateCustomerScore(responses),
    };

    // Determine primary and secondary types
    const sortedTypes = Object.entries(scores).sort(([, a], [, b]) => b - a);

    const primaryType = sortedTypes[0][0] as ProspectType;
    const secondaryType = sortedTypes[1][1] > 40 ? (sortedTypes[1][0] as ProspectType) : undefined;

    // Calculate confidence
    const confidence = this.calculateConfidence(scores, primaryType);

    return {
      primaryType,
      secondaryType,
      confidence,
      scores,
      metadata: {
        algorithmVersion: '2.0.0',
        calculatedAt: new Date().toISOString(),
        factors: this.getClassificationFactors(responses, primaryType),
      },
    };
  }

  private calculateInvestorScore(responses: Map<string, any>): number {
    let score = 0;
    const weights = this.weights.investor;

    // Organization type
    const orgType = responses.get('org_type');
    if (orgType === 'investment_firm') {
      score += 40 * weights.org_type;
    } else if (orgType === 'family_office') {
      score += 35 * weights.org_type;
    }

    // Primary interest
    const interest = responses.get('primary_interest');
    if (interest === 'invest') {
      score += 40 * weights.primary_interest;
    } else if (interest === 'explore_investment') {
      score += 20 * weights.primary_interest;
    }

    // Investment history
    const portfolio = responses.get('portfolio_companies');
    if (portfolio > 50) {
      score += 30 * weights.portfolio_size;
    } else if (portfolio > 10) {
      score += 20 * weights.portfolio_size;
    }

    // Decision authority
    const role = responses.get('decision_role');
    if (role === 'general_partner' || role === 'managing_director') {
      score += 30 * weights.decision_role;
    }

    return Math.min(Math.round(score), 100);
  }

  private calculateConfidence(
    scores: Record<ProspectType, number>,
    primaryType: ProspectType
  ): number {
    const primaryScore = scores[primaryType];
    const otherScores = Object.entries(scores)
      .filter(([type]) => type !== primaryType)
      .map(([, score]) => score);

    const maxOtherScore = Math.max(...otherScores);
    const separation = primaryScore - maxOtherScore;

    // High confidence if clear separation
    if (separation > 30) return 90 + (separation - 30) / 7;
    if (separation > 20) return 80 + (separation - 20) / 1;
    if (separation > 10) return 60 + (separation - 10) * 2;

    return 40 + separation * 2;
  }
}
```

### 4. Dynamic Question Engine

```typescript
// lib/questions/DynamicQuestionEngine.ts

export class DynamicQuestionEngine {
  private questionBank: Map<string, Question>;
  private rules: BranchingRule[];

  constructor() {
    this.questionBank = this.loadQuestionBank();
    this.rules = this.loadBranchingRules();
  }

  getNextQuestions(context: AssessmentContext, count: number = 1): Question[] {
    const answeredIds = Array.from(context.responses.keys());
    const classification = context.classification;

    // Apply branching rules
    const triggeredQuestions = this.applyBranchingRules(context);

    // Get phase-appropriate questions
    const phaseQuestions = this.getPhaseQuestions(context.currentPhase, answeredIds);

    // Prioritize based on classification confidence
    const prioritized = this.prioritizeQuestions(
      [...triggeredQuestions, ...phaseQuestions],
      classification
    );

    return prioritized.slice(0, count);
  }

  private applyBranchingRules(context: AssessmentContext): Question[] {
    const triggered: Question[] = [];

    for (const rule of this.rules) {
      if (this.evaluateCondition(rule.condition, context)) {
        const questions = rule.triggerQuestions
          .map(id => this.questionBank.get(id))
          .filter(Boolean) as Question[];

        triggered.push(...questions);
      }
    }

    return triggered;
  }

  private prioritizeQuestions(questions: Question[], classification?: Classification): Question[] {
    if (!classification) return questions;

    // Score each question based on its value for clarifying classification
    const scored = questions.map(q => ({
      question: q,
      score: this.calculateQuestionValue(q, classification),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    return scored.map(s => s.question);
  }

  private calculateQuestionValue(question: Question, classification: Classification): number {
    let value = 0;

    // Questions that can increase confidence are valuable
    if (classification.confidence < 70) {
      if (question.category === 'intent' || question.category === 'profile') {
        value += 20;
      }
    }

    // Type-specific questions are valuable when confidence is moderate
    if (classification.confidence > 50 && classification.confidence < 80) {
      if (
        classification.primaryType === ProspectType.INVESTOR &&
        question.category === 'investment'
      ) {
        value += 30;
      }

      if (
        classification.primaryType === ProspectType.STRATEGIC_PARTNER &&
        question.category === 'partnership'
      ) {
        value += 30;
      }

      if (
        classification.primaryType === ProspectType.CUSTOMER &&
        (question.category === 'budget' || question.category === 'timeline')
      ) {
        value += 30;
      }
    }

    return value;
  }
}
```

### 5. Product Matching Service

```typescript
// services/ProductMatchingService.ts

export class ProductMatchingService {
  private products: Product[] = [
    {
      id: ProductFit.PENNY,
      name: 'PENNY',
      description: 'AI Assistant for Enterprises',
      idealCustomer: {
        companySize: ['medium', 'large', 'enterprise'],
        aiReadiness: { min: 30 },
        budget: { min: 50000 },
        industries: 'all',
      },
    },
    // ... other products
  ];

  async matchProducts(
    profile: ProspectProfile,
    classification: Classification
  ): Promise<ProductRecommendation[]> {
    if (classification.primaryType !== ProspectType.CUSTOMER) {
      return [];
    }

    const matches: ProductRecommendation[] = [];

    for (const product of this.products) {
      const fitScore = this.calculateProductFit(product, profile);

      if (fitScore > 50) {
        matches.push({
          productId: product.id,
          productName: product.name,
          fitScore,
          reasoning: this.generateReasoning(product, profile, fitScore),
          benefits: this.getProductBenefits(product, profile),
          nextSteps: this.getNextSteps(product, fitScore),
          pricing: await this.getPricing(product, profile),
        });
      }
    }

    // Sort by fit score
    matches.sort((a, b) => b.fitScore - a.fitScore);

    // Limit to top 3 recommendations
    return matches.slice(0, 3);
  }

  private calculateProductFit(product: Product, profile: ProspectProfile): number {
    let score = 0;
    let factors = 0;

    // Company size match
    if (
      product.idealCustomer.companySize === 'all' ||
      product.idealCustomer.companySize.includes(profile.company.size)
    ) {
      score += 25;
    }
    factors++;

    // AI readiness match
    if (profile.business.aiReadiness >= product.idealCustomer.aiReadiness.min) {
      score += 25;
    }
    factors++;

    // Budget match
    const budget = this.parseBudget(profile.intent.budget);
    if (budget >= product.idealCustomer.budget.min) {
      score += 25;
    }
    factors++;

    // Industry match
    if (
      product.idealCustomer.industries === 'all' ||
      product.idealCustomer.industries.includes(profile.company.industry)
    ) {
      score += 25;
    }
    factors++;

    // Normalize score
    return Math.round(score);
  }
}
```

---

## Database Implementation

### 6. Prisma Schema

```prisma
// prisma/schema.prisma

model ProspectAssessment {
  id                String            @id @default(cuid())
  sessionId         String            @unique

  // Classification
  primaryType       ProspectType
  secondaryType     ProspectType?
  confidence        Float
  investorScore     Int
  partnerScore      Int
  customerScore     Int

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
  phone             String?

  // Scores & Analysis
  aiReadiness       Int
  dataMaturity      Int
  techCapability    Int
  leadScore         Int

  // Recommendations
  productMatches    Json              // ProductRecommendation[]
  nextSteps         Json              // string[]
  resources         Json              // Resource[]

  // Routing
  assignedTo        String?
  businessUnit      String?
  priority          Priority
  routedAt          DateTime?

  // Metadata
  startedAt         DateTime
  completedAt       DateTime?
  timeSpent         Int?             // seconds
  locale            String
  source            String?

  // Relations
  responses         ProspectResponse[]
  lead              Lead?             @relation(fields: [leadId], references: [id])
  leadId            String?
  events            AssessmentEvent[]

  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  @@index([primaryType, confidence])
  @@index([sessionId])
  @@index([email])
  @@index([completedAt])
}

model ProspectResponse {
  id                String            @id @default(cuid())
  assessmentId      String
  assessment        ProspectAssessment @relation(fields: [assessmentId], references: [id])

  questionId        String
  questionText      String
  questionCategory  String

  answer            String
  answerValue       Json?
  answerMetadata    Json?             // timeSpent, confidence, etc.

  // Scoring contribution
  investorWeight    Float?
  partnerWeight     Float?
  customerWeight    Float?

  createdAt         DateTime          @default(now())

  @@index([assessmentId])
  @@index([questionId])
}

model AssessmentEvent {
  id                String            @id @default(cuid())
  assessmentId      String
  assessment        ProspectAssessment @relation(fields: [assessmentId], references: [id])

  type              EventType
  data              Json
  timestamp         DateTime          @default(now())

  @@index([assessmentId, type])
}

enum ProspectType {
  INVESTOR
  STRATEGIC_PARTNER
  CUSTOMER
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum EventType {
  STARTED
  QUESTION_ANSWERED
  CLASSIFICATION_UPDATED
  COMPLETED
  ABANDONED
  ROUTED
  CONTACTED
}
```

---

## Integration Examples

### 7. CRM Integration

```typescript
// integrations/CRMIntegration.ts

export class CRMIntegration {
  private hubspotClient: HubspotClient;
  private salesforceClient: SalesforceClient;

  async syncAssessment(assessment: ProspectAssessment): Promise<void> {
    const crmData = this.transformToCRMFormat(assessment);

    // Determine CRM based on classification
    if (assessment.primaryType === ProspectType.INVESTOR) {
      await this.syncToInvestorCRM(crmData);
    } else {
      await this.syncToSalesCRM(crmData);
    }

    // Update assessment with CRM ID
    await this.updateAssessmentWithCRMId(assessment.id, crmData.crmId);
  }

  private transformToCRMFormat(assessment: ProspectAssessment): CRMData {
    return {
      // Contact Info
      email: assessment.email,
      firstName: this.parseFirstName(assessment.name),
      lastName: this.parseLastName(assessment.name),
      company: assessment.company,
      jobTitle: assessment.role,

      // Classification
      leadType: assessment.primaryType,
      leadScore: assessment.leadScore,
      confidence: assessment.confidence,

      // Custom Properties
      customProperties: {
        assessment_id: assessment.id,
        ai_readiness: assessment.aiReadiness,
        investor_score: assessment.investorScore,
        partner_score: assessment.partnerScore,
        customer_score: assessment.customerScore,
        product_matches: assessment.productMatches,
        classification_date: assessment.completedAt,
        source_campaign: assessment.source,
      },

      // Tags
      tags: this.generateTags(assessment),

      // Owner Assignment
      ownerId: this.determineOwner(assessment),
    };
  }

  private generateTags(assessment: ProspectAssessment): string[] {
    const tags: string[] = [
      `type:${assessment.primaryType}`,
      `confidence:${assessment.confidence > 80 ? 'high' : assessment.confidence > 60 ? 'medium' : 'low'}`,
      `industry:${assessment.industry}`,
      `size:${assessment.companySize}`,
    ];

    // Add product tags
    const products = assessment.productMatches as ProductRecommendation[];
    products?.forEach(p => {
      if (p.fitScore > 70) {
        tags.push(`product:${p.productId}`);
      }
    });

    // Add priority tags
    if (assessment.priority === Priority.URGENT) {
      tags.push('hot_lead');
    }

    if (assessment.leadScore > 80) {
      tags.push('high_value');
    }

    return tags;
  }

  private determineOwner(assessment: ProspectAssessment): string {
    // Route based on type and geography
    const ownerMap = {
      [ProspectType.INVESTOR]: process.env.INVESTOR_RELATIONS_OWNER_ID,
      [ProspectType.STRATEGIC_PARTNER]: process.env.PARTNERSHIPS_OWNER_ID,
      [ProspectType.CUSTOMER]: this.getSalesOwner(assessment),
    };

    return ownerMap[assessment.primaryType] || process.env.DEFAULT_OWNER_ID;
  }
}
```

### 8. Email Automation

```typescript
// services/EmailAutomation.ts

export class EmailAutomation {
  async sendAssessmentResults(assessment: ProspectAssessment): Promise<void> {
    const template = this.selectTemplate(assessment);
    const data = this.prepareTemplateData(assessment);

    await this.emailService.send({
      to: assessment.email,
      template,
      data,
      tags: ['assessment', assessment.primaryType],
      scheduledFor: this.calculateSendTime(assessment),
    });

    // Schedule follow-ups
    await this.scheduleFollowUps(assessment);
  }

  private selectTemplate(assessment: ProspectAssessment): string {
    const templateMap = {
      [ProspectType.INVESTOR]: 'investor-welcome',
      [ProspectType.STRATEGIC_PARTNER]: 'partner-opportunity',
      [ProspectType.CUSTOMER]: this.getCustomerTemplate(assessment),
    };

    return templateMap[assessment.primaryType];
  }

  private getCustomerTemplate(assessment: ProspectAssessment): string {
    const products = assessment.productMatches as ProductRecommendation[];

    if (!products || products.length === 0) {
      return 'customer-consultation';
    }

    const topProduct = products[0];

    const productTemplates = {
      [ProductFit.PENNY]: 'penny-trial',
      [ProductFit.DHANAM]: 'dhanam-demo',
    };

    return productTemplates[topProduct.productId] || 'customer-general';
  }

  private async scheduleFollowUps(assessment: ProspectAssessment): Promise<void> {
    const sequence = this.getEmailSequence(assessment);

    for (const [index, email] of sequence.entries()) {
      await this.emailService.schedule({
        to: assessment.email,
        template: email.template,
        data: email.data,
        sendAt: this.calculateFollowUpTime(assessment.completedAt, email.delay),
        condition: email.condition, // e.g., "not_responded", "not_converted"
      });
    }
  }
}
```

---

## Testing Strategy

### 9. Test Scenarios

```typescript
// tests/classification.test.ts

describe('ProspectClassifier', () => {
  let classifier: ProspectClassifier;

  beforeEach(() => {
    classifier = new ProspectClassifier();
  });

  describe('Investor Classification', () => {
    it('should classify VC firm as investor with high confidence', () => {
      const responses = new Map([
        ['org_type', 'investment_firm'],
        ['primary_interest', 'invest'],
        ['portfolio_companies', 75],
        ['investment_stage', 'Series A'],
        ['decision_role', 'general_partner'],
      ]);

      const result = classifier.classify(responses);

      expect(result.primaryType).toBe(ProspectType.INVESTOR);
      expect(result.confidence).toBeGreaterThan(85);
      expect(result.scores.investor).toBeGreaterThan(80);
    });
  });

  describe('Customer Classification', () => {
    it('should classify enterprise seeking AI implementation as customer', () => {
      const responses = new Map([
        ['org_type', 'corporation'],
        ['company_size', 'enterprise'],
        ['primary_interest', 'implement_ai'],
        ['budget', '250k-1M'],
        ['timeline', '1-3 months'],
        ['decision_role', 'decision_maker'],
      ]);

      const result = classifier.classify(responses);

      expect(result.primaryType).toBe(ProspectType.CUSTOMER);
      expect(result.confidence).toBeGreaterThan(75);
    });
  });

  describe('Edge Cases', () => {
    it('should handle ambiguous classification with low confidence', () => {
      const responses = new Map([
        ['org_type', 'consultancy'],
        ['primary_interest', 'explore'],
        ['decision_role', 'researcher'],
      ]);

      const result = classifier.classify(responses);

      expect(result.confidence).toBeLessThan(60);
      expect(result.secondaryType).toBeDefined();
    });
  });
});
```

---

## Monitoring & Analytics

### 10. Analytics Implementation

```typescript
// analytics/AssessmentAnalytics.ts

export class AssessmentAnalytics {
  async trackAssessment(assessment: ProspectAssessment): Promise<void> {
    // Track completion
    await this.track('Assessment Completed', {
      assessmentId: assessment.id,
      primaryType: assessment.primaryType,
      secondaryType: assessment.secondaryType,
      confidence: assessment.confidence,
      duration: assessment.timeSpent,
      questionCount: await this.getQuestionCount(assessment.id),
    });

    // Track classification distribution
    await this.increment(`classification.${assessment.primaryType}`);

    // Track quality metrics
    if (assessment.confidence > 80) {
      await this.increment('high_confidence_classifications');
    }

    // Track product matches
    const products = assessment.productMatches as ProductRecommendation[];
    for (const product of products || []) {
      await this.track('Product Matched', {
        assessmentId: assessment.id,
        productId: product.productId,
        fitScore: product.fitScore,
      });
    }
  }

  async generateDashboard(): Promise<DashboardData> {
    const [
      totalAssessments,
      completionRate,
      classificationDistribution,
      averageConfidence,
      conversionFunnel,
    ] = await Promise.all([
      this.getTotalAssessments(),
      this.getCompletionRate(),
      this.getClassificationDistribution(),
      this.getAverageConfidence(),
      this.getConversionFunnel(),
    ]);

    return {
      summary: {
        totalAssessments,
        completionRate,
        averageConfidence,
      },
      charts: {
        classificationDistribution,
        conversionFunnel,
        confidenceTrend: await this.getConfidenceTrend(),
        productPerformance: await this.getProductPerformance(),
      },
      insights: await this.generateInsights(),
    };
  }
}
```

---

## Deployment Checklist

### Production Readiness

```yaml
deployment:
  prerequisites:
    - Database migrations complete
    - Environment variables configured
    - API endpoints tested
    - CRM integration verified
    - Email templates created

  monitoring:
    - Error tracking (Sentry)
    - Performance monitoring (DataDog)
    - Business metrics (Mixpanel)
    - Uptime monitoring (Pingdom)

  rollout:
    - Feature flag: assessment_v2
    - Canary deployment: 10% -> 50% -> 100%
    - Rollback plan documented
    - Support team trained

  validation:
    - Classification accuracy > 85%
    - API response time < 500ms p95
    - Completion rate > 60%
    - Zero critical bugs
```
