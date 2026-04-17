# Dependency Update Notes - November 2025

## Summary

Consolidated 5 Dependabot PRs into a single update:

| Package     | From             | To     | Type  |
| ----------- | ---------------- | ------ | ----- |
| zod         | 3.22.4 → 3.25.76 | 4.1.12 | Major |
| tailwindcss | 3.4.18           | 4.1.17 | Major |
| eslint      | 8.57.1           | 9.39.1 | Major |
| next-intl   | 3.4.0 → 3.26.5   | 4.5.3  | Major |

**Status**: ⚠️ Dependencies updated but **BREAKING CHANGES** require code fixes before deployment

---

## Breaking Changes Found (87 type errors)

### 1. next-intl v4 Breaking Changes (26 errors)

**Issue**: `unstable_setRequestLocale` has been removed from `next-intl/server`

**Affected Files**:

- `app/[locale]/about/page.tsx`
- `app/[locale]/api/page.tsx`
- `app/[locale]/arms/madfam/page.tsx`
- `app/[locale]/arms/colabs/page.tsx`
- `app/[locale]/arms/page.tsx`
- `app/[locale]/arms/primavera3d/page.tsx`
- `app/[locale]/assessment/page.tsx`
- `app/[locale]/auth/signin/page.tsx`
- `app/[locale]/blog/[slug]/page.tsx`
- `app/[locale]/blog/page.tsx`
- `app/[locale]/calculator/page.tsx`
- `app/[locale]/careers/page.tsx`
- `app/[locale]/case-studies/page.tsx`
- `app/[locale]/contact/page.tsx`
- `app/[locale]/cookies/page.tsx`
- `app/[locale]/dashboard/page.tsx`
- `app/[locale]/docs/page.tsx`
- `app/[locale]/estimator/page.tsx`
- `app/[locale]/guides/page.tsx`
- `app/[locale]/impact/page.tsx`
- `app/[locale]/page.tsx`
- `app/[locale]/privacy/page.tsx`
- `app/[locale]/products/page.tsx`
- `app/[locale]/programs/page.tsx`
- `app/[locale]/showcase/page.tsx`
- `app/[locale]/terms/page.tsx`

**Migration Required**:

- Remove `unstable_setRequestLocale` calls (now stable in v4)
- Update i18n configuration in `i18n.ts` to include `locale` in `RequestConfig`

**Fix**:

```typescript
// OLD (v3):
import { unstable_setRequestLocale } from 'next-intl/server';
unstable_setRequestLocale(locale);

// NEW (v4):
// Remove the call - locale handling is now automatic with proper config
```

**i18n.ts config fix**:

```typescript
// Add locale to the returned config
export default getRequestConfig(async ({ locale }: GetRequestConfigParams) => {
  return {
    locale, // ADD THIS LINE
    messages: (await import(`./translations/${locale}/index.ts`)).default,
  };
});
```

---

### 2. Zod v4 Breaking Changes (8 errors)

**Issue**: API changes in error handling and parse methods

**Affected Files**:

- `app/api/assessment/route.ts` (4 errors)
- `app/api/calculator/route.ts` (2 errors)
- `app/api/feature-flags/route.ts` (2 errors)
- `app/api/leads/route.ts` (2 errors)

**Changes**:

1. `error.errors` → Use `error.issues` instead
2. `z.parse()` signature changed - now expects 2-3 arguments

**Fix**:

```typescript
// OLD (v3):
try {
  const data = schema.parse(input);
} catch (error) {
  if (error instanceof z.ZodError) {
    return error.errors.map(e => e.message);
  }
}

// NEW (v4):
try {
  const data = schema.parse(input, { errorMap: customErrorMap });
} catch (error) {
  if (error instanceof z.ZodError) {
    return error.issues.map(e => e.message); // .errors → .issues
  }
}
```

---

### 3. Framer Motion className Issues (40+ errors)

**Issue**: TypeScript typing issue with `className` on `motion.*` components

**Affected Components**:

- `components/AnimatedButton.tsx`
- `components/AnimatedCard.tsx`
- `components/AnimatedCounter.tsx`
- `components/AnimatedText.tsx`
- `components/CookieConsent.tsx`
- `components/CustomCursor.tsx`
- `components/Navbar.tsx`
- `components/ParallaxSection.tsx`
- `components/ProjectEstimator.tsx`
- `components/ROICalculator.tsx`
- `components/ScrollProgress.tsx`
- `components/Search.tsx`

**Likely Cause**: Framer Motion v11 typing changes or React 19 compatibility

**Fix Options**:

1. Cast components: `<motion.div className={...} as any>`
2. Update framer-motion to latest v11.x
3. Use `styled()` from framer-motion instead of className

---

### 4. Prisma Enum Export Issues (7 errors)

**Issue**: Prisma generated enums not being exported

**Affected Files**:

- `app/api/assessment/route.ts` - `AssessmentStatus`
- `app/api/feature-flags/route.ts` - `UserRole`
- `app/api/leads/route.ts` - `LeadSource`, `LeadStatus`
- `app/api/webhook/n8n/route.ts` - `LeadStatus`
- `lib/auth.ts` - `UserRole`

**Temporary Fix**: Regenerate Prisma client

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 pnpm prisma generate
```

**Permanent Fix**: Verify Prisma schema exports enums correctly

---

### 5. Other TypeScript Issues (10 errors)

**Files**:

- `components/GlobalAnalytics.tsx` - Missing argument
- `hooks/useScrollAnimation.ts` - RefObject type mismatch
- `lib/email-queue.ts` - Prisma.JsonObject namespace issue

---

## Recommended Action Plan

### Phase 1: Critical Fixes (Required for Build)

1. ✅ Fix next-intl v4 migration
   - Update `i18n.ts` config
   - Remove `unstable_setRequestLocale` calls from all pages
2. ✅ Fix Zod v4 changes
   - Replace `.errors` with `.issues`
   - Update `z.parse()` calls
3. ✅ Regenerate Prisma client for enum exports

### Phase 2: Component Fixes

4. ⚠️ Fix Framer Motion type issues
   - Update framer-motion to latest v11.x
   - Or use type assertions as temporary fix
5. ⚠️ Fix remaining TypeScript errors in hooks/libs

### Phase 3: Testing & Validation

6. 🧪 Run full test suite
7. 🧪 Manual testing of affected pages
8. 🧪 Verify animations still work
9. 🚀 Deploy to staging for validation

### Phase 4: ESLint v9 Migration (Separate Task)

- ESLint v9 requires flat config migration
- Current config will need updating
- Recommend doing this as separate PR

---

## Next Steps

**Option A - Fix Now**:
Apply all fixes in this PR before merging

**Option B - Staged Rollout** (Recommended):

1. Merge only safe updates (defer breaking changes)
2. Create separate PRs for each major version bump
3. Test thoroughly in staging

**Option C - Revert**:
Revert to previous versions and upgrade incrementally

---

## Notes

- All package.json files updated
- pnpm-lock.yaml regenerated
- Build will fail without fixes applied
- Estimated fix time: 2-3 hours
- Consider upgrading dependencies one at a time in future

---

**Created**: 2025-11-14
**Branch**: `claude/review-open-prs-01VzKr4QwZDqVfedz2t6EFtN`
