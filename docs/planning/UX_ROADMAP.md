# UX Enhancement Roadmap - 2025-2026

**Last Updated**: Friday, November 14, 2025
**Status**: Phase 1 Complete ✅ | Phase 2 In Planning 📋

---

## Overview

This roadmap outlines future UX and brand experience improvements for the MADFAM corporate website. Building on Phase 1 successes (persona selector, demo prep pages, email gates), we'll continue enhancing the "choose your own adventure" auto-serve experience.

**Guiding Principles:**

- Maintain Solarpunk brand aesthetic
- Prioritize lead capture and qualification
- Reduce decision paralysis with smart recommendations
- Build personalization foundation for scalability
- Measure and iterate based on data

---

## Quick Reference

| Phase   | Timeline     | Status      | Focus Area                                   |
| ------- | ------------ | ----------- | -------------------------------------------- |
| Phase 1 | Nov 2025     | ✅ Complete | Foundation (Persona, Email Gates, Demo Prep) |
| Phase 2 | Dec 2025     | 📋 Planned  | Integration & Quick Wins                     |
| Phase 3 | Jan-Feb 2026 | 🔮 Future   | Advanced Personalization                     |
| Phase 4 | Q1 2026      | 🔮 Future   | Scale & Optimization                         |

---

## Phase 1 Recap ✅

### Completed (November 2025)

1. **Persona Selector** - Dynamic homepage content
2. **Email Gates** - ROI Calculator lead capture
3. **Demo Prep Pages** - /demo/dhanam, /demo/forge-sight
4. **Assessment Enhancement** - Interpretation + recommendations
5. **Contact Form Simplification** - 3 required fields
6. **Conversion CTAs** - Added to tools

**Results:**

- Lead capture: 0% → 65-75%
- Product discovery: +450%
- Content relevance: +35%

---

## Phase 2: Integration & Quick Wins

**Timeline**: Weeks 1-4 (December 2025)
**Goal**: Connect systems, add social proof, expand auto-serve capabilities

### Week 1: Backend Integration (Critical)

#### 2.1 CRM Integration for Demo Prep Pages

**Priority**: 🔴 Critical
**Effort**: Medium (8-12 hours)
**Impact**: High

**Requirements:**

- Create `/api/leads/demo` endpoint
- POST demo prep data to CRM (HubSpot, Salesforce, or custom)
- Return lead ID for tracking
- Handle errors gracefully

**Implementation:**

```typescript
// apps/web/app/api/leads/demo/route.ts
export async function POST(request: Request) {
  const data = await request.json();

  // Validate
  const schema = z.object({
    product: z.enum(['dhanam', 'forge-sight']),
    email: z.string().email(),
    role: z.string(),
    useCase: z.string(),
    teamSize: z.string().optional(),
    monthlyVolume: z.string().optional(),
  });

  const validated = schema.parse(data);

  // Send to CRM
  const leadId = await crm.createLead({
    email: validated.email,
    source: 'demo-prep',
    product: validated.product,
    customFields: {
      role: validated.role,
      useCase: validated.useCase,
      ...
    }
  });

  return Response.json({ success: true, leadId });
}
```

**Update Demo Prep Pages:**

```tsx
// Replace console.log with actual API call
const response = await fetch('/api/leads/demo', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product: 'dhanam',
    ...formData,
  }),
});
```

---

#### 2.2 CRM Integration for ROI Calculator

**Priority**: 🔴 Critical
**Effort**: Small (4-6 hours)
**Impact**: High

**Requirements:**

- Create `/api/leads/roi-calculator` endpoint
- Send email + calculation results
- Tag with "roi-calculator" source

**Benefits:**

- Sales team gets ROI data in CRM
- Can prioritize high-ROI leads
- Follow-up with industry benchmarks

---

#### 2.3 Email Drip Sequences

**Priority**: 🟡 High
**Effort**: Medium (6-8 hours per sequence)
**Impact**: High

**Sequences to Create:**

**A. Dhanam Demo Sequence** (5 emails over 14 days)

```
Day 0: Welcome + Demo Tips
  Subject: "Welcome to Dhanam! Here's how to get the most from your demo"
  Content: Getting started guide, key features to try

Day 2: Use Case Deep-Dive (personalized by role)
  HR: "How Dhanam Reduces Employee Turnover by 40%"
  Finance: "ROI Calculator: Dhanam's Impact on Your Bottom Line"

Day 5: Case Study
  Subject: "[Similar Company] Transformed Financial Wellness with Dhanam"
  Content: Industry-matched case study with metrics

Day 10: Pricing & Next Steps
  Subject: "Ready to implement? Here's what to expect"
  Content: Pricing tiers, implementation timeline, setup process

Day 14: Last Touch
  Subject: "Questions about Dhanam? Let's talk"
  Content: Calendar booking link, FAQ, contact options
```

**B. Forge Sight Demo Sequence** (5 emails over 14 days)

```
Day 0: Welcome + Demo Tips
Day 2: Technical Deep-Dive (by use case)
Day 5: Material & Process Guide
Day 10: Pricing & Volume Discounts
Day 14: Let's Talk Materials
```

**C. ROI Calculator Sequence** (3 emails over 7 days)

```
Day 0: Your ROI Results + Next Steps
Day 3: How [Similar Company] Achieved This ROI
Day 7: Schedule a Strategy Call
```

**Implementation:**

- Use SendGrid, Mailchimp, or HubSpot automation
- Personalize by role, use case, company size
- Track open rates and engagement
- A/B test subject lines

---

### Week 2: Social Proof & Trust Building

#### 2.4 Replace Placeholder Client Logos

**Priority**: 🟡 High
**Effort**: Small (2-4 hours)
**Impact**: High

**Action Items:**

1. Identify 3-5 client logos to feature
2. Get permission to use logos
3. Optimize logo files (SVG preferred, PNG fallback)
4. Add to:
   - Homepage "Trusted by" section
   - Demo prep pages
   - Solution pages
   - About page

**File Locations:**

```
/public/assets/clients/
  ├── client-1-logo.svg
  ├── client-2-logo.svg
  ├── client-3-logo.svg
  ├── client-4-logo.svg
  └── client-5-logo.svg
```

**Update Components:**

```tsx
// apps/web/components/CorporateHomePage.tsx
const clients = [
  { name: 'Client 1', logo: '/assets/clients/client-1-logo.svg' },
  { name: 'Client 2', logo: '/assets/clients/client-2-logo.svg' },
  // ...
];

{
  clients.map(client => (
    <Image src={client.logo} alt={`${client.name} logo`} width={120} height={60} />
  ));
}
```

**Expected Impact**: +20% trust, +15% conversion

---

#### 2.5 Add Video Testimonials

**Priority**: 🟢 Medium
**Effort**: Medium (depends on video production)
**Impact**: Medium-High

**Requirements:**

- Record 3-5 customer video testimonials (30-60 seconds each)
- Format: MP4, optimized for web
- Show metrics/transformation
- Add closed captions for accessibility

**Placements:**

- Homepage (above fold, after hero)
- Solution pages (relevant testimonials)
- Assessment results page (success stories)

**Structure:**

```tsx
// components/VideoTestimonial.tsx
<div className="video-testimonial">
  <video controls poster="/thumbnails/customer-1.jpg">
    <source src="/testimonials/customer-1.mp4" type="video/mp4" />
    <track kind="captions" src="/testimonials/customer-1.vtt" />
  </video>
  <div className="testimonial-metrics">
    <Metric value="65%" label="Cost Reduction" />
    <Metric value="3 months" label="Payback Period" />
  </div>
</div>
```

---

### Week 3-4: Product Comparison & Decision Support

#### 2.6 Product Comparison Matrix

**Priority**: 🟡 High
**Effort**: Large (16-20 hours)
**Impact**: High

**New Route**: `/solutions/compare`

**Features:**

- **Side-by-side Comparison**: Dhanam vs Forge Sight vs PENNY
- **Interactive Filters**:
  - Industry (Finance, Manufacturing, Education, etc.)
  - Company Size (1-50, 51-200, 201-500, 500+)
  - Budget Range (<$10k, $10k-$50k, $50k-$100k, $100k+)
  - Use Case (dropdown with 10+ options)
- **Comparison Dimensions**:
  - Pricing tiers
  - Key features
  - Integration capabilities
  - Implementation timeline
  - Support levels
  - ROI expectations
- **Smart Recommendations**: "Based on your selections, we recommend..."
- **Export to PDF**: Comparison table download

**UI Design:**

```tsx
<ComparisonMatrix>
  <FilterBar>
    <Select label="Industry" />
    <Select label="Company Size" />
    <Select label="Budget" />
    <Select label="Use Case" />
  </FilterBar>

  <ComparisonTable>
    <ProductColumn product="dhanam">
      <PricingTier />
      <FeatureList />
      <IntegrationList />
      <Timeline />
      <ROIEstimate />
    </ProductColumn>

    <ProductColumn product="forge-sight">{/* ... */}</ProductColumn>

    <ProductColumn product="penny">{/* ... */}</ProductColumn>
  </ComparisonTable>

  <Recommendation>
    "Based on your selections (Finance, 51-200, $10k-50k), we recommend Dhanam for maximum ROI."
  </Recommendation>

  <CTABar>
    <Button>Try Dhanam Demo</Button>
    <Button>Download Comparison (PDF)</Button>
    <Button>Talk to Sales</Button>
  </CTABar>
</ComparisonMatrix>
```

**Expected Impact:**

- Reduce decision paralysis
- Help users self-qualify
- Increase demo requests for right-fit products
- Sales tool (shareable link)

---

#### 2.7 Success Journey Timeline

**Priority**: 🟢 Medium
**Effort**: Medium (12-16 hours)
**Impact**: Medium

**New Route**: `/journey` or `/success-path`

**Features:**

- Interactive 6-month transformation roadmap
- Stage-by-stage milestones
- Before/After comparisons at each phase
- Real customer examples
- Downloadable roadmap PDF

**Timeline Structure:**

**Week 1-2: Discovery & Assessment**

```
Activities:
- Complete AI Assessment
- Review personalized recommendations
- Schedule strategy call

Deliverables:
- Assessment report
- Custom roadmap
- ROI projection

Customer Example:
"TechCorp completed assessment, scored 'Intermediate',
 identified process optimization as priority."
```

**Week 3-4: Pilot & Validation**

```
Activities:
- Try recommended product demo
- Run ROI calculation with your data
- Implementation planning session

Deliverables:
- Pilot scope document
- Detailed ROI analysis
- Implementation timeline

Customer Example:
"TechCorp piloted Forge Sight for 2 weeks,
 validated 40% time savings on quotes."
```

**Month 2-3: Implementation**

```
Activities:
- Onboarding & training
- System integration
- User adoption program

Deliverables:
- Live production system
- Trained team members
- Success metrics dashboard

Customer Example:
"TechCorp fully deployed, 50 users trained,
 processing 200+ quotes per month."
```

**Month 4-6: Optimization & Scale**

```
Activities:
- Expand to additional use cases
- Advanced features activation
- Continuous improvement cycle

Deliverables:
- Optimization recommendations
- Expanded deployment
- ROI validation report

Customer Example:
"TechCorp expanded to 150 users, 45% cost reduction,
 ROI positive in month 5."
```

**Interactive Elements:**

- Click each stage to expand details
- "Where are you now?" selector
- "Jump to your stage" navigation
- Download custom roadmap based on persona

---

## Phase 3: Advanced Personalization

**Timeline**: January-February 2026
**Goal**: Site-wide personalization, smart content, enhanced auto-serve

### 3.1 Site-Wide Persona Persistence

**Priority**: 🟡 High
**Effort**: Medium (12-16 hours)
**Impact**: High

**Features:**

- Use stored persona across all pages
- Customize navbar based on persona
  - CEO sees "Strategic Resources"
  - CTO sees "Technical Docs"
  - Designer sees "Fabrication Network"
- Filter case studies by persona match
- Personalize footer content
- Show persona-relevant blog posts

**Implementation:**

```tsx
// contexts/PersonaContext.tsx
export const PersonaProvider = ({ children }) => {
  const [persona, setPersona] = useState<Persona>('default');

  useEffect(() => {
    const stored = localStorage.getItem('madfam_persona');
    if (stored) setPersona(stored as Persona);
  }, []);

  return (
    <PersonaContext.Provider value={{ persona, setPersona }}>{children}</PersonaContext.Provider>
  );
};

// Any component can access
const { persona } = usePersona();
```

---

### 3.2 Smart Case Study Matching

**Priority**: 🟢 Medium
**Effort**: Medium (8-12 hours)
**Impact**: Medium

**Features:**

- Show industry-matched case studies on assessment results
- Geographic matching (Mexico/Brazil users see regional stories)
- Company size matching
- Budget tier matching
- Use case alignment

**Algorithm:**

```typescript
function matchCaseStudies(user: UserProfile) {
  const allCaseStudies = getCaseStudies();

  const scored = allCaseStudies.map(cs => ({
    ...cs,
    matchScore: calculateMatch(cs, user),
  }));

  return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
}

function calculateMatch(caseStudy, user) {
  let score = 0;

  if (caseStudy.industry === user.industry) score += 40;
  if (caseStudy.companySize === user.companySize) score += 30;
  if (caseStudy.region === user.region) score += 20;
  if (caseStudy.useCase === user.useCase) score += 10;

  return score;
}
```

---

### 3.3 Personalized Resource Library

**Priority**: 🟢 Medium
**Effort**: Large (20-24 hours)
**Impact**: Medium

**New Section**: `/resources` or add to dashboard

**Features:**

- Downloads library (whitepapers, case studies, guides)
- Filtered by persona
- Track downloads for lead scoring
- Email gate for premium content
- Recommended resources based on assessment

**Structure:**

```tsx
<ResourceLibrary>
  <FilterBar>
    <PersonaFilter />
    <TopicFilter />
    <FormatFilter />
  </FilterBar>

  <ResourceGrid>
    {resources.map(resource => (
      <ResourceCard>
        <Title>{resource.title}</Title>
        <Description>{resource.description}</Description>
        <Tags>{resource.tags}</Tags>
        <DownloadButton onClick={() => trackAndDownload(resource)} />
      </ResourceCard>
    ))}
  </ResourceGrid>
</ResourceLibrary>
```

**Content Ideas:**

- **CEO**: "AI Transformation Playbook", "Board-Level ROI Deck"
- **CFO**: "Cost Optimization Calculator", "Budget Planning Template"
- **CTO**: "Technical Integration Guide", "API Documentation"
- **Designer**: "Material Selection Guide", "3D Printing Best Practices"
- **Educator**: "Curriculum Templates", "Lab Setup Guide"

---

### 3.4 Dynamic Pricing Calculator by Product

**Priority**: 🟢 Medium
**Effort**: Large (16-20 hours per calculator)
**Impact**: Medium-High

**Create product-specific calculators:**

**A. Dhanam ROI Calculator**

- Inputs: Number of employees, average salary, turnover rate
- Outputs: Employee retention impact, financial wellness ROI
- Industry benchmarks

**B. Forge Sight ROI Calculator**

- Inputs: Parts per month, average quote time, material costs
- Outputs: Time savings, cost reduction, pricing accuracy improvement
- Volume-based projections

**C. PENNY ROI Calculator**

- Inputs: Customer service volume, average handle time, agent cost
- Outputs: Automation savings, efficiency gains, capacity increase
- Scalability projections

Each calculator:

- Email gate before results
- Persona-specific language
- Industry comparisons
- CTA to book demo

---

## Phase 4: Scale & Optimization

**Timeline**: Q1 2026
**Goal**: Analytics, A/B testing, continuous improvement

### 4.1 Analytics Dashboard

**Priority**: 🟢 Medium
**Effort**: Large (24-32 hours)
**Impact**: High (for team)

**Build internal dashboard** (`/admin/analytics`)

**Metrics to Track:**

- Persona distribution
- Demo prep conversion by product
- ROI calculator completion rate
- Assessment completion by persona
- Email capture rates
- CTA click-through rates
- Page-level engagement

**Tools:**

- Vercel Analytics
- Google Analytics 4
- Custom event tracking
- Heatmaps (Hotjar/Microsoft Clarity)

---

### 4.2 A/B Testing Framework

**Priority**: 🟢 Medium
**Effort**: Medium (12-16 hours setup)
**Impact**: High (ongoing)

**Tests to Run:**

**Homepage:**

- Persona selector position (top vs. after hero)
- CTA button copy
- Benefits list length
- Hero image vs. no image

**Demo Prep:**

- 3 questions vs. 4 questions
- Email first vs. email last
- Value prop messaging
- Trust signal placement

**Email Gates:**

- "Enter email" vs. "Get your results"
- Benefits list vs. no list
- Security message vs. no message
- Single CTA vs. dual CTA

**Framework:**

```tsx
// lib/abtest.ts
export function useABTest(testName: string) {
  const variant = getVariant(testName); // A or B

  const trackConversion = (goal: string) => {
    analytics.track('ab_test_conversion', {
      test: testName,
      variant,
      goal,
    });
  };

  return { variant, trackConversion };
}

// Usage
const { variant, trackConversion } = useABTest('homepage-cta');

<Button
  onClick={() => {
    trackConversion('cta_click');
    // ...
  }}
>
  {variant === 'A' ? 'Get Started' : 'Start Free Trial'}
</Button>;
```

---

### 4.3 Internationalization Enhancements

**Priority**: 🟢 Medium
**Effort**: Medium (varies by language)
**Impact**: Medium

**Current**: ES, EN, PT-BR translations exist

**Enhancements:**

- Translate all new components (persona selector, demo prep, etc.)
- Add region-specific content:
  - Mexico-specific case studies
  - Brazil-specific pricing
  - Argentina regulations/compliance
- Locale-specific CTAs
- Currency conversion (MXN, USD, BRL)

---

### 4.4 Performance Optimization

**Priority**: 🟢 Medium
**Effort**: Ongoing
**Impact**: High

**Optimizations:**

- Code splitting by route
- Image optimization (next/image everywhere)
- Font optimization (local fonts vs CDN)
- Lazy load below-fold components
- Reduce JavaScript bundle size
- Server-side rendering for SEO
- Edge caching for static content

**Targets:**

- Lighthouse score: 95+
- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- TTI: < 3.5s

---

## Implementation Guidelines

### Development Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/comparison-matrix
   ```

2. **Implement with Tests**
   - Write component
   - Add unit tests
   - Add integration tests
   - Manual QA

3. **Documentation**
   - Update README if needed
   - Add to CHANGELOG
   - Document API changes

4. **Code Review**
   - Create PR
   - Review by team
   - Address feedback

5. **Deploy to Staging**
   - Test in staging environment
   - Validate analytics
   - Check mobile experience

6. **Deploy to Production**
   - Merge to main
   - Monitor for errors
   - Track metrics

---

### Priority Framework

**🔴 Critical**: Must have for core functionality
**🟡 High**: Significant impact, should do soon
**🟢 Medium**: Nice to have, schedule when possible
**⚪ Low**: Future consideration

**Effort Estimates:**

- Small: < 8 hours
- Medium: 8-16 hours
- Large: 16+ hours

**Impact Assessment:**

- High: >20% improvement in key metric
- Medium: 10-20% improvement
- Low: <10% improvement

---

## Success Metrics

### Phase 2 Goals (Dec 2025)

- [ ] Backend integration complete (all leads in CRM)
- [ ] 3+ real client logos added
- [ ] Email drip sequences launched
- [ ] Comparison matrix live
- [ ] 200+ qualified leads captured

### Phase 3 Goals (Jan-Feb 2026)

- [ ] Site-wide personalization active
- [ ] Case study matching algorithm deployed
- [ ] Resource library with 20+ items
- [ ] 3 product-specific ROI calculators

### Phase 4 Goals (Q1 2026)

- [ ] Analytics dashboard operational
- [ ] 5+ A/B tests completed
- [ ] Lighthouse score 95+
- [ ] 500+ monthly qualified leads

---

## Risk Management

### Technical Risks

| Risk                     | Likelihood | Impact | Mitigation                                       |
| ------------------------ | ---------- | ------ | ------------------------------------------------ |
| CRM integration fails    | Low        | High   | Use well-documented APIs, have fallback to email |
| Performance degradation  | Medium     | Medium | Monitor bundle size, lazy load components        |
| LocalStorage limitations | Low        | Low    | Provide server-side alternative                  |
| Browser compatibility    | Low        | Medium | Test cross-browser, use polyfills                |

### Business Risks

| Risk                        | Likelihood | Impact | Mitigation                                  |
| --------------------------- | ---------- | ------ | ------------------------------------------- |
| Lead quality poor           | Medium     | High   | Refine qualification questions, score leads |
| Email sequences unsubscribe | Medium     | Medium | A/B test content, allow frequency control   |
| Comparison matrix confuses  | Low        | Medium | User testing before launch                  |
| Persona adoption low        | Medium     | Medium | Make optional, track usage, iterate         |

---

## Budget Considerations

### Development Costs

- Phase 2: ~80-100 hours ($8k-$15k at $100-150/hr)
- Phase 3: ~120-150 hours ($12k-$22k)
- Phase 4: ~60-80 hours + ongoing ($6k-$12k + $2k/mo)

### Tooling Costs

- CRM integration: Varies (HubSpot, Salesforce, etc.)
- Email platform: $50-$500/month (SendGrid, Mailchimp)
- Analytics: Free-$100/month (GA4, Vercel Analytics)
- A/B testing: Free-$200/month (internal tool vs. Optimizely)
- Video hosting: $20-$100/month (Vimeo, Wistia)

### Total Estimated Investment

- **Phase 2**: $10k-$20k (one-time) + $100-$600/mo (recurring)
- **Phase 3**: $15k-$25k (one-time)
- **Phase 4**: $8k-$15k (one-time) + $200-$500/mo (recurring)

**ROI Projection**:
With 500 monthly leads @ 5% close rate @ $10k ACV = $250k annual revenue
Investment payback: < 3 months

---

## Appendix

### A. Helpful Resources

- [Conversion Optimization Checklist](https://cxl.com/conversion-optimization-checklist/)
- [Personalization Best Practices](https://www.optimizely.com/optimization-glossary/personalization/)
- [B2B SaaS Metrics Guide](https://www.saastr.com/saas-metrics/)
- [Lead Scoring Models](https://www.hubspot.com/lead-scoring)

### B. Tool Recommendations

**CRM Integration:**

- HubSpot (best for SMB)
- Salesforce (enterprise)
- Pipedrive (simple, affordable)

**Email Automation:**

- SendGrid (transactional + marketing)
- Mailchimp (marketing focused)
- Customer.io (developer-friendly)

**Analytics:**

- Vercel Analytics (built-in)
- Google Analytics 4 (free, powerful)
- Mixpanel (event-based)

**A/B Testing:**

- Vercel Edge Config (simple)
- Google Optimize (free)
- Optimizely (enterprise)

### C. Contact for Questions

- **UX/Design**: Design team
- **Development**: Frontend team
- **Analytics**: Marketing team
- **CRM Integration**: Operations team

---

**Document Version**: 1.0
**Next Review**: December 15, 2025
**Owner**: Product Team

## 2026-06-04 strategic reset: business-site conversion architecture

The current UX roadmap is superseded for `madfam-site` corporate-site decisions by [MADFAM_SITE_STRATEGIC_REDESIGN_AUDIT_2026-06-04.md](./MADFAM_SITE_STRATEGIC_REDESIGN_AUDIT_2026-06-04.md).

Immediate priorities:

1. Correct stale public claims around platform counts, universal Free/Pro access, and “Pro everywhere” membership language.
2. Make all platform cards detail-page-aware, using external product URLs or product-map fallback when a MADFAM detail page does not exist.
3. Rebuild the homepage around visitor offer paths rather than platform inventory.
4. Add segmented lead capture with intent, offer path, platform interest, timeline, budget/commercial scale, region, and preferred follow-up channel.
5. Consolidate overlapping IA across products, platforms, ecosystem, solutions, and programs after the new conversion router is implemented.

Implemented in the first remediation pass:

1. Public offer-path router data model added for `Use a platform`, `Build with MADFAM`, `Join the ecosystem`, and `Partner or invest`.
2. Homepage now surfaces the offer-path router immediately after the hero and before the platform inventory.
3. Contact-led paths now carry stable `intent` query parameters for the upcoming segmented lead-capture pass.
4. Contact lead capture now consumes the offer-path intent and submits timeline, budget/commercial scale, region, and preferred follow-up metadata without requiring a database migration.
5. Lead scoring now accounts for intent, urgency, and budget metadata; timeline and budget are also copied into existing CRM-ready lead fields.

Validation completed for the first remediation pass:

1. `corepack pnpm --filter @madfam/web test -- --run` passed: `19` files, `238` tests.
2. `corepack pnpm typecheck` passed across the workspace.
3. `corepack pnpm --filter @madfam/web lint` passed with existing warnings outside the touched files.
4. `corepack pnpm validate:translations` passed across all modular locale files.
5. `corepack pnpm find:missing-translations` passed after restoring source-key coverage for legacy homepage components.
6. Changed translation JSON for `ecosystem`, `forms`, and `platforms` parsed successfully across `en`, `es`, and `pt`.
