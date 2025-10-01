import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for Winter Arc App
 * Run with: npm run test:visual
 */

test.describe('Winter Arc App Visual Tests', () => {
  test('Home Screen - Light Mode', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    // Take screenshot
    await expect(page).toHaveScreenshot('home-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Home Screen - Dark Mode', async ({ page }) => {
    await page.goto('/');

    // Wait for app to load
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    // Enable dark mode (if theme toggle exists)
    const themeToggle = page.locator('button[aria-label*="Theme"]').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
    }

    // Take screenshot
    await expect(page).toHaveScreenshot('home-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Liquid Glass Components - Cards', async ({ page }) => {
    await page.goto('/');

    // Wait for glass cards to render
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });
    await page.waitForTimeout(1000); // Wait for liquid glass effects

    // Take screenshot of main content area
    const mainContent = page.locator('main').first();
    if (await mainContent.isVisible()) {
      await expect(mainContent).toHaveScreenshot('glass-cards.png', {
        animations: 'disabled',
      });
    } else {
      // Fallback to full page
      await expect(page).toHaveScreenshot('glass-cards-fullpage.png', {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('Liquid Glass Components - Buttons', async ({ page }) => {
    await page.goto('/');

    // Wait for buttons to render
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Hover over a button to test hover state
    const firstButton = page.locator('button').first();
    await firstButton.hover();
    await page.waitForTimeout(300);

    // Take screenshot
    await expect(page).toHaveScreenshot('glass-buttons.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});

test.describe('Responsive Layout Tests', () => {
  test('Mobile View', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    await expect(page).toHaveScreenshot('mobile-view.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Tablet View', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    await expect(page).toHaveScreenshot('tablet-view.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('Desktop View', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
    await page.goto('/');
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    await expect(page).toHaveScreenshot('desktop-view.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
