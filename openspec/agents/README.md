# Winter Arc - Agent System

Spezialisierte AI-Agents für strukturierte Entwicklung mit Quality Gates.

## 🤖 Verfügbare Agents

### 1. UI-Refactor Agent
**Fokus**: Modernes, konsistentes UI mit Glass/Blur-Design, Mobile-First

**Trigger**:
- Tile-Design inkonsistent
- Mobile-Layout scrollt vertikal (One-Screen-Regel verletzt)
- Dark/Light-Mode Hintergründe falsch
- Fehlende Design Tokens

**Output**:
- Design Token System (`src/theme/tokens.ts`)
- Einheitliche Tile-Komponenten
- Before/After Screenshots (Light & Dark)
- Playwright Visual Diffs

**Quality Gates**:
- ✅ Lighthouse Performance ≥ 90
- ✅ Mobile One-Screen (kein vertikales Scrollen)
- ✅ Visual Regression Tests grün

---

### 2. PWA/Performance Agent
**Fokus**: Performance-Optimierung, Bundle-Splitting, PWA-Funktionalität

**Trigger**:
- Lighthouse Performance Score < 90
- Bundle zu groß (>600kb)
- Langsame TTI (Time to Interactive)
- Service Worker nicht optimal

**Output**:
- Route-based Lazy Loading
- WebP/AVIF Bilder
- Bundle Analyzer Report
- Lighthouse Reports (JSON + HTML)

**Quality Gates**:
- ✅ Lighthouse ≥ 90 (alle Metriken)
- ✅ Bundle < 600KB main chunk
- ✅ TTI < 3s

---

### 3. Test/Guard Agent
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

**Quality Gates**:
- ✅ Coverage ≥ 70%
- ✅ ESLint: 0 Errors
- ✅ TypeScript: 0 Errors
- ✅ E2E Tests: 100% Pass

---

### 4. Docs/Changelog Agent
**Fokus**: Dokumentation, Developer Experience, Onboarding

**Trigger**:
- README veraltet
- Dokumentation inkonsistent mit Code
- CHANGELOG.md nicht aktuell

**Output**:
- Aktualisierte READMEs
- Konsolidierte Dokumentation
- CHANGELOG.md (Release Notes)

**Quality Gates**:
- ✅ Alle Links funktionieren
- ✅ Code-Beispiele kompilieren
- ✅ Screenshots aktuell

---

## 🚀 Workflow

### 1. Agent triggern
```bash
# Manuell
1. Lese Agent-Definition (siehe unten)
2. Erstelle Branch: feat/<agent>-<topic>
3. Führe Agent-Steps aus
4. Sammle Artefakte
5. Erstelle PR mit Template

# Via Commit-Message
git commit -m "[agent:ui-refactor] fix glass-blur tiles"
```

### 2. Quality Gates
Jede PR muss folgende Gates bestehen:
- ✅ ESLint: 0 Errors
- ✅ TypeScript: 0 Errors  
- ✅ Tests: 100% Pass
- ✅ Build: Erfolgreich
- ✅ Agent-spezifische Gates (siehe oben)

### 3. PR-Struktur
Verwende `.taskmaster/templates/pr_template.md`:
1. **Ziel & Kontext**
2. **Änderungen**
3. **Wie getestet**
4. **Artefakte**
5. **Risiken/Nächste Schritte**

---

## 📐 Design-Regeln

### Mobile-First: One-Screen-Regel
- Jede Hauptseite passt in ~100vh (mobil)
- Kein vertikales Scrollen auf Haupt-Container
- Getestet auf: iPhone SE, Pixel 6, Galaxy S20

### Glass/Blur Design System
Alle Tiles verwenden einheitliches Glassmorphism:
```css
rounded-2xl
bg-white/5 dark:bg-white/5
backdrop-blur-md
border border-white/10
shadow-[0_6px_24px_rgba(0,0,0,0.25)]
transition-all duration-200
```

### Layout
- 2-Spalten Desktop (`tile-grid-2`)
- Responsive Collapse auf Mobile
- Spacing: Mobile `px-3 pt-4`, Desktop `px-6 pt-8`

---

## 🔒 Sicherheit & Stabilität

### Verboten
- ❌ Secrets in Code committen
- ❌ Destruktive npm-Befehle (`npm audit fix --force`)
- ❌ Riskante Dependency-Upgrades ohne Tests

### Pflicht
- ✅ Frozen Lockfile in CI (`npm ci`)
- ✅ Security Check (`npm run lint:secrets`)
- ✅ Branch Protection (kein direkter Push zu `main`)

---

## 📊 Artefakte

Agents legen Outputs in `.taskmaster/reports/<agent-name>/` ab:

- **UI-Refactor**: Screenshots, Visual Diffs, Design Tokens
- **PWA/Perf**: Lighthouse Reports, Bundle Analysis
- **Test/Guard**: Coverage Reports, Test Results
- **Docs**: Updated Docs, Changelog

---

Siehe auch:
- Task Master AI: `.taskmaster/`
- OpenSpec Workflow: `openspec/AGENTS.md`
- Branching Strategy: `.github/CONTRIBUTING.md`
