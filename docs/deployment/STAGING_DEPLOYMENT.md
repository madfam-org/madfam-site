# Staging Deployment (GitHub Pages)

This document explains the staging deployment setup for GitHub Pages.

## Overview

The staging environment is deployed to GitHub Pages as a static site with limited functionality. This is useful for:

- Preview of UI/UX changes
- Content review
- Design validation
- Client demos

## Limitations

Since GitHub Pages only supports static sites, the following features are **NOT available** in staging:

1. **API Routes**: No backend functionality
2. **Authentication**: Login/logout disabled
3. **Database Operations**: No data persistence
4. **Form Submissions**: Forms show success but don't save data
5. **Dynamic Content**: All content is static

## How It Works

The staging build process:

1. **Removes API routes** temporarily during build
2. **Uses static configuration** without rewrites/headers
3. **Mocks form submissions** to show success messages
4. **Disables authentication** components
5. **Swaps dynamic pages** with static versions

## Staging-Specific Behaviors

### Lead Forms

- Forms appear to work but don't submit data
- Success messages are shown for demo purposes
- Console logs the form data for debugging

### Authentication

- Login page shows but doesn't authenticate
- Dashboard displays demo data
- Protected routes are accessible without login

### API Calls

- All API calls are intercepted and mocked
- Static demo data is shown

## Build Process

The staging build uses a custom script that:

```bash
# Run from apps/web directory
pnpm build:staging
```

This script:

1. Backs up original files
2. Removes `/api` directory
3. Uses `next.config.staging.js`
4. Builds with `output: 'export'`
5. Restores original files

## Deployment

Staging deployment is triggered by:

- Push to `main` branch (temporary)
- Push to `staging` branch
- Pull requests to `main`

The GitHub Action:

1. Runs the staging build
2. Deploys to GitHub Pages
3. Available at: https://madfam-org.github.io/biz-site/

## Environment Detection

Components can detect staging environment using:

```typescript
if (process.env.NEXT_PUBLIC_ENV === 'staging') {
  // Staging-specific behavior
}
```

## Testing Staging Locally

To test the staging build locally:

```bash
cd apps/web
pnpm build:staging
npx serve out -p 3001
```

Then visit: http://localhost:3001/biz-site

## Important Notes

- **DO NOT** use staging for functionality testing
- **DO NOT** expect forms to save data
- **DO NOT** test authentication flows
- **DO** use for visual/content review
- **DO** use for client previews
- **DO** test responsive design

## Troubleshooting

### Build Fails

- Check if new API routes were added
- Ensure no dynamic imports of API code
- Verify no server-side only dependencies

### 404 Errors

- Check basePath configuration (/biz-site)
- Ensure trailing slashes are consistent
- Verify GitHub Pages is enabled

### Missing Features

- This is expected - staging has limited functionality
- Use Vercel preview deployments for full features
