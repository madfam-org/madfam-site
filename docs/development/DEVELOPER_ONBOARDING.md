# Developer Onboarding Guide

Welcome to the MADFAM Corporate Website development team! 🚀

## Quick Start (15 minutes)

### 1. Prerequisites

```bash
# Check versions
node --version    # Should be >=20.0.0
pnpm --version    # Should be >=8.0.0
git --version     # Any recent version
```

### 2. Repository Setup

```bash
# Clone repository
git clone https://github.com/madfam-org/biz-site.git
cd biz-site

# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local

# Set up database
pnpm run db:setup

# Start development
pnpm dev
```

### 3. Verify Setup

- 🌐 Website: http://localhost:3000
- 📊 CMS: http://localhost:3001/admin
- 📧 Email previews: http://localhost:3002

## Project Architecture

### Monorepo Structure

```
biz-site/
├── apps/
│   ├── web/          # Next.js 14 main website
│   └── cms/          # Payload CMS
├── packages/
│   ├── ui/           # Shared components
│   ├── i18n/         # Internationalization
│   ├── core/         # Business logic
│   └── email/        # Email templates
└── services/         # Future microservices
```

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: NextAuth.js
- **CMS**: Payload CMS
- **Testing**: Vitest + Playwright
- **Deployment**: Vercel

## Development Workflow

### 1. Branch Strategy

```bash
# Feature development
git checkout -b feature/your-feature-name
git checkout -b fix/bug-description
git checkout -b refactor/component-name

# Always branch from main
git checkout main
git pull origin main
git checkout -b feature/new-feature
```

### 2. Code Standards

#### TypeScript

```typescript
// ✅ Good - Explicit types
interface User {
  id: string;
  email: string;
  name?: string;
}

function createUser(data: CreateUserData): Promise<User> {
  // implementation
}

// ❌ Bad - Any types
function createUser(data: any): any {
  // implementation
}
```

#### Component Structure

```typescript
// ✅ Good - Proper component structure
interface ButtonProps {
  variant: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export function Button({ variant, size = 'md', children, onClick }: ButtonProps) {
  return (
    <button
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size])}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

#### File Naming

- Components: `PascalCase.tsx` (e.g., `LeadForm.tsx`)
- Utilities: `camelCase.ts` (e.g., `formatDate.ts`)
- Pages: `kebab-case.tsx` (e.g., `about-us.tsx`)
- Constants: `SCREAMING_SNAKE_CASE.ts`

### 3. Testing Requirements

Every PR must include:

```bash
# Unit tests for utilities
src/utils/formatDate.test.ts

# Component tests for UI
src/components/LeadForm.test.tsx

# Integration tests for API routes
src/app/api/leads/route.test.ts

# E2E tests for critical flows (when applicable)
e2e/lead-capture.spec.ts
```

### 4. Commit Convention

```bash
# Format: type(scope): description
git commit -m "feat(auth): add password reset functionality"
git commit -m "fix(ui): resolve button color contrast issue"
git commit -m "docs(api): update lead endpoint documentation"
git commit -m "test(forms): add validation tests for contact form"

# Types: feat, fix, docs, style, refactor, test, chore
```

## Common Development Tasks

### Working with Database

```bash
# Generate Prisma client
pnpm run db:generate

# Run migrations
pnpm run db:migrate

# Reset database (development only)
pnpm run db:reset

# Seed database
pnpm run db:seed
```

### Working with Translations

```bash
# Add new translation key
# 1. Add to packages/i18n/src/translations/en/common.json
# 2. Add to Spanish and Portuguese versions
# 3. Use in component: t('common.newKey')

# Validate translations
pnpm run validate:translations
```

### Working with Components

```bash
# Create new component
mkdir src/components/NewComponent
touch src/components/NewComponent/index.tsx
touch src/components/NewComponent/NewComponent.test.tsx

# Add to UI package for reusability
cp -r src/components/NewComponent packages/ui/src/components/
```

## Debugging

### Common Issues

#### 1. Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules
rm -rf node_modules
pnpm install

# Check TypeScript errors
pnpm run typecheck
```

#### 2. Database Issues

```bash
# Reset database connection
pnpm run db:reset

# Check database URL
echo $DATABASE_URL
```

#### 3. Translation Errors

```bash
# Validate all translations
pnpm run validate:translations

# Check missing keys
pnpm run find:missing-translations
```

### Debugging Tools

- **React DevTools**: Browser extension
- **Prisma Studio**: `pnpm run db:studio`
- **Network Tab**: Check API calls
- **Console Logs**: Use structured logging

## Code Review Checklist

### Before Creating PR

- [ ] Tests written and passing
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Translations added for all locales
- [ ] Documentation updated
- [ ] Performance considered

### PR Template

```markdown
## What changed?

Brief description of changes

## How to test?

1. Checkout branch
2. Run `pnpm dev`
3. Navigate to...
4. Verify...

## Checklist

- [ ] Tests added/updated
- [ ] Types are correct
- [ ] Translations added
- [ ] Documentation updated
- [ ] Accessibility considered
```

## Performance Best Practices

### 1. Images

```typescript
// ✅ Use Next.js Image component
import Image from 'next/image'

<Image
  src="/hero-image.jpg"
  alt="Description"
  width={800}
  height={400}
  priority // for above-the-fold images
/>
```

### 2. Dynamic Imports

```typescript
// ✅ Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />
})
```

### 3. API Optimization

```typescript
// ✅ Proper caching headers
export async function GET() {
  const data = await fetchData();

  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60',
    },
  });
}
```

## Getting Help

### Resources

- 📚 **Documentation**: `/docs` folder
- 🔧 **Component Library**: `pnpm run storybook`
- 🎯 **Design System**: Figma link (ask PM)
- 📊 **Analytics**: Vercel dashboard

### Team Communication

- **Daily Standups**: 9:00 AM (Mon-Fri)
- **Code Reviews**: Slack #dev-reviews
- **Architecture Discussions**: #dev-architecture
- **Emergency Issues**: @channel in #dev-team

### Mentorship Program

New developers are paired with experienced team members for:

- Code review guidance
- Architecture decisions
- Best practices
- Career development

## Advanced Topics

### Custom Hooks Pattern

```typescript
// useLead.ts
export function useLead() {
  const [loading, setLoading] = useState(false);

  const submitLead = useCallback(async (data: LeadData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return await response.json();
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitLead, loading };
}
```

### Error Boundaries

```typescript
// Use error boundaries for graceful failures
<ErrorBoundary fallback={<ErrorMessage />}>
  <ComplexComponent />
</ErrorBoundary>
```

Welcome to the team! 🎉 Don't hesitate to ask questions in Slack or during standup meetings.
