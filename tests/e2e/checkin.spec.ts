import { test, expect } from '@playwright/test';

test.describe('Check-in Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Use demo mode for E2E tests
    const demoButton = page.getByTestId('demo-login-button');
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForURL('/', { timeout: 5000 });
    }
  });

  test('should open check-in modal and save successfully', async ({ page }) => {
    // Open training load tile (which opens check-in modal)
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await expect(trainingLoadTile).toBeVisible();
    await trainingLoadTile.click();

    // Wait for modal to open
    const modal = page.locator('#daily-check-in-modal');
    await expect(modal).toBeVisible();

    // Fill in check-in form
    const sleepSlider = page.locator('#sleep-score');
    await sleepSlider.fill('8');

    const recoverySlider = page.locator('#recovery-score');
    await recoverySlider.fill('7');

    // Optional: Toggle sick status
    const sickToggle = page.locator('#sick-toggle');
    await sickToggle.click(); // Toggle to sick

    // Save the check-in
    const saveButton = page.getByRole('button', { name: /save|speichern/i });
    await saveButton.click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Verify training load tile shows updated values
    await expect(trainingLoadTile).toBeVisible();

    // Check that sleep score is displayed
    const sleepValue = page.getByTestId('training-load-sleep-value');
    await expect(sleepValue).toContainText(/8/);

    // Check that recovery score is displayed
    const recoveryValue = page.getByTestId('training-load-recovery-value');
    await expect(recoveryValue).toContainText(/7/);
  });

  test('should update training load after check-in', async ({ page }) => {
    // Open training load tile
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    // Wait for modal
    const modal = page.locator('#daily-check-in-modal');
    await expect(modal).toBeVisible();

    // Set high wellness scores
    await page.locator('#sleep-score').fill('10');
    await page.locator('#recovery-score').fill('10');

    // Save
    await page.getByRole('button', { name: /save|speichern/i }).click();

    // Wait for modal to close
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Verify that training load value is displayed (should be > 0)
    const loadValue = trainingLoadTile.locator('div').filter({ hasText: /^\d+$/ }).first();
    await expect(loadValue).toBeVisible();

    // Get the text and verify it's a number
    const loadText = await loadValue.textContent();
    const load = parseInt(loadText || '0', 10);
    expect(load).toBeGreaterThan(0);
  });

  test('should reduce training load when sick', async ({ page }) => {
    // Open training load tile
    const trainingLoadTile = page.getByTestId('training-load-tile');

    // First check-in: healthy
    await trainingLoadTile.click();
    const modal = page.locator('#daily-check-in-modal');
    await expect(modal).toBeVisible();

    await page.locator('#sleep-score').fill('7');
    await page.locator('#recovery-score').fill('7');
    await page.getByRole('button', { name: /save|speichern/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Get healthy load value
    const loadValueHealthy = trainingLoadTile.locator('div').filter({ hasText: /^\d+$/ }).first();
    const healthyLoadText = await loadValueHealthy.textContent();
    const healthyLoad = parseInt(healthyLoadText || '0', 10);

    // Second check-in: sick
    await trainingLoadTile.click();
    await expect(modal).toBeVisible();

    await page.locator('#sleep-score').fill('7');
    await page.locator('#recovery-score').fill('7');
    await page.locator('#sick-toggle').click(); // Toggle to sick
    await page.getByRole('button', { name: /save|speichern/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 5000 });

    // Get sick load value
    const loadValueSick = trainingLoadTile.locator('div').filter({ hasText: /^\d+$/ }).first();
    const sickLoadText = await loadValueSick.textContent();
    const sickLoad = parseInt(sickLoadText || '0', 10);

    // Verify sick load is less than healthy load
    expect(sickLoad).toBeLessThan(healthyLoad);
  });

  test('should close modal on cancel', async ({ page }) => {
    // Open training load tile
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    // Wait for modal
    const modal = page.locator('#daily-check-in-modal');
    await expect(modal).toBeVisible();

    // Click cancel
    const cancelButton = page.getByRole('button', { name: /cancel|abbrechen/i });
    await cancelButton.click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('should close modal on ESC key', async ({ page }) => {
    // Open training load tile
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    // Wait for modal
    const modal = page.locator('#daily-check-in-modal');
    await expect(modal).toBeVisible();

    // Press ESC
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });
});
