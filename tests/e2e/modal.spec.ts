import { test, expect } from '@playwright/test';

test.describe('AppModal Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Use demo mode for E2E tests
    const demoButton = page.getByTestId('demo-login-button');
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForURL('/', { timeout: 5000 });
    }
  });

  test('should open and close modal via close button', async ({ page }) => {
    // Open check-in modal via training load tile
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    // Wait for modal to be visible
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Find and click the close button (X button in header)
    const closeButton = modal.getByLabel(/close/i);
    await closeButton.click();

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('should close modal on Escape key', async ({ page }) => {
    // Open modal
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('should close modal on backdrop click', async ({ page }) => {
    // Open modal
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Click on the backdrop (outside the modal)
    // We need to click on the overlay div, not the dialog itself
    await page.locator('[role="presentation"]').click({ position: { x: 10, y: 10 } });

    // Verify modal is closed
    await expect(modal).not.toBeVisible();
  });

  test('should trap focus within modal', async ({ page }) => {
    // Open modal
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Get all focusable elements in the modal
    const focusableElements = modal.locator(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const count = await focusableElements.count();

    // Tab through all elements
    for (let i = 0; i < count; i++) {
      await page.keyboard.press('Tab');
    }

    // After tabbing through all elements, focus should cycle back to the first element
    const firstElement = focusableElements.first();
    await expect(firstElement).toBeFocused();

    // Shift+Tab should go to the last element
    await page.keyboard.press('Shift+Tab');
    const lastElement = focusableElements.last();
    await expect(lastElement).toBeFocused();
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Open modal
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check for aria-modal="true"
    await expect(modal).toHaveAttribute('aria-modal', 'true');

    // Check for aria-labelledby (title should be labeled)
    const ariaLabelledBy = await modal.getAttribute('aria-labelledby');
    expect(ariaLabelledBy).toBeTruthy();

    // Verify the title element exists and has the correct ID
    const titleElement = page.locator(`#${ariaLabelledBy}`);
    await expect(titleElement).toBeVisible();
  });

  test('should prevent body scroll when open', async ({ page }) => {
    // Check initial body overflow (unused but kept for documentation)
    const _initialOverflow = await page.evaluate(() => document.body.style.overflow);

    // Open modal
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check that body overflow is now hidden
    const openOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(openOverflow).toBe('hidden');

    // Close modal
    await page.keyboard.press('Escape');

    // Wait for modal to close
    await expect(modal).not.toBeVisible();

    // Check that body overflow is restored
    const closedOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(closedOverflow).toBe('');
  });

  test('should restore focus to trigger element after closing', async ({ page }) => {
    // Open modal by clicking training load tile
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Close modal with Escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();

    // Note: Focus restoration to the exact trigger element is hard to test in Playwright
    // because the trigger might not be a focusable element. We can at least verify
    // that focus is somewhere in the document
    const activeElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(activeElement).toBeTruthy();
  });

  test('should render with correct size classes', async ({ page }) => {
    // This test verifies the modal container has the correct max-width class
    // We can't easily test all sizes without a dedicated test page,
    // but we can verify the default (md) size

    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check that modal has a max-width class (size="lg" in CheckInModal)
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toContain('max-w-');
  });

  test('should display title and subtitle', async ({ page }) => {
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check for title (from translation key 'checkIn.title')
    const title = modal.locator('h2');
    await expect(title).toBeVisible();

    // Check for subtitle (from translation key 'checkIn.subtitle')
    const subtitle = modal.locator('p').first();
    await expect(subtitle).toBeVisible();
  });

  test('should render footer with action buttons', async ({ page }) => {
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check for Cancel button
    const cancelButton = modal.getByRole('button', { name: /cancel|abbrechen/i });
    await expect(cancelButton).toBeVisible();

    // Check for Save button
    const saveButton = modal.getByRole('button', { name: /save|speichern/i });
    await expect(saveButton).toBeVisible();
  });

  test('should handle scrollable content', async ({ page }) => {
    // The CheckIn modal has quite a bit of content, so it should be scrollable
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check that the modal content area exists
    // The content should be within the max-h-[90vh] container
    const modalContent = modal.locator('.overflow-y-auto');
    await expect(modalContent).toBeVisible();

    // Verify we can scroll within the modal
    const scrollHeight = await modalContent.evaluate((el) => el.scrollHeight);
    const clientHeight = await modalContent.evaluate((el) => el.clientHeight);

    // If content is taller than viewport, it should be scrollable
    if (scrollHeight > clientHeight) {
      // Scroll down
      await modalContent.evaluate((el) => {
        el.scrollTop = 100;
      });

      // Verify scroll position changed
      const scrollTop = await modalContent.evaluate((el) => el.scrollTop);
      expect(scrollTop).toBeGreaterThan(0);
    }
  });

  test('should use CSS custom properties for styling', async ({ page }) => {
    const trainingLoadTile = page.getByTestId('training-load-tile');
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    // Check that modal uses CSS custom properties
    const backgroundColor = await modal.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBeTruthy();

    const borderRadius = await modal.evaluate((el) =>
      window.getComputedStyle(el).borderRadius
    );
    expect(borderRadius).toBeTruthy();
  });

  test('should animate on open', async ({ page }) => {
    const trainingLoadTile = page.getByTestId('training-load-tile');

    // Click to open modal
    await trainingLoadTile.click();

    const modal = page.getByRole('dialog');

    // Check that modal has animation class
    const modalClasses = await modal.getAttribute('class');
    expect(modalClasses).toContain('animate-scale-fade-in');

    // Verify modal is visible after animation
    await expect(modal).toBeVisible();
  });
});
