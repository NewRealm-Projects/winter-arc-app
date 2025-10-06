# PWA/Performance Agent

**Verantwortung**: Performance-Optimierung, Bundle-Splitting, PWA-Funktionalität, Lighthouse ≥90

---

## 🎯 Ziel

Optimiere die App für:
- **TTI (Time to Interactive) < 2s** lokal
- **Lighthouse Performance Score ≥ 90** (Home + Key Screens)
- **PWA Score ≥ 90** (installierbar, offline-fähig)
- **Bundle-Size < 600kb** (konfiguriert in `vite.config.ts`)
- **Route-based Lazy Loading** für Heavy Views
- **Optimierte Bilder** (WebP/AVIF, korrekte Größen)

---

## 🚨 Trigger (wann dieser Agent läuft)

- Lighthouse Performance Score < 90
- Bundle zu groß (>600kb Warnung beim Build)
- TTI > 2s (Time to Interactive)
- Service Worker nicht optimal (z.B. veraltete Caching-Strategie)
- Bilder nicht optimiert (PNG/JPG statt WebP)
- Fehlende Code-Splitting-Strategie

---

## 📋 Schritte

### 1. Baseline messen
**Lighthouse-Audit** für Key Screens:
```bash
npm run agent:lighthouse
```

Screens:
- `/` (Dashboard/Home)
- `/leaderboard` (Gruppenliste)
- `/notes` (Notizen-Seite)

**Ziel-Scores**:
- Performance: ≥ 90
- PWA: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90

**Bundle-Analyse**:
```bash
npm run analyze
# Generiert stats.html
```

Identifiziere:
- Größte Chunks (>100kb)
- Nicht genutzte Dependencies
- Duplicate Packages

### 2. Route-based Lazy Loading
**Problem**: Alle Seiten werden beim ersten Load geladen.

**Lösung**: Lazy Loading mit React.lazy + Suspense

```tsx
// src/routes/index.tsx (BEFORE)
import DashboardPage from '../pages/DashboardPage';
import LeaderboardPage from '../pages/LeaderboardPage';
import NotesPage from '../pages/NotesPage';
import SettingsPage from '../pages/SettingsPage';

// src/routes/index.tsx (AFTER)
import { lazy, Suspense } from 'react';
import { Skeleton } from '../components/ui/Skeleton';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const LeaderboardPage = lazy(() => import('../pages/LeaderboardPage'));
const NotesPage = lazy(() => import('../pages/NotesPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// Wrapper mit Suspense
function LazyRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <Suspense fallback={<Skeleton />}>
      <Component />
    </Suspense>
  );
}
```

**Vite Chunk-Splitting** (bereits in `vite.config.ts`):
```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor': ['react', 'react-dom', 'react-router-dom'],
        'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        'charts': ['recharts'],
        'ai': ['@google/generative-ai'],
      },
    },
  },
},
```

**Prüfen**:
- Sind Heavy Libraries (z.B. Recharts) nur in WeightTile geladen?
- Können wir Gemini AI lazy loaden? (falls nur in einer Komponente genutzt)

### 3. Bildoptimierung
**Bestandsaufnahme**:
```bash
# Finde große Bilder
find public -name "*.png" -o -name "*.jpg" | xargs ls -lh
```

**Konvertierung zu WebP/AVIF**:
```bash
# Beispiel: Hintergrundbild optimieren
npx @squoosh/cli --webp auto public/bg/light/*.jpg
npx @squoosh/cli --avif auto public/bg/dark/*.jpg
```

**Responsive Images**:
```tsx
// OptimizedImage-Komponente bereits vorhanden?
import { OptimizedImage } from '../components/ui/OptimizedImage';

<OptimizedImage
  src="/bg/light/winter_arc_bg_light.webp"
  fallback="/bg/light/winter_arc_bg_light.jpg"
  alt="Background"
  loading="lazy"
/>
```

**Lighthouse-Check**: Bilder mit korrekter Größe (keine 4K-Bilder für Mobile)

### 4. Service Worker & PWA
**Prüfen** (`vite.config.ts` → VitePWA Plugin):
- `registerType: 'autoUpdate'` ✅
- Manifest korrekt (Icons 192/512) ✅
- `workbox.globPatterns` deckt alle Assets ab

**Caching-Strategie**:
```typescript
// vite.config.ts
workbox: {
  runtimeCaching: [
    {
      // Firebase: Network-First (Echtzeit-Daten)
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'firestore-cache',
        expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
      }
    },
    {
      // Statische Assets: Cache-First
      urlPattern: /\.(?:png|jpg|jpeg|svg|webp|avif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'image-cache',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
      }
    }
  ]
}
```

**PWA-Installability**:
- Prüfe `manifest.json` (generiert von VitePWA)
- Icons vorhanden? (`/icon-192.png`, `/icon-512.png`)
- `display: 'standalone'` ✅

### 5. Above-the-Fold Critical CSS
**Problem**: Unnötiges CSS blockiert Rendering.

**Lösung**:
- Prüfe Tailwind Purge: `tailwind.config.js` → `content: ['./src/**/*.{js,jsx,ts,tsx}']`
- Entferne ungenutztes CSS (bereits via Tailwind JIT)

### 6. Prefetching & Preloading
**Fonts** (falls Custom Fonts):
```html
<!-- index.html -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin>
```

**Critical Routes** (z.B. Dashboard):
```tsx
// Prefetch Leaderboard beim Hover auf Nav-Link
<Link to="/leaderboard" onMouseEnter={() => import('../pages/LeaderboardPage')}>
  Leaderboard
</Link>
```

### 7. Performance Budgets
**Prüfen**: `scripts/check-budgets.mjs` (bereits vorhanden?)

```javascript
// scripts/check-budgets.mjs
const budgets = {
  'dist/index.html': 5 * 1024, // 5kb
  'dist/assets/*.js': 200 * 1024, // 200kb per chunk
  'dist/assets/*.css': 50 * 1024, // 50kb
};

// Validierung nach Build
```

### 8. Lighthouse CI Integration
**Bereits konfiguriert** (`.lhcirc.json` vorhanden?):
```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4173/"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:pwa": ["error", { "minScore": 0.9 }]
      }
    }
  }
}
```

**Run**:
```bash
npm run lhci:run
```

---

## 📦 Artefakte (in `artifacts/pwa-perf/`)

1. **Lighthouse Reports**:
   - `lighthouse-home.json` (Dashboard)
   - `lighthouse-leaderboard.json`
   - `lighthouse-notes.json`
   - `lighthouse-summary.html` (kombinierter Report)

2. **Bundle-Analyse**:
   - `stats.html` (Rollup Visualizer)
   - `bundle-summary.md` (Top 3 größte Chunks, Empfehlungen)

3. **Performance-Maßnahmen**:
   - `performance-improvements.md` (Was wurde optimiert, Vorher/Nachher)

---

## ✅ Definition of Done

- [ ] Lighthouse Performance ≥ 90 (alle Key Screens)
- [ ] Lighthouse PWA Score ≥ 90
- [ ] Bundle-Size < 600kb (keine Vite-Warnung)
- [ ] Route-based Lazy Loading implementiert
- [ ] Bilder optimiert (WebP/AVIF)
- [ ] Service Worker funktioniert (offline-fähig)
- [ ] Performance Budgets eingehalten
- [ ] Lint/TS = 0 Errors
- [ ] PR gegen `dev` mit Reports

---

## 🔄 Branch & PR

**Branch-Name**: `feat/pwa-perf-lazy-loading`

**PR-Template**:
- **Ziel**: Performance ≥90, Bundle < 600kb, PWA installierbar
- **Änderungen**:
  - Route-based Lazy Loading (`src/routes/index.tsx`)
  - Bilder zu WebP/AVIF konvertiert
  - Service Worker Caching optimiert
  - Performance Budgets validiert
- **Getestet**:
  - Lighthouse: Performance 92, PWA 95 ✅
  - Bundle: 480kb ✅
  - Offline-Test: Service Worker funktioniert ✅
- **Artefakte**:
  - `artifacts/pwa-perf/lighthouse-*.json`
  - `artifacts/pwa-perf/stats.html`
  - `artifacts/pwa-perf/performance-improvements.md`
- **Risiken**: Lazy Loading könnte minimale Flash of Loading verursachen (via Skeleton gemildert)

---

## 🚀 Nächste Schritte

1. **Test/Guard Agent**: E2E-Tests für PWA-Installation
2. **Docs/Changelog Agent**: README mit Performance-Metriken aktualisieren
