# ARCHIVED: This document is historical. Production now runs on Enclii/K8s.

> **Warning**: The Vercel + Railway migration described below is no longer the active deployment strategy. Production infrastructure has moved to Kubernetes via Enclii. This document is retained for historical reference only. See `docs/deployment/DEPLOYMENT.md` and `docs/infrastructure/INFRASTRUCTURE_REQUIREMENTS.md` for current deployment information.

---

# Vercel + Railway Migration Guide (Historical)

## Overview

This guide provides step-by-step instructions for migrating the MADFAM corporate website from a single-platform deployment to a hybrid Vercel + Railway infrastructure.

## Prerequisites

- [ ] Vercel account with Pro plan
- [ ] Railway account
- [ ] GitHub repository access
- [ ] Environment variables documented
- [ ] Database backup completed

## Migration Timeline

- **Total Duration**: 2-4 weeks
- **Downtime Required**: None (zero-downtime migration)
- **Rollback Available**: Yes, at each phase

## Phase 1: Vercel Setup (Days 1-3)

### Step 1: Create Vercel Project

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Create project
cd /path/to/biz-site
vercel
```

### Step 2: Configure Vercel Project

1. **Import from GitHub**:

   ```
   Project Name: madfam-web
   Framework: Next.js
   Root Directory: apps/web
   Build Command: pnpm build
   Install Command: pnpm install
   ```

2. **Environment Variables**:
   ```bash
   # Production
   DATABASE_URL="postgres://..."
   NEXT_PUBLIC_ENV="production"
   NEXT_PUBLIC_API_URL="https://madfam.io/api"
   NEXT_PUBLIC_CMS_URL="https://cms.madfam.railway.app"
   RESEND_API_KEY="re_..."
   N8N_API_KEY="..."
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN="madfam.io"
   ```

### Step 3: Set up Vercel Postgres

1. Navigate to Vercel Dashboard → Storage
2. Create new Postgres database
3. Copy connection string to `DATABASE_URL`

### Step 4: Deploy to Vercel

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel
```

## Phase 2: Railway Setup (Days 4-7)

### Step 1: Create Railway Project

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init
```

### Step 2: Configure CMS Service

1. **Create `railway.toml` in project root**:

   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "pnpm install && pnpm build --filter=@madfam/cms"

   [deploy]
   startCommand = "cd apps/cms && pnpm start"
   healthcheckPath = "/api/health"
   restartPolicyType = "always"

   [[services]]
   name = "cms"
   port = 3001

   [[services.domains]]
   domain = "cms.madfam.railway.app"
   ```

2. **Add PostgreSQL Database**:

   ```bash
   railway add postgresql
   ```

3. **Configure Environment Variables**:
   ```bash
   railway variables set DATABASE_URL=$RAILWAY_DATABASE_URL
   railway variables set PAYLOAD_SECRET=$(openssl rand -hex 32)
   railway variables set PAYLOAD_PUBLIC_SERVER_URL=https://cms.madfam.railway.app
   ```

### Step 3: Deploy CMS to Railway

```bash
# Deploy
railway up

# Check logs
railway logs
```

### Step 4: Create Worker Service

1. **Create `apps/workers/email-processor.ts`**:

   ```typescript
   import { EmailQueueProcessor } from '@/lib/email-queue';

   class EmailWorker {
     private processor: EmailQueueProcessor;

     constructor() {
       this.processor = new EmailQueueProcessor();
     }

     async run() {
       console.log('Email worker started');

       while (true) {
         await this.processor.processQueue();
         await new Promise(resolve => setTimeout(resolve, 30000));
       }
     }
   }

   // Start worker
   const worker = new EmailWorker();
   worker.run().catch(console.error);
   ```

2. **Create worker service in Railway**:
   ```bash
   railway service create email-worker
   railway link email-worker
   railway up
   ```

## Phase 3: Database Migration (Days 8-10)

### Step 1: Export Existing Data

```bash
# Backup current database
pg_dump $OLD_DATABASE_URL > backup.sql

# Export Prisma schema
pnpm prisma migrate dev --create-only
```

### Step 2: Import to New Databases

```bash
# Import to Vercel Postgres (main app)
psql $VERCEL_DATABASE_URL < backup_web.sql

# Import to Railway Postgres (CMS)
psql $RAILWAY_DATABASE_URL < backup_cms.sql
```

### Step 3: Run Migrations

```bash
# Main app
cd apps/web
pnpm prisma migrate deploy

# CMS
cd apps/cms
pnpm prisma migrate deploy
```

## Phase 4: Media Storage Setup (Days 11-14)

### Step 1: Create Cloudflare R2 Bucket

1. Login to Cloudflare Dashboard
2. Navigate to R2 Storage
3. Create bucket: `madfam-media`
4. Generate API credentials

### Step 2: Configure Payload CMS

```typescript
// apps/cms/payload.config.ts
import { s3Adapter } from '@payloadcms/plugin-cloud-storage-s3';

export default buildConfig({
  plugins: [
    s3Adapter({
      config: {
        endpoint: process.env.R2_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      },
      bucket: 'madfam-media',
    }),
  ],
});
```

### Step 3: Migrate Existing Media

```bash
# Upload existing media to R2
aws s3 sync ./media s3://madfam-media/ \
  --endpoint-url $R2_ENDPOINT \
  --profile r2
```

## Phase 5: Integration Testing (Days 15-17)

### Test Checklist

- [ ] **Main Application**
  - [ ] Homepage loads
  - [ ] All routes accessible
  - [ ] API routes functional
  - [ ] Authentication works
  - [ ] Forms submit correctly

- [ ] **CMS**
  - [ ] Admin panel accessible
  - [ ] Content CRUD operations
  - [ ] Media uploads work
  - [ ] API endpoints respond

- [ ] **Background Jobs**
  - [ ] Email queue processes
  - [ ] Webhooks receive data
  - [ ] Scheduled tasks run

- [ ] **Performance**
  - [ ] Page load < 3s
  - [ ] API response < 500ms
  - [ ] No memory leaks

## Phase 6: DNS & Domain Configuration (Day 18)

### Update DNS Records

```dns
# Main site (Vercel)
A     @     76.76.21.21
AAAA  @     2606:4700:3000::6812:1515
CNAME www   cname.vercel-dns.com

# CMS (Railway)
CNAME cms   cms.madfam.railway.app

# Email
MX    @     10 mx1.madfam.io
TXT   @     "v=spf1 include:resend.com ~all"
```

## Phase 7: Go Live (Day 19)

### Pre-Launch Checklist

- [ ] All tests passing
- [ ] Backups verified
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Rollback plan ready

### Launch Steps

1. **Update Production Environment Variables**
2. **Deploy Final Version**:
   ```bash
   vercel --prod
   railway up --environment production
   ```
3. **Monitor Metrics** (first 24 hours)
4. **Verify Analytics**
5. **Check Error Tracking**

## Rollback Procedure

If issues arise, follow this rollback process:

1. **Immediate Rollback** (< 5 minutes):

   ```bash
   vercel rollback
   railway rollback
   ```

2. **Database Rollback**:

   ```bash
   psql $DATABASE_URL < backup.sql
   ```

3. **DNS Rollback**:
   - Revert DNS changes
   - Clear CDN cache

## Post-Migration Tasks

### Week 1

- [ ] Monitor performance metrics
- [ ] Review error logs
- [ ] Gather team feedback
- [ ] Document issues

### Week 2

- [ ] Optimize based on metrics
- [ ] Update documentation
- [ ] Train team on new infrastructure
- [ ] Plan future improvements

## Monitoring & Alerts

### Set Up Monitoring

1. **Vercel Analytics**: Automatic
2. **Railway Metrics**: Built-in dashboard
3. **Plausible Analytics**: Configure goals
4. **Error Tracking** (optional):
   ```bash
   npm install @sentry/nextjs
   ```

### Alert Configuration

```javascript
// Example alert rules
{
  "alerts": [
    {
      "name": "High Error Rate",
      "condition": "error_rate > 1%",
      "action": "email"
    },
    {
      "name": "Slow Response",
      "condition": "p95_latency > 3000ms",
      "action": "slack"
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### Issue: CMS Can't Connect to Database

```bash
# Check connection string
railway variables get DATABASE_URL

# Test connection
railway run psql $DATABASE_URL
```

#### Issue: Media Upload Fails

```bash
# Check R2 credentials
aws s3 ls s3://madfam-media/ --endpoint-url $R2_ENDPOINT

# Verify CORS settings
```

#### Issue: Email Queue Not Processing

```bash
# Check worker logs
railway logs --service email-worker

# Verify database connection
railway run node -e "console.log(process.env.DATABASE_URL)"
```

## Cost Monitoring

### Track Monthly Costs

| Service       | Expected | Alert Threshold |
| ------------- | -------- | --------------- |
| Vercel        | $20      | $30             |
| Railway       | $15      | $25             |
| Cloudflare R2 | $10      | $20             |
| **Total**     | **$45**  | **$75**         |

### Cost Optimization Tips

1. Use Vercel's caching effectively
2. Optimize Railway resource allocation
3. Implement R2 lifecycle policies
4. Review usage weekly

## Success Metrics

### Technical Metrics

- Deployment success rate: > 99%
- Uptime: > 99.9%
- Response time: < 500ms p50
- Error rate: < 0.1%

### Business Metrics

- No increase in bounce rate
- Maintain conversion rates
- Zero customer complaints
- Reduced operational overhead

## Support Resources

### Documentation

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2)

### Support Channels

- Vercel Support: support@vercel.com
- Railway Discord: discord.gg/railway
- Internal Team: devops@madfam.io

## Appendix: Scripts

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "Checking services..."

# Check Vercel
curl -I https://madfam.io || echo "Main site down"

# Check Railway CMS
curl -I https://cms.madfam.railway.app/api/health || echo "CMS down"

# Check database
psql $DATABASE_URL -c "SELECT 1" || echo "Database down"

echo "Health check complete"
```

### Backup Script

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d)

# Backup databases
pg_dump $VERCEL_DATABASE_URL > backup_web_$DATE.sql
pg_dump $RAILWAY_DATABASE_URL > backup_cms_$DATE.sql

# Upload to R2
aws s3 cp backup_web_$DATE.sql s3://madfam-backups/
aws s3 cp backup_cms_$DATE.sql s3://madfam-backups/

echo "Backup complete: $DATE"
```

---

_Last Updated: November 2024_
_Version: 1.0.0_
