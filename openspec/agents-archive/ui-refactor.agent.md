# UI-Refactor Agent

**Verantwortung**: Modernes, konsistentes UI mit Glass/Blur-Design, Mobile-First, One-Screen-Regel

---

## 🎯 Ziel

Erstelle ein **einheitliches Design System** mit:
- **Glass/Blur-Effekt** auf allen Tiles (Backdrop-Filter + Fallback)
- **Mobile One-Screen**: Jede Hauptseite passt in einen Viewport (~100vh) ohne Scrollen
- **Design Tokens**: Zentrale Variablen für Spacing, Radius, Shadows, Blur-Intensität
- **Light/Dark Mode**: Korrekte Hintergründe und Kontraste
- **Responsive Grids**: 2-Spalten Desktop, kompakt auf Mobile

---

## 🚨 Trigger (wann dieser Agent läuft)

- Tile-Design inkonsistent (verschiedene Border-Radien, Schatten, Padding)
- Mobile-Layout scrollt vertikal (verletzt One-Screen-Regel)
- Dark/Light-Mode Hintergründe falsch (z.B. falsches `bg-image`)
- Fehlende Design Tokens (harte CSS-Werte im Code)
- Kein Storybook für Komponenten

---

## 📋 Schritte

### 1. Inventar & Analyse
- **Lesen**:
  - `src/` (Layouts, Components, Pages)
  - `vite.config.ts`, `tailwind.config.js`
  - Bestehende Styles (CSS, Tailwind-Klassen)
- **Prüfen**:
  - Gibt es bereits Design Tokens? (z.B. `src/theme/tokens.ts`)
  - Welche Tiles existieren? (PushupTile, SportTile, WaterTile, ProteinTile, WeightTile)
  - Sind Storybook-Stories vorhanden?

### 2. Design Token System erstellen
Erstelle `src/theme/tokens.ts` (falls nicht vorhanden) mit:

```typescript
// src/theme/tokens.ts
export const designTokens = {
  // Spacing
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '0.75rem', // 12px
    lg: '1rem',    // 16px
    xl: '1.5rem',  // 24px
    '2xl': '2rem', // 32px
  },

  // Border Radius
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px
  },

  // Shadows
  shadow: {
    glass: '0 6px 24px rgba(0, 0, 0, 0.25)',
    tile: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },

  // Blur
  blur: {
    sm: '8px',
    md: '16px',
    lg: '24px',
  },

  // Glass/Blur Preset
  glass: {
    background: 'bg-white/5 dark:bg-white/5',
    backdropBlur: 'backdrop-blur-md',
    border: 'border border-white/10',
    shadow: 'shadow-[0_6px_24px_rgba(0,0,0,0.25)]',
    rounded: 'rounded-2xl',
    transition: 'transition-all duration-200',
  }
};

// Kombinierte Klassen für Wiederverwendung
export const glassCardClasses = [
  designTokens.glass.rounded,
  designTokens.glass.background,
  designTokens.glass.backdropBlur,
  designTokens.glass.border,
  designTokens.glass.shadow,
  designTokens.glass.transition,
].join(' ');
```

### 3. Tiles uniformieren (Glass/Blur)
**Alle Tiles** MÜSSEN diese Klassen verwenden:

```tsx
// Standard Tile Structure (z.B. WaterTile, ProteinTile)
<div className="rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] transition-all duration-200 p-3 text-white">
  {/* Header: Icon (left) + Title + Metric (right) - ALWAYS left-aligned */}
  <div className="flex items-center justify-between mb-2">
    <div className="flex items-center gap-2">
      <div className="text-xl">💧</div>
      <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {t('tracking.water')}
      </h3>
    </div>
    <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
      {value}
    </div>
  </div>

  {/* Content area - ALWAYS centered */}
  <div className="text-center">
    {/* Progress bars, buttons, inputs, etc. */}
  </div>
</div>
```

**Wichtige Regeln**:
- ✅ Header **links-aligned** (Icon + Titel links, Metrik rechts)
- ✅ Content **zentriert** (Buttons, Inputs, Progress Bars)
- ✅ Einheitliches Padding: `p-3` (Standard) oder `p-6` (WeightTile mit Graph)
- ❌ **Niemals** `glass-dark` oder andere veraltete Klassen

### 4. Mobile-Layouts anpassen
**One-Screen-Regel**:
- Hauptseiten (Dashboard, Leaderboard, Notes, Settings) passen in **einen Viewport** (~100vh)
- Kein vertikales Scrollen auf Haupt-Container

**Implementierung**:
```tsx
// Desktop: 2-Spalten-Grid (flush mit WeekOverview/WeightTile)
<div className="tile-grid-2">
  <PushupTile />
  <SportTile />
</div>

// Mobile: Reduziere Padding/Gaps
<div className="px-3 pt-4 md:px-6 md:pt-8 gap-2 md:gap-4">
  {/* Content */}
</div>

// Flatten große Tiles (z.B. Weight Chart)
<div className="h-32 md:h-48"> {/* Mobile: 128px, Desktop: 192px */}
  <ResponsiveContainer>...</ResponsiveContainer>
</div>
```

**Test-Devices**:
- iPhone SE (375×667px)
- Pixel 6 (412×915px)
- Galaxy S20 (360×800px)

### 5. Storybook Stories hinzufügen
Falls Storybook nicht installiert:
```bash
npx sb init --builder vite
```

Erstelle Stories für Tiles:
```tsx
// src/components/WaterTile.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { WaterTile } from './WaterTile';

const meta: Meta<typeof WaterTile> = {
  title: 'Tiles/WaterTile',
  component: WaterTile,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof WaterTile>;

export const Default: Story = {};
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
```

### 6. Playwright Visual Diffs
Erstelle Before/After Screenshots:

```bash
# Before: Baseline erstellen
npm run test:ui -- --update-snapshots

# After: Änderungen testen
npm run test:ui
```

Screenshots für:
- Dashboard (Light & Dark)
- Tiles einzeln (Light & Dark)
- Mobile Viewports (375px, 412px)

### 7. Lighthouse-Check
```bash
npm run agent:lighthouse
```

Ziel: Performance Score ≥ 90 (Startseite)

---

## 📦 Artefakte (in `artifacts/ui-refactor/`)

1. **Design Tokens**: `src/theme/tokens.ts`
2. **Storybook**: `storybook-static/` (oder Link)
3. **Screenshots**:
   - `screenshots/before/` (Baseline)
   - `screenshots/after/` (Nach Änderungen)
   - Light & Dark Mode
4. **Playwright Report**: `playwright-report/`
5. **Lighthouse Report**: `lighthouse.json`

---

## ✅ Definition of Done

- [ ] Design Tokens erstellt (`src/theme/tokens.ts`)
- [ ] Alle Tiles verwenden einheitliche Glass/Blur-Klassen
- [ ] Mobile One-Screen: Keine vertikale Scroll-Notwendigkeit
- [ ] Storybook Stories für Tiles (mind. 3 Stories)
- [ ] Playwright Visual Diffs grün (Light & Dark)
- [ ] Lighthouse Performance ≥ 90
- [ ] Lint/TS = 0 Errors
- [ ] PR gegen `dev` mit Template

---

## 🔄 Branch & PR

**Branch-Name**: `feat/ui-refactor-glass-tiles`

**PR-Template** (`.agent/templates/PR_TEMPLATE.md`):
- **Ziel**: Einheitliches Glass/Blur Design System
- **Änderungen**:
  - Design Tokens (`src/theme/tokens.ts`)
  - Tile-Refactor (PushupTile, SportTile, WaterTile, ProteinTile, WeightTile)
  - Mobile-Grids angepasst (One-Screen-Regel)
  - Storybook Stories
- **Getestet**:
  - `npm run test:all` ✅
  - Playwright Visual Diffs ✅
  - Lighthouse ≥ 90 ✅
- **Artefakte**:
  - `artifacts/ui-refactor/storybook-static/`
  - `artifacts/ui-refactor/screenshots/`
  - `artifacts/ui-refactor/playwright-report/`
- **Risiken**: Keine, rein visuell

---

## 🚀 Nächste Schritte

1. **Test/Guard Agent**: E2E-Tests für neue UI-Komponenten
2. **PWA/Performance Agent**: Lazy Loading für Storybook-Bundle
3. **Docs/Changelog Agent**: README-Screenshots aktualisieren
