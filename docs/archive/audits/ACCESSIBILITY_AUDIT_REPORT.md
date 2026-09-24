> **ARCHIVED — historical record, not current guidance** (banner added 2026-09-23).
> Names, hosts, products and procedures below may be retired — e.g. PENNY, SPARK,
> penny.onl, forgesight.quest, and Vercel / Railway / GitHub Pages hosting. Current
> sources: [`AGENTS.md`](/AGENTS.md), [`ECOSYSTEM.md`](/ECOSYSTEM.md) and
> [`docs/deployment/DEPLOYMENT.md`](/docs/deployment/DEPLOYMENT.md).

# Visual Accessibility & Theme Consistency Audit Report

## MADFAM Corporate Website - December 2024

### Executive Summary

A comprehensive accessibility audit revealed that while the MADFAM codebase has a strong foundation, there are critical issues affecting visual accessibility and theme consistency. The most urgent issues include dangerous global focus removal, inconsistent dark mode implementation, and multiple WCAG AA compliance failures.

---

## 🚨 Critical Issues Requiring Immediate Action

### 1. Global Focus Outline Removal (WCAG 2.4.7 Failure)

**Location**: `apps/web/app/globals.css:52`

**Current Code (DANGEROUS):**

```css
*:focus {
  outline: none;
}
```

**Impact**:

- Removes ALL focus indicators across the entire application
- Makes keyboard navigation impossible for users with disabilities
- Violates WCAG 2.4.7 Focus Visible (Level AA)

**Fix Required:**

```css
/* Remove the global outline: none rule entirely */
/* Keep only the focus-visible enhancement */
*:focus-visible {
  outline: 2px solid var(--lavender);
  outline-offset: 2px;
}

/* For specific elements that need custom focus */
button:focus-visible,
a:focus-visible,
input:focus-visible,
textarea:focus-visible,
select:focus-visible {
  outline: 2px solid var(--lavender);
  outline-offset: 2px;
  border-radius: 0.25rem;
}
```

### 2. Low Contrast Placeholder Text

**Location**: `packages/ui/src/components/Newsletter.tsx:171`

**Current Issue:**

- White text with 70% opacity on potentially light backgrounds
- Contrast ratio likely below 3:1 (WCAG AA requires 4.5:1)

**Fix:**

```tsx
// Before
className = 'placeholder:text-white/70';

// After
className = 'placeholder:text-gray-500 dark:placeholder:text-gray-400';
// Or use higher opacity
className = 'placeholder:text-white/90 dark:placeholder:text-gray-300';
```

---

## 📊 Contrast Ratio Violations

### Identified Low-Contrast Combinations

| Component              | Current Colors        | Ratio   | Required | Status   |
| ---------------------- | --------------------- | ------- | -------- | -------- |
| Newsletter placeholder | #ffffff @ 70% on var  | ~2.8:1  | 4.5:1    | ❌ FAIL  |
| Footer links           | text-obsidian/70      | ~3.9:1  | 4.5:1    | ❌ FAIL  |
| Small text (text-xs)   | Various @ 70% opacity | <4.5:1  | 4.5:1    | ❌ FAIL  |
| Button disabled state  | Unknown               | Unknown | 3:1      | ⚠️ CHECK |

### Color Contrast Fixes

```css
/* Add to globals.css or theme configuration */
:root {
  /* Minimum contrast ratios for accessibility */
  --text-primary: hsl(0, 0%, 13%); /* Contrast 16:1 on white */
  --text-secondary: hsl(0, 0%, 35%); /* Contrast 7.5:1 on white */
  --text-tertiary: hsl(0, 0%, 45%); /* Contrast 4.6:1 on white */
  --text-disabled: hsl(0, 0%, 55%); /* Contrast 3.1:1 on white */
}

.dark {
  --text-primary: hsl(0, 0%, 95%); /* Contrast 15:1 on black */
  --text-secondary: hsl(0, 0%, 75%); /* Contrast 9.5:1 on black */
  --text-tertiary: hsl(0, 0%, 65%); /* Contrast 7:1 on black */
  --text-disabled: hsl(0, 0%, 50%); /* Contrast 4.5:1 on black */
}
```

---

## 🌓 Dark/Light Mode Inconsistencies

### Components Missing Dark Mode Support

1. **Form Elements** - Partial implementation
2. **Error Messages** - No dark mode variants
3. **Loading States** - Hardcoded colors
4. **Tooltips** - Missing dark mode

### Standardized Dark Mode Pattern

Create a consistent approach:

```tsx
// components/ui/themed-components.tsx

export const ThemedCard = ({ children, className = '' }) => (
  <div
    className={cn(
      // Light mode
      'bg-white text-gray-900 border-gray-200',
      // Dark mode
      'dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700',
      // Shared styles
      'border rounded-lg p-4 transition-colors',
      className
    )}
  >
    {children}
  </div>
);

export const ThemedInput = ({ ...props }) => (
  <input
    className={cn(
      // Light mode
      'bg-white text-gray-900 border-gray-300',
      'placeholder:text-gray-500',
      'focus:border-brand-primary focus:ring-brand-primary',
      // Dark mode
      'dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
      'dark:placeholder:text-gray-400',
      'dark:focus:border-brand-primary-light dark:focus:ring-brand-primary-light',
      // Shared styles
      'px-3 py-2 border rounded-md text-base', // 16px to prevent iOS zoom
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'dark:focus:ring-offset-gray-900',
      props.className
    )}
    {...props}
  />
);
```

---

## ♿ ARIA & Screen Reader Improvements

### Current State

- Only 20 ARIA attributes across entire codebase
- Missing live regions for dynamic content
- No skip links for keyboard navigation
- Form validation messages not announced

### Required ARIA Implementations

```tsx
// 1. Skip Link (Add to Layout)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white px-4 py-2 rounded-md z-50"
>
  Skip to main content
</a>

// 2. Form with Proper ARIA
<form>
  <div>
    <label htmlFor="email" className="sr-only">
      Email address
    </label>
    <input
      id="email"
      name="email"
      type="email"
      required
      aria-required="true"
      aria-invalid={errors.email ? "true" : "false"}
      aria-describedby={errors.email ? "email-error" : undefined}
      placeholder="Enter your email"
    />
    {errors.email && (
      <p id="email-error" role="alert" className="text-red-600 text-sm mt-1">
        {errors.email}
      </p>
    )}
  </div>
</form>

// 3. Live Region for Dynamic Updates
<div
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>

// 4. Loading State
<button
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label={isLoading ? "Processing, please wait" : "Submit form"}
>
  {isLoading ? <Spinner /> : "Submit"}
</button>
```

---

## 📝 Typography Accessibility Issues

### Problems Identified

1. **Text too small**: 15+ components use `text-xs` (12px or less)
2. **Fixed font sizes**: Don't respect user preferences
3. **Poor line height**: Some text blocks are too dense

### Typography Scale Fix

```css
/* Replace in globals.css */
:root {
  /* Fluid typography with clamp() */
  --text-xs: clamp(0.875rem, 0.8rem + 0.25vw, 0.875rem); /* 14px min */
  --text-sm: clamp(0.875rem, 0.85rem + 0.3vw, 1rem); /* 14-16px */
  --text-base: clamp(1rem, 0.95rem + 0.4vw, 1.125rem); /* 16-18px */
  --text-lg: clamp(1.125rem, 1rem + 0.5vw, 1.25rem); /* 18-20px */
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem); /* 20-24px */

  /* Line heights for readability */
  --leading-tight: 1.4;
  --leading-normal: 1.6;
  --leading-relaxed: 1.75;
}

/* Minimum font size for body text */
body {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

/* Never go below 14px for any text */
.text-xs {
  font-size: var(--text-sm) !important; /* Override to maintain readability */
}
```

---

## 🎯 Component-Specific Fixes

### Footer Component

```tsx
// apps/web/components/Footer.tsx
// Replace low-contrast text
<p className="text-obsidian/70 dark:text-white/70">
// With:
<p className="text-gray-600 dark:text-gray-400">
```

### Newsletter Component

```tsx
// packages/ui/src/components/Newsletter.tsx
// Replace:
<input className="placeholder:text-white/70" />
// With:
<input className="placeholder:text-gray-600 dark:placeholder:text-gray-400" />
```

### Button Focus States

```tsx
// packages/ui/src/components/Button.tsx
// Ensure all variants have visible focus
const buttonVariants = cva(
  '... focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'focus-visible:ring-brand-primary',
        destructive: 'focus-visible:ring-red-500',
        outline: 'focus-visible:ring-gray-400',
        ghost: 'focus-visible:ring-gray-400',
      },
    },
  }
);
```

---

## 📋 Implementation Priority

### Week 1 - Critical Fixes

- [ ] Remove dangerous global focus outline rule
- [ ] Fix Newsletter component contrast
- [ ] Fix Footer component contrast
- [ ] Add skip link to main layout

### Week 2 - ARIA Implementation

- [ ] Add ARIA labels to all form inputs
- [ ] Implement live regions for dynamic content
- [ ] Add proper error announcements
- [ ] Fix button loading states

### Week 3 - Dark Mode Consistency

- [ ] Audit all components for dark mode support
- [ ] Create ThemedComponent utilities
- [ ] Update color variables for dark mode
- [ ] Test all interactive states

### Week 4 - Typography & Testing

- [ ] Implement fluid typography scale
- [ ] Increase minimum font sizes
- [ ] Add automated contrast testing
- [ ] Screen reader testing

---

## 🔧 Testing Tools & Resources

### Recommended Testing Tools

1. **axe DevTools** - Browser extension for accessibility testing
2. **WAVE** - Web Accessibility Evaluation Tool
3. **Contrast Ratio Checker** - For color testing
4. **NVDA/JAWS** - Screen reader testing
5. **Lighthouse** - Automated accessibility scoring

### Testing Checklist

- [ ] All interactive elements have visible focus
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large)
- [ ] Keyboard navigation works throughout
- [ ] Screen reader announces all content properly
- [ ] Dark mode has equivalent contrast ratios
- [ ] Forms are fully accessible with proper labels
- [ ] Error messages are announced
- [ ] Loading states are communicated

---

## 📈 Success Metrics

### Target Compliance

- **WCAG 2.1 Level AA**: Full compliance
- **Lighthouse Score**: >95 accessibility
- **axe Issues**: 0 critical, 0 serious
- **Contrast Ratios**: All text >4.5:1
- **Focus Visible**: 100% of interactive elements
- **Screen Reader**: 100% navigable

### Monitoring

Implement automated testing in CI/CD:

```json
// package.json
{
  "scripts": {
    "test:a11y": "pa11y-ci",
    "test:contrast": "color-contrast-checker",
    "audit": "lighthouse --only-categories=accessibility"
  }
}
```

---

## 📚 Resources & Documentation

### WCAG Guidelines

- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://www.webaxe.org/color-contrast-tools/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Internal Documentation

- Update component library docs with accessibility notes
- Create accessibility checklist for PR reviews
- Document color contrast ratios for all combinations
- Maintain ARIA pattern library

---

_Report Generated: December 2024_  
_Next Review: January 2025_
