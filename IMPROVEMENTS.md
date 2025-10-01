# IMPROVEMENTS.md

**🚀 Fehlende Features & Verbesserungsvorschläge**

Diese Datei dokumentiert systematisch, was dem Winter Arc Projekt noch fehlt für eine **bessere, stabilere und schnellere** Entwicklung.

**Version:** 1.1.0
**Erstellt:** 2025-10-01
**Letzte Aktualisierung:** 2025-10-01
**Ziel:** Production-Ready App mit professionellen DevOps-Praktiken

## ✅ Implementierte Improvements (2025-10-01)

**Bereits umgesetzt:**
1. ✅ **Testing Framework** - Jest + React Testing Library konfiguriert
2. ✅ **Code Quality Tools** - ESLint + Prettier + Husky eingerichtet
3. ⏸️ **Error Tracking** - Geplant für nächsten Sprint (Sentry Setup komplex)

**Details siehe Commit:** `feat: add testing framework + code quality tools`

---

## 📋 Inhaltsverzeichnis

- [Critical (Sofort notwendig)](#critical-sofort-notwendig)
- [High Priority (Nächster Sprint)](#high-priority-nächster-sprint)
- [Medium Priority (Backlog)](#medium-priority-backlog)
- [Nice to Have (Wishlist)](#nice-to-have-wishlist)
- [Implementierungsplan](#implementierungsplan)

---

## Critical (Sofort notwendig)

### 1. ✅ Testing Framework - **IMPLEMENTIERT**

**Problem:**
- **Keine Unit Tests** - Keine Absicherung gegen Regressions
- **Keine Integration Tests** - Database/Firebase Logik ungetestet
- **Keine E2E Tests** - User Flows ungetestet
- **Keine Test Coverage** - Unbekannte Code-Qualität

**Impact:** 🔴 **HOCH**
- Bugs werden erst in Production entdeckt
- Refactoring ist gefährlich
- Keine Vertrauensbasis für Deployments

**Lösung:**
```bash
# 1. Jest + React Testing Library installieren
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest

# 2. jest.config.js erstellen
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/types/**/*'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80
    }
  }
};

# 3. Package.json Scripts
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
"test:ci": "jest --ci --coverage --maxWorkers=2"
```

**Erste Tests implementieren:**
```typescript
// src/services/__tests__/database.test.ts
import { calculateBMI } from '../database';

describe('calculateBMI', () => {
  it('should calculate BMI correctly', () => {
    expect(calculateBMI(80, 180)).toBeCloseTo(24.69, 2);
  });

  it('should handle edge cases', () => {
    expect(calculateBMI(50, 150)).toBeCloseTo(22.22, 2);
  });
});

// src/components/__tests__/GlassButton.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { GlassButton } from '../GlassButton';

describe('GlassButton', () => {
  it('renders correctly', () => {
    const { getByText } = render(<GlassButton title="Test" />);
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when clicked', () => {
    const onPress = jest.fn();
    const { getByText } = render(<GlassButton title="Test" onPress={onPress} />);
    fireEvent.press(getByText('Test'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

**Aufwand:** ~2-3 Tage für Setup + erste Tests
**ROI:** ⭐⭐⭐⭐⭐ (Kritisch für Stabilität)

---

### 2. ✅ Code Quality Tools - **IMPLEMENTIERT**

**Problem:**
- **Kein ESLint** - Keine Code-Style-Konsistenz
- **Kein Prettier** - Inkonsistente Formatierung
- **Keine Pre-commit Hooks** - Fehler landen in Git
- **Kein TypeScript Strict Mode** - Schwache Type Safety

**Impact:** 🔴 **HOCH**
- Inkonsistenter Code-Stil im Team
- Type-Fehler erst zur Laufzeit entdeckt
- Schlechte Code-Qualität

**Lösung:**
```bash
# 1. ESLint + Prettier installieren
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
npm install --save-dev eslint-plugin-react eslint-plugin-react-native

# 2. Husky + lint-staged (Pre-commit Hooks)
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

**.eslintrc.js:**
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-native/all',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    'react/react-in-jsx-scope': 'off',
    'react-native/no-inline-styles': 'warn'
  }
};
```

**.prettierrc.json:**
```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

**package.json lint-staged:**
```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "jest --bail --findRelatedTests"
    ]
  }
}
```

**tsconfig.json strict mode:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Package.json Scripts:**
```json
{
  "lint": "eslint src --ext .ts,.tsx",
  "lint:fix": "eslint src --ext .ts,.tsx --fix",
  "format": "prettier --write \"src/**/*.{ts,tsx}\"",
  "type-check": "tsc --noEmit"
}
```

**Aufwand:** ~1 Tag für Setup
**ROI:** ⭐⭐⭐⭐⭐ (Essentiell für Code-Qualität)

---

### 3. ❌ Error Tracking & Monitoring fehlt

**Problem:**
- **Keine Error Logs** - Production-Fehler unsichtbar
- **Keine Crash Reports** - User-Probleme unbekannt
- **Keine Performance Metrics** - Bottlenecks unbekannt
- **Keine Analytics** - User-Verhalten unbekannt

**Impact:** 🔴 **HOCH**
- Bugs bleiben unentdeckt
- Performance-Probleme erst bei User-Beschwerden bekannt
- Keine Daten für Optimierungen

**Lösung:**

#### 3.1 Sentry für Error Tracking
```bash
npm install --save @sentry/react-native
npx @sentry/wizard -i reactNative -p ios android
```

**App.tsx mit Sentry:**
```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? 'development' : 'production',
  tracesSampleRate: 1.0, // 100% of transactions for performance monitoring
  integrations: [
    new Sentry.ReactNativeTracing({
      tracingOrigins: ['localhost', 'wilddragonking.github.io', /^\//],
    }),
  ],
});

export default Sentry.wrap(App);
```

**Error Boundaries mit Sentry:**
```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react-native';

class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    return this.props.children;
  }
}
```

#### 3.2 Firebase Performance Monitoring
```bash
npm install --save firebase/performance
```

**firebase.ts:**
```typescript
import { getPerformance } from 'firebase/performance';

export const perf = getPerformance(app);

// Custom Traces
export const trace = (traceName: string) => perf.trace(traceName);

// Usage:
const t = trace('load_home_screen');
await loadAllData();
t.stop();
```

#### 3.3 Firebase Analytics
```bash
npm install --save firebase/analytics
```

**analytics.ts:**
```typescript
import { getAnalytics, logEvent } from 'firebase/analytics';

export const analytics = getAnalytics(app);

export const logUserAction = (action: string, params?: any) => {
  logEvent(analytics, action, params);
};

// Usage:
logUserAction('push_ups_logged', { count: 50 });
logUserAction('screen_view', { screen_name: 'HomeScreen' });
```

**GitHub Secrets hinzufügen:**
- `EXPO_PUBLIC_SENTRY_DSN`

**Aufwand:** ~1-2 Tage
**ROI:** ⭐⭐⭐⭐⭐ (Kritisch für Production)

---

## High Priority (Nächster Sprint)

### 4. ⚠️ CI/CD Pipeline verbessern

**Problem:**
- **Nur Deployment** - Keine Quality Gates
- **Keine Tests in CI** - Fehler können deployt werden
- **Keine Type-Checks** - Type-Fehler unentdeckt
- **Kein Linting** - Code-Quality nicht geprüft

**Impact:** 🟠 **MITTEL-HOCH**
- Broken Builds können auf Production landen
- Keine Vertrauensbasis für Merges

**Lösung:**

**.github/workflows/ci.yml:**
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Format check
        run: npx prettier --check "src/**/*.{ts,tsx}"

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build web
        run: npm run build:web

      - name: Check bundle size
        run: npx bundlesize
```

**Aufwand:** ~1 Tag
**ROI:** ⭐⭐⭐⭐ (Verhindert fehlerhafte Deployments)

---

### 5. ⚠️ State Management optimieren

**Problem:**
- **Context API für alles** - Performance-Probleme bei vielen Re-Renders
- **Keine Caching-Strategie** - Daten werden wiederholt geladen
- **Kein Optimistic Updates** - Langsame UI-Feedback
- **Keine Offline-Synchronization** - App funktioniert offline nicht

**Impact:** 🟠 **MITTEL**
- Langsame App
- Schlechte UX bei schlechter Verbindung
- Unnötige Firebase-Reads (Kosten)

**Lösung: React Query (TanStack Query)**

```bash
npm install @tanstack/react-query
```

**Setup:**
```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';

<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

**Beispiel: Push-Ups mit React Query:**
```typescript
// src/hooks/usePushUps.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPushUpEntries, addPushUpEntry } from '../services/database';

export const usePushUps = (userId: string) => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['pushUps', userId],
    queryFn: () => getPushUpEntries(userId, startDate, endDate),
  });

  const addMutation = useMutation({
    mutationFn: (count: number) => addPushUpEntry(userId, count),
    onMutate: async (count) => {
      // Optimistic update
      await queryClient.cancelQueries(['pushUps', userId]);
      const previous = queryClient.getQueryData(['pushUps', userId]);

      queryClient.setQueryData(['pushUps', userId], (old: any) => [
        ...old,
        { id: 'temp', count, date: new Date(), userId }
      ]);

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['pushUps', userId], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['pushUps', userId]);
    },
  });

  return {
    pushUps: data || [],
    isLoading,
    addPushUp: addMutation.mutate,
    isAdding: addMutation.isLoading,
  };
};

// Usage in Component:
const { pushUps, addPushUp, isAdding } = usePushUps(userId);
```

**Vorteile:**
- ✅ Automatisches Caching
- ✅ Optimistic Updates (sofortige UI-Reaktion)
- ✅ Automatic Re-fetching
- ✅ Weniger Boilerplate
- ✅ DevTools für Debugging

**Aufwand:** ~3-4 Tage (Refactoring aller API-Calls)
**ROI:** ⭐⭐⭐⭐ (Deutlich bessere Performance & UX)

---

### 6. ⚠️ Offline Support fehlt

**Problem:**
- **App funktioniert offline nicht**
- **Keine Daten ohne Internet**
- **Schlechte UX bei instabiler Verbindung**

**Impact:** 🟠 **MITTEL**
- User können App nicht im Gym nutzen (schlechtes WLAN)
- Daten gehen verloren bei Verbindungsproblemen

**Lösung: PWA + Service Worker + Local Storage**

```bash
# 1. Workbox für Service Worker
npm install --save workbox-webpack-plugin
```

**Expo Web Config (app.json):**
```json
{
  "web": {
    "serviceWorker": {
      "enabled": true
    }
  }
}
```

**Service Worker (public/sw.js):**
```javascript
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'document',
  new workbox.strategies.NetworkFirst({
    cacheName: 'html-cache',
  })
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);
```

**Local Storage für Offline-Daten:**
```typescript
// src/services/offlineStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveOfflineData = async (key: string, data: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save offline data:', error);
  }
};

export const getOfflineData = async (key: string) => {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get offline data:', error);
    return null;
  }
};

// Usage with React Query:
const { data } = useQuery({
  queryKey: ['pushUps', userId],
  queryFn: async () => {
    try {
      const data = await getPushUpEntries(userId);
      await saveOfflineData(`pushUps_${userId}`, data); // Cache offline
      return data;
    } catch (error) {
      // Fallback to offline data
      const offlineData = await getOfflineData(`pushUps_${userId}`);
      if (offlineData) return offlineData;
      throw error;
    }
  },
});
```

**Aufwand:** ~2-3 Tage
**ROI:** ⭐⭐⭐⭐ (Deutlich bessere UX)

---

## Medium Priority (Backlog)

### 7. ℹ️ Environment Management verbessern

**Problem:**
- **Nur .env Datei** - Keine Umgebungen (dev/staging/prod)
- **Secrets in Repository** - Unsicher bei Public Repos
- **Keine Validierung** - Fehlende Env-Vars führen zu Crashes

**Lösung:**

```bash
npm install --save dotenv
npm install --save-dev @t3-oss/env-nextjs zod
```

**env.ts mit Zod-Validierung:**
```typescript
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {},
  client: {
    EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(1),
  },
  runtimeEnv: {
    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_GOOGLE_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  },
});
```

**Aufwand:** ~0.5 Tage
**ROI:** ⭐⭐⭐ (Verhindert Runtime-Fehler)

---

### 8. ℹ️ Bundle Size Optimierung

**Problem:**
- **Großer Bundle** - Langsame Ladezeiten
- **Keine Code-Splitting** - Alles wird sofort geladen
- **Keine Tree-Shaking Analyse**

**Lösung:**

```bash
# Bundle Analyzer
npm install --save-dev webpack-bundle-analyzer

# Package.json
"analyze": "ANALYZE=true npm run build:web"
```

**Lazy Loading für Screens:**
```typescript
import { lazy, Suspense } from 'react';

const WeightTrackerScreen = lazy(() => import('./screens/WeightTrackerScreen'));
const LeaderboardScreen = lazy(() => import('./screens/LeaderboardScreen'));

// In Navigation:
<Suspense fallback={<LoadingSpinner />}>
  <WeightTrackerScreen />
</Suspense>
```

**Aufwand:** ~1 Tag
**ROI:** ⭐⭐⭐ (Schnellere App)

---

### 9. ℹ️ Accessibility (a11y) fehlt

**Problem:**
- **Keine Screen Reader Support**
- **Keine Keyboard Navigation**
- **Keine ARIA Labels**
- **Kontrast möglicherweise zu niedrig**

**Lösung:**

```typescript
// Alle interaktiven Elemente:
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Log 50 push-ups"
  accessibilityRole="button"
  accessibilityHint="Adds 50 push-ups to today's total"
>
  <Text>50</Text>
</TouchableOpacity>

// Inputs:
<TextInput
  accessible={true}
  accessibilityLabel="Weight in kg"
  accessibilityHint="Enter your current weight"
/>
```

**Aufwand:** ~2-3 Tage
**ROI:** ⭐⭐⭐ (Inklusivität + App Store Requirements)

---

## Nice to Have (Wishlist)

### 10. 💡 Developer Experience Improvements

```bash
# React DevTools
npm install --save-dev react-devtools

# Redux DevTools (falls Redux später)
npm install --save-dev redux-devtools-extension

# Better logging
npm install --save-dev reactotron-react-native

# Storybook für Component Development
npx sb init --type react_native
```

**Aufwand:** ~1-2 Tage
**ROI:** ⭐⭐ (Schnellere Entwicklung)

---

### 11. 💡 Database Optimizations

**Firestore Composite Indexes:**
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "pushUpEntries",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

**Aufwand:** ~0.5 Tage
**ROI:** ⭐⭐⭐ (Schnellere Queries)

---

## Implementierungsplan

### Phase 1: Stabilität (Woche 1-2)
**Ziel:** Production-Ready App

1. ✅ **Tag 1-2:** Testing Setup (Jest + erste Tests)
2. ✅ **Tag 3:** Code Quality Tools (ESLint, Prettier, Husky)
3. ✅ **Tag 4-5:** Error Tracking (Sentry + Firebase Performance)
4. ✅ **Tag 6-7:** CI/CD Pipeline erweitern

**Deliverables:**
- 80%+ Test Coverage
- CI Pipeline mit Quality Gates
- Error Tracking in Production
- Pre-commit Hooks aktiv

---

### Phase 2: Performance (Woche 3-4)
**Ziel:** Schnelle & Responsive App

1. ✅ **Tag 1-3:** React Query Migration
2. ✅ **Tag 4-5:** Offline Support (PWA + Service Worker)
3. ✅ **Tag 6:** Bundle Size Optimierung
4. ✅ **Tag 7:** Performance Testing & Tuning

**Deliverables:**
- React Query für alle API-Calls
- App funktioniert offline
- Bundle Size < 500KB (initial)
- Lighthouse Score > 90

---

### Phase 3: Qualität (Woche 5-6)
**Ziel:** Professionelle Codebase

1. ✅ **Tag 1-2:** Environment Management
2. ✅ **Tag 3-4:** Accessibility Improvements
3. ✅ **Tag 5:** Database Optimizations
4. ✅ **Tag 6-7:** Developer Experience Tools

**Deliverables:**
- WCAG AA Compliance
- Firestore Composite Indexes
- Storybook für Components
- Dokumentation vervollständigt

---

## Zusammenfassung: Was fehlt?

### 🔴 Critical (Production Blocker):
1. ❌ Testing Framework
2. ❌ Code Quality Tools (ESLint, Prettier, Husky)
3. ❌ Error Tracking (Sentry)
4. ❌ Performance Monitoring

### 🟠 High Priority (Nächster Sprint):
5. ⚠️ CI/CD Pipeline verbessert
6. ⚠️ State Management (React Query)
7. ⚠️ Offline Support

### 🟡 Medium Priority (Backlog):
8. ℹ️ Environment Management
9. ℹ️ Bundle Size Optimierung
10. ℹ️ Accessibility

### 🟢 Nice to Have:
11. 💡 Developer Experience Tools
12. 💡 Database Optimizations

---

## Quick Wins (Sofort umsetzbar)

**1-2 Stunden:**
- ✅ `.prettierrc` + `.eslintrc` hinzufügen
- ✅ `tsconfig.json` strict mode aktivieren
- ✅ Package.json Scripts ergänzen (lint, format, test)

**1 Tag:**
- ✅ Husky + Pre-commit Hooks
- ✅ Jest Setup + erste Unit Tests
- ✅ GitHub Actions CI Pipeline

**2-3 Tage:**
- ✅ Sentry Integration
- ✅ Firebase Analytics & Performance
- ✅ React Query für 1-2 Features (als Proof of Concept)

---

**Nächster Schritt:** Welche Improvements sollen wir zuerst implementieren?

**Empfehlung:** Start mit **Phase 1 (Stabilität)** - Testing + Code Quality + Error Tracking

---

**Letzte Aktualisierung:** 2025-10-01
**Maintained By:** Development Team
