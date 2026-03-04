# Core Components

### Assessment

**Purpose**: Interactive AI readiness assessment with multi-step questions and detailed results.

#### Props Interface

```typescript
interface AssessmentProps {
  title?: string;
  description?: string;
  questions: AssessmentQuestion[];
  onComplete?: (result: AssessmentResult) => void;
  className?: string;
  locale?: 'es-MX' | 'en-US' | 'pt-BR';
  translations?: TranslationObject;
}

interface AssessmentQuestion {
  id: string;
  question: string;
  options: {
    value: string;
    text: string;
    score: number;
  }[];
  category: 'strategy' | 'technology' | 'data' | 'culture' | 'processes';
}

interface AssessmentResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  categoryScores: Record<string, number>;
  recommendations: string[];
  recommendedProgram:
    | 'DESIGN_FABRICATION'
    | 'STRATEGY_ENABLEMENT'
    | 'PLATFORM_PILOTS'
    | 'STRATEGIC_PARTNERSHIPS';
}
```

#### Usage Examples

```tsx
import { Assessment } from '@madfam/ui';

// Basic usage
<Assessment
  questions={myQuestions}
  onComplete={(result) => console.log('Assessment result:', result)}
/>

// With custom title and multilingual support
<Assessment
  title="AI Maturity Assessment"
  locale="en-US"
  questions={questions}
  onComplete={handleResults}
  className="max-w-4xl mx-auto"
/>
```

#### Features

- Multi-language support (Spanish, English, Portuguese)
- Progress tracking with visual progress bar
- Category-based scoring (Strategy, Technology, Data, Culture, Processes)
- Automatic transformation program recommendations
- Responsive design with mobile optimization
- Built-in result visualization with charts

---

### Button

**Purpose**: Versatile button component with multiple variants, sizes, and states.

#### Props Interface

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'creative' | 'outline' | 'danger' | 'success';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon';
  fullWidth?: boolean;
  asChild?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}
```

#### Variants & Styling

- **Primary**: `bg-obsidian text-pearl` - Main actions
- **Secondary**: `bg-sun text-obsidian` - Secondary actions
- **Ghost**: `hover:bg-obsidian/5` - Subtle actions
- **Creative**: `bg-gradient-to-r from-lavender to-sun` - Special CTAs
- **Outline**: `border-2 border-obsidian` - Alternative style
- **Danger**: `bg-red-600 text-white` - Destructive actions
- **Success**: `bg-leaf text-white` - Success states

#### Usage Examples

```tsx
import { Button } from '@madfam/ui';

// Primary button
<Button variant="primary" size="lg">
  Get Started
</Button>

// With icon and loading state
<Button
  variant="creative"
  icon={<StarIcon />}
  loading={isSubmitting}
  onClick={handleSubmit}
>
  Submit Assessment
</Button>

// As link (using asChild)
<Button asChild variant="outline">
  <Link href="/contact">Contact Us</Link>
</Button>
```

#### Features

- 7 distinct visual variants
- 6 size options (xs to xl, plus icon)
- Loading states with spinner
- Icon support (left/right positioning)
- Full width option
- Polymorphic with `asChild` prop
- Built-in accessibility features

---

### Card

**Purpose**: Flexible container component with multiple variants and consistent styling.

#### Props Interface

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ghost' | 'elevated' | 'glass' | 'gradient' | 'service' | 'product';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}
```

#### Subcomponents

- `CardHeader` - Header section with spacing
- `CardTitle` - Styled heading element
- `CardDescription` - Subtitle/description text
- `CardContent` - Main content area
- `CardFooter` - Footer section with flex layout

#### Variants

- **Default**: Basic card with subtle shadow
- **Ghost**: Transparent with hover effect
- **Elevated**: Enhanced shadow with hover lift
- **Glass**: Glassmorphism effect with backdrop blur
- **Gradient**: Subtle gradient background
- **Service**: Specialized for service offerings
- **Product**: Enhanced styling for product showcases

#### Usage Examples

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@madfam/ui';

// Basic card
<Card variant="default" padding="md">
  <CardHeader>
    <CardTitle>Service Overview</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content goes here...</p>
  </CardContent>
</Card>

// Glass effect card
<Card variant="glass" className="backdrop-blur-lg">
  <CardContent>
    Glassmorphism styled content
  </CardContent>
</Card>
```

---

### Container

**Purpose**: Responsive wrapper component for consistent layout and spacing.

#### Props Interface

```typescript
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}
```

#### Sizes

- **sm**: `max-w-3xl` (768px)
- **md**: `max-w-5xl` (1024px)
- **lg**: `max-w-7xl` (1280px) - Default
- **xl**: `max-w-[90rem]` (1440px)
- **full**: `max-w-full` (No limit)

#### Usage Examples

```tsx
import { Container } from '@madfam/ui';

// Default container
<Container>
  <h1>Page Content</h1>
</Container>

// Large container for wide layouts
<Container size="xl">
  <div className="grid grid-cols-3 gap-8">
    {/* Wide grid content */}
  </div>
</Container>
```

---
