import { test, expect } from '@playwright/test';

test.describe('Winter Arc App - Visual Tests', () => {
  test('login page - light and dark mode (system preference)', async ({ page }) => {
    // Navigate to app (should redirect to login)
    await page.goto('/');

    // Wait for content to load
    await page.waitForSelector('text=Winter Arc', { timeout: 10000 });

    // Test light mode via system preference emulation
    // ThemeContext will detect this and apply light theme
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForTimeout(500); // Wait for theme transition
    await expect(page).toHaveScreenshot('login-light.png', {
      fullPage: true,
      animations: 'disabled',
    });

    // Test dark mode via system preference emulation
    // ThemeContext will detect this and apply dark theme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForTimeout(500); // Wait for theme transition
    await expect(page).toHaveScreenshot('login-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  // Note: Dashboard, Settings, etc. require authentication
  // These tests would need Firebase auth emulator or test user setup
  // For now, we only test the public login page

  // TODO: Add test for manual theme toggle in Settings (requires auth)
});
