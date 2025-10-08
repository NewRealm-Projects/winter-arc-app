import { expect, test, Page } from '@playwright/test';
import { format, startOfISOWeek } from 'date-fns';

async function loginAtPath(page: Page, path = '/') {
  await page.goto(path);
  const loginVisible = await page
    .getByTestId('login-page')
    .isVisible()
    .catch(() => false);

  if (loginVisible) {
    await page.getByTestId('demo-login-button').click();
  }

  await expect(page.getByTestId('dashboard-page')).toBeVisible();
}

function getIsoWeekParam(date: Date): string {
  const weekStart = startOfISOWeek(date);
  return `${format(weekStart, 'RRRR')}-${format(weekStart, 'II')}`;
}

test.describe('Week navigation', () => {
  test('updates header label when navigating weeks', async ({ page }) => {
    await loginAtPath(page);

    const headerLabel = page.getByTestId('header-week-range');
    const weekCard = page.getByTestId('week-circles-card');
    const previousButton = page.getByRole('button', { name: /Vorherige Woche/i });
    const nextButton = page.getByRole('button', { name: /Nächste Woche/i });

    const initialText = (await headerLabel.textContent())?.trim() ?? '';
    expect(initialText.length).toBeGreaterThan(0);

    const initialSelectedDayNumber = (
      (await weekCard
        .locator('button[aria-pressed="true"] span')
        .filter({ hasText: /^\d+$/ })
        .first()
        .textContent()) ?? ''
    ).trim();

    await previousButton.click();

    await expect(headerLabel).not.toHaveText(initialText, { timeout: 5000 });
    const updatedText = (await headerLabel.textContent())?.trim() ?? '';
    expect(updatedText.length).toBeGreaterThan(0);

    const previousWeekSelectedDayNumber = (
      (await weekCard
        .locator('button[aria-pressed="true"] span')
        .filter({ hasText: /^\d+$/ })
        .first()
        .textContent()) ?? ''
    ).trim();

    expect(previousWeekSelectedDayNumber).not.toBe(initialSelectedDayNumber);

    await nextButton.click();

    await expect(headerLabel).toHaveText(initialText, { timeout: 5000 });

    const currentWeekSelectedDayNumber = (
      (await weekCard
        .locator('button[aria-pressed="true"] span')
        .filter({ hasText: /^\d+$/ })
        .first()
        .textContent()) ?? ''
    ).trim();

    expect(currentWeekSelectedDayNumber).toBe(initialSelectedDayNumber);
    await expect(nextButton).toBeDisabled();

    await expect(page).toHaveURL(/week=/);
  });

  test('retains week selection from query after reload', async ({ page }) => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const targetWeekParam = getIsoWeekParam(lastWeek);

    await loginAtPath(page, `/?week=${targetWeekParam}`);

    const headerLabel = page.getByTestId('header-week-range');
    const beforeReload = (await headerLabel.textContent())?.trim() ?? '';
    expect(beforeReload.length).toBeGreaterThan(0);
    await expect(page).toHaveURL(new RegExp(`week=${targetWeekParam}`));

    await page.reload();

    await expect(headerLabel).toHaveText(beforeReload, { timeout: 5000 });
    await expect(page).toHaveURL(new RegExp(`week=${targetWeekParam}`));
  });
});
