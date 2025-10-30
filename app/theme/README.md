# Design Token System

Zentrales Design Token System für konsistente UI-Komponenten.

## 📦 Verwendung

```typescript
import {
  designTokens,
  glassCardClasses,
  getTileClasses
} from '../theme/tokens';
```

## 🎨 Verfügbare Tokens

### Spacing
```typescript
designTokens.spacing.xs   // 4px
designTokens.spacing.sm   // 8px
designTokens.spacing.md   // 12px
designTokens.spacing.lg   // 16px
designTokens.spacing.xl   // 24px
designTokens.spacing['2xl'] // 32px
```

### Border Radius
```typescript
designTokens.radius.sm    // 6px
designTokens.radius.md    // 8px
designTokens.radius.lg    // 12px
designTokens.radius.xl    // 16px
designTokens.radius['2xl'] // 24px (Standard für Tiles)
designTokens.radius.full  // Circular
```

### Shadows
```typescript
designTokens.shadow.glass // Standard Glass-Shadow für Tiles
designTokens.shadow.tile  // Leichterer Tile-Shadow
designTokens.shadow.sm/md/lg/xl // Standard-Shadows
```

### Glass/Blur-Effekte
```typescript
designTokens.glass.background   // bg-white/5 dark:bg-white/5
designTokens.glass.backdropBlur // backdrop-blur-md
designTokens.glass.border       // border border-white/10
designTokens.glass.shadow       // shadow-[0_6px_24px_rgba(0,0,0,0.25)]
designTokens.glass.rounded      // rounded-2xl
designTokens.glass.transition   // transition-all duration-200
```

## 🔧 Utility-Klassen

### Standard Glass-Card
```typescript
import { glassCardClasses } from '../theme/tokens';

<div className={glassCardClasses}>
  {/* Content */}
</div>
```

Ergibt:
```css
rounded-2xl bg-white/5 dark:bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_6px_24px_rgba(0,0,0,0.25)] transition-all duration-200
```

### Tile mit Tracking-Status
```typescript
import { getTileClasses } from '../theme/tokens';

const isTracked = pushupsForDay > 0;

<div className={getTileClasses(isTracked)}>
  {/* Tile Content */}
</div>
```

**Tracked** (grüner Glow):
- Ring: `ring-2 ring-green-400/50`
- Shadow: `shadow-[0_0_20px_rgba(34,197,94,0.3)]`

**Untracked** (reduzierte Opazität):
- Opacity: `opacity-80 hover:opacity-100`

## 📐 Layout-Tokens

### Padding
```typescript
designTokens.padding.compact   // p-3 (Standard Tiles)
designTokens.padding.spacious  // p-6 (Large Tiles, z.B. WeightTile)
```

### Grid-Gaps
```typescript
designTokens.gap.mobile   // gap-2 (8px)
designTokens.gap.desktop  // gap-4 (16px)
```

**Verwendung**:
```tsx
<div className="grid grid-cols-2 gap-2 md:gap-4">
  <WaterTile />
  <ProteinTile />
</div>
```

## 🌈 Beispiel: Tile-Komponente

```tsx
import { getTileClasses } from '../theme/tokens';

function WaterTile() {
  const currentWater = 2000; // ml
  const isTracked = currentWater >= 1000;

  return (
    <div className={`${getTileClasses(isTracked)} p-3 text-white`}>
      {/* Header: Icon (left) + Title + Metric (right) */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-xl">💧</div>
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Water
          </h3>
        </div>
        <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
          2.0L
        </div>
      </div>

      {/* Content (centered) */}
      <div className="text-center">
        {/* Progress bars, buttons, etc. */}
      </div>
    </div>
  );
}
```

## 🎯 Design-Regeln

### Tile-Struktur (IMMER einhalten)
1. **Header**: Links-aligned (Icon + Title auf der linken Seite, Metrik rechts)
2. **Content**: Zentriert (Progress Bars, Buttons, Inputs)
3. **Glass-Card**: Einheitliches Design (`glassCardClasses`)
4. **Padding**: `p-3` (Standard) oder `p-6` (Large Tiles)

### Mobile-First
- Mobile: `px-3 pt-4` + `gap-2`
- Desktop: `px-6 pt-8` + `gap-4`

### One-Screen-Regel
Jede Hauptseite muss in **einen mobilen Viewport** (~100vh) passen ohne vertikales Scrollen.

## 🚀 Vorteile

✅ **Konsistenz**: Alle Tiles verwenden die gleichen Design-Tokens
✅ **Wartbarkeit**: Änderungen an einem Ort (tokens.ts)
✅ **TypeScript**: Auto-Completion für alle Tokens
✅ **Performance**: Keine CSS-in-JS Overhead
✅ **Dark Mode**: Light/Dark Varianten integriert

---

**Last Updated**: 2025-01-06
