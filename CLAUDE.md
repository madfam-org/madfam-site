# CLAUDE.md - AI Assistant Context for MADFAM Codebase

This document provides essential context for AI assistants working on the MADFAM corporate website.

## Quick Start

```bash
# Development
pnpm install
pnpm dev

# Build
pnpm build

# Test
pnpm test
pnpm typecheck
```

## Project Overview

**Company**: MADFAM - AI consultancy and product studio  
**Tech Stack**: Next.js 14, TypeScript, Tailwind CSS, Turborepo  
**Architecture**: Monorepo with shared packages  
**Languages**: Spanish (es), English (en), Portuguese (pt-br)

## Repository Structure

```
biz-site/
├── apps/
│   ├── web/           # Main Next.js website
│   └── cms/           # Payload CMS (optional)
├── packages/
│   ├── ui/            # Component library
│   ├── core/          # Business logic
│   ├── i18n/          # Translations
│   └── analytics/     # Tracking
├── docs/              # All documentation
├── README.md          # Project README
└── CLAUDE.md          # This file
```

## Business Context

### Corporate Arms (Business Units)

- **Aureo Labs**: Digital innovation lab (a MADFAM Company)
- **Primavera3D**: 3D design & fabrication studio (a MADFAM Company)
- **MADFAM Co-Labs**: Innovation lab & educational programs (a MADFAM Company)
- **Showtech**: Technology showcase & events (a MADFAM Company)

### Products

- **PENNY**: AI assistant for consumers & enterprises (In Development)
- **Dhanam**: Financial wellness platform (https://www.dhan.am)
- **Cotiza Studio**: Quoting/estimation tool
- **Forge Sight**: Analytics platform
- **Enclii**: Cloud deployment and infrastructure platform
- **Janua**: Authentication and identity platform
- **Yantra4D**: Spatial computing / 4D design platform
- **AVALA**: Training & certification platform (Coming Soon)

### Service Model

- Transformation programs (no longer tier-based L1-L5)
- Focus on AI implementation and digital transformation

## Critical Rules

### File Management

- **NEVER** create files unless absolutely necessary
- **ALWAYS** prefer editing existing files
- **NEVER** create documentation proactively (only on request)

### Routing

- All routes are internationalized with `[locale]` prefix
- Use `getLocalizedUrl()` helper for navigation
- Middleware handles locale detection and routing

### Branding

- Business units: "a MADFAM Company"
- Products: "by [Unit], a MADFAM Company"
- No references to deprecated SPARK product

### Mobile Optimization

- Touch targets: 44px minimum, 48px recommended
- Use MobileButton and MobileInput components
- Font size 16px minimum for inputs (prevents iOS zoom)

## Common Tasks

### Add New Page

```tsx
// apps/web/app/[locale]/new-page/page.tsx
import { getTranslations } from 'next-intl/server';

export default async function NewPage() {
  const t = await getTranslations('newPage');
  return <main>{t('title')}</main>;
}
```

### Create Component

```tsx
// packages/ui/src/components/NewComponent.tsx
import { cn } from '../lib/utils';

interface NewComponentProps {
  className?: string;
}

export function NewComponent({ className }: NewComponentProps) {
  return <div className={cn('base-styles', className)} />;
}
```

### Add Translation

```json
// packages/i18n/src/translations/[locale]/newPage.json
{
  "title": "Page Title",
  "description": "Page description"
}
```

## Code Standards

### TypeScript

- Strict mode enabled
- Explicit return types for functions
- Interfaces for component props

### Styling

- Tailwind CSS only (no inline styles)
- Mobile-first responsive design
- Use design tokens from tailwind.config

### Git Commits

- Conventional commits format
- Pre-commit hooks run linting
- Auto-generated commit signature

## Environment Variables

Required:

```env
NEXT_PUBLIC_ENV=development|staging|production
NEXT_PUBLIC_API_URL=
```

Optional:

```env
DATABASE_URL=
N8N_WEBHOOK_URL=
```

## Testing & Quality

```bash
# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Run tests
pnpm test
```

## Deployment

- **Development**: `pnpm dev`
- **Staging**: Push to staging branch
- **Production**: Push to main branch → Kubernetes via Enclii (Vercel available as preview/fallback)

## Performance Guidelines

1. Lazy load below-fold content
2. Optimize images with next/image
3. Use dynamic imports for heavy components
4. Keep bundle under 200KB per route
5. Implement proper loading states

## Security

- Input validation with Zod
- CSP headers configured
- No secrets in code
- Sanitize user content
- Use environment variables

## Debugging Tips

### Common Issues

- **Build errors**: Run `pnpm clean && pnpm install`
- **Type errors**: Check `pnpm typecheck`
- **Import errors**: Verify package exports
- **Style issues**: Check Tailwind config

### Useful Commands

```bash
pnpm clean           # Clean all caches
pnpm build           # Build all packages
pnpm dev             # Start dev server
pnpm analyze         # Bundle analysis
```

## AI Assistant Notes

When working on this codebase:

1. Follow existing patterns
2. Maintain consistency
3. Consider all 3 languages
4. Test mobile responsiveness
5. Validate with TypeScript
6. Keep responses concise
7. Use TodoWrite for task tracking

## Documentation Index

All detailed documentation is in `/docs/`:

- Architecture details: `docs/ARCHITECTURE.md`
- API documentation: `docs/API.md`
- Testing guide: `docs/TESTING.md`
- Deployment guide: `docs/DEPLOYMENT.md`
- Brand guidelines: `docs/BRAND_IMPLEMENTATION_GUIDE.md`
- Mobile guide: `docs/MOBILE_OPTIMIZATION_GUIDE.md`

---

**Last Updated**: November 2024  
**Version**: 1.0.0  
**Maintained by**: MADFAM Development Team
