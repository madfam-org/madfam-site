# Interface & Form Components

**Purpose**: Prominent section component for driving user actions with multiple layouts.

#### Props Interface

```typescript
interface CTAProps {
  variant?: 'default' | 'centered' | 'split' | 'minimal';
  title: string;
  description?: string;
  cta: {
    text: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'creative';
    icon?: React.ReactNode;
  };
  secondaryCta?: {
    text: string;
    href: string;
    variant?: 'outline' | 'ghost';
    icon?: React.ReactNode;
  };
  background?: 'gradient' | 'solid' | 'pattern' | 'none';
  icon?: React.ReactNode;
  image?: string;
  className?: string;
}
```

#### Variants

- **Default**: Standard layout with title, description, and buttons
- **Centered**: Center-aligned content for maximum impact
- **Split**: Two-column layout with image support
- **Minimal**: Compact version for inline use

#### Backgrounds

- **Gradient**: `bg-gradient-to-r from-lavender to-sun`
- **Solid**: `bg-obsidian`
- **Pattern**: Obsidian with decorative pattern overlay
- **None**: Transparent background

#### Usage Examples

```tsx
import { CTA } from '@madfam/ui';

// Basic centered CTA
<CTA
  variant="centered"
  title="Ready to Transform Your Business?"
  description="Join hundreds of companies already benefiting from AI automation"
  cta={{
    text: "Start Assessment",
    href: "/assessment",
    variant: "creative"
  }}
  secondaryCta={{
    text: "Learn More",
    href: "/services",
    variant: "outline"
  }}
  background="gradient"
/>

// Split layout with image
<CTA
  variant="split"
  title="See SPARK in Action"
  image="/products/spark-demo.jpg"
  cta={{ text: "Book Demo", href: "/demo" }}
/>
```

---

### Features

**Purpose**: Showcase product or service features in various layouts with icons and descriptions.

#### Props Interface

```typescript
interface FeaturesProps {
  variant?: 'grid' | 'list' | 'cards' | 'timeline';
  title?: string;
  subtitle?: string;
  description?: string;
  features: Feature[];
  columns?: 2 | 3 | 4;
  centered?: boolean;
  iconStyle?: 'default' | 'gradient' | 'filled';
  className?: string;
}

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: {
    text: string;
    href: string;
  };
  badge?: string;
}
```

#### Variants

- **Grid**: Traditional grid layout (default)
- **List**: Vertical list with side-by-side icon/content
- **Cards**: Each feature in individual cards with hover effects
- **Timeline**: Vertical timeline layout with connecting line

#### Icon Styles

- **Default**: `bg-gray-100` neutral background
- **Gradient**: `bg-gradient-to-br from-lavender/20 to-sun/20`
- **Filled**: `bg-lavender text-white` solid background

#### Usage Examples

```tsx
import { Features } from '@madfam/ui';

const features = [
  {
    icon: <AiIcon />,
    title: "AI-Powered Automation",
    description: "Intelligent process automation that learns and adapts",
    link: { text: "Learn More", href: "/ai-automation" }
  },
  {
    icon: <IntegrationIcon />,
    title: "Seamless Integrations",
    description: "Connect with 100+ popular business tools",
    badge: "New"
  }
];

// Grid layout
<Features
  variant="grid"
  title="Platform Capabilities"
  subtitle="What makes us different"
  features={features}
  columns={3}
  iconStyle="gradient"
  centered
/>

// Timeline layout
<Features
  variant="timeline"
  title="Implementation Process"
  features={processSteps}
  iconStyle="filled"
/>
```

---

### Heading

**Purpose**: Semantic heading component with consistent typography and gradient options.

#### Props Interface

```typescript
interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  gradient?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}
```

#### Typography Scale

- **Level 1**: `text-display` - Main page headings
- **Level 2**: `text-heading-1` - Section headings
- **Level 3**: `text-heading-2` - Subsection headings
- **Level 4**: `text-heading-3` - Component headings
- **Level 5**: `text-xl` - Small headings
- **Level 6**: `text-lg` - Micro headings

#### Usage Examples

```tsx
import { Heading } from '@madfam/ui';

// Main page heading with gradient
<Heading level={1} gradient>
  Transform Your Business with AI
</Heading>

// Section heading with custom element
<Heading level={2} as="h1">
  Services Overview
</Heading>
```

---

### Hero

**Purpose**: Large banner component for page headers with multiple layout and background options.

#### Props Interface

```typescript
interface HeroProps {
  variant?: 'home' | 'service' | 'product' | 'simple';
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  description?: string | React.ReactNode;
  cta?: {
    primary?: {
      text: string;
      href: string;
      variant?: 'primary' | 'secondary' | 'creative';
      icon?: React.ReactNode;
    };
    secondary?: {
      text: string;
      href: string;
      variant?: 'outline' | 'ghost';
      icon?: React.ReactNode;
    };
  };
  background?: 'gradient' | 'mesh' | 'particles' | 'none';
  overlay?: boolean;
  centered?: boolean;
  fullHeight?: boolean;
  children?: React.ReactNode;
  className?: string;
}
```

#### Variants

- **Home**: Maximum impact with large text and animations
- **Service**: Focused on service-specific messaging
- **Product**: Product-centric with subtle animations
- **Simple**: Clean layout for basic pages

#### Backgrounds

- **Gradient**: `bg-gradient-to-br from-obsidian via-obsidian/95 to-lavender/10`
- **Mesh**: Obsidian with animated mesh pattern
- **Particles**: Solid obsidian (particle effects via JS)
- **None**: Transparent background

#### Usage Examples

```tsx
import { Hero } from '@madfam/ui';

// Home page hero
<Hero
  variant="home"
  subtitle="AI Business Transformation"
  title="Automate, Optimize, Accelerate"
  description="Transform your business with intelligent automation and AI-powered solutions"
  background="gradient"
  cta={{
    primary: { text: "Start Assessment", href: "/assessment" },
    secondary: { text: "View Services", href: "/services" }
  }}
  fullHeight
  centered
/>

// Service page hero
<Hero
  variant="service"
  title="Strategy & Enablement"
  description="Strategic AI implementation guidance"
  background="mesh"
  cta={{ primary: { text: "Book Consultation", href: "/contact" } }}
/>
```

---

### LeadForm

**Purpose**: Comprehensive form component for lead capture with multiple variants and validation.

#### Props Interface

```typescript
interface LeadFormProps {
  variant?: 'simple' | 'progressive' | 'detailed';
  program?: TransformationProgram;
  source?: string;
  title?: string;
  description?: string;
  submitText?: string;
  onSubmit?: (data: LeadFormData) => Promise<void>;
  onSuccess?: () => void;
  className?: string;
}

interface LeadFormData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  program?: TransformationProgram;
  industry?: string;
  companySize?: string;
  budget?: string;
  timeframe?: string;
  challenges?: string[];
  message?: string;
  source?: string;
}

type TransformationProgram =
  | 'DESIGN_FABRICATION'
  | 'STRATEGY_ENABLEMENT'
  | 'PLATFORM_PILOTS'
  | 'STRATEGIC_PARTNERSHIPS';
```

#### Variants

- **Simple**: Basic contact form with essential fields
- **Progressive**: Multi-step form with progress indicator
- **Detailed**: All fields in single view (same as simple currently)

#### Features

- Built-in validation for required fields
- Progressive disclosure in multi-step variant
- Program pre-selection
- Industry and company size options
- Budget and timeframe selection
- Challenge selection (multiple choice)
- Form state management with error handling
- Loading states and success/error messages

#### Usage Examples

```tsx
import { LeadForm } from '@madfam/ui';

// Simple lead capture
<LeadForm
  variant="simple"
  title="Get Started Today"
  onSubmit={async (data) => {
    await submitLead(data);
  }}
  onSuccess={() => router.push('/thank-you')}
/>

// Progressive form with program selection
<LeadForm
  variant="progressive"
  program="STRATEGY_ENABLEMENT"
  source="strategy-page"
  onSubmit={handleLeadSubmission}
/>
```

---

### Newsletter

**Purpose**: Email subscription component with multiple layouts and states.

#### Props Interface

```typescript
interface NewsletterProps {
  title?: string;
  description?: string;
  placeholder?: string;
  buttonText?: string;
  variant?: 'card' | 'inline' | 'footer';
  size?: 'sm' | 'md' | 'lg';
  onSubscribe?: (email: string) => Promise<void>;
  className?: string;
}
```

#### Variants

- **Card**: Full card layout with icon, title, and description
- **Inline**: Compact horizontal layout
- **Footer**: Dark theme variant for footer use

#### Usage Examples

```tsx
import { Newsletter } from '@madfam/ui';

// Card variant
<Newsletter
  title="Stay Updated"
  description="Get the latest insights on AI and automation"
  onSubscribe={async (email) => {
    await subscribeToNewsletter(email);
  }}
/>

// Inline variant for sidebars
<Newsletter
  variant="inline"
  size="sm"
  placeholder="Enter your email"
  buttonText="Subscribe"
/>

// Footer variant
<Newsletter
  variant="footer"
  title="Newsletter"
  description="Monthly updates and insights"
/>
```

---

### ProductCard

**Purpose**: Specialized card component for showcasing products with features, badges, and CTAs.

#### Props Interface

```typescript
interface ProductCardProps {
  name: string;
  tagline: string;
  description: string;
  features: Array<{
    icon?: React.ReactNode;
    text: string;
  }>;
  image?: string;
  logo?: React.ReactNode;
  badge?: {
    text: string;
    variant?: 'new' | 'beta' | 'popular';
  };
  cta?: {
    primary?: {
      text: string;
      href: string;
    };
    secondary?: {
      text: string;
      href: string;
    };
  };
  gradient?: string;
  className?: string;
}
```

#### Badge Variants

- **New**: `bg-gradient-to-r from-leaf to-sun`
- **Beta**: `bg-gradient-to-r from-lavender to-creative`
- **Popular**: `bg-gradient-to-r from-sun to-creative`

#### Usage Examples

```tsx
import { ProductCard } from '@madfam/ui';

<ProductCard
  name="SPARK"
  tagline="Integration Platform"
  description="Connect and automate your entire tech stack"
  logo={<SparkLogo />}
  badge={{ text: 'Popular', variant: 'popular' }}
  features={[
    { icon: <IntegrationIcon />, text: '100+ Integrations' },
    { icon: <AutomationIcon />, text: 'No-code Automation' },
    { icon: <ScaleIcon />, text: 'Enterprise Scale' },
  ]}
  image="/products/spark-dashboard.jpg"
  cta={{
    primary: { text: 'Try Free', href: '/spark/trial' },
    secondary: { text: 'Learn More', href: '/spark' },
  }}
  gradient="from-blue/10 to-purple/10"
/>;
```

---

### ROICalculator

**Purpose**: Interactive calculator for estimating return on investment with service-specific parameters.

#### Props Interface

```typescript
interface ROICalculatorProps {
  program?: TransformationProgram;
  title?: string;
  currency?: 'MXN' | 'USD';
  variant?: 'compact' | 'full';
  className?: string;
  onCalculate?: (results: ROIResults) => void;
}

interface ROIResults {
  monthlySavings: number;
  timeSaved: number;
  roiPercentage: number;
  paybackPeriod: number;
  totalBenefit: number;
  investment: number;
}
```

#### Program Pricing (MXN)

- **DESIGN_FABRICATION**: $15,000
- **STRATEGY_ENABLEMENT**: $50,000
- **PLATFORM_PILOTS**: $150,000
- **STRATEGIC_PARTNERSHIPS**: $500,000

#### Variants

- **Compact**: Simplified inputs with basic results
- **Full**: Complete calculator with detailed breakdown and charts

#### Usage Examples

```tsx
import { ROICalculator } from '@madfam/ui';

// Full calculator
<ROICalculator
  program="STRATEGY_ENABLEMENT"
  title="Calculate Your ROI"
  currency="MXN"
  variant="full"
  onCalculate={(results) => {
    trackEvent('roi_calculated', results);
  }}
/>

// Compact version for sidebars
<ROICalculator
  variant="compact"
  program="DESIGN_FABRICATION"
/>
```

---
