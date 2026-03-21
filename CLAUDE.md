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
**Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Turborepo
**Architecture**: Monorepo with shared packages  
**Languages**: Spanish (es), English (en), Portuguese (pt)

## Repository Structure

```
biz-site/
├── apps/
│   ├── web/           # Main Next.js website
│   └── cms/           # Payload CMS (optional)
├── packages/
│   ├── ui/            # Shared themes/tokens (components dissolved to apps/web)
│   ├── core/          # Business logic, feature flags, logger
│   ├── i18n/          # Translations (es, en, pt)
│   ├── analytics/     # Tracking (Plausible integration)
│   └── email/         # Email templates and Resend sender
├── docs/              # All documentation
├── README.md          # Project README
└── CLAUDE.md          # This file
```

## Business Context

### Ecosystem Structure

MADFAM is a solarpunk ecosystem of open platforms for creators, makers, and entrepreneurs in LATAM. Three conversion paths:

1. **Use a MADFAM Platform** — 10 digital platforms (each with Free + Pro tiers)
2. **Use Primavera Maker Node** — Physical fabrication (3D printing, CNC, laser cutting)
3. **Become an Ecosystem Member** — One membership unlocks Pro across all platforms + discounted fabrication

### Digital Platforms (by MADFAM)

- **Enclii**: Sovereign cloud PaaS
- **Janua**: Self-hosted identity platform
- **Dhanam**: Wealth & finance for LATAM founders (https://www.dhan.am)
- **Forge Sight**: Pricing intelligence for digital fabrication
- **Cotiza Studio**: Automated quoting and estimation
- **Yantra4D**: Parametric design platform
- **Pravara-MES**: Manufacturing execution system
- **Tezca**: Mexican regulatory intelligence (https://tezca.mx)
- **AVALA**: Competency-based training (Coming Soon)
- **PENNY**: AI assistant (In Development)

### Solutions

- **Primavera Maker Node**: Physical fabrication hub (3D printing, CNC, laser cutting)
- **MADFAM Co-Labs**: Collaborations & co-creations (a MADFAM Company)
- **Showtech**: Technology showcase & events (Coming Soon)

### Programs

- **Design & Fabrication** — End-to-end design and digital fabrication
- **Launch Program** — Strategic consulting for startups entering the ecosystem
- **Scale Program** — Platform integration and workflow automation for growing projects
- **Partner Program** — Technology partnerships for organizations embedding MADFAM tech

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

- Products/Platforms: "by MADFAM"
- Co-Labs / Showtech: "a MADFAM Company"
- No references to deprecated SPARK, Aureo Labs, or Primavera3D
- Maker Node is "Primavera Maker Node" (formerly Primavera3D)

### Mobile Optimization

- Touch targets: 44px minimum, 48px recommended
- Use MobileButton and MobileInput components
- Font size 16px minimum for inputs (prevents iOS zoom)

## Key Data Files

- **Platform Registry**: `apps/web/lib/data/platforms.ts` — Single source of truth for all 10 platform metadata. Used by platform detail pages, homepage, products page, navbar, footer.
- **Platform Translations**: `packages/i18n/src/translations/{en,es,pt}/platforms.json` — ~290 keys per locale with taglines, value props, features, CTAs, comparison tables, tech specs.
- **Platform Detail Pages**: `apps/web/app/[locale]/platforms/[slug]/page.tsx` — Dynamic route with `generateStaticParams` for all 10 slugs.
- **Integration Flow**: Design (Yantra4D) → Quote (Cotiza) → Price (Forge Sight) → Finance (Dhanam) → Manufacture (Pravara-MES) → Comply (Tezca/AVALA)

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
// apps/web/components/NewComponent.tsx
import { cn } from '@/components/ui/utils';

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
DATABASE_URL=
```

Optional (services activate when configured):

```env
REDIS_URL=                        # Multi-pod rate limiting & CMS cache
SENTRY_DSN=                       # Server-side error tracking
NEXT_PUBLIC_SENTRY_DSN=           # Client-side error tracking
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=     # Plausible analytics
RESEND_API_KEY=                   # Email sending via Resend
RESEND_FROM_EMAIL=                # Sender address (default: hello@madfam.io)
CMS_WEBHOOK_SECRET=               # CMS cache invalidation webhook auth
N8N_WEBHOOK_URL=                  # n8n workflow automation
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

- Nonce-based CSP with `strict-dynamic` for script-src
- Input validation with Zod
- Redis-backed rate limiting (falls back to in-memory)
- Sentry error tracking (guarded by env var)
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

## Infrastructure

- **K8s**: HPA with 2-5 replicas, 70% CPU target
- **Rate limiting**: Redis-backed (multi-pod safe) with in-memory fallback
- **CMS cache**: Write-through Redis cache with webhook invalidation
- **Search**: Server-side search API at `/api/search`
- **Analytics**: Plausible via `sendBeacon` (no cookie consent needed)
- **Email**: Resend integration via email queue processor

---

**Last Updated**: March 2026
**Version**: 3.0.0
**Maintained by**: MADFAM Development Team
