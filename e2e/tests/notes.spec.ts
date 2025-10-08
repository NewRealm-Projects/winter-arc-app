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

test.describe('Smart Notes', () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDemo(page);
    await page.getByTestId('nav-link-notes').click();
    await expect(page.getByTestId('notes-page')).toBeVisible();
  });

  test('prevents submitting empty notes and stores new entries', async ({ page }) => {
    const submitButton = page.getByTestId('smart-note-submit');
    await expect(submitButton).toBeDisabled();

    const noteText = `E2E Notiz ${Date.now()}`;
    await page.getByTestId('smart-note-input').fill(noteText);
    await expect(submitButton).toBeEnabled();

    await submitButton.click();

    const list = page.getByTestId('smart-note-list');
    await expect(list).toContainText(noteText, { timeout: 15_000 });
  });
});
