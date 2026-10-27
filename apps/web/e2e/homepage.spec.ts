import { test, expect } from '@playwright/test';

// The site redirects `/` by Accept-Language (Playwright sends en-US), so the
// smoke tests open the Spanish home directly and assert Spanish labels.
test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/es');
  });

  test('should display the main heading', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have navigation links', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const navbar = page.locator('nav').first();

    await expect(navbar.getByRole('button', { name: /Plataformas/ })).toBeVisible();
    await expect(navbar.getByRole('link', { name: 'Maker Node' })).toBeVisible();
    await expect(navbar.getByRole('link', { name: 'Ecosistema', exact: true })).toBeVisible();
  });

  test('should navigate to the platform catalog', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator('nav').first().getByRole('link', { name: 'Explorar Plataformas' }).click();
    await expect(page).toHaveURL(/\/es\/products$/);
  });

  test('should have ecosystem and platform CTAs', async ({ page }) => {
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
    await page.setViewportSize({ width: 375, height: 667 });

    // The mobile menu button is visible and opens the menu.
    const menuButton = page.getByRole('button', { name: 'Abrir menú' });
    await expect(menuButton).toBeVisible();

    // The desktop-only header actions are hidden at this width.
    const desktopCta = page
      .locator('nav')
      .first()
      .getByRole('link', { name: 'Explorar Plataformas' });
    await expect(desktopCta).toBeHidden();

    await menuButton.click();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
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

    expect(metrics.domContentLoaded).toBeLessThan(3000);
    expect(metrics.loadComplete).toBeLessThan(5000);
  });
});
