# Pull Request: [Titel]

## 🎯 Ziel & Kontext

<!-- Was wird geändert und warum? (2-3 Sätze) -->

**Problem/Motivation**:


**Lösung**:


**Agent** (falls zutreffend):
- [ ] UI-Refactor
- [ ] PWA/Performance
- [ ] Test/Guard
- [ ] Docs/Changelog
- [ ] Keine (manueller Bugfix/Feature)

---

## 📝 Änderungen

<!-- Stichpunkte mit Key-Changes -->

### Added
-

### Changed
-

### Fixed
-

### Removed
-

---

## 🧪 Wie getestet

<!-- Konkrete Befehle/Links (reproduzierbar) -->

**Lokal getestet**:
```bash
# Befehle zum Reproduzieren
npm run test:all
npm run build
```

**Screenshots** (falls UI-Änderungen):
| Before | After |
|--------|-------|
| ![Before](link) | ![After](link) |

**Test-Devices** (falls Mobile-Änderungen):
- [ ] iPhone SE (375×667px)
- [ ] Pixel 6 (412×915px)
- [ ] Desktop (1920×1080px)

**Dark/Light Mode**:
- [ ] Light Mode getestet
- [ ] Dark Mode getestet

---

## 📦 Artefakte

<!-- Pfade zu Reports/Screenshots/Logs -->

**Reports**:
- Coverage: `artifacts/<agent>/coverage/`
- Playwright: `artifacts/<agent>/playwright-report/`
- Lighthouse: `artifacts/<agent>/lighthouse.json`
- Bundle: `artifacts/<agent>/stats.html`

**Screenshots**:
- `artifacts/<agent>/screenshots/`

**Logs**:
- Lint: `artifacts/<agent>/lint-report.txt`
- TypeScript: `artifacts/<agent>/typecheck-report.txt`

---

## ✅ Quality Gates

<!-- Bestätigung, dass alle Gates erfüllt sind -->

**Code Quality**:
- [ ] ESLint: 0 Errors (`npm run lint`)
- [ ] TypeScript: 0 Errors (`npm run typecheck`)
- [ ] Strikte Regeln eingehalten (`strict: true`)

**Tests**:
- [ ] Unit Tests: 100% Pass (`npm run test:unit`)
- [ ] E2E Tests: 100% Pass (`npm run test:e2e`)
- [ ] Visual Tests: Keine Regressions (`npm run test:ui`)
- [ ] Coverage: ≥ 70% (Core-Module)

**Performance**:
- [ ] Lighthouse Performance: ≥ 90
- [ ] Lighthouse PWA: ≥ 90
- [ ] Bundle Size: < 600kb (keine Vite-Warnung)

**Design**:
- [ ] Mobile One-Screen-Regel eingehalten
- [ ] Glass/Blur Design konsistent
- [ ] Responsive (375px, 412px, 1920px)

**Dokumentation**:
- [ ] CHANGELOG.md aktualisiert
- [ ] package.json Version gebumpt (falls nötig)
- [ ] Code kommentiert (komplexe Logik)

---

## ⚠️ Risiken & Offene Punkte

<!-- Was könnte schiefgehen? Follow-ups? -->

**Risiken**:
-

**Follow-up Issues**:
-

**Nächste Schritte**:
-

---

## 🔗 Links

<!-- Referenzen zu Issues, Docs, etc. -->

- Issue: #
- Agent-Definition: `.agent/<agent-name>.agent.md`
- Policies: `.agent/policies.md`

---

## 📋 Checklist (vor Merge)

- [ ] Code reviewed
- [ ] CI grün (Lint, TS, Tests, Lighthouse)
- [ ] Alle Quality Gates erfüllt
- [ ] Artefakte hochgeladen (GitHub Actions Artifacts)
- [ ] CHANGELOG.md aktualisiert
- [ ] package.json Version gebumpt (falls nötig)
- [ ] Konflikte mit `dev` resolved
- [ ] Squash-Merge bevorzugt (saubere History)

---

**Agent-generiert?**
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
