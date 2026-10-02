# API Documentation

## Overview

The MADFAM website API provides endpoints for lead capture, search, email opt-out and deploy health. All API routes are Next.js route handlers in `apps/web/app/api/`.

> The endpoint list below was checked against `apps/web/app/api/` on 2026-10-02. The base configuration, request format, rate-limit and environment sections are older and are due for review in batch S14 (public repo docs).

## Base Configuration

- **Development**: `http://localhost:3000/api`
- **Staging**: `https://staging.madfam.io/api`
- **Production**: `https://madfam.io/api`

## Available Endpoints

### 📧 Lead Management

**POST** `/api/leads`

- Captures leads from the contact form

**GET** `/api/leads`

- Lists leads; requires `Authorization: Bearer <API_SECRET>`

**POST** `/api/leads/demo`

- Demo-request leads for the removed demo pages; no longer called by the site

### 🔎 Search

**GET** `/api/search`

- Site search; query `q` (2–200 characters) and `locale` (`es`, `en` or `pt`)

### ✉️ Unsubscribe

**POST** `/api/unsubscribe`

- Records an email opt-out

### 🚩 Feature Flags

**GET** `/api/feature-flags`

- Retrieve active feature flags
- Controls feature visibility

### 📝 Logging

**POST** `/api/logs`

- Client log intake (**GET** returns a health stub)

### 🔗 Webhooks

**POST** `/api/webhook/n8n`

- N8N workflow integration (**GET** is an authenticated health check)

**POST** `/api/webhook/cms`

- CMS cache invalidation; nothing sends to it since the CMS was retired (R52)

### 🩺 Health and version

**GET** `/api/health` - Readiness; downstream services are informational and report `unknown` when unset

**GET** `/api/health/live` - Liveness (process only); used by the Kubernetes liveness and startup probes

**GET** `/api/version` - `{ "sha", "buildTime" }` of the deployed build; the Deploy Web verify job waits for it to serve the new commit

## Request/Response Format

All endpoints use JSON format:

### Request Headers

```http
Content-Type: application/json
Authorization: Bearer {API_SECRET} (if required)
```

### Standard Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per API key

## Security

- All endpoints use HTTPS in production
- Input validation with Zod schemas
- CORS configured for allowed origins
- CSP headers enforced

## Examples

### Create Lead

```bash
curl -X POST https://madfam.io/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "tier": "consulting"
  }'
```

### Get Feature Flags

```bash
curl https://madfam.io/api/feature-flags
```

## Error Codes

| Code | Description                             |
| ---- | --------------------------------------- |
| 400  | Bad Request - Invalid input             |
| 401  | Unauthorized - Missing/invalid token    |
| 404  | Not Found - Resource doesn't exist      |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error                   |

## Environment Variables

Required for API functionality:

```env
API_SECRET=your-secret-key
DATABASE_URL=postgresql://...
N8N_WEBHOOK_URL=https://...
NEXT_PUBLIC_API_URL=https://...
```

---

Last Updated: 2026-10-02 (endpoint list)
