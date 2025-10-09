# Winter Arc Fitness Tracker

Progressive Web App (PWA) für iOS und Android – umfassendes Fitness-Tracking mit Liegestützen, Sport, Ernährung und Gewichtstracking.

[![CI](https://github.com/WildDragonKing/winter-arc-app/workflows/CI/badge.svg)](https://github.com/WildDragonKing/winter-arc-app/actions)
[![Lighthouse Score](https://img.shields.io/badge/lighthouse-95%2B-brightgreen)](.agent/scripts/run-lighthouse.mjs)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](tsconfig.json)

---

## ✨ Features

- 💪 **Pushup Training Mode** - Base & Bump Algorithm mit progressiver Überlastung und automatischer Plan-Generierung
- 🏃 **Sport-Tracking** - HIIT/HYROX, Cardio, Gym (mit Intensitäts- und Dauer-Tracking)
- 💧 **Wasser-Tracking** - Tägliche Hydrations-Ziele mit visuellen Fortschrittsbalken
- 🥩 **Protein-Tracking** - Ernährungs-Ziele basierend auf Körpergewicht (2g/kg)
- 📈 **Gewichts-Graph** - BMI-Berechnung und interaktiver Verlaufsgraph mit Recharts
- 🏆 **Leaderboard** - Gruppen-basiertes Ranking mit wöchentlichem/monatlichem Statistiken
- 📝 **Notizen** - Tägliche Notizen mit Markdown-Support
- 🌤️ **Wetter-Integration** - Aktuelle Wetterdaten im Dashboard-Header (Open-Meteo API)
- 📱 **PWA** - Installierbar auf allen Geräten, offline-fähig mit Service Worker
- 🌙 **Dark Mode** - Vollständige Dark-Mode-Unterstützung mit Glassmorphism-Design
- 🔐 **Firebase Auth** - Google SSO mit sicherer Authentifizierung
- ⚡ **Performance** - Lazy Loading, Bundle Optimization, Lighthouse Score 95+

---

## 📱 Screenshots

| Dashboard (Light) | Dashboard (Dark) | Leaderboard |
|-------------------|------------------|-------------|
| ![Dashboard Light](./docs/screenshots/dashboard-light.png) | ![Dashboard Dark](./docs/screenshots/dashboard-dark.png) | ![Leaderboard](./docs/screenshots/leaderboard.png) |

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **TypeScript** (strict mode)
- **Vite 7** - Build tool
- **Tailwind CSS** - Styling (Glassmorphism Design)
- **Recharts** - Weight tracking graphs
- **React Router** - Client-side routing
- **i18n** - Internationalization (DE/EN)

### Backend
- **Firebase Auth** - Google SSO
- **Firestore** - NoSQL database
- **Firebase Cloud Functions** - Serverless backend
- **Firebase App Check** - reCAPTCHA v3 protection

### State Management
- **Zustand** - Global state with Firebase sync
- **Firebase Hooks** - Real-time data subscriptions

### PWA
- **Vite PWA Plugin** - Service Worker generation
- **Workbox** - Offline-first caching strategies
- **Web App Manifest** - Installable on all platforms

### Testing
- **Vitest** - Unit testing with coverage reports
- **Playwright** - E2E testing and visual regression
- **Lighthouse CI** - Performance and accessibility audits

### Performance
- **Bundle Analyzer** - Visualize bundle sizes
- **Lazy Loading** - Route-based code splitting
- **Performance Budgets** - Enforce bundle size limits

---

## 🚀 Release Management & Deployment

### Architecture Overview

This project implements a **three-environment deployment strategy** using GitHub Pages:

| Environment | Branch | Domain | Purpose |
|------------|--------|--------|---------|
| **Production** | `main` | `app.winterarc.newrealm.de` | Live production environment |
| **Staging** | `develop` | `staging.winterarc.newrealm.de` | Testing and QA |
| **PR Previews** | Any PR | `staging.winterarc.newrealm.de/pr-<num>/` | Feature review |

### Deployment Flow

```
┌──────────────┐     Push to main      ┌────────────────────────┐
│   main       │ ───────────────────→  │  winter-arc-app-prod   │
│   branch     │                       │  (GitHub Pages Repo)   │
└──────────────┘                       └────────────────────────┘
                                                ↓
                                    app.winterarc.newrealm.de (PROD)

┌──────────────┐    Push to develop   ┌────────────────────────┐
│  develop     │ ───────────────────→  │ winter-arc-app-staging │
│  branch      │                       │  (GitHub Pages Repo)   │
└──────────────┘                       └────────────────────────┘
                                                ↓
                                  staging.winterarc.newrealm.de (TEST)

┌──────────────┐     Open PR          ┌────────────────────────┐
│  feat/...    │ ───────────────────→  │ winter-arc-app-staging │
│  branch      │                       │    /pr-<number>/       │
└──────────────┘                       └────────────────────────┘
                                                ↓
                          staging.winterarc.newrealm.de/pr-123/ (PREVIEW)
```

### Workflows

Three GitHub Actions workflows handle deployments:

1. **`.github/workflows/deploy-prod.yml`**
   - Trigger: Push to `main` branch
   - Deploy to: `NewRealm-Projects/winter-arc-app-prod` (gh-pages)
   - Environment: `VITE_APP_ENV=production`
   - Steps: Install → Build → Deploy
   - Domain: `app.winterarc.newrealm.de`

2. **`.github/workflows/deploy-staging.yml`**
   - Trigger: Push to `develop` branch
   - Deploy to: `NewRealm-Projects/winter-arc-app-staging` (gh-pages)
   - Environment: `VITE_APP_ENV=staging`
   - Domain: `staging.winterarc.newrealm.de`

3. **`.github/workflows/pr-preview.yml`**
   - Trigger: Pull Request (opened, synchronize, reopened)
   - Deploy to: `NewRealm-Projects/winter-arc-app-staging/pr-<num>/`
   - Environment: `VITE_APP_ENV=preview`
   - Adds preview link as PR comment

### Setup Instructions

#### 1. Create GitHub Pages Repositories

Create two separate repos for hosting:

```bash
# Production Pages Repo
NewRealm-Projects/winter-arc-app-prod
  - Settings → Pages → Source: Deploy from branch
  - Branch: gh-pages, folder: / (root)

# Staging Pages Repo
NewRealm-Projects/winter-arc-app-staging
  - Settings → Pages → Source: Deploy from branch
  - Branch: gh-pages, folder: / (root)
```

#### 2. Configure GitHub Secret

In the **source code repository** (`winter-arc-app`), add a secret:

- Go to: **Settings → Secrets and variables → Actions**
- Click **New repository secret**
- Name: `PAGES_DEPLOY_TOKEN`
- Value: Personal Access Token (PAT) with `repo` scope
  - Generate at: https://github.com/settings/tokens
  - Required scope: `repo` (full control of private repositories)

#### 3. Configure DNS (Custom Domains)

Add CNAME records in your DNS provider:

```
Type    Name        Value
CNAME   app         newrealm-projects.github.io
CNAME   staging     newrealm-projects.github.io
```

After DNS propagation, configure custom domains in GitHub Pages:

- **Production Repo** → Settings → Pages → Custom domain: `app.winterarc.newrealm.de`
- **Staging Repo** → Settings → Pages → Custom domain: `staging.winterarc.newrealm.de`

✅ **Enforce HTTPS** (both repos)

#### 4. Branch Protection (Optional but Recommended)

**main branch:**
- Require pull request reviews
- Require status checks to pass (CI, tests)
- Require branches to be up to date

**develop branch:**
- Require status checks to pass

### System Indicator

The app displays a **version + environment badge** in the bottom-right corner:

| Environment | Display | Color |
|------------|---------|-------|
| **Production** | `vX.Y.Z – PROD` | 🟢 Green |
| **Staging** | `vX.Y.Z – TEST` | 🟠 Orange |
| **PR Preview** | `vX.Y.Z – PREVIEW` | 🔴 Red |
| **Local** | `vX.Y.Z – LOCAL` | ⚪ Gray |

**Implementation:**
- Component: `src/components/SystemIndicator.tsx`
- Reads `VITE_APP_ENV` from environment
- Version from `package.json`
- Fixed position, bottom-right, semi-transparent

### Rollback Procedure

#### Rollback Production

**Option 1: Revert Git Commit**
```bash
# On main branch
git revert <bad-commit-sha>
git push origin main
# Workflow auto-deploys reverted state
```

**Option 2: Reset to Previous Commit**
```bash
git reset --hard <good-commit-sha>
git push origin main --force
# ⚠️ Use with caution - rewrites history
```

**Option 3: Manual Rollback in Pages Repo**
```bash
cd winter-arc-app-prod
git checkout gh-pages
git log  # Find last good commit
git reset --hard <last-good-commit>
git push origin gh-pages --force
```

#### Rollback Staging

Same procedure as production, but use `develop` branch and `winter-arc-app-staging` repo.

### SPA Routing & 404 Handling

GitHub Pages doesn't natively support client-side routing. We use a workaround:

**`public/404.html`**
- Intercepts 404 errors
- Redirects to `index.html` with path preserved
- Detects PR preview paths (`/pr-123/`) and adjusts routing
- Client-side React Router handles the route

**How it works:**
1. User visits `app.winterarc.newrealm.de/leaderboard`
2. GitHub Pages returns `404.html`
3. JavaScript redirects to `/?/leaderboard`
4. React Router parses and renders `/leaderboard`

### PR Preview Workflow

1. **Developer creates PR:**
   ```bash
   git checkout -b feat/new-feature
   git push origin feat/new-feature
   # Open PR on GitHub
   ```

2. **Workflow triggers automatically:**
   - Builds app with `VITE_APP_ENV=preview`
   - Builds with `VITE_BASE_PATH=/pr-<num>/`
   - Deploys to `winter-arc-app-staging/pr-<num>/`

3. **Bot comments on PR:**
   ```
   🚀 Preview deployed!
   Your changes are available at:
   https://staging.winterarc.newrealm.de/pr-123/

   Environment: PREVIEW
   ```

4. **After PR merge/close:**
   - Preview remains until manually cleaned up
   - To remove: Delete `pr-<num>` folder from staging repo's gh-pages branch

### Troubleshooting

**Issue: "PAGES_DEPLOY_TOKEN" not found**
- Ensure secret is set in **source repo** (winter-arc-app), not pages repos
- Token must have `repo` scope

**Issue: Deploy fails with "remote: Permission denied"**
- Check PAT hasn't expired
- Regenerate token and update secret

**Issue: Custom domain shows 404**
- Verify CNAME DNS record exists and propagated
- Check GitHub Pages settings → Custom domain is set
- Wait up to 24h for DNS propagation

**Issue: PR preview broken / white screen**
- Check `VITE_BASE_PATH` is set correctly in workflow
- Verify `vite.config.ts` uses `process.env.VITE_BASE_PATH`
- Check browser console for asset loading errors

**Issue: Deep links (e.g., /leaderboard) don't work**
- Verify `public/404.html` exists and is deployed
- Check 404.html detects PR paths correctly

### Cleanup Old PR Previews

PR previews are **not** automatically deleted after merge/close. To clean up:

```bash
cd winter-arc-app-staging
git checkout gh-pages
rm -rf pr-<number>
git commit -m "Clean up PR #<number> preview"
git push origin gh-pages
```

Or use GitHub UI:
1. Go to `winter-arc-app-staging` repo
2. Navigate to `gh-pages` branch
3. Delete `pr-<number>` folder

---

## 🚀 Quick Start

### Voraussetzungen

- **Node.js** ≥ 18
- **npm** ≥ 9 (oder pnpm/yarn)
- **Firebase Project** (für Backend)

### Installation

```bash
# 1. Clone Repository
git clone https://github.com/WildDragonKing/winter-arc-app.git
cd winter-arc-app

# 2. Dependencies installieren
npm install

# 3. Environment Variables (Firebase)
cp .env.example .env
# Fülle .env mit deinen Firebase-Credentials (siehe unten)

# 4. Dev-Server starten
npm run dev
# → http://localhost:5173
```

### Environment Variables Setup

Erstelle `.env` mit deinen Firebase-Credentials:

```env
# Firebase Configuration (Required)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Firebase App Check with reCAPTCHA v3 (Optional, recommended for production)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
```

#### Gemini Smart Notes API Key

Die Smart-Notes-Pipeline spricht direkt die Google Generative Language API (`gemini-2.0-flash-exp`) an. Hinterlege dafür in deiner `.env` den archivierten Schlüssel `VITE_GEMINI_API_KEY` (siehe Kommentar in `CLAUDE.md`, Abschnitt „Gemini AI for Personalized Quotes“).

Der Client ruft `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=...` per `POST` auf und sendet den System-Prompt sowie die heuristisch erkannten Events. Die Antwort MUSS ein JSON der Form `{ summary: string; events: Event[] }` enthalten.

Ein `401` oder `403` deutet auf einen fehlenden/ungültigen Schlüssel hin. Stelle sicher, dass der Key aktiv ist und in deiner `.env` verfügbar gemacht wird (`VITE_GEMINI_API_KEY=...`).

Falls die Generierung bei dir regelmäßig durch ein Timeout abbricht, kannst du mit `VITE_GEMINI_TIMEOUT_MS` (Standard: `20000`) einen längeren Request-Timeout in Millisekunden konfigurieren.

**Firebase Setup**:
1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Erstelle neues Projekt
3. Aktiviere **Google Authentication** (Authentication → Sign-in method)
4. Erstelle **Firestore Database** (Production mode)
5. (Optional) Aktiviere **App Check** mit reCAPTCHA v3

### Firebase Emulator Setup (optional)

Für lokales Entwickeln ohne Produktionszugriff kannst du die Firebase Emulator Suite nutzen:

1. Installiere die Firebase CLI (`npm install -g firebase-tools`).
2. Starte die gewünschten Emulatoren: `firebase emulators:start --only auth,firestore` (Ports 9099 und 8080).
3. Setze in deiner `.env.local` oder `.env` den Schalter `VITE_USE_FIREBASE_EMULATORS=true`.
4. Starte den Dev-Server neu (`npm run dev`). Die App verbindet sich automatisch mit den Emulatoren.

> Hinweis: Der Emulator-Schalter ist rein für DEV gedacht. Für Builds bleibt die Variable auf `false`.

---

## 📦 Development Scripts

### Development

```bash
# Dev-Server starten (HMR enabled)
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview
```

### Code Quality

```bash
# Lint code (ESLint)
npm run lint

# TypeScript type checking
npm run typecheck

# Unused imports/exports (Knip)
npm run scan:knip

# Unused dependencies
npm run scan:dep
```

### Testing

```bash
# Alle Tests & Checks (Lint, Typecheck, Unit, UI)
npm run test:all

# Unit Tests (Vitest)
npm run test

# Watch Mode für Unit-Tests
npm run test:watch

# Coverage Report generieren (HTML & lcov unter ./coverage)
npm run test:coverage

# End-to-End-Tests (Playwright)
npm run e2e

# Playwright UI Runner (lokal)
npm run e2e:ui

# Vitest UI (lokal)
npm run test:ui
```

## ✅ Tests & CI

Die GitHub-Actions-Pipeline läuft vollständig auf den Depot-Runnern und erzwingt folgende Qualitätsstufen:

- **lint_typecheck** – `npm run lint` und `npm run typecheck` müssen ohne Findings durchlaufen.
- **unit_integration** – `npm run test:coverage` mit Vitest (Thresholds ≥ 80 % für Statements/Branches/Functions/Lines). Der HTML-Report liegt nach dem Lauf unter `coverage/index.html` und wird als Artifact `coverage-html` veröffentlicht.
- **e2e** – `npm run e2e` startet die Playwright-Suites (`e2e/tests/*.spec.ts`) auf Desktop- und Mobile-Viewport. Der HTML-Report befindet sich unter `e2e/artifacts/playwright-report/index.html` (Artifact `e2e-report`).
- **build** – `npm run build` erzeugt das Produktionsbundle (`dist/`) und packt es für GitHub Pages.
- **deploy** – veröffentlicht das zuvor geprüfte Bundle mit `actions/deploy-pages@v4`.

### Lokale End-to-End-Tests

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
# Neues Terminal
E2E_BASE_URL=http://127.0.0.1:4173 npm run e2e
```

Beende den Preview-Server anschließend mit `Ctrl+C`. Für explorative Runs steht `npm run e2e:ui` bereit.

### Data-TestID Konventionen

- Verwende `data-testid` mit sprechenden, kebab-case Bezeichnern (`nav-link-dashboard`, `smart-note-input`).
- Kennzeichne Seiten-Roots, Navigationselemente und kritische Interaktionspunkte konsistent, damit Playwright- und Vitest-Specs stabile Selektoren besitzen.
- Neue Komponenten sollten nur dann ein `data-testid` erhalten, wenn kein semantischer Selektor möglich ist.

### Performance & Analysis

```bash
# Bundle Size Analyse
npm run analyze

# Lighthouse CI (lokal)
npm run lhci:run

# Performance Budgets prüfen
npm run perf:budget

# Agent-spezifische Scripts
npm run agent:lighthouse  # Lighthouse Reports
npm run agent:bundle      # Bundle Analysis
npm run agent:artifacts   # Artifacts sammeln
```

---

## ⚡ Performance

| Metric | Target | Current |
|--------|--------|---------|
| **Lighthouse Performance** | ≥ 90 | **95+** ✅ |
| **Lighthouse PWA** | ≥ 90 | **95+** ✅ |
| **Bundle Size (Main)** | < 600 KB | **86 KB** ✅ |
| **Total JS Size** | < 1500 KB | **1204 KB** ✅ |
| **TTI (Time To Interactive)** | < 2s | **~1.5s** ✅ |

**Optimierungen**:
- Route-based Lazy Loading für alle Pages
- Firebase & Recharts dynamisch geladen (824 KB lazy chunks)
- Service Worker mit Cache-First Strategie
- Image Optimization mit WebP
- Design Tokens für konsistente Styles

Siehe [`artifacts/performance/PERFORMANCE.md`](./artifacts/performance/PERFORMANCE.md) für Details.

---

## 🏗️ Project Structure

```
winter-arc-app/
├── .agent/                   # Agent-System (4 spezialisierte Agents)
│   ├── ui-refactor.agent.md
│   ├── pwa-perf.agent.md
│   ├── test-guard.agent.md
│   ├── docs-changelog.agent.md
│   ├── policies.md
│   ├── templates/
│   └── scripts/
├── .github/workflows/        # CI/CD Pipeline
├── artifacts/                # Agent-Artefakte (Bundle, Lighthouse, Performance)
├── docs/                     # Dokumentation & Screenshots
├── public/                   # Static Assets (Icons, Manifest)
├── src/
│   ├── components/           # React Components (Tiles, UI-Elemente)
│   ├── pages/                # Page Components (Dashboard, Leaderboard, etc.)
│   ├── routes/               # React Router Configuration
│   ├── store/                # Zustand State Management
│   ├── firebase/             # Firebase Config & Services
│   ├── hooks/                # Custom React Hooks
│   ├── theme/                # Design Tokens & Theme Configuration
│   ├── utils/                # Utility Functions (Pushup Algorithm, etc.)
│   ├── types/                # TypeScript Type Definitions
│   └── locales/              # i18n Translations (DE/EN)
├── tests/                    # Test Suites
│   ├── e2e/                  # Playwright E2E Tests
│   └── __tests__/            # Vitest Unit Tests
└── package.json
```

---

## 🤖 Agentisches Entwicklungs-Setup

Dieses Projekt nutzt ein **strukturiertes Agent-System** (`.agent/`) zur Qualitätssicherung:

### 4 Spezialisierte Agents

1. **UI-Refactor Agent** ([`.agent/ui-refactor.agent.md`](.agent/ui-refactor.agent.md))
   - Glass/Blur Design-Konsistenz
   - Mobile-First One-Screen-Regel
   - Design Token System

2. **PWA/Performance Agent** ([`.agent/pwa-perf.agent.md`](.agent/pwa-perf.agent.md))
   - Lighthouse Score ≥ 90
   - Bundle Size Optimization
   - Lazy Loading & Code Splitting

3. **Test/Guard Agent** ([`.agent/test-guard.agent.md`](.agent/test-guard.agent.md))
   - Test Coverage ≥ 70%
   - E2E Tests für kritische Flows
   - Visual Regression Tests

4. **Docs/Changelog Agent** ([`.agent/docs-changelog.agent.md`](.agent/docs-changelog.agent.md))
   - Dokumentation synchron mit Code
   - CHANGELOG-Pflege
   - Semantic Versioning

### Wie triggern?

1. Lies `.agent/<agent-name>.agent.md` für Specs
2. Führe Schritte aus (Branch erstellen, Code ändern, Tests ausführen)
3. Erstelle PR gegen `dev` mit Artefakten

Siehe [`.agent/README.md`](.agent/README.md) und [`.agent/policies.md`](.agent/policies.md) für Details.

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

```bash
npm run test
```

**Coverage**:
- Business Logic: `src/logic/`, `src/utils/`
- Hooks: `src/hooks/`
- Services: `src/services/`

**Beispiel**: [`src/store/__tests__/useStore.test.ts`](src/store/__tests__/useStore.test.ts)

### E2E Tests (Playwright)

```bash
npm run e2e
```

**Test Suites**:
- **Smoke Flow** ([`e2e/tests/smoke.spec.ts`](e2e/tests/smoke.spec.ts)) – Login, Navigation & Responsiveness (Desktop/Mobile)
- **Smart Notes Flow** ([`e2e/tests/notes.spec.ts`](e2e/tests/notes.spec.ts)) – Formularvalidierung & Persistenz

### Interaktive Test Runner

- `npm run test:ui` – Vitest UI (lokal, Browser-gestütztes Debugging)
- `npm run e2e:ui` – Playwright UI (lokal, Trace/Screenshot-Viewer)

---

## 📚 Firebase Setup

### 1. Firestore Collections

```
users/{userId}
├── language: 'de' | 'en'
├── nickname: string
├── gender: 'male' | 'female' | 'diverse'
├── height: number (cm)
├── weight: number (kg)
├── maxPushups: number
├── groupCode: string
└── pushupState: { baseReps, sets, restTime }

tracking/{userId}/days/{date: YYYY-MM-DD}
├── pushups: { total?, workout? }
├── sports: { hiit, cardio, gym }
├── water: number (ml)
├── protein: number (g)
├── weight?: { value, bodyFat?, bmi? }
└── completed: boolean

groups/{groupCode}
├── name: string
├── members: string[] (userIds)
└── createdAt: timestamp
```

### 2. Security Rules

```bash
# Deploy Firestore Security Rules
firebase deploy --only firestore:rules
```

Regeln in `firestore.rules`:
- User können nur eigene Daten lesen/schreiben
- Alle authentifizierten User können Gruppen-Daten lesen
- Gruppen können nicht gelöscht werden

### 3. App Check (Optional)

```bash
# reCAPTCHA v3 Site Key in .env hinzufügen
VITE_RECAPTCHA_SITE_KEY=your_site_key
```

Schützt Firebase Services vor Missbrauch und unbefugtem Zugriff.

---

## 🌳 Branching Strategy

- **main** - Production (geschützt, nur via PR)
- **dev** - Staging (Integration Testing)
- **feat/<topic>** - Feature Branches (von `dev` abzweigen)
- **fix/<topic>** - Bug Fixes

**Commit-Konventionen**: Conventional Commits (siehe [CONTRIBUTING.md](CONTRIBUTING.md))

---

## 📝 CHANGELOG

Siehe [CHANGELOG.md](CHANGELOG.md) für Release Notes und Versionshistorie.

**Aktuell**: `v0.1.0` - Agent-System, E2E Tests, Performance-Optimierungen

---

## 🤝 Contributing

Beiträge sind willkommen! Bitte lies [CONTRIBUTING.md](CONTRIBUTING.md) für Guidelines zu:
- Branching-Strategie
- Commit-Konventionen
- PR-Prozess
- Definition of Done
- Code Quality Gates

---

## 📄 License

MIT License - siehe [LICENSE](LICENSE) (falls vorhanden)

---

## 🙏 Credits

- **Glassmorphism Design** - Inspiriert von iOS und modernen Web-Apps
- **Base & Bump Algorithm** - Progressive Overload für Pushup-Training
- **Open-Meteo API** - Kostenlose Wetter-Daten ohne API-Key
- **Firebase** - Backend-as-a-Service
- **Vite & React** - Modern Web Development

---

**Entwickelt mit ❤️ und Claude Code**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
