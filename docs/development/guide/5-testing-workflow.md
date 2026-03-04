# Testing & Development Workflow

Testing patterns, git workflow, and code review process

### **Test Types**

1. **Unit Tests** (Vitest + Testing Library)
   - Components and utilities
   - Business logic functions
   - Database models

2. **Integration Tests** (Vitest)
   - API endpoints
   - Database operations
   - Service integrations

3. **E2E Tests** (Playwright)
   - Critical user journeys
   - Lead generation flows
   - Cross-browser testing

### **Running Tests**

```bash
# Unit tests
pnpm test                    # Run all tests
pnpm test:watch             # Watch mode
pnpm test --filter=@madfam/ui  # Package-specific

# E2E tests
pnpm test:e2e               # All E2E tests
pnpm test:e2e:ui            # With UI
pnpm test:e2e:headed        # With browser visible

# Coverage
pnpm test:coverage          # Generate coverage report
```

### **Writing Tests**

#### **Component Tests**

```tsx
// apps/web/components/__tests__/LeadForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LeadForm } from '../LeadForm';

describe('LeadForm', () => {
  it('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<LeadForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@company.com' },
    });
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'John Doe' },
    });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@company.com',
        name: 'John Doe',
      });
    });
  });
});
```

#### **API Tests**

```tsx
// apps/web/app/api/__tests__/leads.test.ts
import { POST } from '../leads/route';
import { NextRequest } from 'next/server';

describe('/api/leads', () => {
  it('creates lead with valid data', async () => {
    const request = new NextRequest('http://localhost:3000/api/leads', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@company.com',
        name: 'John Doe',
        company: 'Test Corp',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.leadId).toBeDefined();
  });
});
```

#### **E2E Tests**

```tsx
// apps/web/e2e/lead-capture.spec.ts
import { test, expect } from '@playwright/test';

test('lead capture flow', async ({ page }) => {
  await page.goto('/es-MX/contact');

  await page.fill('[name="email"]', 'test@company.com');
  await page.fill('[name="name"]', 'John Doe');
  await page.fill('[name="company"]', 'Test Corp');
  await page.selectOption('[name="program"]', 'STRATEGY_ENABLEMENT');

  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page).toHaveURL(/thank-you/);
});
```

---

## 🔄 Development Workflow

### **Git Flow**

```bash
# 1. Create feature branch
git checkout -b feature/new-assessment-questions

# 2. Make changes and commit frequently
git add .
git commit -m "feat: add industry-specific assessment questions"

# 3. Push branch and create PR
git push origin feature/new-assessment-questions
# Create PR via GitHub UI

# 4. Code review and merge
# 5. Delete branch after merge
git branch -d feature/new-assessment-questions
```

### **Commit Conventions**

```bash
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code change that neither fixes a bug nor adds a feature
test: adding tests
chore: updating build tasks, package manager configs, etc.
```

### **Code Review Checklist**

**Before Submitting PR:**

- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Components work in all locales
- [ ] Mobile responsive design
- [ ] Accessibility considerations
- [ ] Performance impact minimal

**Reviewer Checklist:**

- [ ] Code follows established patterns
- [ ] Business logic is sound
- [ ] Error handling is comprehensive
- [ ] Tests cover new functionality
- [ ] Documentation is updated
- [ ] Security considerations addressed

---
