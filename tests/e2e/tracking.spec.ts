import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Tracking Flow
 *
 * Tests the daily tracking functionality (Water, Protein, Pushups, Sport, Weight).
 *
 * Prerequisites:
 * - Firebase Auth Emulator or Test User credentials
 * - Test data cleanup after each test
 *
 * TODO: Setup Firebase Auth Emulator for automated testing
 * For now, these tests serve as specification/documentation.
 */

test.describe('Tracking Flow', () => {
  test.beforeEach(async ({ page: _page }) => {
    // TODO: Setup Firebase Auth Emulator or mock auth
    // await _page.goto('/');
    // await loginAsTestUser(_page);
    // await _page.waitForURL('/dashboard');
  });

  test('should track water intake', async ({ page }) => {
    // GIVEN: User is on dashboard
    await page.goto('/dashboard');

    // WHEN: User clicks on Water Tile
    const waterTile = page.locator('[data-testid="water-tile"]');
    await expect(waterTile).toBeVisible();

    // AND: User adds 500ml
    const add500mlButton = waterTile.locator('button:has-text("+500")');
    await add500mlButton.click();

    // THEN: Water count should increase by 500ml
    const waterValue = waterTile.locator('[data-testid="water-value"]');
    await expect(waterValue).toContainText('0.50L');

    // AND: Progress bar should update
    const progressBar = waterTile.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // AND: Tile should show tracked state (green glow)
    await expect(waterTile).toHaveClass(/tile-tracked/);
  });

  test('should track protein intake', async ({ page }) => {
    // GIVEN: User is on dashboard
    await page.goto('/dashboard');

    // WHEN: User clicks on Protein Tile
    const proteinTile = page.locator('[data-testid="protein-tile"]');
    await expect(proteinTile).toBeVisible();

    // AND: User clicks "Add Protein" button
    await proteinTile.locator('button:has-text("Protein")').click();

    // AND: User enters 30g and saves
    const input = proteinTile.locator('input[type="number"]');
    await input.fill('30');
    await proteinTile.locator('button:has-text("+")').click();

    // THEN: Protein count should show 30g
    const proteinValue = proteinTile.locator('[data-testid="protein-value"]');
    await expect(proteinValue).toContainText('30g');

    // AND: Tile should show tracked state
    await expect(proteinTile).toHaveClass(/tile-tracked/);
  });

  test('should track pushups via quick input', async ({ page }) => {
    // GIVEN: User is on dashboard
    await page.goto('/dashboard');

    // WHEN: User clicks on Pushup Tile
    const pushupTile = page.locator('[data-testid="pushup-tile"]');
    await pushupTile.click();

    // AND: Modal opens with quick input
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Add Pushups');

    // AND: User enters 50 pushups
    const input = modal.locator('input[type="number"]');
    await input.fill('50');

    // AND: User saves
    await modal.locator('button:has-text("Add")').click();

    // THEN: Modal closes
    await expect(modal).not.toBeVisible();

    // AND: Pushup count shows 50
    const pushupValue = pushupTile.locator('[data-testid="pushup-value"]');
    await expect(pushupValue).toContainText('50');

    // AND: Tile shows tracked state
    await expect(pushupTile).toHaveClass(/tile-tracked/);
  });

  test('should track sport activity', async ({ page }) => {
    // GIVEN: User is on dashboard
    await page.goto('/dashboard');

    // WHEN: User clicks on Sport Tile
    const sportTile = page.locator('[data-testid="sport-tile"]');
    await expect(sportTile).toBeVisible();

    // AND: User selects "HIIT" activity
    const hiitButton = sportTile.locator('button:has-text("🔥")');
    await hiitButton.click();

    // AND: Modal opens for duration/intensity
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // AND: User sets 60 minutes, intensity 7
    await modal.locator('button:has-text("60 min")').click();
    await modal.locator('button:has-text("7")').click();

    // AND: User saves
    await modal.locator('button:has-text("Save")').click();

    // THEN: Modal closes
    await expect(modal).not.toBeVisible();

    // AND: Sport count increases to 1
    const sportValue = sportTile.locator('[data-testid="sport-value"]');
    await expect(sportValue).toContainText('1');

    // AND: HIIT button shows active state
    await expect(hiitButton).toHaveClass(/border-blue-400/);
  });

  test('should track weight and calculate BMI', async ({ page }) => {
    // GIVEN: User is on dashboard and has height in profile
    await page.goto('/dashboard');

    // WHEN: User clicks on Weight Tile "Add Weight" button
    const weightTile = page.locator('[data-testid="weight-tile"]');
    await weightTile.locator('button:has-text("Add Weight")').click();

    // AND: Input fields appear
    const weightInput = weightTile.locator('input[placeholder*="Gewicht"]');
    const bodyFatInput = weightTile.locator('input[placeholder*="KFA"]');

    // AND: User enters weight 80kg and body fat 15%
    await weightInput.fill('80');
    await bodyFatInput.fill('15');

    // AND: User saves
    await weightTile.locator('button:has-text("Speichern")').click();

    // THEN: Inputs close
    await expect(weightInput).not.toBeVisible();

    // AND: Weight displays 80kg
    const weightValue = weightTile.locator('[data-testid="weight-value"]');
    await expect(weightValue).toContainText('80kg');

    // AND: BMI is calculated and displayed (assuming height 180cm: BMI = 24.7)
    const bmiValue = weightTile.locator('[data-testid="bmi-value"]');
    await expect(bmiValue).toBeVisible();
    await expect(bmiValue).toContainText('BMI:');
  });

  test('should persist tracking data after page reload', async ({ page }) => {
    // GIVEN: User has tracked water intake
    await page.goto('/dashboard');
    const waterTile = page.locator('[data-testid="water-tile"]');
    await waterTile.locator('button:has-text("+500")').click();

    // WHEN: User reloads the page
    await page.reload();
    await page.waitForURL('/dashboard');

    // THEN: Water count should still show 0.50L
    const waterValue = waterTile.locator('[data-testid="water-value"]');
    await expect(waterValue).toContainText('0.50L');
  });

  test('should show week overview with completed days', async ({ page }) => {
    // GIVEN: User has tracked multiple items today
    await page.goto('/dashboard');

    // Track water
    await page.locator('[data-testid="water-tile"] button:has-text("+500")').click();

    // Track protein
    const proteinTile = page.locator('[data-testid="protein-tile"]');
    await proteinTile.locator('button:has-text("Protein")').click();
    await proteinTile.locator('input[type="number"]').fill('30');
    await proteinTile.locator('button:has-text("+")').click();

    // WHEN: User looks at week overview
    const weekOverview = page.locator('[data-testid="week-overview"]');
    await expect(weekOverview).toBeVisible();

    // THEN: Today should be marked as completed
    const todayCircle = weekOverview.locator('[data-day="today"]');
    await expect(todayCircle).toHaveClass(/completed/);
  });
});

/**
 * Helper function to login as test user
 * TODO: Implement with Firebase Auth Emulator
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function loginAsTestUser(_page: unknown) {
  // Mock implementation
  // In real scenario:
  // 1. Setup Firebase Auth Emulator
  // 2. Create test user with known credentials
  // 3. Perform login via Google OAuth mock
  /* await _page.evaluate(() => {
    // Mock Firebase Auth state
    localStorage.setItem('firebase:auth:user', JSON.stringify({
      uid: 'test-user-123',
      email: 'test@example.com',
    }));
  }); */
}
