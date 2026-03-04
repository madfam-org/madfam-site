# AI Assistant Context Documentation

> **ARCHIVED**: This document is superseded by the root `/CLAUDE.md`. The L1-L5 service tier model described here has been replaced by 4 transformation programs: Design & Fabrication, Strategy & Enablement, Platform Pilots, and Strategic Partnerships. See the root CLAUDE.md for current context.

This document provides context for AI assistants (like Claude, GPT-4, etc.) working on the MADFAM corporate website codebase.

## Project Overview

**What**: Corporate website for MADFAM - an AI consultancy and product studio
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Monorepo with Turborepo
**Purpose**: Lead generation, service showcase, product demos

## Quick Context

```
Company: MADFAM
Tagline: "Where AI meets human creativity"
Industry: AI Consultancy & Product Development
Location: Mexico City (serving globally)
Languages: Spanish (es-MX), English (en-US), Portuguese (pt-BR)
```

## Architecture Summary

```
monorepo/
├── apps/web/          → Main Next.js website
├── packages/ui/       → Reusable components
├── packages/core/     → Business logic & types
├── packages/analytics/→ Plausible integration
├── packages/i18n/     → Translations
```

## Key Business Concepts

### Service Tiers (5 Levels)

1. **L1 Essentials** - Basic 3D design & graphics
2. **L2 Advanced** - Parametric design
3. **L3 Consulting** - Workshops & training
4. **L4 Platforms** - SPARK/PENNY implementation
5. **L5 Strategic** - vCTO partnerships

### Products

- **SPARK**: AI orchestration platform
- **PENNY**: Process automation tool

## Common Tasks

### Adding a New Page

1. Create file in `apps/web/app/[page-name]/page.tsx`
2. Import components from `@madfam/ui`
3. Add translations to `packages/i18n/src/translations/`
4. Update navigation in `Navbar.tsx` and `Footer.tsx`

Example:

```tsx
import { Container, Heading, Button } from '@madfam/ui';

export default function NewPage() {
  return (
    <main>
      <Container>
        <Heading level={1}>Page Title</Heading>
      </Container>
    </main>
  );
}
```

### Creating a Component

1. Add to `packages/ui/src/components/`
2. Export from `packages/ui/src/index.ts`
3. Follow existing patterns (props interface, forwarded refs)

Template:

```tsx
import { forwardRef } from 'react';
import { cn } from '../lib/utils';

interface ComponentProps {
  // props
}

export const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('base-styles', className)} {...props} />;
  }
);

Component.displayName = 'Component';
```

### Adding API Endpoint

1. Create route in `apps/web/app/api/[endpoint]/route.ts`
2. Use Zod for validation
3. Return consistent response format

Template:

```ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  // validation
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = schema.parse(body);

    // Logic here

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Error' }, { status: 400 });
  }
}
```

## Design System

### Colors

- **Primary**: Obsidian (#0A0E27)
- **Secondary**: Sun (#FFD93D)
- **Accent**: Lavender (#9B59B6)
- **Success**: Leaf (#6BCB77)
- **Surface**: Pearl (#FAFAFA)

### Typography

- **Headings**: Poppins
- **Body**: Inter
- **Code**: Space Mono

### Spacing

8px grid system: `xs: 0.5rem`, `sm: 1rem`, `md: 2rem`, `lg: 3rem`, `xl: 4rem`

## Code Conventions

### Imports Order

1. React/Next.js
2. External packages
3. Internal packages (@madfam/\*)
4. Relative imports
5. Types

### Component Structure

1. Interfaces/Types
2. Component definition
3. Subcomponents
4. Exports

### Naming

- Components: PascalCase
- Files: PascalCase for components, kebab-case for pages
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase with I/T prefix for clarity

## State Management

- **Global State**: React Context (minimal use)
- **Form State**: React Hook Form + Zod
- **Server State**: Next.js data fetching
- **URL State**: Next.js searchParams

## Internationalization

Default language: Spanish (es-MX)
Supported locales: es-MX, en-US, pt-BR

Usage:

```tsx
// In client components
import { useTranslations } from 'next-intl';
const t = useTranslations('home');
<h1>{t('hero.title')}</h1>;

// In server components
import { getTranslations } from 'next-intl/server';
const t = await getTranslations('home');
<h1>{t('hero.title')}</h1>;

// Translation keys follow pattern:
// [page].[section].[element]
```

## Performance Guidelines

1. Use `dynamic()` for heavy components
2. Optimize images with `next/image`
3. Implement proper loading states
4. Use `memo()` for expensive components
5. Lazy load below-the-fold content

## Testing Approach

```bash
# Unit tests for utilities
pnpm test

# Component tests
pnpm test Button.test.tsx

# E2E tests (coming soon)
pnpm test:e2e
```

## Deployment

- **Staging**: Push to `staging` branch → GitHub Pages
- **Production**: Create release tag → Vercel

## Environment Variables

Required:

```
NEXT_PUBLIC_ENV=development|staging|production
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=
```

Optional:

```
N8N_WEBHOOK_URL=
API_SECRET=
DATABASE_URL=
```

## Common Patterns

### Lead Capture

```tsx
<LeadForm
  tier={ServiceTier.L3_CONSULTING}
  source="service-page"
  onSuccess={() => router.push('/thank-you')}
/>
```

### Feature Flags

```tsx
const showFeature = useFeatureFlag('NEW_FEATURE');
if (showFeature) {
  return <NewFeature />;
}
```

### Analytics Events

```tsx
analytics.trackServiceInquiry({
  tier: 'consulting',
  source: 'hero-cta',
});
```

## Troubleshooting

### Build Errors

1. Check TypeScript: `pnpm typecheck`
2. Clear cache: `pnpm clean`
3. Reinstall: `rm -rf node_modules && pnpm install`

### Import Errors

- Ensure `baseUrl` is set in tsconfig
- Check package exports in index files
- Verify monorepo package names

### Style Issues

- Use Tailwind classes, not inline styles
- Follow mobile-first approach
- Check for purged classes in production

## File Locations Quick Reference

- **Pages**: `apps/web/app/*/page.tsx`
- **API Routes**: `apps/web/app/api/*/route.ts`
- **Components**: `packages/ui/src/components/*`
- **Business Logic**: `packages/core/src/*`
- **Translations**: `packages/i18n/src/translations/*`
- **Types**: `packages/core/src/types/*`

## Useful Commands

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build all packages
pnpm lint             # Run linting
pnpm typecheck        # Check TypeScript

# Testing
pnpm test             # Run tests
pnpm test:watch       # Watch mode

# Deployment
pnpm build:staging    # Build for GitHub Pages
pnpm build:production # Build for Vercel

# Utilities
pnpm clean            # Clean build artifacts
pnpm analyze          # Analyze bundle size
```

## Contact for Help

- GitHub Issues: Technical problems
- Slack: Internal team communication
- Documentation: `/docs` folder

## Important Notes

1. Always validate user input with Zod
2. Use semantic HTML for accessibility
3. Follow mobile-first responsive design
4. Keep bundle size under 200KB per route
5. Test in Spanish and English
6. Consider SEO implications for all changes

---

**Last Updated:** July 2025  
**Next Review:** August 2025

**AI Assistant Notes:**

- This document is optimized for AI assistants working on the MADFAM codebase
- All examples are current and tested
- Follow the patterns established in existing code
- Always consider multilingual support (es-MX, en-US, pt-BR)
- Maintain consistency with design system and conventions
