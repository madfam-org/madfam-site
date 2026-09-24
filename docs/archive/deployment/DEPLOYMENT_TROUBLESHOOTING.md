> **ARCHIVED — historical record, not current guidance** (banner added 2026-09-23).
> Names, hosts, products and procedures below may be retired — e.g. PENNY, SPARK,
> penny.onl, forgesight.quest, and Vercel / Railway / GitHub Pages hosting. Current
> sources: [`AGENTS.md`](/AGENTS.md), [`ECOSYSTEM.md`](/ECOSYSTEM.md) and
> [`docs/deployment/DEPLOYMENT.md`](/docs/deployment/DEPLOYMENT.md).

<!-- Boundary checkpoint (public-safe, 2026-09-04, madfam-site): deployment troubleshooting shape only. No credentials, cluster identifiers or provider account detail; the private sink is internal-devops. Policy: internal-devops/docs/repo-boundary-contract.md -->

# Deployment Troubleshooting Guide

## Overview

This guide helps troubleshoot common deployment issues for both GitHub Pages (staging) and Vercel (production) deployments.

## GitHub Pages Deployment Issues

### Issue: Site Shows 404 Error

**Symptoms:**

- GitHub Pages deployment succeeds but site shows 404
- URL shows repository name in path when it shouldn't

**Solutions:**

1. **Check basePath Configuration**

   - If using custom domain (e.g., staging.madfam.io), ensure `basePath: ''` in next.config.js
   - If using GitHub Pages default URL (username.github.io/repo-name), ensure `basePath: '/repo-name'`

2. **Verify Static Export**

   ```bash
   cd apps/web
   DEPLOY_TARGET=github-pages pnpm build:staging
   # Check if 'out' directory exists
   ls -la out/
   ```

3. **Check GitHub Pages Settings**
   - Go to Repository Settings → Pages
   - Ensure source is set to "Deploy from a branch"
   - Branch should be `gh-pages`
   - Folder should be `/ (root)`

### Issue: Build Fails During Static Export

**Symptoms:**

- Error: "Cannot export a server-side rendered page"
- Build fails with dynamic route errors

**Solutions:**

1. **Check for Server-Side Features**

   - Remove or conditionally disable `getServerSideProps`
   - Replace with `getStaticProps` for static data
   - For dynamic routes, implement `getStaticPaths`

2. **Environment Variables**
   - Ensure all `NEXT_PUBLIC_*` variables are set in GitHub Secrets
   - Check workflow file for proper environment variable passing

### Issue: Assets Not Loading

**Symptoms:**

- CSS/JS files return 404
- Images don't load
- Console shows path errors

**Solutions:**

1. **Check Asset Paths**

   - Ensure no hardcoded absolute paths
   - Use Next.js `Image` component for images
   - Check `assetPrefix` in next.config.js matches `basePath`

2. **Verify .nojekyll File**
   ```bash
   # In deploy-staging.yml, ensure this line exists:
   touch out/.nojekyll
   ```

## Vercel Deployment Issues

### Issue: "No Next.js version detected"

**Symptoms:**

- Vercel can't find Next.js in dependencies
- Build fails immediately

**Solutions:**

1. **Set Root Directory in Vercel Dashboard**

   - Go to Project Settings → General
   - Set Root Directory to `apps/web`
   - Clear build cache and redeploy

2. **Remove Root vercel.json** _(historical — Vercel was retired 2026-09-04 and
   the file no longer exists in this repo; kept for context on old branches)_
   - Root-level vercel.json can interfere with monorepo detection
   - Keep only app-level vercel.json if needed

### Issue: Build Command Fails

**Symptoms:**

- "Command not found" errors
- Package manager issues
- Monorepo packages not found

**Solutions:**

1. **Check Build Settings**

   - Framework Preset: Next.js (should auto-detect)
   - Build Command: (leave empty for auto-detection)
   - Output Directory: (leave empty for auto-detection)

2. **Verify Package Manager**

   ```json
   // In root package.json
   "packageManager": "pnpm@8.14.1"
   ```

3. **Check Turborepo Configuration**
   ```json
   // In turbo.json
   "pipeline": {
     "build": {
       "outputs": [".next/**", "!.next/cache/**"]
     }
   }
   ```

### Issue: Environment Variables Not Working

**Symptoms:**

- Features missing in production
- API calls failing
- Undefined environment variables

**Solutions:**

1. **Check Variable Names**

   - Client-side variables must start with `NEXT_PUBLIC_`
   - Server-side variables don't need prefix

2. **Verify in Vercel Dashboard**
   - Go to Settings → Environment Variables
   - Ensure all required variables are set
   - Check correct environment (Production/Preview/Development)

## Common Issues for Both Platforms

### Issue: Dependencies Not Found

**Symptoms:**

- "Module not found" errors
- Package resolution failures

**Solutions:**

1. **Check Workspace Configuration**

   ```yaml
   # pnpm-workspace.yaml
   packages:
     - 'apps/*'
     - 'packages/*'
   ```

2. **Verify Package Names**

   ```json
   // In apps/web/package.json
   "dependencies": {
     "@madfam/ui": "workspace:*"
   }
   ```

3. **Clear Cache and Reinstall**
   ```bash
   pnpm clean
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```

### Issue: Type Errors During Build

**Symptoms:**

- TypeScript compilation errors
- Type definition conflicts

**Solutions:**

1. **Run Type Check Locally**

   ```bash
   pnpm typecheck
   ```

2. **Check tsconfig.json**
   - Ensure proper extends and references
   - Verify path mappings

### Issue: Test Failures Blocking Deployment

**Symptoms:**

- CI pipeline fails at test stage
- Deployment never triggered

**Solutions:**

1. **Run Tests Locally**

   ```bash
   pnpm test
   ```

2. **Skip Tests Temporarily** (Not Recommended)
   ```yaml
   # In workflow file
   run: pnpm test || echo "Tests skipped"
   ```

## Debugging Commands

### Local Build Testing

```bash
# Test staging build
cd apps/web
DEPLOY_TARGET=github-pages NEXT_PUBLIC_ENV=staging pnpm build:staging
npx serve out

# Test production build
NEXT_PUBLIC_ENV=production pnpm build:production
pnpm start
```

### Check Deployment Status

```bash
# GitHub Pages
curl -I https://staging.madfam.io

# Check GitHub Actions
gh workflow view deploy-staging.yml
gh run list --workflow=deploy-staging.yml

# Vercel
vercel list
vercel inspect [deployment-url]
```

### Environment Debugging

```bash
# Print all environment variables (be careful with secrets!)
env | grep NEXT_PUBLIC

# Check which environment is active
echo $NEXT_PUBLIC_ENV
```

## Emergency Procedures

### Rollback GitHub Pages

```bash
# Revert to previous deployment
git checkout gh-pages
git reset --hard HEAD~1
git push --force origin gh-pages
```

### Rollback Vercel

1. Via Dashboard: Click "Instant Rollback"
2. Via CLI: `vercel rollback`

## Getting Help

1. **Check Logs**

   - GitHub Actions: Actions tab → workflow run → job logs
   - Vercel: Dashboard → Functions tab → Logs

2. **Enable Debug Mode**

   ```bash
   # For Next.js debugging
   DEBUG=* pnpm build
   ```

3. **Community Resources**
   - [Next.js GitHub Discussions](https://github.com/vercel/next.js/discussions)
   - [Vercel Support](https://vercel.com/support)
   - [GitHub Pages Documentation](https://docs.github.com/en/pages)

## Checklist Before Deployment

- [ ] All environment variables configured
- [ ] Tests passing locally
- [ ] Build succeeds locally
- [ ] No hardcoded URLs or secrets
- [ ] Proper error handling for missing env vars
- [ ] Assets properly configured for deployment target
- [ ] Database migrations run (if applicable)
