# Deployment Guide

## Overview

The MADFAM website uses a comprehensive multi-environment deployment strategy optimized for AI consultancy business operations:

- **Development**: Local development with SQLite and hot reload
- **Staging**: GitHub Pages (static export for design/content review)
- **Production**: Vercel + Railway (hybrid infrastructure for full functionality)

> **Important**: Vercel alone is NOT sufficient for 100% functionality. See [Infrastructure Requirements](../infrastructure/INFRASTRUCTURE_REQUIREMENTS.md) for details.

## Prerequisites

- Node.js 20+ and pnpm 8+
- Git and GitHub account
- Vercel account (for production)
- Environment variables configured

## Environment Configuration

### Development (.env.local)

```env
# Environment
NEXT_PUBLIC_ENV=development

# Analytics (optional in dev)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=localhost

# API
NEXT_PUBLIC_API_URL=http://localhost:3002/api
DATABASE_URL=file:./dev.db

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS=all
```

### Staging

```env
# Environment
NEXT_PUBLIC_ENV=staging

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=staging.madfam.io

# API
NEXT_PUBLIC_API_URL=https://staging.madfam.io/api

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS=staging
```

### Production

```env
# Environment
NEXT_PUBLIC_ENV=production

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=madfam.io

# API
NEXT_PUBLIC_API_URL=https://madfam.io/api

# Database (Vercel)
DATABASE_URL=postgresql://...

# CMS Integration (Railway)
NEXT_PUBLIC_CMS_URL=https://cms.madfam.railway.app
CMS_API_KEY=...

# Feature Flags
NEXT_PUBLIC_FEATURE_FLAGS=stable

# Secrets
API_SECRET=your-api-secret
N8N_WEBHOOK_URL=https://n8n.madfam.io/webhook/xxx

# Email Service
RESEND_API_KEY=re_...
```

## Deployment Workflows

### 1. Staging Deployment (GitHub Pages)

Staging is automatically deployed when pushing to the `staging` branch.

#### Manual Deployment

```bash
# Switch to staging branch
git checkout staging

# Merge latest changes from main
git merge main

# Push to trigger deployment
git push origin staging
```

#### Build Process

The GitHub Action will:

1. Install dependencies
2. Run tests
3. Build static export with staging config
4. Deploy to GitHub Pages

#### Access Staging

- URL: `https://madfam-org.github.io/biz-site`
- Or with custom domain: `https://staging.madfam.io`

**Important Limitations:**

- No API functionality (forms don't save data)
- No authentication (login disabled)
- No database operations
- Static content only

### 2. Production Deployment (Vercel)

Production is deployed when creating a new release tag.

#### Deployment Steps

```bash
# Ensure main branch is up to date
git checkout main
git pull origin main

# Create a new version tag
npm version patch  # or minor/major
# This creates a commit and tag

# Push tag to trigger deployment
git push origin main --tags
```

#### Alternative: Direct Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### 3. Preview Deployments

Vercel automatically creates preview deployments for pull requests.

1. Create a pull request
2. Vercel bot comments with preview URL
3. Test changes in isolation
4. Merge when ready

## CI/CD Pipeline

### GitHub Actions Workflows

#### Main Workflow (.github/workflows/main.yml)

Runs on every push:

- Dependency installation with pnpm
- TypeScript compilation and linting
- Unit tests with Vitest
- E2E tests with Playwright
- Build verification for all packages
- Security dependency scanning

#### Staging Deployment (.github/workflows/deploy-staging.yml)

Triggers on push to `staging`:

- Builds static export
- Deploys to GitHub Pages
- Posts deployment URL

#### Production Deployment

Triggers on release creation:

- Builds optimized production build
- Deploys to Vercel
- Runs smoke tests

## Build Commands

### Development

```bash
# Start dev server
pnpm dev

# Run with staging config
NEXT_PUBLIC_ENV=staging pnpm dev
```

### Staging Build

```bash
# Build for GitHub Pages
pnpm build:staging

# Test static export locally
cd apps/web
pnpm export
npx serve out
```

### Production Build

```bash
# Build for production
pnpm build:production

# Test production build
pnpm start
```

## Feature Flags

Control feature availability per environment:

```typescript
// Feature flag configuration
{
  NEW_LEAD_SCORING: {
    development: true,
    staging: true,
    production: false
  }
}
```

### Enabling Features

```bash
# Enable in staging
NEXT_PUBLIC_FEATURE_NEW_LEAD_SCORING=true

# Enable in production (via Vercel dashboard)
# Add environment variable
```

## Rollback Procedures

### Staging Rollback

```bash
# Revert to previous commit
git checkout staging
git reset --hard HEAD~1
git push --force-with-lease origin staging
```

### Production Rollback (Vercel)

Option 1: Via Vercel Dashboard

1. Go to Vercel dashboard
2. Click "Instant Rollback"
3. Select previous deployment

Option 2: Via CLI

```bash
vercel rollback
```

Option 3: Git Revert

```bash
git revert HEAD
git push origin main
# Create new release tag
```

## Monitoring

### Health Checks

- Staging: `https://staging.madfam.io/api/health`
- Production: `https://madfam.io/api/health`

### Monitoring Services

1. **Vercel Analytics** (Production)
   - Real User Metrics
   - Web Vitals
   - Error tracking

2. **Plausible Analytics**
   - Page views
   - User journeys
   - Conversion tracking

3. **Sentry** (Coming soon)
   - Error monitoring
   - Performance tracking

## Troubleshooting

### Common Issues

#### Build Fails on Vercel

1. Check build logs in Vercel dashboard
2. Verify environment variables
3. Ensure all dependencies are in package.json
4. Check for TypeScript errors: `pnpm typecheck`

#### GitHub Pages 404

1. Ensure `.nojekyll` file exists
2. Check `basePath` in next.config.js
3. Verify GitHub Pages is enabled in repo settings

#### Static Export Issues

```bash
# Debug static export
cd apps/web
NEXT_PUBLIC_ENV=staging pnpm build
pnpm export

# Check for dynamic routes without getStaticPaths
# Check for server-only features
```

### Debug Commands

```bash
# Check environment
echo $NEXT_PUBLIC_ENV

# Verify build output
ls -la apps/web/.next
ls -la apps/web/out

# Test production build locally
pnpm build:production
pnpm start
```

## Security Checklist

Before deploying to production:

- [ ] Environment variables set correctly
- [ ] API endpoints protected
- [ ] CORS configured properly
- [ ] CSP headers enabled
- [ ] Secrets not exposed in code
- [ ] Dependencies updated
- [ ] Security headers configured

## Performance Checklist

- [ ] Images optimized
- [ ] Fonts loaded efficiently
- [ ] JavaScript bundles < 200KB
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing

## Deployment Notifications

Configure notifications in GitHub/Vercel:

1. **Slack Integration**
   - GitHub Actions: Add Slack webhook
   - Vercel: Connect Slack in settings

2. **Email Notifications**
   - GitHub: Watch repository
   - Vercel: Team notifications

## Useful Links

- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Actions](https://github.com/madfam-org/biz-site/actions)
- [Deployment Status](https://github.com/madfam-org/biz-site/deployments)
- [Analytics Dashboard](https://plausible.io/madfam.io)
