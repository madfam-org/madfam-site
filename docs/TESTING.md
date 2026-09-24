# Testing Guide

## Overview

The MADFAM corporate website uses a comprehensive testing strategy with unit tests, integration tests, and end-to-end tests.

## Testing Stack

- **Unit/Integration Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Coverage**: Vitest Coverage with C8

## Running Tests

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm --filter @madfam-site/web test

# Run tests with UI
pnpm --filter @madfam-site/web test:ui

# Run tests with coverage
pnpm --filter @madfam-site/web test:coverage
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
pnpm --filter @madfam-site/web exec playwright install

# Run all E2E tests
pnpm --filter @madfam-site/web test:e2e

# Run E2E tests with UI
pnpm --filter @madfam-site/web test:e2e:ui

# Run E2E tests in headed mode (see browser)
pnpm --filter @madfam-site/web test:e2e:headed
```

## Test Structure

```
apps/web/
├── lib/__tests__/          # Unit tests for utilities
├── components/__tests__/   # Component tests
├── e2e/                   # End-to-end tests
├── test/                  # Test utilities and setup
├── vitest.config.ts       # Vitest configuration
└── playwright.config.ts   # Playwright configuration
```

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { calculateLeadScore } from '../lead-scoring';

describe('Lead Scoring', () => {
  it('should score business emails higher', () => {
    const lead = { email: 'contact@company.com' };
    expect(calculateLeadScore(lead)).toBeGreaterThan(0);
  });
});
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should submit lead form', async ({ page }) => {
  await page.goto('/contact');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.click('button[type="submit"]');
  await expect(page.locator('text=Thank you')).toBeVisible();
});
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Mock External Dependencies**: Mock API calls and external services
4. **Test User Behavior**: Focus on testing what users do, not implementation details
5. **Keep Tests Fast**: Unit tests should run in milliseconds
6. **Test Coverage**: Aim for 80%+ coverage on critical business logic

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Push to main branch
- Before deployment

The CI pipeline will fail if:

- Any test fails
- Coverage drops below threshold
- TypeScript errors are found

## Debugging Tests

### Debug Unit Tests

```bash
# Run specific test file
pnpm --filter @madfam-site/web test lib/__tests__/seo.test.ts

# Run tests matching pattern
pnpm --filter @madfam-site/web test -t "should calculate"
```

### Debug E2E Tests

```bash
# Run with debug mode
PWDEBUG=1 pnpm --filter @madfam-site/web test:e2e

# Run specific test file
pnpm --filter @madfam-site/web test:e2e homepage.spec.ts

# Save trace on failure
pnpm --filter @madfam-site/web test:e2e --trace on
```

## Performance Testing

For performance testing, use Playwright's built-in metrics:

```typescript
const metrics = await page.evaluate(() => ({
  FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
  LCP: performance.getEntriesByType('largest-contentful-paint')[0]?.startTime,
}));

expect(metrics.FCP).toBeLessThan(1500);
expect(metrics.LCP).toBeLessThan(2500);
```
