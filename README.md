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
- **React 18** + **TypeScript** (strict mode)
- **Vite 6** - Build tool
- **Tailwind CSS** - Styling (Glassmorphism Design)
- **Recharts** - Weight tracking graphs
- **React Router** - Client-side routing
- **i18next** - Internationalization (DE/EN)

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

**Firebase Setup**:
1. Gehe zu [Firebase Console](https://console.firebase.google.com/)
2. Erstelle neues Projekt
3. Aktiviere **Google Authentication** (Authentication → Sign-in method)
4. Erstelle **Firestore Database** (Production mode)
5. (Optional) Aktiviere **App Check** mit reCAPTCHA v3

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
# Alle Tests & Checks
npm run test:all

# Unit Tests (Vitest)
npm run test:unit

# E2E Tests (Playwright)
npm run test:e2e

# Visual Regression Tests (Playwright)
npm run test:ui
```

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
npm run test:unit
```

**Coverage**:
- Business Logic: `src/logic/`, `src/utils/`
- Hooks: `src/hooks/`
- Services: `src/services/`

**Beispiel**: [`src/logic/motivation.test.ts`](src/logic/motivation.test.ts)

### E2E Tests (Playwright)

```bash
npm run test:e2e
```

**Test Suites**:
- **Tracking Flow** ([`tests/e2e/tracking.spec.ts`](tests/e2e/tracking.spec.ts)) - 8 Tests
- **Navigation Flow** ([`tests/e2e/navigation.spec.ts`](tests/e2e/navigation.spec.ts)) - 9 Tests
- **Training Flow** ([`tests/e2e/training.spec.ts`](tests/e2e/training.spec.ts)) - 9 Tests

**Status**: Spezifikationen erstellt, Firebase Auth Emulator Setup ausstehend (siehe [`tests/e2e/README.md`](tests/e2e/README.md))

### Visual Regression Tests (Playwright)

```bash
npm run test:ui
```

Screenshots für Light/Dark Mode in `tests/`

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
