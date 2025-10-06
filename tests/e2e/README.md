# E2E Test Suite - Winter Arc

End-to-End tests für kritische User-Flows.

## 📋 Test Coverage

### 1. Tracking Flow (`tracking.spec.ts`)
- ✅ Water intake tracking
- ✅ Protein intake tracking
- ✅ Pushup quick input
- ✅ Sport activity tracking
- ✅ Weight and BMI tracking
- ✅ Data persistence after reload
- ✅ Week overview completion

**Total**: 8 tests

### 2. Navigation Flow (`navigation.spec.ts`)
- ✅ Bottom navigation (Dashboard, Leaderboard, Notes)
- ✅ Top navigation (Settings icon)
- ✅ Deep linking (Pushup Training)
- ✅ State preservation during navigation
- ✅ Active navigation highlighting
- ✅ Browser back/forward support
- ✅ Auth redirect protection
- ✅ Loading states

**Total**: 9 tests

### 3. Training Flow (`training.spec.ts`)
- ✅ Daily plan display (5 sets)
- ✅ Workout completion (Pass status)
- ✅ Workout hold (Hold status)
- ✅ Workout regression (Fail status)
- ✅ Rest timer between sets
- ✅ Input validation
- ✅ Firestore data persistence
- ✅ Info banner display

**Total**: 9 tests

## 🚀 Running Tests

### Prerequisites

**Option A: Firebase Auth Emulator (Recommended)**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Start Auth Emulator
firebase emulators:start --only auth

# Run tests
npm run test:e2e
```

**Option B: Test User Credentials**
```bash
# Set test user credentials in .env.test
VITE_TEST_USER_EMAIL=test@example.com
VITE_TEST_USER_PASSWORD=testpassword123

# Run tests
npm run test:e2e
```

### Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/tracking.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Update snapshots (visual tests)
npx playwright test --update-snapshots
```

## 🛠️ Implementation Status

### Current State: **Specification Only**

These tests are currently **specification/documentation**. They define:
- Expected user interactions
- Success criteria
- Edge cases
- Error handling

### Next Steps for Implementation:

1. **Setup Firebase Auth Emulator**
   ```bash
   firebase init emulators
   # Select: Authentication
   ```

2. **Create Test User Factory**
   ```typescript
   // tests/helpers/auth.ts
   export async function createTestUser() {
     // Create user in Auth Emulator
     // Return { uid, email, token }
   }
   ```

3. **Implement Test Fixtures**
   ```typescript
   // tests/fixtures/auth.fixture.ts
   export const test = base.extend({
     authenticatedPage: async ({ page }, use) => {
       await loginAsTestUser(page);
       await use(page);
     }
   });
   ```

4. **Add Data Testids**
   Add `data-testid` attributes to components:
   ```tsx
   <div data-testid="water-tile">
     <button data-testid="add-500ml">+500</button>
     <span data-testid="water-value">0.50L</span>
   </div>
   ```

5. **Run Tests in CI**
   Update `.github/workflows/ci.yml`:
   ```yaml
   - name: Start Firebase Emulators
     run: firebase emulators:start --only auth &

   - name: Run E2E Tests
     run: npm run test:e2e
   ```

## 📐 Test Structure

Each test follows **Given-When-Then** pattern:

```typescript
test('should track water intake', async ({ page }) => {
  // GIVEN: User is on dashboard
  await page.goto('/dashboard');

  // WHEN: User adds 500ml
  await page.locator('[data-testid="add-500ml"]').click();

  // THEN: Water count increases
  await expect(page.locator('[data-testid="water-value"]')).toContainText('0.50L');
});
```

## 🎯 Coverage Goals

- **Critical Flows**: 100% (Tracking, Navigation, Training)
- **Error Scenarios**: 80%
- **Edge Cases**: 60%

## 🐛 Known Issues / TODOs

- [ ] Firebase Auth Emulator setup pending
- [ ] Test data cleanup strategy needed
- [ ] Parallel test execution (avoid data conflicts)
- [ ] Screenshot comparison for visual regression
- [ ] Performance budgets (TTI < 2s)

## 📚 Resources

- [Playwright Docs](https://playwright.dev/)
- [Firebase Auth Emulator](https://firebase.google.com/docs/emulator-suite)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)

---

**Last Updated**: 2025-01-06
