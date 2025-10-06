# Agent Policies – Winter Arc

Diese Datei definiert **verbindliche Regeln** für alle Agents im `.agent/`-System. Jeder Agent MUSS sich an diese Policies halten.

---

## 1. Branching & PR-Workflow

### Branch-Naming
- **Pattern**: `feat/<agent-name>-<short-topic>`
- **Beispiele**:
  - `feat/ui-refactor-glass-tiles`
  - `feat/pwa-perf-lazy-loading`
  - `feat/test-guard-e2e-flows`
  - `feat/docs-changelog-mobile-rules`

### Target Branch
- **IMMER** PR gegen `dev` erstellen, **NIEMALS** direkt auf `main`
- `main` ist geschützt und nur für Production Releases

### PR-Größe
- **Netto-Diff ≤ 300 Zeilen** pro PR
- Größere Änderungen in Teilschritte aufteilen (z.B. Teil 1/3, Teil 2/3)
- Begründung: Bessere Reviews, schnellere Merges, geringeres Risiko

---

## 2. PR-Struktur & Dokumentation

Jede PR MUSS folgende Abschnitte enthalten (siehe `.agent/templates/PR_TEMPLATE.md`):

1. **Ziel & Kontext** – Was & Warum (2-3 Sätze)
2. **Änderungen** – Stichpunkte mit Key-Changes
3. **Wie getestet** – Konkrete Befehle/Links (reproduzierbar)
4. **Artefakte** – Pfade zu Reports/Screenshots/Logs
5. **Risiken/Nächste Schritte** – Offene Punkte, Follow-ups

---

## 3. Gate-Kriterien (CI MUSS grün sein)

Jede PR wird durch automatisierte Gates validiert. **Bei Verletzung wird die CI rot.**

### 3.1 Code Quality
- ✅ **ESLint**: `npm run lint` → 0 Errors
- ✅ **TypeScript**: `npm run typecheck` → 0 Errors
- ✅ **Strict Mode**: `tsconfig.json` hat `"strict": true`

### 3.2 Tests
- ✅ **Unit Tests**: `npm run test:unit` → 100% Pass
- ✅ **E2E Tests**: `npm run test:e2e` → 100% Pass
- ✅ **Coverage**: ≥ 70% für Core-Module (Ziel, kein Hard-Gate)

### 3.3 Visual Regression
- ✅ **Playwright Visual Diffs**: Keine unerwarteten Regressions
- ✅ **Light & Dark Mode**: Beide Themes getestet

### 3.4 Performance
- ✅ **Lighthouse Performance Score**: ≥ 90 (Home + Key Screens)
- ✅ **PWA Score**: ≥ 90
- ✅ **Bundle Size**: Keine Warnung über 600kb (konfiguriert in `vite.config.ts`)

---

## 4. Projekt-spezifische Constraints

### 4.1 Mobile-First: One-Screen-Regel
- **Jede Hauptseite** (Dashboard, Leaderboard, Notes, Settings) MUSS vollständig in **einen mobilen Viewport** passen (~100vh)
- **Kein vertikales Scrollen** auf dem Haupt-Container
- Getestet auf:
  - iPhone SE (375×667px)
  - Pixel 6 (412×915px)
  - Galaxy S20 (360×800px)

### 4.2 Design System
- **Glass/Blur**: Alle Tiles verwenden einheitliches Glassmorphism-Design:
  ```css
  rounded-2xl
  bg-white/5 dark:bg-white/5
  backdrop-blur-md
  border border-white/10
  shadow-[0_6px_24px_rgba(0,0,0,0.25)]
  transition-all duration-200
  ```
- **Layout**: 2-Spalten-Grid auf Desktop (`tile-grid-2`), responsive Collapse auf Mobile
- **Spacing**: Mobile `px-3 pt-4`, Desktop `px-6 pt-8`

### 4.3 Sicherheit & Stabilität
- ❌ **Keine Secrets** in Code committen (`.env` ist in `.gitignore`)
- ❌ **Keine destruktiven npm-Befehle**: z.B. `npm audit fix --force`
- ❌ **Keine riskanten Dependency-Upgrades** ohne Begründung/Tests
- ✅ **Frozen Lockfile** in CI: `npm ci` (nicht `npm install`)

---

## 5. Artefakte & Nachvollziehbarkeit

Jeder Agent MUSS seine Outputs in `artifacts/<agent-name>/` ablegen:

### UI-Refactor (`artifacts/ui-refactor/`)
- `storybook-static/` (oder Link zu Hosted Storybook)
- `playwright-report/` (Visual Diffs, Before/After)
- `screenshots/` (Light & Dark Mode, Key Screens)
- `lighthouse.json` (Startseite)

### PWA/Performance (`artifacts/pwa-perf/`)
- `lighthouse.json` + HTML Report
- `stats.html` (Bundle Analyzer)
- `performance-summary.md` (Top 3 Optimierungen)

### Test/Guard (`artifacts/test-guard/`)
- `playwright-report/`
- `coverage/` (Vitest Coverage Report)
- `lint-report.txt`, `typecheck-report.txt`

### Docs/Changelog (`artifacts/docs/`)
- Aktualisierte Markdown-Dateien (`README.md`, `CLAUDE.md`, `CONTRIBUTING.md`)
- Screenshots für README (Light/Dark)

---

## 6. Commit-Konventionen

Nutze **Conventional Commits**:

```
<type>(<scope>): <subject>

<body (optional)>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**:
- `feat` – Neue Features
- `fix` – Bug Fixes
- `refactor` – Code-Umstrukturierung ohne Behavior-Change
- `chore` – Dependencies, Config, Tooling
- `test` – Test-Ergänzungen
- `docs` – Dokumentation
- `style` – Formatting, UI-Styling
- `perf` – Performance-Verbesserungen

**Beispiele**:
```
feat(ui): implement glass-blur design tokens
fix(pwa): optimize service worker caching strategy
docs(agent): add comprehensive agent policies
```

---

## 7. Sandbox & Permissions

### Erlaubte Operationen
- ✅ Lesen/Schreiben von Dateien **innerhalb** des Projektordners
- ✅ Ausführen von npm/node Scripts (z.B. `npm run build`)
- ✅ Git-Operationen (branch, commit, push)
- ✅ Lighthouse/Playwright Runs (lokal)

### Verboten
- ❌ Zugriff außerhalb des Projektordners
- ❌ Netzwerk-Schreibzugriffe (außer Git Push)
- ❌ Datenbank-Modifikationen (keine Firestore-Writes in CI)
- ❌ Secrets auslesen (`.env` darf nicht geloggt werden)

---

## 8. Review & Merge

### Review-Kriterien
- Code Quality (Lint/TS/Tests grün)
- Design-Konsistenz (Glass/Blur, Mobile-First)
- Performance (Lighthouse ≥ 90)
- Dokumentation vollständig (Artefakte vorhanden)

### Merge-Strategie
- **Squash-Merge** bevorzugt (saubere History)
- Nach Merge: Branch löschen
- Bei Konflikten: Rebase auf `dev`, dann erneut pushen

---

## 9. Eskalation & Ausnahmen

Wenn ein Agent **nicht** alle Gates erfüllen kann:
1. **Dokumentiere** in der PR, warum (z.B. „Lighthouse 88 wegen externem API-Call")
2. **Begründe**, warum die Änderung trotzdem wertvoll ist
3. **Erstelle Follow-up Issue** für später
4. **Markiere PR** mit Label `needs-review` (manuelles Review erforderlich)

---

## 10. Enforcement

Diese Policies werden durchgesetzt durch:
- **CI Pipeline** (`.github/workflows/ci.yml`) – automatische Gates
- **Husky Pre-commit Hooks** – lokale Validierung
- **PR Template** – strukturierte Dokumentation
- **Agent-Definitionen** – klare Anweisungen pro Agent

**Jeder Agent MUSS diese Policies in seinem Workflow berücksichtigen.**
