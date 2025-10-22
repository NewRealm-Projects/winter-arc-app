<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

Guidance for Claude Code when working with this repository.

**Note**: For project architecture, tech stack, and testing conventions, see `openspec/project.md`. This file focuses on UI/UX guidelines and developer workflow.

---

## Claude Code Workflow

**MANDATORY**: Claude Code soll standardmäßig bis zu **10 Worker/Tasks parallel** ausführen, wenn sinnvoll.

**Parallel-Richtlinien:**
- Nutze parallele Tool-Aufrufe für unabhängige Operationen (Read, Glob, Grep, Bash)
- Starte mehrere Tasks/Agents gleichzeitig in einem Response-Block
- Beispiele:
  - Mehrere Dateien parallel lesen
  - Lint, TypeScript, Tests parallel ausführen
  - Verschiedene Suchen parallel durchführen
  - Mehrere unabhängige Agents gleichzeitig starten

**Sequenziell nur bei Abhängigkeiten:**
- Dateien erst lesen, dann editieren
- Build erst nach Code-Änderungen
- Commit erst nach erfolgreichen Tests

---

## Codacy Compliance (MANDATORY)

Every commit MUST pass Codacy checks:

| Check | Requirement |
|-------|-------------|
| ESLint | No errors/warnings |
| Prettier | `format:check` OK |
| TypeScript | No type errors |
| Tests | Coverage ≥80% |
| Security | No Critical/Major issues |

**Local validation:**
```bash
npm run lint && npm run format:check && npm run typecheck && npm test -- --coverage
```

**Common fixes:**
- Remove unused imports/vars or prefix with `_`
- Replace `any` with proper types
- Remove `console.*` (use logger or remove)
- Extract magic numbers to constants
- Split complex functions (<50 lines)
- No circular dependencies

---

## Branching & Workflow

**MANDATORY**: The `main` branch is PROTECTED and requires Pull Requests.

### Branch Naming Convention

**Format**: `<username>/<type>-<description>`

**Valid Types**: `feature`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`

**Examples:**
```bash
# ✅ CORRECT
lbuettge/feature-dashboard
niklas/chore-cleanup
daniel/fix-login-bug
lars/refactor-api-client

# ❌ WRONG
feat/dashboard           # Missing username
lbuettge-feature         # Wrong separator
feature-dashboard        # Missing username
```

### Workflow

1. **Create Feature Branch** (MANDATORY):
   ```bash
   git checkout -b <username>/<type>-<description>
   ```

2. **Work on Changes**:
   ```bash
   git add .
   git commit -m "type: description"
   ```

3. **Push to Remote**:
   ```bash
   git push -u origin <username>/<type>-<description>
   ```

4. **Create Pull Request**:
   ```bash
   gh pr create --title "type: description" --body "..." --base main
   ```

5. **Wait for CI & Review**:
   - CI must pass (TypeScript, ESLint, Tests, Build)
   - Codacy checks must pass
   - At least 1 approval required

6. **Merge**:
   - Squash and merge (preferred)
   - Delete branch after merge

### Protected Branches

- **`main`**: Production (requires PR + CI + approval)
- **`develop`**: Staging (requires PR + CI)

**NEVER** push directly to `main` or `develop`!

### PR Checklist

- [ ] Branch name follows convention (`<username>/<type>-<description>`)
- [ ] Codacy Passed
- [ ] All tests pass (`npm run test:all`)
- [ ] CHANGELOG.md updated
- [ ] package.json version bumped (SemVer)
- [ ] Git hooks passed
- [ ] Screenshots for UI changes
- [ ] PR description includes summary and test plan

### Commit Format

```
type(scope): subject

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `refactor`, `chore`, `test`, `docs`, `style`, `perf`

### Git Hooks

- **Pre-commit**: TypeScript + ESLint + Secret Scanning
- **Pre-push**: TypeScript + ESLint + Tests + Build + Branch Name Validation

---

## Agent System

Structured agents in `.agent/` for quality assurance:

1. **UI-Refactor** (`.agent/ui-refactor.agent.md`): Glass design, mobile-first, responsive
2. **PWA/Performance** (`.agent/pwa-perf.agent.md`): Lighthouse ≥90, Bundle <600KB
3. **Test/Guard** (`.agent/test-guard.agent.md`): Coverage ≥70%, E2E tests
4. **Docs/Changelog** (`.agent/docs-changelog.agent.md`): Docs, changelog, versioning

**Trigger examples:**
- Lighthouse <90 → PWA Agent
- Coverage <70% → Test Agent
- Inconsistent styles → UI Agent
- Missing changelog → Docs Agent

**Artifacts**: `artifacts/<agent>/` (bundle, lighthouse, tests, docs)

See [`.agent/policies.md`](.agent/policies.md) for full rules.

---

## Scripts

```bash
# Development
npm run dev              # Start dev server (localhost:5173)
npm run build            # Production build
npm run preview          # Preview build

# Quality
npm run lint             # ESLint
npm run typecheck        # TypeScript
npm run test:all         # All checks
npm run test:unit        # Vitest
npm run test:ui          # Playwright

# Performance
npm run analyze          # Bundle analyzer
npm run lhci:run         # Lighthouse CI
```

---

## UI/UX Guidelines

### Tile Design System - ENDUCO-INSPIRED (Updated 2025-10-09)

**Modern Card System (OPAQUE, NO transparency):**

**Design Principles:**
- **NO Glassmorphism**: Solid backgrounds, no `backdrop-blur`
- **Clean Borders**: `1px solid var(--border-subtle)`
- **Subtle Shadows**: `var(--shadow-card)` instead of heavy box-shadows
- **Consistent Radius**: `12px` (`rounded-xl`) for all cards

**Standard Tile Classes:**
```typescript
import { glassCardClasses, glassCardHoverClasses } from '@/theme/tokens';
// Use: className={glassCardClasses}
```

**CSS Variables (theme.css):**
```css
/* Light Mode */
--card-bg: #FFFFFF;
--card-bg-hover: #FAFAFA;
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);

/* Dark Mode */
--card-bg: #1F2937;
--card-bg-hover: #374151;
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.4);
```

**Structure:**
- Header: Icon (left) + Title + Metric (right) - LEFT-ALIGNED
- Content: CENTERED (progress bars, buttons, inputs)
- Padding: `p-3` mobile, `p-4` desktop (from `designTokens.padding`)

**❌ DEPRECATED:**
- `glass-dark` (removed)
- `backdrop-blur-*` (no transparency)
- `bg-white/5` (use `var(--card-bg)`)
- Winter blue gradients (use `var(--accent-primary)` green)

### Mobile-First (One Screen Rule)

**CRITICAL**: Every page MUST fit in one mobile viewport (~100vh) - NO vertical scrolling.

- Reduce padding on mobile: `px-3 pt-4` (Desktop: `px-6 pt-8`)
- Reduce gaps: `gap-2 mb-3` mobile, `gap-4 mb-4` desktop
- Flatten tiles: `h-32` instead of `h-48`
- Test on: iPhone SE (375×667), Pixel 6 (412×915), Galaxy S20 (360×800)

### Layout Grid

- **Tracking tiles**: Use `tile-grid-2` for flush desktop alignment
- **❌ Never use** `mobile-grid` for tracking tiles (breaks desktop alignment)
- **Bottom nav**: 3 items only (Dashboard, Group, Notes) - Settings in header only

### UI Popups & Modals (Updated 2025-10-09)

**MANDATORY**: All dialogs/popups/modals MUST use the unified `AppModal` component.

**Import:**
```typescript
import { AppModal, ModalPrimaryButton, ModalSecondaryButton } from '@/components/ui/AppModal';
```

**Design Rules:**
1. **Overlay**: `var(--wa-overlay)` - NO `backdrop-blur` on overlay
2. **Dialog Panel**: Fully opaque background `var(--wa-surface-elev)` - NO transparency
3. **Border & Shadow**: `1px solid var(--wa-border)` + `box-shadow: var(--wa-shadow-lg)`
4. **Border Radius**: `border-radius: var(--wa-radius-xl)` (16px)
5. **Animation**: 180ms fade+scale with `cubic-bezier(0.2, 0.8, 0.2, 1)`
6. **Z-Index**: Overlay at `var(--z-overlay)`, Dialog at `var(--z-modal)`

**Theme Compatibility:**
- ✅ Light Mode: Dialog uses `var(--wa-surface-elev)` = `#FFFFFF`
- ✅ Dark Mode: Dialog uses `var(--wa-surface-elev)` = `#1F2937`
- ✅ All modals inherit theme from ThemeProvider
- ✅ NO hard-coded colors (e.g., `bg-slate-800`, `text-white`)

**Accessibility (A11y):**
- ✅ ARIA: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- ✅ Focus Trap: Tab cycles within modal, Shift+Tab reverses
- ✅ Escape Key: Closes modal (unless `preventCloseOnBackdrop={true}`)
- ✅ Return Focus: Focus returns to trigger element on close
- ✅ Body Scroll Lock: Prevents background scrolling when open

**Usage Pattern:**
```tsx
<AppModal
  open={isOpen}
  onClose={handleClose}
  title="Modal Title"
  subtitle="Optional subtitle"
  size="md" // sm | md | lg | xl
  preventCloseOnBackdrop={false}
  icon={<YourIcon />} // optional
  footer={
    <>
      <ModalSecondaryButton onClick={handleClose}>Cancel</ModalSecondaryButton>
      <ModalPrimaryButton onClick={handleSave}>Save</ModalPrimaryButton>
    </>
  }
>
  <div className="space-y-4">
    {/* Modal content */}
  </div>
</AppModal>
```

**Size Options:**
- `sm`: `max-w-md` (448px) - Quick confirmations
- `md`: `max-w-lg` (512px) - Default, simple forms
- `lg`: `max-w-2xl` (672px) - Complex forms (like CheckIn)
- `xl`: `max-w-4xl` (896px) - Dashboards, data-heavy views

**Z-Index Matrix:**
| Layer | CSS Variable | Value | Usage |
|-------|-------------|-------|-------|
| Base | `--z-base` | 0 | Default layer |
| Elevated | `--z-elevated` | 10 | Dropdowns |
| Sticky | `--z-sticky` | 20 | Sticky headers |
| Bottom Nav | `--z-bottom-nav` | 30 | Navigation bar |
| FAB | `--z-fab` | 35 | Floating buttons |
| Overlay | `--z-overlay` | 1000 | Modal backdrop |
| Modal | `--z-modal` | 1010 | Dialog content |
| Toast | `--z-toast` | 1100 | Notifications |
| Tooltip | `--z-tooltip` | 1200 | Tooltips |

**Common Mistakes to Avoid:**
- ❌ NO `backdrop-blur` on dialog panel (only on overlay if needed)
- ❌ NO custom z-index values - use CSS variables (`var(--z-overlay)`, `var(--z-modal)`)
- ❌ NO inline modal implementations - use `AppModal`
- ❌ NO `opacity` classes on dialog wrapper
- ❌ NO `bg-white/80` or similar transparent backgrounds on dialog
- ❌ NO manual focus management - `AppModal` handles it
- ❌ NO hard-coded colors - use theme variables (`var(--text-primary)`, `var(--card-bg)`, etc.)

**Light Mode Checklist:**
- [ ] Modal background uses `var(--wa-surface-elev)` (NOT `bg-slate-800`)
- [ ] Text uses `text-gray-900 dark:text-gray-100` (NOT `text-white`)
- [ ] Buttons use theme-aware classes (NOT hard-coded dark colors)
- [ ] Inputs use `border-gray-200 dark:border-white/20` (responsive)

**Testing:**
- E2E tests in `tests/e2e/modal.spec.ts`
- Storybook stories in `src/components/ui/AppModal.stories.tsx`
- Visual regression: All modal variants must pass screenshot tests

---

## Design Tokens

### Colors
**Light**: `--primary-blue: #3B82F6`, `--bg-light: #F8FAFC`
**Dark**: `--primary-blue: #60A5FA`, `--bg-dark: #0F172A`
**Glass**: `--glass-blur: blur(16px)`, `--glass-border: rgba(255,255,255,0.12)`

### Typography
- XS: `12px` | SM: `14px` | Base: `16px` | LG: `18px` | XL: `20px`
- H1: `28px` | H2: `24px` | H3: `20px`
- Font Stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto'`

### Spacing
- Standard: `4px, 8px, 12px, 16px, 20px, 24px`
- Tile Padding: `12px` mobile, `16px` desktop
- Gap: `8px` mobile, `16px` desktop

### Shadows (Refined)
- Card: `0 2px 8px rgba(0, 0, 0, 0.08)` light, `0 2px 8px rgba(0, 0, 0, 0.4)` dark
- Card Hover: `0 4px 12px rgba(0, 0, 0, 0.12)` light, `0 4px 12px rgba(0, 0, 0, 0.5)` dark

### Backgrounds
**NO gradients or images** - Clean solid colors:
- Light: `#F8FAFC`
- Dark: `#0F172A`

---

## App Structure

### 1. Dashboard (Updated 2025-10-09)

**Layout:**
1. **WeeklyTile** (`src/components/dashboard/WeeklyTile.tsx`)
   - Week navigation (‹ ›)
   - Mon-Sun progress circles (Mo-So)
   - Clean, minimalist design (NO redundant info)
   - Fixed: Kreise-Clipping behoben mit `overflow-visible`

2. **UnifiedTrainingCard** (`src/components/UnifiedTrainingCard.tsx`) **[NEW]**
   - **Ersetzt:** `TrainingLoadTile` + `SportTile`
   - **Header:** Titel + Badge (Niedrig/Mittel/Hoch) + Check-in Button (rechts)
   - **Subheader:** Wochenstatistik (Streak, Ø Erfüllung)
   - **Section A:** Trainingslast-Graph (7 Tage)
   - **Section B:** Sport-Status (Icons + "Training verwalten")
   - **Hook:** `useTrainingLoadWeek()` für Wochenstatistiken

3. **Tracking Tiles** (tile-grid-2)
   - **Pushup Tile**: Quick input OR Training mode
   - **Water Tile**: Progress bar, quick buttons
   - **Protein Tile**: Goal based on weight (2g/kg)

4. **WeightTile**: Line chart (30/90 days), BMI calculation

**Check-in Flow:**
- Check-in Button jetzt in `UnifiedTrainingCard` (vorher in `WeeklyTile`)
- Modal: Schlaf (1-10), Regeneration (1-10), Krankheit (Toggle)
- Speichern → Recompute Trainingslast + Graph update

### 2. Leaderboard
- Calendar heatmap, group stats, achievements

### 3. Settings
- Profile, groups, notifications, privacy, account deletion

### 4. History (Archived)
**Status**: ⚫ Archived 2025-10-04 (redundant with week navigation)
**Reactivate**: Set `HISTORY_ENABLED=true` in `src/config/features.ts`, uncomment routes

---

## Implemented Features

✅ Pushup Training Mode (Base & Bump in `pushupAlgorithm.ts`)
✅ Leaderboard Preview Widget
✅ Weather Integration (Open-Meteo API)
✅ Visual Regression Tests (Playwright)
✅ Lighthouse CI & Performance Budgets
✅ Vitest Unit Tests
✅ Sentry Error Tracking (with privacy filtering)

### Archived Features
⚫ **AI Quotes** (2025-10-04): Gemini API removed, no user value. Fallback quotes remain.
⚫ **History Page** (2025-10-04): Redundant with week navigation. Feature flag: `HISTORY_ENABLED`.

---

## Planned Features

🟡 **Profile Pictures**: Upload, Firebase Storage, compression
🔵 **Push Notifications**: FCM, daily reminders
🔵 **Data Export**: CSV/JSON, GDPR compliance
🔵 **Social Sharing**: Progress cards
🔵 **Achievements**: Badge system

---

## PWA & Performance

- Service Worker (Workbox)
- Offline-first: IndexedDB/localStorage → Firebase sync
- Cache-first for static assets
- Network-first for leaderboard data
- Lighthouse target: ≥90
- Bundle budget: <600KB main chunk

---

## Best Practices

- TypeScript strict mode
- a11y standards (WCAG)
- Mobile-first responsive design
- Dark mode support
- Code splitting & lazy loading
- Optimized images (WebP)
- Semantic versioning (SemVer)
- CHANGELOG.md for every change
