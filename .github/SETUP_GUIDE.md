# GitHub Repository Setup Guide

This guide will help you configure the GitHub repository settings to enable all quality gates and protections.

## Prerequisites

- Repository admin access
- GitHub organization with team management
- Vercel account (for deployment)

## Step 1: Configure Repository Settings

### General Settings

1. Go to **Settings** > **General**
2. Configure the following:

**Features:**

- ✅ Issues
- ✅ Discussions (optional)
- ✅ Projects
- ❌ Wiki (use `/docs` instead)

**Pull Requests:**

- ✅ Allow squash merging (default)
- ✅ Allow merge commits
- ❌ Allow rebase merging
- ✅ Always suggest updating pull request branches
- ✅ Automatically delete head branches

**Pushes:**

- ✅ Limit how many branches and tags can be updated in a single push: 5

## Step 2: Configure Branch Protection Rules

### For `main` branch:

1. Go to **Settings** > **Branches** > **Add branch protection rule**
2. Branch name pattern: `main`
3. Configure:

```
Branch Protection Settings:

✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed
   ✅ Require review from Code Owners
   ✅ Require approval of the most recent reviewable push

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Required status checks:
     - quality-gates
     - build
     - pr-validation
     - security

✅ Require conversation resolution before merging

✅ Require signed commits (recommended)

✅ Require linear history

✅ Require deployments to succeed before merging
   Environment: production

✅ Lock branch (only allow specific people to push)
   - Add admin team

✅ Do not allow bypassing the above settings

✅ Restrict who can push to matching branches
   - Admins only

Rules applied to everyone including administrators:
   ✅ Require status checks to pass
   ✅ Require conversation resolution
```

4. Click **Create** or **Save changes**

### For `staging` branch:

1. Add another branch protection rule
2. Branch name pattern: `staging`
3. Configure:

```
Branch Protection Settings:

✅ Require a pull request before merging
   ✅ Require approvals: 1
   ✅ Dismiss stale pull request approvals when new commits are pushed

✅ Require status checks to pass before merging
   ✅ Require branches to be up to date before merging
   Required status checks:
     - quality-gates
     - build

✅ Require conversation resolution before merging

✅ Require deployments to succeed before merging
   Environment: staging

✅ Restrict who can push to matching branches
   - Developers team
```

### For `develop` branch:

1. Add another branch protection rule
2. Branch name pattern: `develop`
3. Configure:

```
Branch Protection Settings:

✅ Require status checks to pass before merging
   Required status checks:
     - quality-gates

✅ Require conversation resolution before merging
```

## Step 3: Configure Environments

### Production Environment

1. Go to **Settings** > **Environments** > **New environment**
2. Name: `production`
3. Configure:

```
Protection rules:
✅ Required reviewers: [Select admin team or specific users]
✅ Wait timer: 0 minutes
✅ Deployment branches: Selected branches
   - main

Environment secrets:
- NEXT_PUBLIC_ENV=production
- NEXT_PUBLIC_API_URL=[production API URL]
- DATABASE_URL=[production database URL]
- Any other production-specific secrets
```

### Staging Environment

1. Create another environment
2. Name: `staging`
3. Configure:

```
Protection rules:
✅ Deployment branches: Selected branches
   - staging
   - main

Environment secrets:
- NEXT_PUBLIC_ENV=staging
- NEXT_PUBLIC_API_URL=[staging API URL]
- DATABASE_URL=[staging database URL]
- Any other staging-specific secrets
```

### Development Environment

1. Create another environment
2. Name: `development`
3. Configure:

```
Protection rules:
✅ Deployment branches: Selected branches
   - develop
   - staging

Environment secrets:
- NEXT_PUBLIC_ENV=development
- NEXT_PUBLIC_API_URL=[dev API URL]
- DATABASE_URL=[dev database URL]
```

## Step 4: Configure Secrets

Go to **Settings** > **Secrets and variables** > **Actions**

### Required Secrets

```bash
# Vercel Deployment
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID=<your-project-id>
PRODUCTION_DOMAIN=<your-domain.com>
STAGING_DOMAIN=<staging.your-domain.com>

# Turborepo (optional but recommended)
TURBO_TOKEN=<your-turbo-token>
TURBO_TEAM=<your-team-name>

# Lighthouse CI (optional)
LHCI_GITHUB_APP_TOKEN=<your-lhci-token>

# Bundle Watch (optional)
BUNDLEWATCH_GITHUB_TOKEN=<your-github-token>

# Database
DATABASE_URL=<your-database-url>

# N8N Webhook (if used)
N8N_WEBHOOK_URL=<your-webhook-url>
```

### How to Get Secrets

**Vercel Token:**

```bash
# Install Vercel CLI
npm i -g vercel

# Login and get token
vercel login
vercel whoami
# Go to https://vercel.com/account/tokens to create token

# Get org and project IDs
cd apps/web
vercel link
cat .vercel/project.json
```

**Turbo Token:**

```bash
# Sign up at https://turbo.build
# Go to account settings to create token
```

## Step 5: Configure Teams (If Using Organizations)

1. Go to **Organization Settings** > **Teams**
2. Create the following teams:

```
Teams to create:
- @madfam-org/developers (all developers)
- @madfam-org/devops (DevOps engineers)
- @madfam-org/web-team (frontend developers)
- @madfam-org/backend-team (backend developers)
- @madfam-org/design-team (designers)
- @madfam-org/qa-team (QA engineers)
- @madfam-org/security-team (security reviewers)
- @madfam-org/database-team (database admins)
- @madfam-org/i18n-team (translation coordinators)
- @madfam-org/cms-team (CMS content managers)
- @madfam-org/data-team (data analysts)
```

3. Add members to each team
4. Set team permissions:
   - developers: **Write**
   - devops: **Admin**
   - others: **Read** or **Write** as appropriate

**Note:** If not using teams, update `.github/CODEOWNERS` with individual usernames

## Step 6: Configure Dependabot

1. Go to **Settings** > **Code security and analysis**
2. Enable:
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Dependabot version updates (configured via `.github/dependabot.yml`)
   - ✅ Grouped security updates

3. Configure Dependabot alerts:
   - ✅ Send email notifications
   - ✅ Enable vulnerable dependency notifications

## Step 7: Configure Code Scanning

1. Go to **Settings** > **Code security and analysis**
2. Enable:
   - ✅ CodeQL analysis (configured via `.github/workflows/codeql.yml`)
   - ✅ Secret scanning
   - ✅ Push protection (prevents committing secrets)

## Step 8: Enable Discussions (Optional)

1. Go to **Settings** > **General** > **Features**
2. ✅ Enable Discussions
3. Configure discussion categories:
   - General
   - Ideas
   - Q&A
   - Show and tell
   - Announcements (locked to maintainers)

## Step 9: Configure Rulesets (Optional, replaces branch protection)

**Note:** Rulesets are a newer feature that can replace branch protection rules. Use either rulesets OR branch protection, not both.

1. Go to **Settings** > **Rules** > **Rulesets** > **New ruleset**
2. Create ruleset for `main` branch
3. Configure same rules as branch protection above

## Step 10: Configure Webhooks (If Needed)

1. Go to **Settings** > **Webhooks** > **Add webhook**
2. Configure webhooks for:
   - Deployment notifications
   - Slack notifications
   - Custom integrations

Example webhook for Slack:

```
Payload URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
Content type: application/json
Events:
  - Pull requests
  - Pull request reviews
  - Pushes
  - Workflow runs
```

## Step 11: Configure Issue and PR Labels

1. Go to **Issues** > **Labels**
2. Add the following labels:

```
Priority:
- priority: critical (red)
- priority: high (orange)
- priority: medium (yellow)
- priority: low (green)

Type:
- bug (red)
- enhancement (blue)
- feature (purple)
- documentation (light blue)
- security (red)
- performance (orange)
- refactor (gray)

Status:
- needs-triage (yellow)
- in-progress (orange)
- blocked (red)
- ready-for-review (green)
- ready-for-deploy (blue)

Teams:
- web (blue)
- backend (green)
- design (purple)
- infrastructure (orange)
- analytics (yellow)

Automated:
- automated (gray)
- dependencies (light blue)
```

## Step 12: Repository Insights

1. Go to **Insights** > **Community**
2. Ensure all items are checked:
   - ✅ Description
   - ✅ README
   - ✅ Code of conduct
   - ✅ Contributing guidelines
   - ✅ License
   - ✅ Security policy
   - ✅ Issue templates
   - ✅ Pull request template

## Step 13: Notifications

### Team Notifications

Set up notification routing:

1. Go to **Settings** > **Notifications**
2. Configure:
   - ✅ Email notifications for:
     - Failed workflow runs
     - Dependabot alerts
     - Security alerts
   - ✅ Slack/Discord webhooks for:
     - PR reviews
     - Deployments
     - Build failures

### Individual Notifications

Recommend team members configure:

- Watch releases: ✅
- Watch discussions: Custom
- Watch issues: Custom
- Dependabot alerts: ✅

## Step 14: Test the Setup

1. Create a test branch: `test/quality-gates-setup`
2. Make a small change
3. Push the branch
4. Create a PR to `develop`
5. Verify:
   - ✅ CI workflow runs
   - ✅ All quality gates execute
   - ✅ Code owners are requested for review
   - ✅ Branch protection prevents merge until checks pass
6. Delete the test branch

## Step 15: Documentation

1. Update README.md with badges:

```markdown
# MADFAM Corporate Website

[![CI](https://github.com/madfam-org/biz-site/actions/workflows/ci.yml/badge.svg)](https://github.com/madfam-org/biz-site/actions/workflows/ci.yml)
[![CodeQL](https://github.com/madfam-org/biz-site/actions/workflows/codeql.yml/badge.svg)](https://github.com/madfam-org/biz-site/actions/workflows/codeql.yml)
[![Deployment](https://github.com/madfam-org/biz-site/actions/workflows/deploy.yml/badge.svg)](https://github.com/madfam-org/biz-site/actions/workflows/deploy.yml)
```

2. Create or update CONTRIBUTING.md with:
   - Development workflow
   - PR process
   - Code review guidelines
   - Quality standards

## Troubleshooting

### Workflows Not Running

- Check GitHub Actions are enabled in Settings
- Verify workflow YAML syntax is valid
- Check workflow permissions

### Status Checks Not Required

- Ensure workflows have run at least once
- Status check names must match exactly
- Workflows must complete successfully

### Secrets Not Working

- Verify secret names match exactly (case-sensitive)
- Check secret scopes (repository vs environment)
- Ensure secrets are not accidentally exposed in logs

## Maintenance

### Monthly Tasks

- Review Dependabot PRs
- Check security alerts
- Review failed workflow runs
- Update required status checks if workflows change

### Quarterly Tasks

- Review and update branch protection rules
- Audit team permissions
- Review quality gate metrics
- Update documentation

## Support

For help with setup:

1. Check [GitHub documentation](https://docs.github.com)
2. Review [QUALITY_GATES.md](./QUALITY_GATES.md)
3. Contact DevOps team
4. Create an issue with label `infrastructure`

---

**Setup Checklist:**

- [ ] Branch protection rules configured
- [ ] Environments created and configured
- [ ] All required secrets added
- [ ] Teams created and members added
- [ ] CODEOWNERS updated with correct teams
- [ ] Dependabot enabled
- [ ] Code scanning enabled
- [ ] Issue and PR labels created
- [ ] Webhooks configured (if needed)
- [ ] Setup tested with test PR
- [ ] Documentation updated
- [ ] Team notified of new process

---

**Last Updated**: November 2024
**Maintained by**: MADFAM DevOps Team
