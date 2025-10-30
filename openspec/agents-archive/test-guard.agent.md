# Test/Guard Agent

**Verantwortung**: Test-Coverage, Regressionsschutz, Lint/TS-Checks, Code Quality Gates

---

## 🎯 Ziel

Stelle sicher, dass:
- **Unit Test Coverage ≥ 70%** (Core-Module)
- **E2E Tests** für kritische User-Flows
- **Visual Regression Tests** (Playwright Screenshots)
- **Lint/TS = 0 Errors** (ESLint + TypeScript strict)
- **Accessibility Tests** (axe-core)
- **Keine ungenutzten Imports/Exports** (eslint-plugin-unused-imports)

---

## 🚨 Trigger (wann dieser Agent läuft)

- Test-Coverage < 70%
- Fehlende E2E-Tests für Core-Flows
- ESLint/TypeScript Errors
- Visual Regressions (Playwright Diffs)
- Accessibility-Violations (axe-core)
- Ungenutzte Imports/Exports (Dead Code)

---

## 📋 Schritte

### 1. Unit Tests (Vitest + React Testing Library)

**Bestandsaufnahme**:
```bash
npm run test:unit -- --coverage
```

**Ziel**: ≥ 70% Coverage für:
- `src/utils/` (z.B. `pushupAlgorithm.ts`)
- `src/services/` (z.B. `firestoreService.ts`, `weatherService.ts`)
- `src/logic/` (z.B. `motivation.ts`)
- `src/hooks/` (z.B. `useAuth`, `useTracking`)

**Beispiel-Tests**:

```typescript
// src/utils/pushupAlgorithm.test.ts
import { describe, it, expect } from 'vitest';
import { initPushupPlan, evaluateWorkout } from './pushupAlgorithm';

describe('pushupAlgorithm', () => {
  it('should initialize plan with correct base reps', () => {
    const plan = initPushupPlan(20);
    expect(plan.baseReps).toBe(9); // Math.floor(0.45 * 20)
    expect(plan.sets).toBe(5);
  });

  it('should progress when all sets hit target', () => {
    const state = { baseReps: 10, sets: 5, restTime: 60 };
    const reps = [10, 10, 10, 10, 12]; // Pass
    const result = evaluateWorkout(state, reps);
    expect(result.baseReps).toBe(11); // Progress
    expect(result.status).toBe('pass');
  });

  it('should hold when 3 sets hit target', () => {
    const state = { baseReps: 10, sets: 5, restTime: 60 };
    const reps = [10, 10, 10, 9, 10]; // Hold
    const result = evaluateWorkout(state, reps);
    expect(result.baseReps).toBe(10); // Hold
    expect(result.status).toBe('hold');
  });
});
```

```typescript
// src/services/weatherService.test.ts
import { describe, it, expect, vi } from 'vitest';
import { fetchWeather } from './weatherService';

describe('weatherService', () => {
  it('should fetch weather data for Aachen', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          current: { temperature_2m: 15, weather_code: 3 }
        }),
      })
    ) as any;

    const weather = await fetchWeather();
    expect(weather.temperature).toBe(15);
    expect(weather.emoji).toBe('☁️'); // WMO code 3 = Overcast
  });
});
```

### 2. E2E Tests (Playwright)

**Core User Flows**:

#### Flow 1: Tagestracking erfassen
```typescript
// tests/tracking.spec.ts
import { test, expect } from '@playwright/test';

test('should track daily pushups', async ({ page }) => {
  await page.goto('/');

  // Login (Mock Firebase Auth)
  await page.click('[data-testid="google-login"]');
  await page.waitForURL('/dashboard');

  // Open Pushup Tile
  await page.click('[data-testid="pushup-tile"]');

  // Enter pushups (Quick Mode)
  await page.fill('[data-testid="pushup-input"]', '50');
  await page.click('[data-testid="save-pushups"]');

  // Verify updated value
  await expect(page.locator('[data-testid="pushup-total"]')).toHaveText('50');
});
```

#### Flow 2: Trainingsmodus (Base & Bump)
```typescript
// tests/training.spec.ts
test('should complete training mode workout', async ({ page }) => {
  await page.goto('/pushup-training');

  // Verify daily plan
  await expect(page.locator('[data-testid="set-1-target"]')).toHaveText('10');

  // Enter reps for each set
  for (let i = 1; i <= 5; i++) {
    await page.fill(`[data-testid="set-${i}-input"]`, '10');
    await page.click(`[data-testid="next-set"]`);

    // Wait for rest timer (60s, but skip in test)
    if (i < 5) {
      await page.click('[data-testid="skip-rest"]');
    }
  }

  // Verify status
  await expect(page.locator('[data-testid="workout-status"]')).toHaveText('Pass');
});
```

#### Flow 3: Navigation & Settings
```typescript
// tests/navigation.spec.ts
test('should navigate between pages', async ({ page }) => {
  await page.goto('/dashboard');

  // Bottom Nav: Dashboard → Leaderboard → Notes
  await page.click('[data-testid="nav-leaderboard"]');
  await expect(page).toHaveURL('/leaderboard');

  await page.click('[data-testid="nav-notes"]');
  await expect(page).toHaveURL('/notes');

  // Top-Right: Settings
  await page.click('[data-testid="nav-settings"]');
  await expect(page).toHaveURL('/settings');
});
```

### 3. Visual Regression Tests (Playwright)

**Screenshots für Key Screens**:

```typescript
// tests/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('Dashboard - Light Mode', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard-light.png');
  });

  test('Dashboard - Dark Mode', async ({ page }) => {
    await page.goto('/dashboard');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(page).toHaveScreenshot('dashboard-dark.png');
  });

  test('Tiles - Mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="tracking-tiles"]')).toHaveScreenshot('tiles-mobile.png');
  });
});
```

**Update Baseline** (nach bewussten UI-Änderungen):
```bash
npm run test:ui -- --update-snapshots
```

### 4. Accessibility Tests (axe-core)

**Bereits vorhanden** (`src/__tests__/a11y.test.tsx`):

```typescript
// src/__tests__/a11y.test.tsx
import { describe, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { DashboardPage } from '../pages/DashboardPage';

describe('Accessibility', () => {
  it('should not have a11y violations on Dashboard', async () => {
    const { container } = render(<DashboardPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

**Erweitere für alle Pages**:
- Leaderboard
- Notes
- Settings
- Onboarding

### 5. ESLint & TypeScript Strict

**Lint-Check**:
```bash
npm run lint
```

**Behebe**:
- Ungenutzte Imports (`eslint-plugin-unused-imports`)
- React Hooks Rules
- TypeScript `any` Types

**TypeScript Strict**:
```bash
npm run typecheck
```

**Ziel**: 0 Errors, 0 Warnings

**Strikte Regeln** (bereits in `tsconfig.json`):
```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true
}
```

### 6. Dead Code Detection

**Knip** (findet ungenutzte Files/Exports):
```bash
npm run scan:knip
```

**ts-prune** (findet ungenutzte TypeScript Exports):
```bash
npm run scan:tsprune
```

**depcheck** (findet ungenutzte Dependencies):
```bash
npm run scan:dep
```

**Entferne**:
- Ungenutzte Komponenten
- Ungenutzte Utils
- Ungenutzte npm Packages

---

## 📦 Artefakte (in `artifacts/test-guard/`)

1. **Coverage Report**:
   - `coverage/index.html` (Vitest Coverage)
   - `coverage-summary.txt`

2. **Playwright Report**:
   - `playwright-report/index.html`
   - `test-results/` (Screenshots, Videos)

3. **Lint/TS Logs**:
   - `lint-report.txt` (ESLint Output)
   - `typecheck-report.txt` (TypeScript Errors)

4. **Accessibility Report**:
   - `a11y-violations.json` (axe-core Results)

---

## ✅ Definition of Done

- [ ] Unit Test Coverage ≥ 70% (Core-Module)
- [ ] E2E Tests für 3 Core-Flows (Tracking, Training, Navigation)
- [ ] Visual Regression Tests (Light & Dark, Mobile)
- [ ] Accessibility Tests (axe-core, 0 Violations)
- [ ] Lint/TS = 0 Errors
- [ ] Dead Code entfernt (Knip, ts-prune, depcheck)
- [ ] PR gegen `dev` mit Reports

---

## 🔄 Branch & PR

**Branch-Name**: `feat/test-guard-e2e-flows`

**PR-Template**:
- **Ziel**: Test-Coverage ≥70%, E2E-Tests, 0 Lint/TS Errors
- **Änderungen**:
  - Unit Tests für `pushupAlgorithm`, `weatherService`, `motivation`
  - E2E Tests: Tracking, Training, Navigation
  - Visual Regression Tests (Light/Dark, Mobile)
  - Accessibility Tests (axe-core)
  - Dead Code entfernt (3 ungenutzte Utils)
- **Getestet**:
  - Coverage: 75% ✅
  - E2E: 100% Pass (3 Flows) ✅
  - Lint/TS: 0 Errors ✅
  - a11y: 0 Violations ✅
- **Artefakte**:
  - `artifacts/test-guard/coverage/`
  - `artifacts/test-guard/playwright-report/`
  - `artifacts/test-guard/lint-report.txt`
- **Risiken**: Keine

---

## 🚀 Nächste Schritte

1. **UI-Refactor Agent**: Visual Tests für neue Tiles
2. **Docs/Changelog Agent**: Testing-Guide im README
