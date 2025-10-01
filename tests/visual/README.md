# Visual Testing Setup

This directory contains visual regression tests for the Winter Arc App using Playwright.

## Quick Start

### 1. Install Playwright Browsers (First Time Only)

```bash
npx playwright install chromium
```

### 2. Run Visual Tests

**Headless mode (CI/automated):**
```bash
npm run test:visual
```

**UI mode (interactive, recommended for development):**
```bash
npm run test:visual:ui
```

**Headed mode (see browser):**
```bash
npm run test:visual:headed
```

**Update snapshots after UI changes:**
```bash
npm run test:visual:update
```

## How It Works

1. **Automatic Dev Server**: Playwright automatically starts `npm run web:test` before tests
2. **Screenshot Capture**: Tests navigate to the app and take screenshots
3. **Visual Comparison**: Screenshots are compared against baseline images
4. **Test Reports**: HTML report generated in `playwright-report/`

## Test Coverage

- ✅ Home Screen (Light/Dark Mode)
- ✅ Liquid Glass Components (Cards/Buttons)
- ✅ Responsive Layout (Mobile/Tablet/Desktop)

## Workflow

### Before Pushing Changes:

```bash
# 1. Run visual tests in UI mode to verify changes
npm run test:visual:ui

# 2. If UI looks good, update snapshots
npm run test:visual:update

# 3. Commit updated snapshots
git add tests/visual/**/*.png
git commit -m "test: update visual snapshots"
```

### After Making UI Changes:

If tests fail with visual differences:
1. Review diff in `playwright-report/index.html`
2. If changes are intentional: `npm run test:visual:update`
3. If changes are bugs: fix the code and re-run tests

## Screenshot Locations

- **Baseline**: `tests/visual/*.spec.ts-snapshots/`
- **Failed diffs**: `test-results/*/`
- **HTML report**: `playwright-report/index.html`

## Configuration

See `playwright.config.ts` for:
- Browser configuration
- Viewport sizes
- Timeout settings
- Screenshot options

## Tips

- Use UI mode (`npm run test:visual:ui`) for debugging
- Screenshots ignore animations for stability
- Tests wait for liquid glass effects to render (1s delay)
- Full page screenshots capture entire scrollable area
