> **ARCHIVED — historical record, not current guidance** (banner added 2026-09-23).
> Names, hosts, products and procedures below may be retired — e.g. PENNY, SPARK,
> penny.onl, forgesight.quest, and Vercel / Railway / GitHub Pages hosting. Current
> sources: [`AGENTS.md`](/AGENTS.md), [`ECOSYSTEM.md`](/ECOSYSTEM.md) and
> [`docs/deployment/DEPLOYMENT.md`](/docs/deployment/DEPLOYMENT.md).

# 🚨 CRITICAL ACCESSIBILITY FIXES - IMMEDIATE ACTION REQUIRED

## Fix #1: Remove Dangerous Global Focus Outline

**File**: `apps/web/app/globals.css`  
**Line**: 52  
**Severity**: CRITICAL - WCAG 2.4.7 Violation

### Current Code (DELETE THIS):

```css
*:focus {
  outline: none;
}
```

### Replace With:

```css
/* Enhance focus visibility - DO NOT remove outline globally */
*:focus-visible {
  outline: 2px solid var(--lavender);
  outline-offset: 2px;
  border-radius: 2px;
}

/* Specific resets only where needed */
button:focus:not(:focus-visible),
a:focus:not(:focus-visible) {
  outline: none;
}
```

---

## Fix #2: Newsletter Component Contrast

**File**: `packages/ui/src/components/Newsletter.tsx`  
**Line**: 171  
**Severity**: HIGH - WCAG 1.4.3 Violation

### Current Code:

```tsx
<input
  type="email"
  placeholder="Enter your email"
  className="flex-1 bg-transparent text-white placeholder:text-white/70 focus:outline-none"
/>
```

### Fixed Code:

```tsx
<input
  type="email"
  placeholder="Enter your email"
  className="flex-1 bg-transparent text-white placeholder:text-white/90 focus:outline-none focus-visible:outline-2 focus-visible:outline-white/50 focus-visible:outline-offset-2"
  aria-label="Email address for newsletter"
  required
  aria-required="true"
/>
```

---

## Fix #3: Footer Link Contrast

**File**: `apps/web/components/Footer.tsx`  
**Lines**: 68, 75, 82, etc.  
**Severity**: HIGH - WCAG 1.4.3 Violation

### Current Pattern:

```tsx
<Link className="text-obsidian/70 dark:text-white/70 hover:text-obsidian dark:hover:text-white">
```

### Fixed Pattern:

```tsx
<Link className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lavender">
```

---

## Fix #4: Add Skip Navigation Link

**File**: `apps/web/app/[locale]/layout.tsx`  
**Location**: After `<body>` tag  
**Severity**: HIGH - WCAG 2.4.1 Requirement

### Add This Code:

```tsx
export default function RootLayout({ children, params: { locale } }) {
  return (
    <html lang={locale}>
      <body>
        {/* Add skip link as first element in body */}
        <a
          href="#main-content"
          className="absolute left-[-999px] top-2 z-[999] bg-white text-black px-4 py-2 rounded-md focus:left-4 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-lavender"
        >
          Skip to main content
        </a>

        <Navbar />

        {/* Add id to main content area */}
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
```

---

## Fix #5: Mobile Input Font Size

**File**: `apps/web/app/globals.css` (or component level)  
**Severity**: MEDIUM - iOS Zoom Prevention

### Add Global Rule:

```css
/* Prevent iOS zoom on input focus */
input[type='text'],
input[type='email'],
input[type='tel'],
input[type='number'],
input[type='password'],
input[type='url'],
input[type='search'],
textarea,
select {
  font-size: 16px !important; /* Prevents iOS zoom */
}

@media (min-width: 768px) {
  input[type='text'],
  input[type='email'],
  input[type='tel'],
  input[type='number'],
  input[type='password'],
  input[type='url'],
  input[type='search'],
  textarea,
  select {
    font-size: inherit !important; /* Allow smaller sizes on desktop */
  }
}
```

---

## Fix #6: Button Loading States

**File**: `packages/ui/src/components/Button.tsx`  
**Severity**: MEDIUM - WCAG 4.1.3 Status

### Current Pattern:

```tsx
<button disabled={isLoading}>{isLoading ? 'Loading...' : 'Submit'}</button>
```

### Accessible Pattern:

```tsx
<button
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label={isLoading ? 'Processing, please wait' : undefined}
  aria-live="polite"
>
  {isLoading && <span className="sr-only">Loading, please wait</span>}
  {isLoading ? <Spinner aria-hidden="true" /> : null}
  <span className={isLoading ? 'sr-only' : ''}>Submit</span>
</button>
```

---

## Fix #7: Form Error Announcements

**File**: Any form component  
**Severity**: HIGH - WCAG 3.3.1 Error Identification

### Current Pattern:

```tsx
{
  error && <p className="text-red-500">{error}</p>;
}
```

### Accessible Pattern:

```tsx
{
  error && (
    <p
      id={`${fieldName}-error`}
      role="alert"
      aria-live="polite"
      className="text-red-600 dark:text-red-400 text-sm mt-1"
    >
      <span className="sr-only">Error:</span>
      {error}
    </p>
  );
}

{
  /* Input must reference the error */
}
<input aria-invalid={!!error} aria-describedby={error ? `${fieldName}-error` : undefined} />;
```

---

## Fix #8: Image Alt Text

**File**: All image components  
**Severity**: HIGH - WCAG 1.1.1 Non-text Content

### Audit & Fix Pattern:

```tsx
// Decorative images (no information value)
<img src="decoration.png" alt="" role="presentation" />

// Informative images
<img
  src="product.png"
  alt="Product dashboard showing platform analytics and metrics"
/>

// Complex images
<img
  src="chart.png"
  alt="Revenue growth chart"
  aria-describedby="chart-description"
/>
<p id="chart-description" className="sr-only">
  Chart shows 300% revenue growth from Q1 to Q4, with highest growth in Q3
</p>

// Logo images
<img
  src="logo.png"
  alt="MADFAM - AI consultancy and product studio"
/>
```

---

## Testing Checklist After Fixes

### Manual Testing Required:

- [ ] Tab through entire page - all interactive elements reachable
- [ ] Focus indicators visible on ALL interactive elements
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Check color contrast with browser tools
- [ ] Test keyboard navigation in forms
- [ ] Verify skip link works
- [ ] Test in dark mode - same accessibility standards
- [ ] Test on mobile - no zoom on input focus
- [ ] Verify error messages are announced
- [ ] Check loading states are communicated

### Automated Testing:

```bash
# Install tools
npm install -D axe-core pa11y lighthouse

# Run tests
npx axe http://localhost:3000
npx pa11y http://localhost:3000
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

### Browser Extensions:

1. Install "axe DevTools"
2. Install "WAVE"
3. Run on each page after fixes

---

## Commit Message Template

```bash
git commit -m "fix: critical accessibility violations

- Remove dangerous global focus outline removal (WCAG 2.4.7)
- Fix color contrast in Newsletter and Footer (WCAG 1.4.3)
- Add skip navigation link (WCAG 2.4.1)
- Improve form error announcements (WCAG 3.3.1)
- Enhance button loading states with ARIA
- Prevent iOS zoom with 16px input font size

BREAKING CHANGE: Focus styles now visible by default. Custom focus
styles may need adjustment.

Resolves: #accessibility-audit"
```

---

**⚠️ DO NOT DEPLOY WITHOUT THESE FIXES**

These violations could result in:

- Legal liability under ADA
- Lost users who depend on accessibility
- SEO penalties
- Damaged brand reputation

**Timeline**: ALL fixes must be implemented within 48 hours
