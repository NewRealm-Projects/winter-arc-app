import { test, expect } from '@playwright/test';

/**
 * Preview tests for visually inspecting the built app
 *
 * Usage:
 * 1. Build: npm run build:web
 * 2. Preview: npm run preview (in separate terminal)
 * 3. Screenshot: npm run preview:screenshot
 */

test.describe('Visual Preview', () => {
  test('Desktop Screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/winter-arc-app/');

    // Wait for content to load
    await page.waitForTimeout(3000);

    // Take screenshot
    await page.screenshot({
      path: 'preview-screenshots/desktop.png',
      fullPage: true,
    });
  });

  test('Tablet Screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/winter-arc-app/');

    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'preview-screenshots/tablet.png',
      fullPage: true,
    });
  });

  test('Mobile Screenshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/winter-arc-app/');

    await page.waitForTimeout(3000);

    await page.screenshot({
      path: 'preview-screenshots/mobile.png',
      fullPage: true,
    });
  });
});
