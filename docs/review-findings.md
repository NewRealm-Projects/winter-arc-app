# Codebase Review Findings

## 1. Typo Fix Task
- **Issue:** In the feature list the German phrase "wöchentlichem/monatlichem Statistiken" mixes cases and should read "wöchentlichen/monatlichen Statistiken".
- **Location:** `README.md`, line 18.
- **Suggested Task:** Update the bullet to use the correct plural adjective so the sentence is grammatically correct.

## 2. Programming Bug Fix Task
- **Issue:** `generateProgressivePlan` can produce a zero-repetition set when the rounded distribution overshoots the daily total (e.g., previousTotal = 5 ⇒ sets[0] becomes 0 after diff adjustment).
- **Location:** `src/utils/pushupAlgorithm.ts`, lines 83-122.
- **Suggested Task:** Adjust the diff redistribution so that all sets stay ≥ 1 while still summing to `totalToday` (e.g., spread the adjustment across sets with bounds checking).

## 3. Documentation Alignment Task
- **Issue:** The README documents an `npm run test:e2e` script, but `package.json` does not define it (only `test:ui`).
- **Location:** `README.md`, lines 169-180 and `package.json` scripts section.
- **Suggested Task:** Either add the missing `test:e2e` script (proxying to Playwright) or update the README to reflect the available commands so docs match tooling.

## 4. Test Improvement Task
- **Issue:** There is no unit test safeguarding the edge cases of `generateProgressivePlan`, allowing regressions such as zero-length sets to slip through.
- **Location:** `src/utils/pushupAlgorithm.ts` (implementation) and `src/__tests__` (test suite).
- **Suggested Task:** Add Vitest coverage for `generateProgressivePlan` to assert that the sum matches `totalToday` and each set stays ≥ 1, covering small `previousTotal` values.
