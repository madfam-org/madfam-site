import { test, expect, type Page } from '@playwright/test';

// MADFAM self-hosts Plausible; keep this in step with apps/web/lib/plausible.ts.
const plausibleHostname = new URL(
  process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || 'https://plausible.madfam.io'
).hostname.toLowerCase();

// The smoke run has no database and no analytics host: the leads API is
// answered locally and analytics beacons are intercepted, never sent.
async function mockLeadsApi(page: Page): Promise<void> {
  await page.route('**/api/leads', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, leadId: 'e2e-lead' }),
    })
  );
}

async function fillRequiredFields(page: Page, name = 'Test User', email = 'test@example.com') {
  await page.fill('input[name="name"]', name);
  await page.fill('input[name="email"]', email);
  await page.selectOption('select[name="timeline"]', { index: 1 });
  await page.fill('input[name="region"]', 'CDMX');
  await page.fill('textarea[name="message"]', 'This is a test message for E2E testing');
}

test.describe('Lead Capture Flow', () => {
  test('should successfully submit a lead form', async ({ page }) => {
    await mockLeadsApi(page);
    await page.goto('/es/contact');

    await fillRequiredFields(page);
    await page.fill('input[name="company"]', 'Test Company');
    await page.fill('input[name="phone"]', '+525512345678');

    const request = page.waitForRequest('**/api/leads');
    await page.click('button[type="submit"]');
    expect((await request).postDataJSON()).toMatchObject({
      name: 'Test User',
      email: 'test@example.com',
    });

    await expect(page.locator('text=/gracias|thank you/i')).toBeVisible({ timeout: 10000 });
  });

  test('should show validation errors for invalid input', async ({ page }) => {
    await page.goto('/es/contact');

    await page.click('button[type="submit"]');
    await expect(page.locator('text=/requerido|required/i').first()).toBeVisible();

    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=/email inválido|invalid email/i')).toBeVisible();
  });

  test('should track form interactions', async ({ page }) => {
    // Turn the client's Plausible events on for this page and record the
    // beacons instead of sending them: nothing reaches the analytics host.
    await page.addInitScript(() => {
      const w = window as unknown as { __PLAUSIBLE_DOMAIN__: string; __beacons: string[] };
      w.__PLAUSIBLE_DOMAIN__ = 'madfam.io';
      w.__beacons = [];
      navigator.sendBeacon = (url: string | URL) => {
        w.__beacons.push(String(url));
        return true;
      };
    });
    await mockLeadsApi(page);

    await page.goto('/es/contact');
    await fillRequiredFields(page, 'Analytics Test', 'analytics@test.com');
    await page.click('button[type="submit"]');

    const plausibleBeacons = () =>
      page.evaluate(host => {
        const beacons = (window as unknown as { __beacons: string[] }).__beacons;
        return beacons.filter(url => {
          const hostname = new URL(url, window.location.href).hostname.toLowerCase();
          return hostname === host || hostname.endsWith(`.${host}`);
        }).length;
      }, plausibleHostname);

    await expect.poll(plausibleBeacons, { timeout: 5000 }).toBeGreaterThan(0);
  });
});
