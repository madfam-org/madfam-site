# Assessment API Specification

## OpenAPI 3.0 Implementation Guide

### API Overview

```yaml
openapi: 3.0.0
info:
  title: MADFAM Prospect Classification API
  version: 2.0.0
  description: Intelligent prospect identification and classification system
servers:
  - url: https://api.madfam.io/v2
    description: Production API
  - url: https://staging-api.madfam.io/v2
    description: Staging API
```

---

## Core API Endpoints

### 1. Assessment Session Management

```typescript
// POST /api/assessment/session/start
interface StartSessionRequest {
  locale: 'es' | 'en' | 'pt';
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}

interface StartSessionResponse {
  sessionId: string;
  questions: Question[]; // Initial screening questions
  expiresAt: string; // ISO 8601 timestamp
}

// POST /api/assessment/session/{sessionId}/answer
interface SubmitAnswerRequest {
  questionId: string;
  answer: string | string[] | number;
  metadata?: {
    timeSpent: number; // Milliseconds on question
    confidence?: number; // 0-100 self-reported confidence
  };
}

interface SubmitAnswerResponse {
  accepted: boolean;
  nextQuestions?: Question[]; // Dynamic follow-ups
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  classification?: {
    // Partial classification if available
    primaryType?: ProspectType;
    confidence?: number;
  };
}
```

### 2. Classification & Results

```typescript
// POST /api/assessment/session/{sessionId}/complete
interface CompleteAssessmentRequest {
  contact?: {
    email: string;
    name?: string;
    company?: string;
    role?: string;
    phone?: string;
  };
  consent: {
    marketing: boolean;
    dataProcessing: boolean;
    timestamp: string;
  };
}

interface CompleteAssessmentResponse {
  assessmentId: string;
  classification: {
    primaryType: ProspectType;
    secondaryType?: ProspectType;
    confidence: number;
    scores: {
      investor: number;
      strategic_partner: number;
      customer: number;
    };
  };
  recommendations: {
    products?: ProductRecommendation[];
    services?: ServiceRecommendation[];
    nextSteps: string[];
    resources: Resource[];
  };
  routing: {
    assignedTo?: string;
    businessUnit?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    expectedResponseTime: string;
  };
}

// GET /api/assessment/{assessmentId}/report
interface AssessmentReport {
  id: string;
  createdAt: string;
  classification: Classification;
  profile: ProspectProfile;
  responses: QuestionResponse[];
  analysis: {
    strengths: string[];
    opportunities: string[];
    readinessLevel: string;
    maturityScore: number;
  };
  recommendations: Recommendation[];
  shareableLink?: string;
}
```

### 3. Dynamic Question Management

```typescript
// GET /api/assessment/questions/next
interface GetNextQuestionsRequest {
  sessionId: string;
  context: {
    answeredQuestions: string[];
    currentClassification?: ProspectType;
    confidence?: number;
  };
}

interface GetNextQuestionsResponse {
  questions: Question[];
  reasoning?: string; // Why these questions
  remainingQuestions: number;
}

// Question Structure
interface Question {
  id: string;
  type: 'single' | 'multiple' | 'scale' | 'text' | 'matrix';
  category: QuestionCategory;
  text: string;
  description?: string;
  required: boolean;

  // For single/multiple choice
  options?: Option[];

  // For scale questions
  scale?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
    step?: number;
  };

  // For matrix questions
  matrix?: {
    rows: MatrixRow[];
    columns: MatrixColumn[];
  };

  // Validation
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    custom?: string; // Custom validation rule ID
  };

  // Display hints
  displayRules?: {
    showIf?: Condition[];
    hideIf?: Condition[];
  };
}

interface Option {
  value: string;
  label: string;
  description?: string;
  icon?: string;

  // Scoring weights for classification
  weights?: {
    investor?: number;
    partner?: number;
    customer?: number;
  };

  // Follow-up triggers
  triggers?: {
    questions?: string[]; // Question IDs to add
    skip?: string[]; // Question IDs to skip
  };
}
```

---

## Advanced Features

### 4. Real-time Classification

```typescript
// WebSocket: /ws/assessment/{sessionId}
interface RealtimeClassification {
  event: 'classification_update';
  data: {
    currentType?: ProspectType;
    confidence: number;
    changes: {
      investor: number; // Delta from last update
      partner: number;
      customer: number;
    };
    suggestedQuestions?: string[];
  };
}
```

### 5. Bulk Operations

```typescript
// POST /api/assessment/bulk/import
interface BulkImportRequest {
  source: 'csv' | 'crm' | 'form';
  data: ProspectData[];
  options: {
    skipClassification?: boolean;
    autoRoute?: boolean;
    notifyTeam?: boolean;
  };
}

// GET /api/assessment/analytics/aggregate
interface AggregateAnalytics {
  timeRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalAssessments: number;
    completionRate: number;
    averageTime: number;
    classificationDistribution: Record<ProspectType, number>;
    conversionRates: {
      leadToOpportunity: number;
      opportunityToCustomer: number;
    };
  };
  trends: TrendData[];
  insights: Insight[];
}
```

---

## Data Models

### Core Entities

```typescript
// Prospect Classification
enum ProspectType {
  INVESTOR = 'investor',
  STRATEGIC_PARTNER = 'strategic_partner',
  CUSTOMER = 'customer',
}

// Question Categories
enum QuestionCategory {
  SCREENING = 'screening',
  PROFILE = 'profile',
  TECHNICAL = 'technical',
  BUSINESS = 'business',
  INTENT = 'intent',
  BUDGET = 'budget',
  TIMELINE = 'timeline',
  PARTNERSHIP = 'partnership',
  INVESTMENT = 'investment',
}

// Company Profiles
enum CompanySize {
  SOLO = '1',
  SMALL = '2-10',
  MEDIUM = '11-50',
  LARGE = '51-200',
  ENTERPRISE = '201-1000',
  GLOBAL = '1000+',
}

enum Industry {
  TECHNOLOGY = 'technology',
  FINANCIAL_SERVICES = 'financial_services',
  HEALTHCARE = 'healthcare',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  GOVERNMENT = 'government',
  EDUCATION = 'education',
  CONSULTING = 'consulting',
  OTHER = 'other',
}

// Product Mapping
enum ProductFit {
  PENNY = 'penny',
  DHANAM = 'dhanam',
  COTIZA_STUDIO = 'cotiza_studio',
  FORGE_SIGHT = 'forge_sight',
  AVALA = 'avala',
  FACTLAS = 'factlas',
  MADFAM_PLATFORM = 'madfam_platform',
  CUSTOM = 'custom',
}
```

### Response Structures

```typescript
interface Classification {
  primaryType: ProspectType;
  secondaryType?: ProspectType;
  confidence: number; // 0-100
  scores: {
    investor: number;
    strategic_partner: number;
    customer: number;
  };
  metadata: {
    algorithmVersion: string;
    calculatedAt: string;
    factors: ClassificationFactor[];
  };
}

interface ProductRecommendation {
  productId: ProductFit;
  fitScore: number; // 0-100
  reasoning: string;
  benefits: string[];
  pricing?: {
    model: 'subscription' | 'license' | 'usage' | 'custom';
    range?: string;
  };
  cta: {
    text: string;
    url: string;
    type: 'demo' | 'trial' | 'contact' | 'purchase';
  };
}

interface ProspectProfile {
  // Company Information
  company: {
    name?: string;
    size: CompanySize;
    industry: Industry;
    website?: string;
    location?: string;
  };

  // Contact Information
  contact: {
    name?: string;
    email?: string;
    role?: string;
    department?: string;
  };

  // Business Context
  business: {
    annualRevenue?: string;
    aiReadiness: number;
    dataMaturity: number;
    currentTools?: string[];
    challenges: string[];
  };

  // Intent Signals
  intent: {
    primaryGoal: string;
    timeline: string;
    budget?: string;
    decisionProcess?: string;
  };

  // Scoring
  scores: {
    leadScore: number;
    engagementScore: number;
    fitScore: number;
    urgencyScore: number;
  };
}
```

---

## Error Handling

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  };
}

// Error Codes
enum ErrorCode {
  // Session Errors
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_ALREADY_COMPLETED = 'SESSION_ALREADY_COMPLETED',

  // Validation Errors
  INVALID_ANSWER = 'INVALID_ANSWER',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_EMAIL = 'INVALID_EMAIL',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // System Errors
  CLASSIFICATION_FAILED = 'CLASSIFICATION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}
```

---

## Authentication & Security

### Rate Limiting

```typescript
interface RateLimits {
  anonymous: {
    assessments: '5 per hour per IP';
    api_calls: '100 per hour per IP';
  };
  authenticated: {
    assessments: '20 per hour per user';
    api_calls: '1000 per hour per user';
  };
}
```

### Headers

```typescript
interface RequiredHeaders {
  'X-Request-ID': string; // Unique request identifier
  'X-Session-ID'?: string; // Assessment session ID
  'X-Client-Version'?: string; // Client app version
  'Accept-Language': string; // Preferred language
}

interface SecurityHeaders {
  'X-CSRF-Token': string; // CSRF protection
  'X-Fingerprint'?: string; // Device fingerprint
}
```

---

## Webhook Events

```typescript
// POST {webhook_url}
interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  data: any;
  signature: string; // HMAC-SHA256
}

enum WebhookEventType {
  // Assessment Events
  ASSESSMENT_STARTED = 'assessment.started',
  ASSESSMENT_COMPLETED = 'assessment.completed',
  ASSESSMENT_ABANDONED = 'assessment.abandoned',

  // Classification Events
  PROSPECT_CLASSIFIED = 'prospect.classified',
  INVESTOR_IDENTIFIED = 'investor.identified',
  PARTNER_IDENTIFIED = 'partner.identified',
  HIGH_VALUE_LEAD = 'lead.high_value',

  // Routing Events
  LEAD_ASSIGNED = 'lead.assigned',
  LEAD_ROUTED = 'lead.routed',
  FOLLOW_UP_SCHEDULED = 'follow_up.scheduled',
}
```

---

## Testing & Validation

### Test Scenarios

```typescript
interface TestScenario {
  name: string;
  description: string;
  inputs: {
    answers: Record<string, any>;
    profile: Partial<ProspectProfile>;
  };
  expectedOutput: {
    classification: ProspectType;
    minConfidence: number;
    products?: ProductFit[];
  };
}

const testScenarios: TestScenario[] = [
  {
    name: 'Clear Investor Profile',
    description: 'VC firm looking for AI investments',
    inputs: {
      answers: {
        org_type: 'investment_firm',
        primary_interest: 'invest',
        portfolio_size: '51-100',
        investment_stage: 'Series A',
      },
      profile: {},
    },
    expectedOutput: {
      classification: ProspectType.INVESTOR,
      minConfidence: 85,
    },
  },
  // ... more test scenarios
];
```

---

## Migration Strategy

### From v1 to v2

```typescript
interface MigrationPlan {
  phases: [
    {
      name: 'Parallel Running';
      duration: '2 weeks';
      actions: [
        'Deploy v2 alongside v1',
        'Route 10% traffic to v2',
        'Monitor classification accuracy',
      ];
    },
    {
      name: 'Gradual Migration';
      duration: '2 weeks';
      actions: ['Increase v2 traffic to 50%', 'Migrate historical data', 'Update integrations'];
    },
    {
      name: 'Full Cutover';
      duration: '1 week';
      actions: ['Route 100% traffic to v2', 'Deprecate v1 endpoints', 'Archive v1 data'];
    },
  ];
}
```

---

## Performance Specifications

### SLA Requirements

```yaml
performance:
  response_times:
    p50: 200ms
    p95: 500ms
    p99: 1000ms

  availability:
    target: 99.9%
    maintenance_window: Sunday 2-4 AM UTC

  throughput:
    assessments_per_second: 100
    api_calls_per_second: 1000

  data_retention:
    active_sessions: 24 hours
    completed_assessments: 5 years
    analytics_data: 2 years
```

---

## Monitoring & Observability

### Key Metrics

```typescript
interface MonitoringMetrics {
  // Business Metrics
  assessmentsStarted: Counter;
  assessmentsCompleted: Counter;
  classificationAccuracy: Gauge;
  leadQuality: Histogram;

  // Technical Metrics
  apiLatency: Histogram;
  errorRate: Gauge;
  sessionDuration: Histogram;
  questionResponseTime: Histogram;

  // Classification Metrics
  classificationDistribution: {
    investor: Counter;
    partner: Counter;
    customer: Counter;
  };
  confidenceScores: Histogram;
  routingSuccess: Gauge;
}
```

### Alerting Rules

```yaml
alerts:
  - name: HighErrorRate
    condition: error_rate > 5%
    duration: 5 minutes
    severity: critical

  - name: LowCompletionRate
    condition: completion_rate < 50%
    duration: 15 minutes
    severity: warning

  - name: ClassificationAnomaly
    condition: confidence_score < 40%
    duration: 10 minutes
    severity: warning
```
