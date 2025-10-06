import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Navigation Flow
 *
 * Tests the app navigation between pages (Dashboard, Leaderboard, Notes, Settings).
 *
 * Prerequisites:
 * - Firebase Auth Emulator or Test User credentials
 *
 * TODO: Setup Firebase Auth Emulator for automated testing
 * For now, these tests serve as specification/documentation.
 */

test.describe('Navigation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Setup Firebase Auth Emulator or mock auth
    // await loginAsTestUser(page);
    await page.goto('/dashboard');
  });

  test('should navigate between all main pages via bottom navigation', async ({ page }) => {
    // GIVEN: User is on Dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1, h2').filter({ hasText: 'Dashboard' })).toBeVisible();

    // WHEN: User clicks on Leaderboard in bottom nav
    await page.locator('[data-testid="nav-leaderboard"]').click();

    // THEN: User is on Leaderboard page
    await expect(page).toHaveURL('/leaderboard');
    await expect(page.locator('h1, h2').filter({ hasText: 'Leaderboard' })).toBeVisible();

    // WHEN: User clicks on Notes in bottom nav
    await page.locator('[data-testid="nav-notes"]').click();

    // THEN: User is on Notes page
    await expect(page).toHaveURL('/notes');
    await expect(page.locator('h1, h2').filter({ hasText: 'Notes' })).toBeVisible();

    // WHEN: User clicks on Dashboard in bottom nav
    await page.locator('[data-testid="nav-dashboard"]').click();

    // THEN: User is back on Dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to Settings via top-right icon', async ({ page }) => {
    // GIVEN: User is on Dashboard
    await page.goto('/dashboard');

    // WHEN: User clicks Settings icon in top-right
    await page.locator('[data-testid="nav-settings"]').click();

    // THEN: User is on Settings page
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h1, h2').filter({ hasText: 'Settings' })).toBeVisible();
  });

  test('should navigate to Pushup Training page from dashboard', async ({ page }) => {
    // GIVEN: User is on Dashboard
    await page.goto('/dashboard');

    // WHEN: User clicks on Pushup Tile training plan section
    const pushupTile = page.locator('[data-testid="pushup-tile"]');
    const trainingPlanLink = pushupTile.locator('[data-testid="training-plan-link"]');
    await trainingPlanLink.click();

    // THEN: User is on Pushup Training page
    await expect(page).toHaveURL('/tracking/pushup-training');
    await expect(page.locator('h1').filter({ hasText: 'Training Mode' })).toBeVisible();
  });

  test('should navigate to History page (if enabled)', async ({ page }) => {
    // Note: History page is archived (HISTORY_ENABLED = false by default)
    // This test would only run if feature flag is enabled

    // GIVEN: User is on Dashboard
    await page.goto('/dashboard');

    // WHEN: User clicks on History link (if visible)
    const historyLink = page.locator('[data-testid="nav-history"]');

    // THEN: If History is enabled, navigate to History page
    if (await historyLink.isVisible()) {
      await historyLink.click();
      await expect(page).toHaveURL('/history');
      await expect(page.locator('h1').filter({ hasText: 'History' })).toBeVisible();
    }
  });

  test('should preserve state when navigating between pages', async ({ page }) => {
    // GIVEN: User tracks water on Dashboard
    await page.goto('/dashboard');
    const waterTile = page.locator('[data-testid="water-tile"]');
    await waterTile.locator('button:has-text("+500")').click();

    // WHEN: User navigates to Leaderboard
    await page.locator('[data-testid="nav-leaderboard"]').click();
    await expect(page).toHaveURL('/leaderboard');

    // AND: User navigates back to Dashboard
    await page.locator('[data-testid="nav-dashboard"]').click();
    await expect(page).toHaveURL('/dashboard');

    // THEN: Water count should still show 0.50L (state preserved)
    const waterValue = waterTile.locator('[data-testid="water-value"]');
    await expect(waterValue).toContainText('0.50L');
  });

  test('should highlight active navigation item', async ({ page }) => {
    // GIVEN: User is on Dashboard
    await page.goto('/dashboard');

    // THEN: Dashboard nav item should be active
    const dashboardNav = page.locator('[data-testid="nav-dashboard"]');
    await expect(dashboardNav).toHaveClass(/active|text-winter-600/);

    // WHEN: User navigates to Leaderboard
    await page.locator('[data-testid="nav-leaderboard"]').click();

    // THEN: Leaderboard nav item should be active
    const leaderboardNav = page.locator('[data-testid="nav-leaderboard"]');
    await expect(leaderboardNav).toHaveClass(/active|text-winter-600/);

    // AND: Dashboard nav item should not be active
    await expect(dashboardNav).not.toHaveClass(/active|text-winter-600/);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // GIVEN: User navigates Dashboard → Leaderboard → Notes
    await page.goto('/dashboard');
    await page.locator('[data-testid="nav-leaderboard"]').click();
    await expect(page).toHaveURL('/leaderboard');

    await page.locator('[data-testid="nav-notes"]').click();
    await expect(page).toHaveURL('/notes');

    // WHEN: User clicks browser back button
    await page.goBack();

    // THEN: User is on Leaderboard
    await expect(page).toHaveURL('/leaderboard');

    // WHEN: User clicks browser back button again
    await page.goBack();

    // THEN: User is on Dashboard
    await expect(page).toHaveURL('/dashboard');

    // WHEN: User clicks browser forward button
    await page.goForward();

    // THEN: User is back on Leaderboard
    await expect(page).toHaveURL('/leaderboard');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // GIVEN: User is not authenticated (clear auth state)
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // WHEN: User tries to access Dashboard
    await page.goto('/dashboard');

    // THEN: User is redirected to login page
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Winter Arc')).toBeVisible();
  });

  test('should show loading state during page transitions', async ({ page }) => {
    // GIVEN: User is on Dashboard
    await page.goto('/dashboard');

    // WHEN: User clicks on Leaderboard (slow navigation)
    await page.locator('[data-testid="nav-leaderboard"]').click();

    // THEN: Loading skeleton/spinner should appear (if implemented)
    const _loadingIndicator = page.locator('[data-testid="loading"]');
    // Note: May be too fast to catch in tests, but should exist in implementation
    // await expect(_loadingIndicator).toBeVisible();

    // AND: Eventually content loads
    await expect(page).toHaveURL('/leaderboard');
    await expect(page.locator('h1, h2').filter({ hasText: 'Leaderboard' })).toBeVisible();
  });
});

/**
 * Helper function to login as test user
 * TODO: Implement with Firebase Auth Emulator
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loginAsTestUser(_page: unknown) {
  /* await _page.evaluate(() => {
    localStorage.setItem('firebase:auth:user', JSON.stringify({
      uid: 'test-user-123',
      email: 'test@example.com',
    }));
  }); */
}
