# Docs/Changelog Agent

**Verantwortung**: Dokumentation, Developer Experience, Onboarding, CHANGELOG-Pflege

---

## 🎯 Ziel

Halte die Dokumentation **synchron mit dem Code**:
- **README.md**: Screenshots aktuell (Light/Dark), Setup-Anleitung vollständig
- **CLAUDE.md**: Projekt-Guidelines konsolidiert, Agent-Trigger erklärt
- **CONTRIBUTING.md**: Branch/PR-Regeln, Commit-Konventionen
- **CHANGELOG.md**: Diff-basierte Release Notes, Semantic Versioning
- **package.json**: Version korrekt (SemVer)

---

## 🚨 Trigger (wann dieser Agent läuft)

- README veraltet (alte Screenshots, fehlende Scripts)
- CLAUDE.md inkonsistent mit Code (z.B. alte Design-Regeln)
- Fehlende CONTRIBUTING.md (neue Devs wissen nicht, wie PR erstellen)
- CHANGELOG.md nicht aktuell (letzte Änderungen nicht dokumentiert)
- package.json Version nicht gebumpt nach Feature-Release

---

## 📋 Schritte

### 1. README.md aktualisieren

**Aktuelle Abschnitte prüfen**:
```markdown
# Winter Arc Fitness Tracker

Progressive Web App für iOS und Android – umfassendes Fitness-Tracking mit Liegestützen, Sport, Ernährung und Gewicht.

## ✨ Features

- **Liegestütze-Training**: Base & Bump Algorithmus mit progressiver Überlastung
- **Sport-Tracking**: HIIT/HYROX, Cardio, Gym
- **Ernährung**: Wasser & Protein-Tracking
- **Gewichtsverlauf**: BMI-Berechnung, interaktiver Graph
- **Leaderboard**: Gruppen-basiertes Ranking
- **PWA**: Installierbar, offline-fähig
- **Dark Mode**: Vollständig unterstützt
```

**Screenshots hinzufügen/aktualisieren**:
```markdown
## 📱 Screenshots

| Dashboard (Light) | Dashboard (Dark) | Leaderboard |
|-------------------|------------------|-------------|
| ![Dashboard Light](./docs/screenshots/dashboard-light.png) | ![Dashboard Dark](./docs/screenshots/dashboard-dark.png) | ![Leaderboard](./docs/screenshots/leaderboard.png) |
```

**Setup-Anleitung**:
```markdown
## 🚀 Quick Start

### Voraussetzungen
- Node.js ≥ 18
- npm ≥ 9 (oder pnpm)

### Installation
\`\`\`bash
# Clone Repository
git clone https://github.com/WildDragonKing/winter-arc-app.git
cd winter-arc-app

# Dependencies installieren
npm install

# Environment Variables (Firebase)
cp .env.example .env
# Fülle .env mit Firebase-Credentials

# Dev-Server starten
npm run dev
# → http://localhost:5173
\`\`\`

### Testing
\`\`\`bash
# Alle Tests
npm run test:all

# Unit Tests (Vitest)
npm run test:unit

# E2E Tests (Playwright)
npm run test:e2e

# Lighthouse CI
npm run lhci:run
\`\`\`

### Build
\`\`\`bash
# Production Build
npm run build

# Preview
npm run preview
\`\`\`
```

**Tech Stack**:
```markdown
## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (Glassmorphism Design)
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **PWA**: Workbox Service Worker
- **Charts**: Recharts
- **State**: Zustand + Firebase Sync
- **Testing**: Vitest (Unit) + Playwright (E2E + Visual)
- **Performance**: Lighthouse CI, Bundle Analyzer
```

**Performance-Metriken**:
```markdown
## ⚡ Performance

- **Lighthouse Score**: 95+ (Performance, PWA)
- **Bundle Size**: < 500kb (gzipped)
- **TTI**: < 2s (lokal)
- **Offline-fähig**: Service Worker mit NetworkFirst-Strategie
```

### 2. CLAUDE.md konsolidieren

**Anpassen**:
- Agent-System erklären (`.agent/` Verzeichnis)
- Mobile One-Screen-Regel betonen
- Glass/Blur Design-Tokens referenzieren
- Branching-Strategie (feat/<agent>-<topic> → dev)

**Neuer Abschnitt**:
```markdown
## Agentisches Entwicklungs-Setup

Dieses Projekt nutzt ein **strukturiertes Agent-System** (`.agent/`):

### 4 Spezialisierte Agents
1. **UI-Refactor**: Glass/Blur Design, Mobile-First
2. **PWA/Performance**: Lighthouse ≥90, Bundle-Optimierung
3. **Test/Guard**: Coverage ≥70%, E2E-Tests
4. **Docs/Changelog**: Dokumentation synchron halten

### Wie triggern?
- Lese `.agent/<agent-name>.agent.md`
- Führe Schritte aus
- Erstelle PR gegen `dev` mit Artefakten

Siehe `.agent/README.md` für Details.
```

### 3. CONTRIBUTING.md erstellen

```markdown
# Contributing to Winter Arc

Danke für dein Interesse! Bitte folge diesen Guidelines:

## 🌳 Branching-Strategie

- **main**: Production (geschützt, nur via PR)
- **dev**: Staging (Integration Testing)
- **feat/<topic>**: Feature Branches (von `dev` abzweigen)
- **fix/<topic>**: Bug Fixes

**Branch-Namen**:
- `feat/ui-refactor-glass-tiles`
- `fix/pushup-algorithm-regression`
- `chore/update-dependencies`

## 📝 Commit-Konventionen

Nutze **Conventional Commits**:

\`\`\`
<type>(<scope>): <subject>

<body (optional)>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
\`\`\`

**Types**:
- `feat`: Neues Feature
- `fix`: Bug Fix
- `refactor`: Code-Umstrukturierung
- `chore`: Dependencies, Config
- `test`: Tests
- `docs`: Dokumentation
- `style`: UI/CSS
- `perf`: Performance

**Beispiele**:
\`\`\`
feat(ui): implement glass-blur design tokens
fix(pwa): optimize service worker caching
docs(agent): add comprehensive policies
\`\`\`

## 🚀 Pull Request Prozess

1. Branch von `dev` erstellen
2. Kleine, fokussierte Commits (≤300 Zeilen Diff)
3. **CHANGELOG.md** und **package.json Version** aktualisieren
4. Tests lokal laufen lassen: `npm run test:all`
5. PR gegen `dev` erstellen (nutze `.agent/templates/PR_TEMPLATE.md`)
6. CI muss grün sein (Lint, TS, Tests, Lighthouse ≥90)
7. Nach Merge: Branch löschen

## ✅ Definition of Done

- [ ] Code funktioniert in Dev
- [ ] Alle Tests grün (`npm run test:all`)
- [ ] Visual Regression OK (Light & Dark)
- [ ] Lint/TS = 0 Errors
- [ ] Git Hooks bestanden (Pre-commit, Pre-push)
- [ ] CHANGELOG.md aktualisiert
- [ ] package.json Version gebumpt
- [ ] Mobile/Responsive getestet

## 🧪 Testing

\`\`\`bash
# Unit Tests
npm run test:unit

# E2E Tests
npm run test:e2e

# Visual Tests (Playwright)
npm run test:ui

# Alle Checks
npm run test:all
\`\`\`

## 📦 Semantic Versioning

- **Patch** (0.0.1 → 0.0.2): Bug Fixes, Docs
- **Minor** (0.0.2 → 0.1.0): Neue Features
- **Major** (0.1.0 → 1.0.0): Breaking Changes

## 🔒 Code Quality Gates

- ESLint: 0 Errors
- TypeScript: 0 Errors (strict mode)
- Test Coverage: ≥ 70%
- Lighthouse: Performance ≥ 90, PWA ≥ 90

## 🤝 Code Review

- Reviews innerhalb 24h
- Konstruktives Feedback
- Approve nur wenn CI grün

Danke! 🙏
```

### 4. CHANGELOG.md pflegen

**Format** (Keep a Changelog):

```markdown
# Changelog

All notable changes to Winter Arc will be documented here.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

---

## [Unreleased]

### Added
- Agent-System (`.agent/` Verzeichnis) mit 4 spezialisierten Agents
- CI/CD Pipeline mit Lighthouse, Playwright, Vitest
- Design Token System (`src/theme/tokens.ts`)

### Changed
- Tiles verwenden einheitliches Glass/Blur Design
- Mobile One-Screen-Regel durchgesetzt

### Fixed
- Dark Mode Hintergrundbild korrigiert

---

## [0.0.5] - 2025-01-04

### Added
- Weather integration in Dashboard Header
- Leaderboard Preview Widget
- History Page

### Fixed
- TypeScript 'any' type errors (30 instances)
- Unused variables in error handlers

---

## [0.0.4] - 2025-01-03

### Added
- Pushup Training Mode (Base & Bump Algorithm)
- Progressive Plan Generation

### Changed
- Mobile Layout optimiert (One-Screen)

---

## [0.0.3] - 2025-01-02

### Added
- PWA Manifest & Service Worker
- Lighthouse CI Integration

### Fixed
- Bundle Size > 600kb

---

## [0.0.2] - 2025-01-01

### Added
- Dark Mode Support
- Glassmorphism Design

---

## [0.0.1] - 2024-12-31

### Added
- Initial Release
- Firebase Auth & Firestore
- Tracking: Pushups, Sport, Water, Protein, Weight
```

**Nach jeder PR**: Eintrag in `[Unreleased]` hinzufügen.

**Vor Release**: Version bumpen, Datum setzen.

### 5. package.json Version bumpen

**Aktuell**: `"version": "0.0.5"`

**Bump-Regeln**:
- **Patch**: Bug Fixes, Docs → `0.0.6`
- **Minor**: Neue Features → `0.1.0`
- **Major**: Breaking Changes → `1.0.0`

**Manuell**:
```json
{
  "version": "0.1.0"
}
```

Oder via npm:
```bash
npm version patch # 0.0.5 → 0.0.6
npm version minor # 0.0.5 → 0.1.0
npm version major # 0.0.5 → 1.0.0
```

### 6. Screenshots generieren

**Playwright Screenshots**:
```typescript
// scripts/generate-screenshots.ts
import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Dashboard Light
  await page.goto('http://localhost:5173/dashboard');
  await page.screenshot({ path: 'docs/screenshots/dashboard-light.png', fullPage: true });

  // Dashboard Dark
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: 'docs/screenshots/dashboard-dark.png', fullPage: true });

  // Leaderboard
  await page.goto('http://localhost:5173/leaderboard');
  await page.screenshot({ path: 'docs/screenshots/leaderboard.png', fullPage: true });

  await browser.close();
})();
```

**Run**:
```bash
npm run dev & # Start Dev Server
npx tsx scripts/generate-screenshots.ts
```

---

## 📦 Artefakte (in `artifacts/docs/`)

1. **Aktualisierte Markdown-Dateien**:
   - `README.md`
   - `CLAUDE.md`
   - `CONTRIBUTING.md`
   - `CHANGELOG.md`

2. **Screenshots**:
   - `docs/screenshots/dashboard-light.png`
   - `docs/screenshots/dashboard-dark.png`
   - `docs/screenshots/leaderboard.png`

3. **Version Bump**:
   - `package.json` (Version aktualisiert)

---

## ✅ Definition of Done

- [ ] README.md aktualisiert (Screenshots, Setup, Scripts)
- [ ] CLAUDE.md konsolidiert (Agent-System dokumentiert)
- [ ] CONTRIBUTING.md erstellt (Branch/PR-Regeln, Commit-Konventionen)
- [ ] CHANGELOG.md gepflegt (alle Änderungen dokumentiert)
- [ ] package.json Version gebumpt (SemVer)
- [ ] Screenshots generiert (Light/Dark, Key Screens)
- [ ] Lint/TS = 0 Errors
- [ ] PR gegen `dev` mit Artefakten

---

## 🔄 Branch & PR

**Branch-Name**: `feat/docs-changelog-agent-system`

**PR-Template**:
- **Ziel**: Dokumentation synchron mit Code, Agent-System dokumentiert
- **Änderungen**:
  - README.md: Screenshots, Setup-Anleitung, Performance-Metriken
  - CLAUDE.md: Agent-System Abschnitt
  - CONTRIBUTING.md: Branch/PR-Regeln
  - CHANGELOG.md: Unreleased-Einträge
  - package.json: Version 0.0.5 → 0.1.0
- **Getestet**:
  - Links in README funktionieren ✅
  - Screenshots aktuell ✅
  - Lint/TS: 0 Errors ✅
- **Artefakte**:
  - `artifacts/docs/*.md`
  - `artifacts/docs/screenshots/`
- **Risiken**: Keine

---

## 🚀 Nächste Schritte

1. **UI-Refactor Agent**: README-Screenshots nach Glass/Blur-Änderungen aktualisieren
2. **PWA/Performance Agent**: Performance-Metriken im README ergänzen
