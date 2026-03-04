# Display & Utility Components

**Purpose**: Specialized card for displaying transformation programs with pricing, features, and program-specific styling.

#### Props Interface

```typescript
interface ServiceCardProps {
  program:
    | 'design-fabrication'
    | 'strategy-enablement'
    | 'platform-pilots'
    | 'strategic-partnerships';
  title: string;
  description: string;
  price?: {
    amount: number;
    currency: 'MXN' | 'USD';
    period?: 'hour' | 'project' | 'month';
  };
  features: string[];
  cta?: {
    text: string;
    href: string;
    variant?: 'primary' | 'secondary' | 'creative';
  };
  badge?: string;
  icon?: React.ReactNode;
  color?: string;
  className?: string;
}
```

#### Program Colors & Gradients

- **Design & Fabrication**: Leaf green (`border-leaf`, `from-leaf/10 to-leaf/5`)
- **Strategy & Enablement**: Lavender purple (`border-lavender`, `from-lavender/10 to-lavender/5`)
- **Platform Pilots**: Creative blend (`border-creative`, `from-creative/10 to-creative/5`)
- **Strategic Partnerships**: Obsidian dark (`border-obsidian`, `from-obsidian/10 to-obsidian/5`)

#### Usage Examples

```tsx
import { ServiceCard } from '@madfam/ui';

<ServiceCard
  program="strategy-enablement"
  title="AI Consulting"
  description="Strategic guidance for AI implementation"
  price={{ amount: 50000, currency: 'MXN', period: 'project' }}
  features={[
    'AI strategy development',
    'Technology assessment',
    'Implementation roadmap',
    'Team training',
  ]}
  badge="Most Popular"
  cta={{
    text: 'Get Started',
    href: '/contact?program=strategy-enablement',
    variant: 'creative',
  }}
  icon={<ConsultingIcon />}
/>;
```

---

### Spinner

**Purpose**: Loading indicator component with size variants.

#### Props Interface

```typescript
interface SpinnerProps extends React.SVGAttributes<SVGElement> {
  size?: 'sm' | 'md' | 'lg';
}
```

#### Sizes

- **sm**: `h-4 w-4` (16px)
- **md**: `h-6 w-6` (24px)
- **lg**: `h-8 w-8` (32px)

#### Usage Examples

```tsx
import { Spinner } from '@madfam/ui';

// In buttons
<Button loading={isSubmitting}>
  {isSubmitting && <Spinner size="sm" />}
  Submit
</Button>

// Standalone
<div className="flex justify-center">
  <Spinner size="lg" />
</div>
```

---

### Testimonial & TestimonialCard

**Purpose**: Display customer testimonials with ratings, author info, and results.

#### Testimonial Props Interface

```typescript
interface TestimonialProps {
  testimonial: TestimonialData;
  variant?: 'card' | 'quote' | 'featured';
  showResults?: boolean;
  className?: string;
}

interface TestimonialData {
  id: string;
  content: string;
  author: {
    name: string;
    role: string;
    company: string;
    image?: string;
  };
  rating?: number;
  service?: string;
  results?: {
    metric: string;
    value: string;
    description: string;
  }[];
}
```

#### TestimonialCard Props Interface

```typescript
interface TestimonialCardProps {
  quote: string;
  author: {
    name: string;
    role: string;
    company?: string;
    image?: string;
  };
  rating?: number;
  logo?: string;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}
```

#### Variants

- **Card**: Standard card layout with full content
- **Quote**: Stylized quote format with decorative elements
- **Featured**: Enhanced layout with results showcase
- **Compact**: Minimal space usage
- **Default**: Standard testimonial card

#### Usage Examples

```tsx
import { Testimonial, TestimonialCard, TestimonialGrid } from '@madfam/ui';

// Individual testimonial
<Testimonial
  variant="featured"
  testimonial={{
    id: "1",
    content: "MADFAM transformed our entire workflow...",
    author: {
      name: "Ana García",
      role: "CTO",
      company: "TechCorp",
      image: "/testimonials/ana.jpg"
    },
    rating: 5,
    service: "Strategy & Enablement",
    results: [
      { metric: "Efficiency Gain", value: "65%", description: "Process improvement" },
      { metric: "Cost Reduction", value: "$50k", description: "Annual savings" }
    ]
  }}
  showResults
/>

// Simple testimonial card
<TestimonialCard
  quote="Outstanding service and results"
  author={{
    name: "Carlos Mendoza",
    role: "Operations Director",
    company: "InnovateCorp"
  }}
  rating={5}
  variant="default"
/>

// Grid of testimonials
<TestimonialGrid
  testimonials={testimonialData}
  variant="grid"
  columns={3}
/>
```

---
