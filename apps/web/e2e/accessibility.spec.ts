import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests @accessibility', () => {
  // Per-page axe scans live in accessibility-matrix.spec.ts (light and dark,
  // 1440 and 390 px, with a baseline that may only shrink).

  test('navigation should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocusedElement).toBeTruthy();

    // Tab through main navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      const focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          ariaLabel: el?.getAttribute('aria-label'),
          text: el?.textContent?.trim(),
        };
      });
      expect(focusedElement.tagName).toBeTruthy();
    }
  });
});
