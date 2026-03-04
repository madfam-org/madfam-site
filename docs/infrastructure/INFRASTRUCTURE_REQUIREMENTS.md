# Infrastructure Requirements

## Executive Summary

The MADFAM corporate website runs on **Enclii/Kubernetes** for production deployments. Vercel serves as a preview/fallback option for serverless deployments, and **Cloudflare R2** provides scalable media storage.

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

### Option 1: Vercel (Preview/Fallback)

```yaml
Infrastructure Split:
  Vercel:
    - Main Next.js application (apps/web)
    - API routes and webhooks
    - Database (Vercel Postgres)
    - Edge functions
    - Global CDN
    - Preview deployments for PRs
```

**Use Case**: Preview deployments, fallback if K8s is unavailable.

### Option 2: Kubernetes + Cloudflare R2

```yaml
Infrastructure Split:
  Kubernetes (via Enclii):
    - Main Next.js application
    - Payload CMS
    - Background workers
    - Email processor

  Cloudflare R2:
    - Media storage (S3-compatible)
    - CDN for assets
    - Backup storage
```

**Monthly Cost**: Variable based on cluster size + $5-15/month (Cloudflare R2, usage-based)

## Component-Specific Requirements

### 1. Database Infrastructure

**Current Setup**:

- Development: SQLite (`file:./dev.db`)
- Production: PostgreSQL

**Required Changes**:

```bash
# Main App (Vercel)
DATABASE_URL="postgres://[user]:[pass]@[host]/[db]?sslmode=require"

# CMS (Kubernetes)
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

Option A - Kubernetes CronJob/Worker:

```typescript
// Deploy as separate Deployment in K8s
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

Option B - Vercel Cron (fallback):

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

**Kubernetes Deployment (via Dockerfile)**:

The CMS is containerized and deployed to Kubernetes using the Dockerfile at `apps/cms/Dockerfile`. See `k8s/production/madfam-cms-deployment.yaml` for the K8s manifest.

```bash
# Build and push CMS image
docker build -t ghcr.io/madfam-org/madfam-site/cms:latest -f apps/cms/Dockerfile .
docker push ghcr.io/madfam-org/madfam-site/cms:latest

# Deploy to K8s
kubectl apply -k k8s/production/
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

1. Set up Enclii/K8s cluster for production
2. Configure PostgreSQL (external or in-cluster)
3. Deploy CMS via Dockerfile + K8s manifests
4. Configure Vercel for preview deployments

### Phase 2: Background Jobs (Week 2)

1. Refactor email queue as K8s Deployment/CronJob
2. Deploy worker services to cluster
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
NEXT_PUBLIC_CMS_URL=https://cms.madfam.io
CMS_API_KEY=...

# Email Service
RESEND_API_KEY=...

# Analytics
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=madfam.io

# Webhooks
N8N_API_KEY=...
```

### Kubernetes Environment (via Secrets)

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
PAYLOAD_PUBLIC_SERVER_URL=https://cms.madfam.io
```

See `k8s/production/secrets-template.yaml` for the full list of required secrets.

## Performance Considerations

### Vercel Optimization

- Use ISR for dynamic content
- Implement proper caching headers
- Optimize images with next/image
- Use Edge Runtime where possible

### Kubernetes Optimization

- Use connection pooling for database
- Implement Redis for caching (optional)
- Set up health checks and liveness/readiness probes
- Configure Horizontal Pod Autoscaler (HPA)

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

- Vercel: Team-based access (preview/fallback)
- Kubernetes: RBAC and namespace isolation
- Cloudflare: IAM policies
- CMS: Role-based access

## Monitoring & Observability

### Recommended Tools

- Vercel Analytics (built-in)
- Kubernetes metrics (Prometheus/Grafana)
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

- Kubernetes (via Enclii): Variable based on cluster size
- Vercel (preview/fallback): $0-20/month
- Cloudflare R2: $5-15/month
- **Total**: Variable

### Cost Saving Opportunities

1. Use Vercel hobby for preview deployments only
2. Optimize Kubernetes resource requests/limits
3. Implement aggressive caching
4. Clean up unused media regularly

## Next Steps

1. **Immediate**: Verify Enclii/K8s cluster and Vercel preview config
2. **Week 1**: Validate core infrastructure on Kubernetes
3. **Week 2**: Implement background workers as K8s workloads
4. **Week 3**: Configure media storage (Cloudflare R2)
5. **Week 4**: Complete testing and optimization

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2)
- [Payload CMS Documentation](https://payloadcms.com/docs)

---

_Last Updated: November 2024_
_Version: 1.0.0_
