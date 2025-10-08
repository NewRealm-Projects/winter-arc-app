import { expect, test, Page } from '@playwright/test';

async function loginWithDemo(page: Page) {
  await page.goto('/');
  const loginVisible = await page
    .getByTestId('login-page')
    .isVisible()
    .catch(() => false);

  if (loginVisible) {
    await page.getByTestId('demo-login-button').click();
  }

  await expect(page.getByTestId('dashboard-page')).toBeVisible();
}

test.describe('Winter Arc smoke flow', () => {
  test('navigates through primary pages after demo login', async ({ page }) => {
    await loginWithDemo(page);

    await expect(page.getByTestId('bottom-navigation')).toBeVisible();

    await page.getByTestId('nav-link-notes').click();
    await expect(page.getByTestId('notes-page')).toBeVisible();

    await page.getByTestId('nav-link-leaderboard').click();
    await expect(page.getByTestId('leaderboard-page')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('nav-link-dashboard').click();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });
});
