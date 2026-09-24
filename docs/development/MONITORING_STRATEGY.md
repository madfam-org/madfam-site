# Monitoring & Observability Strategy

## Overview

Implement comprehensive monitoring for production excellence

## 1. Error Tracking & Monitoring

### Sentry Integration (Recommended)

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter out sensitive data
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});

export { Sentry };
```

### Error Boundary Implementation

```typescript
// components/ErrorBoundary.tsx
'use client'

import { ErrorBoundary as SentryErrorBoundary } from '@sentry/nextjs'

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <SentryErrorBoundary fallback={({ error, resetError }) => (
      <div className="error-fallback">
        <h2>Something went wrong</h2>
        <button onClick={resetError}>Try again</button>
      </div>
    )}>
      {children}
    </SentryErrorBoundary>
  )
}
```

## 2. Performance Monitoring

### Web Vitals Tracking

```typescript
// lib/web-vitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function trackWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

function sendToAnalytics(metric: any) {
  // Send to Plausible (self-hosted) or a custom endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body: JSON.stringify(metric),
    });
  }
}
```

### Bundle Analysis

```javascript
// next.config.js enhancement
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // existing config...
  experimental: {
    instrumentationHook: true,
  },
});
```

## 3. Application Monitoring

### Health Check Endpoint

```typescript
// app/api/health/route.ts
import { prisma } from '@/lib/prisma';

export async function GET() {
  const checks = {
    database: false,
    cache: false,
    external_apis: false,
    timestamp: new Date().toISOString(),
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;

    // External API checks
    // Add your external service checks here

    const status = Object.values(checks).every(v => v === true || typeof v === 'string')
      ? 'healthy'
      : 'degraded';

    return Response.json(
      {
        status,
        checks,
      },
      {
        status: status === 'healthy' ? 200 : 503,
      }
    );
  } catch (error) {
    return Response.json(
      {
        status: 'unhealthy',
        checks,
        error: error.message,
      },
      { status: 503 }
    );
  }
}
```

### Structured Logging

```typescript
// lib/logger.ts enhancement
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: label => ({ level: label.toUpperCase() }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV === 'production' ? {} : { transport: { target: 'pino-pretty' } }),
});

export default logger;

// Usage with correlation IDs
export function withCorrelationId(req: Request) {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID();
  return logger.child({ correlationId });
}
```

## 4. Business Metrics

### Lead Conversion Tracking

```typescript
// lib/metrics.ts
export class BusinessMetrics {
  static async trackLeadConversion(leadData: any) {
    const metric = {
      type: 'lead_conversion',
      source: leadData.source,
      timestamp: new Date(),
      metadata: {
        service: leadData.interestedService,
        companySize: leadData.companySize,
      },
    };

    await Promise.allSettled([
      // Send to analytics
      fetch('/api/analytics/events', {
        method: 'POST',
        body: JSON.stringify(metric),
      }),
      // Log for internal tracking
      logger.info(metric, 'Lead conversion tracked'),
    ]);
  }

  static async trackFormAbandonment(formName: string, step: string) {
    // Track where users drop off in forms
  }

  static async trackPagePerformance(route: string, metrics: any) {
    // Track page-specific performance
  }
}
```

## 5. Alerting Strategy

### Alert Conditions

- Error rate > 5% (15min window)
- Response time > 2s (5min window)
- Database connection failures
- Failed deployments
- Security events (failed auth attempts)

### Alert Channels

- Slack #alerts channel
- Email for critical issues
- PagerDuty for production incidents

## Implementation Timeline

### Week 1

- [ ] Set up Sentry error tracking
- [ ] Implement health check endpoint
- [ ] Add structured logging
- [ ] Create error boundaries

### Week 2

- [ ] Add Web Vitals tracking
- [ ] Set up bundle analysis
- [ ] Implement business metrics
- [ ] Configure alerting

### Week 3

- [ ] Create monitoring dashboard
- [ ] Set up automated reports
- [ ] Add performance budgets
- [ ] Training team on monitoring tools

## Tools Stack

- **Error Tracking**: Sentry
- **Performance**: Plausible + custom Web Vitals
- **Uptime**: Better Uptime or Pingdom
- **Logs**: Structured logging with Pino
- **Dashboard**: Custom dashboard + Grafana (optional)
- **Alerts**: Slack integration + email
