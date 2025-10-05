import { test, expect } from '@playwright/test';

/**
 * Mobile Device Emulation Tests
 *
 * Tests across real device profiles (defined in playwright.config.mobile.ts):
 * - iPhone 14 (390×844)
 * - iPhone SE (375×667)
 * - Pixel 7 (412×915)
 */

test.describe('Mobile Device Tests', () => {
  test('login page renders correctly in light and dark mode', async ({ page, browserName }) => {
    await page.goto('/');

    // Wait for content
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    // Light mode
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot(`${browserName}-login-light.png`, {
      fullPage: true,
      animations: 'disabled',
    });

    // Dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot(`${browserName}-login-dark.png`, {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('bottom navigation is accessible and visible', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    // Check if bottom nav exists
    const nav = page.locator('nav').filter({ has: page.locator('ul') }).first();
    await expect(nav).toBeVisible();

    // Check nav items
    const navItems = nav.locator('a');
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify each nav item is touch-friendly
    for (let i = 0; i < count; i++) {
      const item = navItems.nth(i);
      const box = await item.boundingBox();

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('FAB is visible and positioned correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    // Check FAB button
    const fab = page.locator('button').filter({ hasText: '+' }).last();
    await expect(fab).toBeVisible();

    const box = await fab.boundingBox();
    if (box) {
      // FAB should be >= 44px
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);

      // FAB should be in bottom-right corner (thumb zone)
      const viewport = page.viewportSize();
      if (viewport) {
        expect(box.x).toBeGreaterThan(viewport.width / 2);
        expect(box.y).toBeGreaterThan(viewport.height / 2);
      }
    }
  });

  test('no horizontal scroll on any page', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    const scrollWidth = await page.evaluate(() => {
      return document.documentElement.scrollWidth;
    });

    const clientWidth = await page.evaluate(() => {
      return document.documentElement.clientWidth;
    });

    // No horizontal overflow
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});

/**
 * Touch Target Size Tests
 * Ensures all interactive elements are >= 44×44px
 * Tests run on all configured devices (iPhone 14, iPhone SE, Pixel 7)
 */
test.describe('Touch Target Sizes', () => {
  test('all buttons meet 44px minimum size', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    const buttons = await page.getByRole('button').all();

    for (const button of buttons) {
      const box = await button.boundingBox();

      if (box && await button.isVisible()) {
        // WCAG 2.1 AA: 44×44px minimum
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('all links meet 44px minimum size', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    const links = await page.getByRole('link').all();

    for (const link of links) {
      const box = await link.boundingBox();

      if (box && await link.isVisible()) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('inputs are touch-friendly (min 44px height)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    // Find all input fields
    const inputs = await page.locator('input[type="number"], input[type="text"], input[type="email"]').all();

    for (const input of inputs) {
      const box = await input.boundingBox();

      if (box && await input.isVisible()) {
        // Inputs should be at least 44px tall
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
