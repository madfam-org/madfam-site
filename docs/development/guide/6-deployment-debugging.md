# Deployment, Monitoring & Debugging

Production deployment, analytics, and troubleshooting

### **Custom Events**

```tsx
// Track business events
import { analytics } from '@madfam/analytics';

// Lead generation
analytics.trackLeadGenerated({
  program: 'STRATEGY_ENABLEMENT',
  source: 'website',
  score: 85,
});

// Assessment completion
analytics.trackAssessmentCompleted({
  score: 76,
  recommendedProgram: 'STRATEGY_ENABLEMENT',
  timeToComplete: 180, // seconds
});

// Conversion events
analytics.trackConversion({
  type: 'meeting_scheduled',
  value: 50000, // estimated deal size
  program: 'PLATFORM_PILOTS',
});
```

### **Performance Monitoring**

```tsx
// Performance tracking
import { performanceMonitor } from '@/lib/performance';

export async function createLead(data: CreateLeadData) {
  return performanceMonitor.track('lead.create', async () => {
    // Business logic here
    return await leadService.create(data);
  });
}
```

### **Error Tracking**

```tsx
// Error reporting
import { logger } from '@/lib/logger';

try {
  // Risky operation
} catch (error) {
  logger.error('Lead creation failed', {
    error: error.message,
    email: lead.email,
    tier: lead.tier,
    context: 'lead-form-submission',
  });

  throw error; // Re-throw for user feedback
}
```

---

## 🚀 Deployment

### **Environments**

1. **Development** (`localhost:3002`)
   - Local development with hot reload
   - SQLite database
   - All feature flags enabled

2. **Staging** (`staging.madfam.io`)
   - GitHub Pages deployment
   - Production-like environment
   - PostgreSQL database
   - Selected feature flags

3. **Production** (`madfam.io`)
   - Vercel deployment
   - PostgreSQL with backups
   - Conservative feature flags
   - Full monitoring

### **Deploy Commands**

```bash
# Staging deployment
git checkout staging
git merge develop
git push origin staging  # Auto-deploys via GitHub Actions

# Production deployment
git checkout main
git merge staging
git tag v1.2.0
git push origin main --tags  # Auto-deploys to Vercel
```

### **Environment Variables**

```bash
# Required for all environments
DATABASE_URL=
NEXT_PUBLIC_ENV=

# Production only
RESEND_API_KEY=
N8N_WEBHOOK_URL=
PLAUSIBLE_API_KEY=
SENTRY_DSN=
```

---

## 🐛 Debugging Guide

### **Common Issues**

#### **Build Errors**

```bash
# TypeScript errors
pnpm typecheck  # Fix type issues

# Dependency issues
rm -rf node_modules .next
pnpm install

# Package linking issues
pnpm build --filter=@madfam/ui
```

#### **Runtime Errors**

```bash
# Database connection issues
npx prisma db push
npx prisma generate

# Environment variable issues
cp apps/web/.env.example apps/web/.env
# Edit .env with correct values

# Port conflicts
lsof -i :3000  # Find process using port
kill -9 <PID>  # Kill process
```

#### **Development Server Issues**

```bash
# Clear Next.js cache
rm -rf apps/web/.next

# Clear Turborepo cache
pnpm clean

# Reset development database
npx prisma migrate reset
```

### **Debugging Tools**

#### **VS Code Debugging**

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/web/node_modules/.bin/next",
      "args": ["dev"],
      "cwd": "${workspaceFolder}/apps/web",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

#### **Database Inspection**

```bash
# Prisma Studio (visual database browser)
npx prisma studio

# Raw SQL queries
npx prisma db execute --stdin < query.sql
```

#### **API Testing**

```bash
# Test API endpoints
curl -X POST http://localhost:3002/api/leads \
  -H "Content-Type: application/json" \
  -d '{"email":"test@company.com","name":"Test User"}'

# Check API logs
tail -f apps/web/logs/api.log
```

---
