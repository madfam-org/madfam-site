# MADFAM Corporate Website

![MADFAM](https://img.shields.io/badge/MADFAM-AI%20%2B%20Creativity-9B59B6)
![Next.js](https://img.shields.io/badge/Next.js-14.2.33-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)
![React](https://img.shields.io/badge/React-19.2.0-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![License](https://img.shields.io/badge/License-Proprietary-red)

> **The official corporate website for MADFAM** - where AI meets human creativity. Built with Next.js 14, TypeScript, and a modern monorepo architecture.

**🌟 Key Highlights:**

- 🏢 Products directly under Innovaciones MADFAM, plus Co-Labs and Showtech
- 🤖 Products: Dhanam, Forge Sight, Cotiza Studio, Enclii, Janua, Yantra4D, Pravara-MES
- 🌐 Full internationalization (Spanish, English, Portuguese)
- 📊 Privacy-first analytics with enterprise-grade security
- 🎨 Modern design system with Tailwind CSS 4 and dark/light mode
- 🧮 Interactive tools: AI Assessment, ROI Calculator, Project Estimator

**📅 Last Updated:** November 2025

## 🚀 Quick Start

### Prerequisites

- Node.js 20.x or higher
- pnpm 8.0.0 or higher (recommended: 8.14.1)

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

> **Note**: Server may start on port 3001 if 3000 is in use.

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
biz-site/
├── apps/
│   ├── web/              # Next.js 14 corporate website
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
├── CLAUDE.md             # AI assistant context & guidelines
└── README.md             # This file
```

## 🎯 Key Features

### Corporate Structure

All products are directly under **Innovaciones MADFAM**:

- **MADFAM Co-Labs** - Collaborations & co-creations
- **Showtech** - Technology showcase & events (Coming Soon)

### Products (by MADFAM)

- **Enclii** - Sovereign cloud PaaS powering MADFAM's infrastructure
- **Janua** - Self-hosted identity platform with SSO, MFA, and Passkeys
- **Dhanam** - Wealth & finance platform for LATAM founders at [dhan.am](https://www.dhan.am)
- **Forge Sight** - Pricing intelligence for digital fabrication
- **Cotiza Studio** - Intelligent quoting and budgeting system
- **Yantra4D** - Open parametric design platform
- **Pravara-MES** - Manufacturing execution system
- **AVALA** - Competency-based training platform (Coming Soon)
- **PENNY** - AI assistant platform (In Development)

### Programs

- **Design & Fabrication** - Advanced manufacturing and 3D design services
- **Strategy & Enablement** - Digital transformation consulting and implementation
- **Platform Pilots** - AI platform proof-of-concept deployments

### Interactive Tools

- 🧮 **AI Capability Assessment** - Evaluate organizational AI readiness with intelligent recommendations
- 💰 **ROI Calculator** - Calculate potential returns from AI and digital transformation initiatives
- 📊 **Project Estimator** - Get accurate project estimates with interactive configuration
- 🎯 **Lead Scoring System** - Intelligent lead qualification and tracking
- 📈 **Analytics Dashboard** - Real-time metrics and user insights

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

All routes support internationalization with Spanish (es), English (en), and Portuguese (pt) locales:

**Public Pages**

- `/` - Corporate homepage
- `/solutions` - MADFAM Co-Labs and Showtech
- `/products` - Product showcase (Dhanam, Forge Sight, Cotiza Studio, and more)
- `/programs` - Transformation and enablement programs
- `/about` - Company information
- `/impact` - ESG and sustainability metrics

**Interactive Tools**

- `/assessment` - AI capability assessment tool
- `/calculator` - ROI and cost calculator
- `/estimator` - Project estimation tool

**Content**

- `/blog` - Articles and guides
- `/case-studies` - Customer success stories
- `/showcase` - Technology demonstrations
- `/guides` - Documentation and tutorials

**Demos**

- `/demo/dhanam` - Financial wellness platform demo
- `/demo/forge-sight` - Analytics platform demo

**User Portal**

- `/dashboard` - User dashboard and analytics
- `/auth/signin` - Authentication page

**Legal**

- `/privacy` - Privacy policy
- `/terms` - Terms of service
- `/cookies` - Cookie policy
- `/contact` - Contact form

> **Note**: Routes are automatically localized. For example, `/products` becomes `/es/productos` in Spanish and `/pt/produtos` in Portuguese.

## 🛠️ Technology Stack

| Category       | Technology            | Version | Purpose                         |
| -------------- | --------------------- | ------- | ------------------------------- |
| **Frontend**   | Next.js               | 14.2.33 | React framework with App Router |
| **Language**   | TypeScript            | 5.9.3   | Type-safe development           |
| **UI**         | React                 | 19.2.0  | Modern UI library               |
| **Styling**    | Tailwind CSS          | 4.1.17  | Utility-first CSS framework     |
| **Animation**  | Framer Motion         | 11.18.0 | Smooth animations & transitions |
| **Forms**      | React Hook Form + Zod | 7.66.0  | Form handling and validation    |
| **i18n**       | next-intl             | 4.5.3   | Internationalization            |
| **Database**   | Prisma + PostgreSQL   | 6.19.0  | Type-safe database ORM          |
| **Auth**       | Janua (@janua/nextjs) | Latest  | Sovereign authentication        |
| **Analytics**  | Plausible             | Latest  | Privacy-first analytics         |
| **CMS**        | Payload CMS           | 3.54.0  | Headless content management     |
| **Testing**    | Vitest + Playwright   | 4.0.8   | Unit and E2E testing            |
| **Deployment** | Enclii (K8s)          | Latest  | Production via sovereign PaaS   |
| **CI/CD**      | GitHub Actions        | Latest  | Automated workflows             |
| **Monorepo**   | Turborepo + pnpm      | 2.6.1   | Workspace management            |

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
- Development server with hot reload (port 3001)
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

The application provides a comprehensive REST API:

### Core Endpoints

- `/api/assessment/*` - AI capability assessment processing and results
- `/api/calculator/*` - ROI and project cost calculations
- `/api/leads/*` - Lead management, scoring, and activity tracking
- `/api/auth/*` - Janua authentication endpoints

### Utility Endpoints

- `/api/csrf-token` - CSRF token generation for security
- `/api/feature-flags` - Environment-specific feature flag retrieval
- `/api/logs` - Application logging and monitoring
- `/api/webhook/*` - External integrations (n8n, Slack, etc.)

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

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=madfam.io

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx

# AI/LLM Integration
OPENAI_API_KEY=sk-xxxxxxxxxxxx

# Optional Integrations
N8N_WEBHOOK_URL=https://n8n.madfam.io/webhook/xxx
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
SENTRY_DSN=https://xxxx@sentry.io/xxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
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
