# MADFAM Corporate Website

![MADFAM](https://img.shields.io/badge/MADFAM-open%20platforms-9B59B6)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black)
![TypeScript](<https://img.shields.io/badge/TypeScript-5.9%20(web)-blue>)
![React](<https://img.shields.io/badge/React-18.3%20(web)-61dafb>)
![Node.js](https://img.shields.io/badge/Node.js-22.x-green)
![License](https://img.shields.io/badge/License-Proprietary-red)

> **The official website for MADFAM** — open platforms for creators, makers, and entrepreneurs building the future of LATAM. Built with Next.js 15 (App Router), TypeScript, and a modern monorepo architecture.

**🌟 Key Highlights:**

- 🌱 Solarpunk ecosystem with digital platforms + physical fabrication
- 🔓 Access models are product-specific; Ecosystem Membership unlocks eligible platform capabilities and coordinated support
- 🏭 Primavera Maker Node: 3D printing, CNC machining, and laser cutting
- 🌐 Full internationalization (Spanish, English, Portuguese)
- 📊 Privacy-first analytics with enterprise-grade security
- 🎨 Modern design system with Tailwind CSS 4 and dark/light mode

**📅 Last Updated:** 2026-09-23

> **Boundary checkpoint (2026-09-04, madfam-site).** This is a public repository (Lane C, public
> corporate site). Setup steps, ports and variable _names_ are public-safe; node hostnames, IP
> addresses, credentials, tunnel identifiers, cost figures and incident evidence live **only** in
> the private `internal-devops` repo. Policy: `internal-devops/docs/repo-boundary-contract.md`.
> Public checklist: [`docs/PUBLIC_REPO_BOUNDARY.md`](docs/PUBLIC_REPO_BOUNDARY.md).

## 🚀 Quick Start

### Prerequisites

- Node.js 22.x (see `.nvmrc`)
- pnpm 9.15.0 via Corepack (package manager is pinned in `package.json`)

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

Visit [http://localhost:3000](http://localhost:3000) to see the site (auto-redirects to Spanish locale).

> **Note**: The web dev server listens on port 3000; `apps/cms` uses 3001.

### Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm clean            # Clean all build artifacts and caches

# Code Quality
pnpm typecheck        # Run TypeScript type checking
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting

# Testing
pnpm test             # Run unit tests
pnpm test:ui          # Run tests with UI
pnpm test:coverage    # Generate test coverage report
pnpm test:e2e         # Run E2E tests with Playwright
pnpm test:a11y        # Run accessibility tests
pnpm test:security    # Run security audits

# Database
pnpm db:push          # Push Prisma schema to database
pnpm db:studio        # Open Prisma Studio
pnpm db:generate      # Generate Prisma Client

# Analysis
pnpm analyze          # Analyze bundle size
```

## 📁 Project Structure

```
madfam-site/
├── apps/
│   ├── web/              # Next.js 15 corporate website
│   └── cms/              # Payload CMS v3 (headless content management)
├── packages/
│   ├── ui/               # Shared UI components (@madfam/ui)
│   ├── core/             # Business logic, types & validation
│   ├── analytics/        # Analytics integration (Plausible)
│   ├── i18n/             # Internationalization (next-intl)
│   └── email/            # Email templates (React Email)
├── docs/                 # Comprehensive documentation
├── scripts/              # Build, validation & deployment scripts
├── .github/              # GitHub Actions CI/CD workflows
├── AGENTS.md             # Canonical AI assistant context & guidelines
├── CLAUDE.md             # Compatibility redirect for Claude
└── README.md             # This file
```

## 🎯 Key Features

### Ecosystem Structure

Three conversion paths into the MADFAM ecosystem:

1. **Use a MADFAM Platform** — MADFAM digital platforms with access models matched to each product
2. **Use Primavera Maker Node** — Physical fabrication (3D printing, CNC, laser cutting)
3. **Become an Ecosystem Member** — One coordinated membership unlocks eligible platform capabilities, ecosystem support, and maker-node advantages

### Digital Platforms (by MADFAM)

- **Enclii** - Sovereign cloud PaaS powering MADFAM's infrastructure
- **Janua** - Self-hosted identity platform with SSO, MFA, and Passkeys
- **Dhanam** - Wealth & finance platform for LATAM founders at [dhan.am](https://www.dhan.am)
- **Forgesight** - Pricing intelligence for digital fabrication
- **Cotiza** - Intelligent quoting and budgeting system
- **Yantra4D** - Open parametric design platform
- **Pravara MES** - Manufacturing execution system
- **Avala** - Competency-based training platform at [avala.studio](https://avala.studio)
- **Selva** - Self-hosted AI agent platform at [selva.town](https://selva.town)

### Solutions

- **Primavera Maker Node** - Physical fabrication hub (3D printing, CNC, laser cutting)
- **MADFAM Co-Labs** - Collaborations & co-creations
- **Showtech** - Technology showcase & events (Coming Soon)

### Programs

- **Design & Fabrication** - End-to-end design and digital fabrication services
- **Launch Program** - Strategic consulting for startups entering the ecosystem
- **Scale Program** - Platform integration and workflow automation for growing projects
- **Partner Program** - Technology partnerships for organizations embedding MADFAM tech

### Technical Features

- 🌐 **Internationalization**: Spanish (es), English (en), Portuguese (pt) with localized routes
- 📊 **Privacy-first analytics** with Plausible (GDPR compliant)
- 🎨 **Modern design system** with Tailwind CSS 4.x, custom color palette, and dark/light mode
- 📱 **Mobile-first responsive design** optimized for all devices with 44px+ touch targets
- 🚀 **Performance optimized** for 95+ Lighthouse scores
- 🔒 **Enterprise-grade security** with CSP, CSRF protection, rate limiting, and security headers
- 📈 **AI-powered lead generation** with intelligent scoring and activity tracking
- 🗄️ **Database-backed** with Prisma ORM and PostgreSQL
- 🧪 **Comprehensive testing** with Vitest (unit) and Playwright (E2E)
- 📧 **Email automation** with React Email templates and queue system
- 🔌 **Integration ready** with n8n webhooks, Slack notifications, and third-party APIs

### Key Pages & Routes

Every route is locale-prefixed (`/es`, `/en`, `/pt`); `apps/web/app/[locale]/` is the source of truth.

**Public pages**

- `/` - Home
- `/ecosystem` - Ecosystem overview
- `/value-ladder` - The value ladder
- `/platforms`, `/platforms/[slug]` - The platform catalog and one page per platform
- `/products` - Products
- `/solutions`, `/solutions/maker-node`, `/solutions/colabs` - Solutions
- `/programs` - Programs
- `/nauta` - Nauta
- `/impact` - Impact
- `/about` - About
- `/careers` - Careers
- `/contact` - Contact form

**Legal and email**

- `/privacy`, `/terms`, `/cookies` - Legal notices
- `/unsubscribe` - Email opt-out

**Removed routes** redirect. Permanent (308): `/case-studies`, `/docs`, `/api`, `/guides` → `/platforms`;
`/blog` → home; `/estimator`, `/calculator`, `/assessment` → `/contact`; `/services` → `/programs`.
Temporary (307): `/showcase` → `/platforms`; `/dashboard` → home; `/auth/*` → Janua;
`/demo/dhanam`, `/demo/forge-sight` → the product sites.

Localized slugs such as `/es/productos` are rewrites: they serve the same page, whose canonical URL
stays `/es/products`.

## 🛠️ Technology Stack

| Category       | Technology            | Version | Purpose                         |
| -------------- | --------------------- | ------- | ------------------------------- |
| **Frontend**   | Next.js               | 15.5.x  | React framework with App Router |
| **Language**   | TypeScript            | 5.9.3   | Type-safe development           |
| **UI**         | React                 | 18.3.x  | Modern UI library               |
| **Styling**    | Tailwind CSS          | 4.3.x   | Utility-first CSS framework     |
| **Animation**  | Framer Motion         | 11.18.0 | Smooth animations & transitions |
| **Forms**      | React Hook Form + Zod | 7.76.x  | Form handling and validation    |
| **i18n**       | next-intl             | 4.12.x  | Internationalization            |
| **Database**   | Prisma + PostgreSQL   | 6.1.x   | Type-safe database ORM          |
| **Auth**       | Janua (@janua/nextjs) | Latest  | Sovereign authentication        |
| **Analytics**  | Plausible             | Latest  | Privacy-first analytics         |
| **CMS**        | Payload CMS           | 3.84.x  | Headless content management     |
| **Testing**    | Vitest + Playwright   | 4.1.x   | Unit and E2E testing            |
| **Deployment** | Enclii (K8s)          | Latest  | Production via sovereign PaaS   |
| **CI/CD**      | GitHub Actions        | Latest  | Automated workflows             |
| **Monorepo**   | Turborepo + pnpm      | 2.9.x   | Workspace management            |

## 🚢 Deployment

### Staging (GitHub Pages)

```bash
git checkout staging
pnpm build:staging
# Automatic deployment via GitHub Actions
```

### Production (Enclii / Kubernetes)

```bash
git checkout main
git push origin main
# Automatic deployment via GitOps CI/CD pipeline
```

### Docker (Local Development)

```bash
# Production build
docker-compose up web

# Development with hot reload
docker-compose up web-dev

# With PostgreSQL database
docker-compose up web postgres
```

The Docker configuration includes:

- Production-ready Next.js build (port 3000)
- Development server with hot reload (port 3000)
- PostgreSQL 15 database for CMS and data persistence

## 📚 Documentation

- [Architecture](./docs/ARCHITECTURE.md) - System design and technical decisions
- [API Documentation](./docs/API.md) - API endpoints and examples
- [Deployment Guide](./docs/DEPLOYMENT.md) - Detailed deployment instructions
- [Contributing](./docs/CONTRIBUTING.md) - Development guidelines
- [AI Context](./CLAUDE.md) - AI assistant context and codebase guidelines
- [Brand Guidelines](./docs/BRAND_IMPLEMENTATION_GUIDE.md) - Brand implementation guide
- [Mobile Optimization](./docs/MOBILE_OPTIMIZATION_GUIDE.md) - Mobile-first design patterns

## 🔌 API Routes

The API lives in `apps/web/app/api/`:

- `/api/leads` - Lead capture from the contact form (`/api/leads/demo`, for the removed demo pages, is no longer called by the site)
- `/api/search` - Site search
- `/api/unsubscribe` - Email opt-out
- `/api/feature-flags` - Environment-specific feature flags
- `/api/logs` - Client log intake
- `/api/webhook/n8n`, `/api/webhook/cms` - Webhook receivers (the CMS is retired, R52)
- `/api/health` - Readiness; downstream services are informational and report `unknown` when unset
- `/api/health/live` - Liveness (process only)
- `/api/version` - Deployed commit SHA and build time; the Deploy Web verify job waits for it to serve the new commit

### Security Features

- CSRF protection on all mutation endpoints
- Rate limiting (configurable: 100 requests per 15 minutes)
- Input validation with Zod schemas
- API authentication with secrets
- CORS configuration

See [API Documentation](./docs/API.md) for detailed endpoint specifications and examples.

## 🧪 Testing

```bash
# Unit tests
pnpm test                  # Run all unit tests
pnpm test:ui              # Run with UI mode
pnpm test:coverage        # Generate coverage report

# E2E tests
pnpm test:e2e             # Run Playwright E2E tests
pnpm test:e2e:ui          # Run E2E with UI mode
pnpm test:e2e:headed      # Run E2E with visible browser

# Quality checks
pnpm typecheck            # TypeScript type checking
pnpm lint                 # ESLint code linting
pnpm test:a11y            # Accessibility tests (WCAG compliance)
pnpm test:security        # Security vulnerability scanning
```

### Test Coverage

- **Unit Tests**: Vitest with React Testing Library
- **E2E Tests**: Playwright across 5 browsers (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
- **Accessibility**: Axe-core automated accessibility testing
- **Performance**: Lighthouse CI with 95+ score targets
- **Security**: Weekly npm audit and dependency scanning

## 🌍 Environment Variables

Create a `.env.local` file in `apps/web/`:

```env
# Required
DATABASE_URL=postgresql://user:password@localhost:5432/madfam
JANUA_API_URL=http://localhost:8000
JANUA_JWT_SECRET=your-janua-secret
NEXT_PUBLIC_ENV=development

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Optional Integrations
N8N_WEBHOOK_URL=https://n8n.madfam.io/webhook/xxx
```

See `.env.example` for a complete list of environment variables.

## 🤝 Contributing

Please read our [Contributing Guide](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is proprietary software. All rights reserved by MADFAM.

## 🔗 Links

- [Production Site](https://madfam.io)
- [Staging Site](https://madfam.github.io/biz-site)
- [Documentation](./docs)
- [Issues](https://github.com/madfam-org/biz-site/issues)

---

Built with ❤️ by MADFAM - Where AI meets human creativity
