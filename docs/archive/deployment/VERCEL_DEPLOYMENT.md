> **ARCHIVED — historical record, not current guidance** (banner added 2026-09-23).
> Names, hosts, products and procedures below may be retired — e.g. PENNY, SPARK,
> penny.onl, forgesight.quest, and Vercel / Railway / GitHub Pages hosting. Current
> sources: [`AGENTS.md`](/AGENTS.md), [`ECOSYSTEM.md`](/ECOSYSTEM.md) and
> [`docs/deployment/DEPLOYMENT.md`](/docs/deployment/DEPLOYMENT.md).

# ARCHIVED: This document is historical. Production now runs on Enclii/K8s.

> **Warning**: The Vercel deployment configuration described below is no longer the active deployment strategy. MADFAM has completely migrated off Vercel onto Enclii (owner confirmation, 2026-09-04); `vercel.json`, `vercel-minimal.json` and `.vercelignore` were deleted from this repository on that date. This document is retained for historical reference only. See `docs/deployment/DEPLOYMENT.md` and `docs/infrastructure/INFRASTRUCTURE_REQUIREMENTS.md` for current deployment information.

> **Boundary checkpoint (2026-09-04, madfam-site):** public-safe historical document. No credentials, project identifiers or provider account detail belong here; the private sink is `internal-devops`. Policy: `internal-devops/docs/repo-boundary-contract.md`.

---

# Vercel Deployment Configuration

This monorepo requires specific configuration for successful Vercel deployment.

## Issue: "No Next.js version detected"

This error occurs because Vercel looks for Next.js in the root `package.json`, but in our monorepo structure, Next.js is installed in `apps/web/package.json`.

## Solution (Verified Working Approach)

### Configure Root Directory in Vercel Dashboard

1. Go to your Vercel project settings
2. Under "General" → "Root Directory", click "Edit"
3. Set the value to `apps/web`
4. Save the changes
5. Trigger a new deployment

This tells Vercel to treat `apps/web` as the root of your Next.js application, allowing it to properly detect Next.js from the correct package.json file.

**Important**: Do not use a root-level vercel.json file as it can interfere with Vercel's auto-detection in monorepo setups.

### Why This Works

- Vercel will look for package.json in the specified root directory (`apps/web`)
- It will properly detect Next.js as a dependency
- The build process will use the monorepo's root for installing dependencies
- Turborepo will handle the build orchestration automatically

## Deployment Steps

1. **For new Vercel projects:**

   - Import your Git repository
   - When prompted, set Root Directory to `apps/web`
   - Vercel will auto-detect Next.js framework
   - Leave all other settings as default
   - Deploy

2. **For existing Vercel projects:**
   - Go to Project Settings → General
   - Update Root Directory to `apps/web`
   - Ensure Framework Preset shows "Next.js" (should auto-detect)
   - Clear build cache if needed (Settings → Advanced → Delete Build Cache)
   - Trigger a new deployment

## Monorepo Structure

```
biz-site/
├── apps/
│   └── web/              # Next.js application
│       ├── package.json  # Contains "next" dependency
│       └── vercel.json   # Optional app-specific config
├── packages/            # Shared packages
├── services/           # Backend services
├── package.json        # Root package.json with workspaces
├── pnpm-workspace.yaml # PNPM workspace configuration
├── turbo.json         # Turborepo configuration
└── vercel.json        # Root Vercel configuration
```

## Environment Variables

Ensure all required environment variables are set in Vercel:

- `NEXT_PUBLIC_ENV`
- `NEXT_PUBLIC_API_URL`
- `DATABASE_URL`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`

## Troubleshooting

If deployment still fails:

1. **Verify Next.js is listed in dependencies:**

   ```bash
   cat apps/web/package.json | grep next
   ```

2. **Check Framework Preset in Vercel:**

   - Go to Settings → General → Build & Development Settings
   - Ensure Framework Preset is set to "Next.js" not "Other"
   - If it shows "Other", manually select "Next.js"

3. **Clear Vercel cache:**

   - In Vercel Dashboard → Settings → Advanced → Delete Build Cache
   - This forces a fresh build

4. **Verify Root Directory:**

   - Ensure Root Directory is exactly `apps/web` (no leading or trailing slashes)
   - The directory path is case-sensitive

5. **Check pnpm version:**

   - Root `package.json` specifies `"packageManager": "pnpm@8.14.1"`
   - Vercel should use this version automatically

6. **Common Mistakes to Avoid:**
   - Don't use a root-level vercel.json with monorepos
   - Don't add Next.js to root package.json (unnecessary)
   - Don't use relative paths in Root Directory setting

## Additional Resources

- [Vercel Monorepo Documentation](https://vercel.com/docs/monorepos)
- [Deploying Turborepo to Vercel](https://vercel.com/docs/monorepos/turborepo)
