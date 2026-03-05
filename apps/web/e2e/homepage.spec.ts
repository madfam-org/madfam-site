import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    const navbar = page.locator('nav');

    await expect(navbar.getByText('Plataformas')).toBeVisible();
    await expect(navbar.getByText('Maker Node')).toBeVisible();
    await expect(navbar.getByText('Ecosistema')).toBeVisible();
  });

  test('should navigate to platforms page', async ({ page }) => {
    await page.click('text=Plataformas');
    await expect(page).toHaveURL(/.*product/);
  });

  test('should have ecosystem and platform CTAs', async ({ page }) => {
    // Look for ecosystem-related CTAs
    const ecosystemLink = page
      .getByRole('link', { name: /ecosistema|ecosystem|ecossistema/i })
      .first();
    await expect(ecosystemLink).toBeVisible();
  });

  test('should have a working CTA button', async ({ page }) => {
    const ctaButton = page.getByRole('link', { name: /ecosistema|explorar|ecosystem/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Mobile menu should be visible
    const mobileMenuButton = page
      .locator('[data-testid="mobile-menu-button"], button[aria-label*="menu"]')
      .first();
    await expect(mobileMenuButton).toBeVisible();

    // Desktop navigation should be hidden
    const desktopNav = page.locator('nav:not([data-mobile])').first();
    await expect(desktopNav).toBeHidden();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('MADFAM');

    const description = await page.getAttribute('meta[name="description"]', 'content');
    expect(description).toBeTruthy();

    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toBeTruthy();
  });

  test('should load performance metrics', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType(
        'navigation'
      )[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded:
          navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      };
    });

    // Page should load quickly
    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.loadComplete).toBeLessThan(5000);
  });
});
