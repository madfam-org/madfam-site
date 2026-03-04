# MADFAM CMS

Content Management System powered by Payload CMS v2 for the MADFAM corporate website.

## Features

- **Content Collections**:
  - Transformation Programs
  - Products (Enclii, Janua, Dhanam, Forge Sight, etc.)
  - Case Studies
  - Blog Posts
  - Resources
  - Team Members
  - Testimonials
  - Media

- **Multilingual Support**: Spanish (es-MX) and English (en-US)
- **User Management**: Admin and Editor roles
- **SEO Optimization**: Meta tags and structured data
- **Media Management**: Upload and organize images/documents

## Setup

1. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

2. Configure environment variables:
   - `PAYLOAD_SECRET`: Generate a secure random string
   - `DATABASE_URL`: Use the same PostgreSQL database as the web app
   - `PAYLOAD_PUBLIC_SERVER_URL`: Set to your CMS URL

3. Install dependencies:

   ```bash
   pnpm install
   ```

4. Run database migrations (from web app):

   ```bash
   cd ../web && pnpm prisma:migrate
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

## Development

- **Dev Server**: `pnpm dev` - Starts on port 3001 with auto-reload
- **Build**: `pnpm build` - Creates production build
- **Start**: `pnpm start` - Runs production server
- **Lint**: `pnpm lint` - Check code quality
- **Type Check**: `pnpm typecheck` - Verify TypeScript types

## Access

- Admin Panel: http://localhost:3001/admin
- API: http://localhost:3001/api

## Authentication

The CMS uses the same user database as the main web application. Users with `ADMIN` role have full access, while `EDITOR` role has limited permissions.

## Collections

### Services

- Manage L1-L5 service tiers
- Multilingual content
- Feature lists and pricing

### Products

- Enclii, Janua, Dhanam, Forge Sight, and other products
- Features, pricing, and benefits
- Related case studies

### Case Studies

- Client success stories
- Project details and outcomes
- Related services and products

### Blog Posts

- Articles and insights
- Categories and tags
- Author attribution

### Resources

- Whitepapers, guides, templates
- Downloadable content
- Access control

### Team Members

- Staff profiles
- Roles and expertise
- Social links

### Testimonials

- Client feedback
- Featured testimonials
- Service associations

## API Usage

The CMS provides REST and GraphQL APIs:

```typescript
// REST API
fetch('http://localhost:3001/api/services')
  .then(res => res.json())
  .then(data => console.log(data));

// GraphQL
const query = `
  query {
    Services {
      docs {
        title
        tier
        features
      }
    }
  }
`;
```

## Deployment

1. Build the application:

   ```bash
   pnpm build
   ```

2. Set production environment variables

3. Start the production server:
   ```bash
   pnpm start
   ```

## Security

- Enable CORS for specific origins only
- Use strong `PAYLOAD_SECRET`
- Implement rate limiting in production
- Regular security updates

## Troubleshooting

- **Build errors**: Ensure all dependencies are installed
- **Database connection**: Verify DATABASE_URL is correct
- **Port conflicts**: Change PORT in .env if 3001 is in use
- **TypeScript errors**: Run `pnpm typecheck` to identify issues
