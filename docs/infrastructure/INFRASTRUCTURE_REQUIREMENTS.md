# Infrastructure Requirements

## Executive Summary

The MADFAM corporate website requires a hybrid infrastructure approach. **Vercel alone is NOT sufficient** for 100% functionality. The recommended architecture is **Vercel + Railway**, with optional **Cloudflare R2** for scalable media storage.

## Current Infrastructure Analysis

### Components Requiring Infrastructure

| Component        | Current Implementation   | Infrastructure Need  | Vercel Compatible        |
| ---------------- | ------------------------ | -------------------- | ------------------------ |
| Main Next.js App | App Router, SSR/SSG      | Edge runtime         | ✅ Yes                   |
| Database (Web)   | Prisma + SQLite/Postgres | Managed PostgreSQL   | ✅ Yes (Vercel Postgres) |
| API Routes       | Next.js API Routes       | Serverless functions | ✅ Yes                   |
| Payload CMS      | Node.js server           | Persistent server    | ❌ No                    |
| CMS Database     | PostgreSQL               | Managed PostgreSQL   | ❌ No (needs separate)   |
| Email Queue      | setInterval (30s)        | Background worker    | ❌ No                    |
| Media Storage    | Local filesystem         | Object storage       | ❌ No                    |
| Webhooks         | N8N integration          | API endpoint         | ✅ Yes                   |
| Analytics        | Plausible                | External service     | ✅ Yes                   |

## Infrastructure Compatibility Matrix

### Vercel Capabilities

#### ✅ Fully Compatible

- Next.js 14 App Router
- API Routes (serverless)
- Edge Middleware
- ISR/SSG/SSR
- Vercel Postgres
- Environment variables
- Custom domains
- SSL certificates
- Global CDN
- Image optimization

#### ⚠️ Partially Compatible

- Cron jobs (limited to 1/hour on hobby)
- File uploads (temporary only)
- Long-running processes (10s limit)

#### ❌ Not Compatible

- Persistent Node.js servers
- Background workers
- Local file storage
- WebSocket servers
- Custom Docker containers

## Recommended Architecture

### Option 0: Kubernetes (Self-Hosted) — Current

The project now includes production-ready Kubernetes manifests under `k8s/production/` with CI/CD pipelines for automated container builds and deployment.

```yaml
Infrastructure:
  Kubernetes Cluster:
    - madfam-web: Next.js app (Deployment + ClusterIP Service)
    - madfam-cms: Payload CMS (Deployment + ClusterIP Service)
    - Network Policies: default-deny, Cloudflare ingress, DB egress, DNS, HTTPS
    - Resource Quotas: 500m–1.5 CPU, 1–2Gi memory, 10 pods max

  External Services:
    - PostgreSQL: Accessed via data namespace (ports 5432/6432)
    - Cloudflare Tunnel: Ingress to cluster
    - GHCR: Container image registry (ghcr.io/madfam-org/madfam-site)
    - Cosign: Image signing for supply-chain security

  CI/CD:
    - deploy-web.yml: Build → Push → Sign → Update kustomization digest
    - deploy-cms.yml: Build → Push → Sign → Update kustomization digest
    - GitOps: kustomization.yaml updated automatically with image digests
```

**Security**: Non-root (UID 1001), read-only rootfs, seccomp, all caps dropped, network segmentation.

See `docs/deployment/DEPLOYMENT.md` for setup instructions.

### Option 1: Vercel + Railway

```yaml
Infrastructure Split:
  Vercel:
    - Main Next.js application (apps/web)
    - API routes and webhooks
    - Database (Vercel Postgres)
    - Edge functions
    - Global CDN

  Railway:
    - Payload CMS (apps/cms)
    - CMS PostgreSQL database
    - Background job processor
    - Email queue worker
    - Media file storage
```

**Monthly Cost**: ~$30-40

- Vercel Pro: $20/month
- Railway: $10-20/month

### Option 2: Vercel + Railway + Cloudflare R2

```yaml
Infrastructure Split:
  Vercel:
    - Main Next.js application
    - API routes
    - Database (Vercel Postgres)

  Railway:
    - Payload CMS
    - Background workers
    - Email processor

  Cloudflare R2:
    - Media storage (S3-compatible)
    - CDN for assets
    - Backup storage
```

**Monthly Cost**: ~$35-45

- Vercel Pro: $20/month
- Railway: $10/month
- Cloudflare R2: $5-15/month (usage-based)

## Component-Specific Requirements

### 1. Database Infrastructure

**Current Setup**:

- Development: SQLite (`file:./dev.db`)
- Production: PostgreSQL

**Required Changes**:

```bash
# Main App (Vercel)
DATABASE_URL="postgres://[user]:[pass]@[host]/[db]?sslmode=require"

# CMS (Railway)
CMS_DATABASE_URL="postgresql://[user]:[pass]@[host]/[db]"
```

### 2. Email Queue Processing

**Current Implementation**:

```typescript
// Uses setInterval - not compatible with serverless
setInterval(() => {
  this.processQueue();
}, 30000);
```

**Required Migration**:

Option A - Railway Worker:

```typescript
// Deploy as separate service on Railway
// apps/workers/email-processor.ts
export class EmailWorker {
  async run() {
    while (true) {
      await processEmails();
      await sleep(30000);
    }
  }
}
```

Option B - Vercel Cron:

```typescript
// app/api/cron/emails/route.ts
export async function GET() {
  await processEmails();
  return Response.json({ processed: true });
}

// vercel.json
{
  "crons": [{
    "path": "/api/cron/emails",
    "schedule": "*/5 * * * *"
  }]
}
```

### 3. Payload CMS

**Requirements**:

- Persistent Node.js server
- PostgreSQL database
- File upload handling
- Admin UI hosting

**Railway Configuration**:

```toml
# railway.toml
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
```

### 4. Media Storage

**Current**: Local filesystem (`/media`)

**Migration to Cloudflare R2**:

```typescript
// payload.config.ts
import { cloudStorage } from '@payloadcms/plugin-cloud-storage';
import { s3Adapter } from '@payloadcms/plugin-cloud-storage-s3';

export default buildConfig({
  plugins: [
    cloudStorage({
      collections: {
        media: {
          adapter: s3Adapter({
            config: {
              endpoint: process.env.R2_ENDPOINT,
              region: 'auto',
              credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
              },
            },
            bucket: process.env.R2_BUCKET,
          }),
        },
      },
    }),
  ],
});
```

## Migration Strategy

### Phase 1: Core Infrastructure (Week 1)

1. Set up Vercel project for main app
2. Configure Vercel Postgres
3. Deploy Railway CMS instance
4. Set up Railway PostgreSQL

### Phase 2: Background Jobs (Week 2)

1. Refactor email queue for Railway
2. Deploy worker services
3. Test webhook integrations
4. Verify job processing

### Phase 3: Media Storage (Week 3)

1. Set up Cloudflare R2 bucket
2. Configure S3-compatible adapter
3. Migrate existing media
4. Update CDN configuration

### Phase 4: Testing & Optimization (Week 4)

1. Load testing
2. Performance optimization
3. Backup verification
4. Documentation update

## Environment Variables

### Vercel Environment

```bash
# Database
DATABASE_URL=postgres://...

# CMS Integration
NEXT_PUBLIC_CMS_URL=https://cms.railway.app
CMS_API_KEY=...

# Email Service
RESEND_API_KEY=...

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=madfam.io

# Webhooks
N8N_API_KEY=...
```

### Railway Environment

```bash
# Database
DATABASE_URL=postgresql://...

# Storage (if using R2)
R2_ENDPOINT=https://...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET=madfam-media

# Payload Config
PAYLOAD_SECRET=...
PAYLOAD_PUBLIC_SERVER_URL=https://cms.railway.app
```

## Performance Considerations

### Vercel Optimization

- Use ISR for dynamic content
- Implement proper caching headers
- Optimize images with next/image
- Use Edge Runtime where possible

### Railway Optimization

- Use connection pooling for database
- Implement Redis for caching (optional)
- Set up health checks
- Configure auto-scaling

### Cloudflare R2 Optimization

- Enable CDN caching
- Set proper cache headers
- Use lifecycle policies
- Implement backup strategy

## Security Requirements

### Network Security

- All services use HTTPS
- Database connections use SSL
- API keys stored in environment variables
- Implement rate limiting

### Access Control

- Vercel: Team-based access
- Railway: Project-based permissions
- Cloudflare: IAM policies
- CMS: Role-based access

## Monitoring & Observability

### Recommended Tools

- Vercel Analytics (built-in)
- Railway Metrics (built-in)
- Plausible Analytics (privacy-first)
- Sentry for error tracking (optional)

### Key Metrics

- Response times
- Error rates
- Database performance
- Worker job completion
- Storage usage

## Disaster Recovery

### Backup Strategy

1. Database: Daily automated backups
2. Media: R2 versioning enabled
3. Code: Git repository
4. Configuration: Environment variable backup

### Recovery Time Objectives

- RTO: 2 hours
- RPO: 24 hours
- Backup retention: 30 days

## Cost Optimization

### Current Estimated Costs

- Vercel Pro: $20/month
- Railway: $10-20/month
- Cloudflare R2: $5-15/month
- **Total**: $35-55/month

### Cost Saving Opportunities

1. Use Vercel hobby for staging
2. Optimize Railway resource allocation
3. Implement aggressive caching
4. Clean up unused media regularly

## Next Steps

1. **Immediate**: Set up Vercel and Railway projects
2. **Week 1**: Migrate core infrastructure
3. **Week 2**: Implement background workers
4. **Week 3**: Configure media storage
5. **Week 4**: Complete testing and optimization

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2)
- [Payload CMS Documentation](https://payloadcms.com/docs)

---

_Last Updated: November 2024_
_Version: 1.0.0_
