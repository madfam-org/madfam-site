# MADFAM Web Application

The main Next.js 14 application for the MADFAM corporate website.

## Overview

This is the primary web application that serves the MADFAM corporate website. It's built with Next.js 14 using the App Router, TypeScript, and Tailwind CSS.

## Features

- 🌐 Multi-language support (Spanish/English)
- 📱 Responsive design
- 🎨 Custom design system
- 📊 Analytics integration
- 🚀 Optimized performance
- 🔒 Enterprise security
- 📧 Lead generation system

## Project Structure

```
apps/web/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── (pages)/          # Page routes
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/            # React components
├── lib/                  # Utilities
├── public/               # Static assets
├── next.config.js        # Next.js config
├── tailwind.config.ts    # Tailwind config
└── tsconfig.json         # TypeScript config
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

From the monorepo root:

```bash
pnpm install
```

### Development

```bash
# From monorepo root
pnpm dev

# Or from this directory
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create `.env.local`:

```env
# Required
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Optional
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=localhost
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/xxx
API_SECRET=your-secret-key
```

## Pages

### Public Pages

- `/` - Homepage
- `/services` - Transformation programs overview
- `/products` - Product portfolio (Enclii, Janua, Dhanam, Forge Sight, etc.)
- `/assessment` - AI readiness assessment
- `/contact` - Contact form
- `/about` - About MADFAM (coming soon)

### API Routes

- `/api/leads` - Lead capture and management
- `/api/assessment` - Assessment processing (coming soon)
- `/api/calculator` - ROI calculations (coming soon)
- `/api/health` - Health check endpoint

## Components

### Layout Components

- `Navbar` - Main navigation
- `Footer` - Site footer

### Form Components

- `LeadForm` - Lead capture form
- `AIAssessment` - Interactive assessment

### UI Components

- `ServiceCard` - Service tier display
- Various components from `@madfam/ui` package

## Styling

We use Tailwind CSS with custom configuration:

- Custom colors matching brand
- Fluid typography with clamp()
- Animation utilities
- Custom component classes

### Design Tokens

```css
--color-sun: #ffd93d;
--color-leaf: #6bcb77;
--color-lavender: #9b59b6;
--color-obsidian: #0a0e27;
--color-pearl: #fafafa;
```

## Performance

### Optimization Strategies

1. **Image Optimization**
   - Using `next/image` component
   - Multiple formats (AVIF, WebP)
   - Lazy loading

2. **Code Splitting**
   - Dynamic imports for heavy components
   - Route-based splitting

3. **Caching**
   - ISR for CMS content
   - Static generation where possible

### Performance Targets

- Lighthouse Score: 95+
- First Contentful Paint: <1.5s
- Time to Interactive: <3.5s
- Cumulative Layout Shift: <0.05

## Testing

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test
pnpm test LeadForm
```

## Building

### Development Build

```bash
pnpm build
```

### Staging Build (Static Export)

```bash
NEXT_PUBLIC_ENV=staging pnpm build
pnpm export
```

### Production Build

```bash
NEXT_PUBLIC_ENV=production pnpm build
```

## Deployment

### Staging (GitHub Pages)

The staging build creates a static export suitable for GitHub Pages:

```bash
# Build for staging
pnpm build:staging

# Files will be in out/
```

### Production (Vercel)

Production deployment uses full Next.js features:

```bash
# Build for production
pnpm build:production

# Deploy with Vercel CLI
vercel --prod
```

## Common Tasks

### Adding a New Page

1. Create `app/[page-name]/page.tsx`
2. Add metadata and component
3. Update navigation in `Navbar` and `Footer`

### Adding an API Route

1. Create `app/api/[route]/route.ts`
2. Export async functions (GET, POST, etc.)
3. Use Zod for validation

### Updating Translations

1. Edit files in `packages/i18n/src/translations/`
2. Follow existing key structure
3. Test in both languages

## Troubleshooting

### Module Resolution Issues

Ensure `tsconfig.json` has correct paths:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@madfam/ui": ["../../packages/ui/src"]
    }
  }
}
```

### Build Errors

1. Clear Next.js cache: `rm -rf .next`
2. Check for TypeScript errors: `pnpm typecheck`
3. Verify all imports are correct

### Static Export Issues

For GitHub Pages deployment:

- Avoid server-only features
- Use `output: 'export'` in config
- Check for dynamic routes without `getStaticPaths`

## Contributing

See the main [Contributing Guide](../../docs/CONTRIBUTING.md) for detailed information.

## License

Proprietary - All rights reserved by MADFAM.
