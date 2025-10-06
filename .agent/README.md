# Agentisches Entwicklungs-Setup – Winter Arc

Dieses `.agent/`-Verzeichnis enthält ein **strukturiertes, agentisches Entwicklungs-System** mit vier spezialisierten Agents, die eigenständig Features entwickeln, testen und dokumentieren.

---

## 🎯 Ziel

- **Kleine, nachvollziehbare PRs** (≤300 Zeilen Diff)
- **Strikte Quality Gates** (Lint, TS, Tests, Visual Diffs, Lighthouse ≥90)
- **Klare Verantwortlichkeiten** pro Agent
- **Reproduzierbare Artefakte** (Reports, Screenshots, Logs)
- **Stabilität**: Keine Überraschungen, keine riskanten Upgrades

---

## 🤖 Die 4 Agents

### 1. **UI-Refactor Agent** (`ui-refactor.agent.md`)
**Fokus**: Modernes, konsistentes UI mit Glass/Blur-Design, Mobile-First, One-Screen-Regel

**Trigger**:
- Tile-Design inkonsistent (z.B. verschiedene Border-Radien, Schatten)
- Mobile-Layout scrollt vertikal (verletzt One-Screen-Regel)
- Dark/Light-Mode Hintergründe falsch
- Fehlende Design Tokens

**Output**:
- Design Token System (`src/theme/tokens.ts`)
- Einheitliche Tile-Komponenten (Glass/Blur)
- Storybook Stories
- Before/After Screenshots (Light & Dark)
- Playwright Visual Diffs

---

### 2. **PWA/Performance Agent** (`pwa-perf.agent.md`)
**Fokus**: Performance-Optimierung, Bundle-Splitting, PWA-Funktionalität

**Trigger**:
- Lighthouse Performance Score < 90
- Bundle zu groß (>600kb)
- Langsame TTI (Time to Interactive)
- Service Worker nicht optimal

**Output**:
- Route-based Lazy Loading
- WebP/AVIF Bilder
- Bundle Analyzer Report (`stats.html`)
- Lighthouse Reports (JSON + HTML)
- Performance-Maßnahmen-Liste

---

### 3. **Test/Guard Agent** (`test-guard.agent.md`)
**Fokus**: Test-Coverage, Regressionsschutz, Lint/TS-Checks

**Trigger**:
- Test-Coverage < 70%
- Fehlende E2E-Tests für Core-Flows
- ESLint/TS Errors
- Visual Regressions

**Output**:
- Unit Tests (Vitest + RTL)
- E2E Tests (Playwright)
- Coverage Reports
- Lint/TS Reports

---

### 4. **Docs/Changelog Agent** (`docs-changelog.agent.md`)
**Fokus**: Dokumentation, Developer Experience, Onboarding

**Trigger**:
- README veraltet
- CLAUDE.md inkonsistent mit Code
- Fehlende CONTRIBUTING.md
- CHANGELOG.md nicht aktuell

**Output**:
- Aktualisierte READMEs (mit Screenshots)
- CLAUDE.md Konsolidierung
- CONTRIBUTING.md (Branch/PR-Regeln)
- CHANGELOG.md (Release Notes)

---

## 🚀 Wie Agents triggern

### Manueller Trigger (empfohlen für Start)
1. Lese Agent-Definition (z.B. `.agent/ui-refactor.agent.md`)
2. Führe Schritte aus Agent-Prompt aus
3. Erstelle Branch `feat/<agent>-<topic>`
4. Sammle Artefakte in `artifacts/<agent>/`
5. Erstelle PR gegen `dev` mit Template

### Automatischer Trigger (zukünftig, via CI)
- **Commit-Message-Pattern**: `[agent:ui-refactor] fix glass-blur tiles`
- **PR-Label**: `agent:pwa-perf` triggert Performance-Checks
- **Scheduled Runs**: Wöchentliche Audits (z.B. Test-Coverage, Bundle-Size)

---

## 📁 Verzeichnisstruktur

```
.agent/
├── README.md                      # Diese Datei
├── policies.md                    # Verbindliche Regeln für alle Agents
├── ui-refactor.agent.md           # Agent 1: UI-Refactor
├── pwa-perf.agent.md              # Agent 2: PWA/Performance
├── test-guard.agent.md            # Agent 3: Test/Guard
├── docs-changelog.agent.md        # Agent 4: Docs/Changelog
├── templates/
│   └── PR_TEMPLATE.md             # PR-Vorlage (Ziel, Änderungen, Tests, Artefakte)
└── scripts/
    ├── run-lighthouse.mjs         # Lighthouse-Run für Key Screens
    ├── bundle-report.mjs          # Bundle-Analyzer Wrapper
    └── prepare-artifacts.mjs      # Sammelt Reports in artifacts/

artifacts/                         # Generierte Outputs (nicht in Git)
├── ui-refactor/
├── pwa-perf/
├── test-guard/
└── docs/
```

---

## 🔒 Policies (siehe `policies.md`)

**Branching**:
- `feat/<agent>-<topic>` → PR gegen `dev`
- **Niemals** direkt auf `main`

**PR-Größe**:
- Netto-Diff ≤ 300 Zeilen (sonst aufteilen)

**Gates**:
- Lint/TS = 0 Errors
- Tests grün (Unit + E2E)
- Playwright Visual Diffs OK
- Lighthouse ≥ 90

**Projekt-Constraints**:
- Mobile One-Screen-Regel
- Glass/Blur Design System
- Keine destruktiven npm-Befehle
- Frozen Lockfile in CI (`npm ci`)

---

## 📦 Artefakte & Outputs

Jeder Agent MUSS seine Outputs in `artifacts/<agent-name>/` ablegen:

| Agent           | Artefakte                                      |
|-----------------|------------------------------------------------|
| UI-Refactor     | Storybook, Screenshots, Playwright-Report     |
| PWA/Performance | Lighthouse JSON/HTML, Bundle-Report (stats.html) |
| Test/Guard      | Coverage, Playwright-Report, Lint/TS Logs     |
| Docs/Changelog  | Aktualisierte Markdown-Dateien, Screenshots   |

---

## 🛠️ Scripts (in `package.json`)

```json
{
  "scripts": {
    // Bestehend (bereits vorhanden)
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:all": "npm run typecheck && npm run lint && npm run test:unit && npm run test:e2e",
    "analyze": "vite build && npx rollup-plugin-visualizer stats.html --open",

    // Neu (von Agents genutzt)
    "agent:lighthouse": "node .agent/scripts/run-lighthouse.mjs",
    "agent:bundle": "node .agent/scripts/bundle-report.mjs",
    "agent:artifacts": "node .agent/scripts/prepare-artifacts.mjs"
  }
}
```

---

## 🔄 Workflow-Beispiel (UI-Refactor Agent)

1. **Trigger**: Mobile-Layout scrollt, verletzt One-Screen-Regel
2. **Agent liest**: `.agent/ui-refactor.agent.md`
3. **Schritte**:
   - Inventar: Layouts, Komponenten, Theme
   - Design Tokens extrahieren → `src/theme/tokens.ts`
   - Tiles uniformieren (Glass/Blur)
   - Mobile-Grids anpassen (2-Spalten, kompakt)
   - Storybook Stories hinzufügen
   - Playwright Visual Diffs (Before/After)
4. **Branch erstellen**: `feat/ui-refactor-glass-tiles`
5. **Artefakte sammeln**:
   - `artifacts/ui-refactor/storybook-static/`
   - `artifacts/ui-refactor/screenshots/`
   - `artifacts/ui-refactor/playwright-report/`
6. **PR erstellen** mit Template:
   - Ziel: Einheitliche Glass/Blur Tiles
   - Änderungen: Design Tokens, Tile-Refactor
   - Getestet: `npm run test:all`, Playwright Visual Diffs
   - Artefakte: Links zu Reports
   - Risiken: Keine, rein visuell

---

## 🚦 CI Pipeline (`.github/workflows/ci.yml`)

Trigger: PR gegen `dev`

**Schritte**:
1. Checkout, Node LTS, Cache
2. `npm ci` (frozen lockfile)
3. `npm run lint` (ESLint)
4. `npm run typecheck` (TypeScript)
5. `npm run test:unit` (Vitest)
6. `npm run test:e2e` (Playwright)
7. `npm run agent:lighthouse` (Lighthouse ≥90)
8. `npm run build` (Produktions-Build)
9. Upload `artifacts/**` als Build-Artefakte

**Harte Gates**: Job failt bei:
- Lint/TS Errors
- Test-Fehlern
- Lighthouse < 90
- Build-Fehlern

---

## 🔐 Sicherheit & Stabilität

- ✅ Keine Secrets in Code (`.env` in `.gitignore`)
- ✅ Keine `npm audit fix --force`
- ✅ Keine riskanten Dependency-Upgrades ohne Tests
- ✅ Frozen Lockfile (`npm ci`)
- ✅ Sandbox: Nur Zugriff auf Projektordner

---

## 📚 Nächste Schritte

1. **UI-Refactor** starten (First PR)
2. **Test/Guard** aufsetzen (E2E-Flows)
3. **PWA/Performance** optimieren (Lazy Loading, Bundle)
4. **Docs/Changelog** aktualisieren (README, CLAUDE.md)

**Viel Erfolg!** 🚀
