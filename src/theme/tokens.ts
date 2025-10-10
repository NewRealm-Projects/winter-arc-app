/**
 * Design Tokens - Winter Arc
 *
 * Zentrale Definition aller Design-Variablen für konsistente UI.
 * Nutze diese Tokens statt harter CSS-Werte in Komponenten.
 */

export const designTokens = {
  // Spacing
  spacing: {
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '0.75rem', // 12px
    lg: '1rem',    // 16px
    xl: '1.5rem',  // 24px
    '2xl': '2rem', // 32px
    '3xl': '3rem', // 48px
  },

  // Border Radius
  radius: {
    sm: '0.375rem',  // 6px
    md: '0.5rem',    // 8px
    lg: '0.75rem',   // 12px
    xl: '1rem',      // 16px
    '2xl': '1.5rem', // 24px - Standard für Tiles
    full: '9999px',  // Circular
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    // Glass-spezifische Schatten
    glass: '0 6px 24px rgba(0, 0, 0, 0.25)',
    tile: '0 4px 16px rgba(0, 0, 0, 0.15)',
  },

  // Blur (für Backdrop-Filter)
  blur: {
    none: '0',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '40px',
  },

  // Modern Card Preset (OPAQUE, NO transparency)
  glass: {
    background: 'bg-[var(--card-bg)]',
    backdropBlur: '', // REMOVED - no blur needed for opaque cards
    border: 'border border-[var(--border-subtle)]',
    shadow: 'shadow-[var(--shadow-card)]',
    rounded: 'rounded-xl', // 12px - standardized
    transition: 'transition-all duration-200',
  },

  // Tile-spezifische Varianten
  tile: {
    // Tracked State (erfolgreiche Eingabe)
    tracked: {
      ring: 'ring-2 ring-green-400/50 dark:ring-green-500/50',
      glow: 'shadow-[0_0_20px_rgba(34,197,94,0.3)]',
    },
    // Untracked State
    untracked: {
      opacity: 'opacity-80 hover:opacity-100',
    },
    // Hover-Effekt
    hover: 'hover:shadow-[0_8px_40px_rgba(0,0,0,0.35)]',
  },

  // Padding für Tiles
  padding: {
    compact: 'p-3',   // Mobile / Standard Tiles
    spacious: 'p-6',  // Desktop / Large Tiles (z.B. WeightTile mit Graph)
  },

  // Grid-Gaps
  gap: {
    mobile: 'gap-2',  // 8px - Mobile
    desktop: 'gap-4', // 16px - Desktop
  },

  // Mobile-First Responsive Breakpoints (Tailwind Standard)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

/**
 * Kombinierte Utility-Klassen für Wiederverwendung
 */

// Standard Modern Card (für Tiles) - OPAQUE
export const glassCardClasses = [
  designTokens.glass.rounded,
  designTokens.glass.background,
  designTokens.glass.border,
  designTokens.glass.shadow,
  designTokens.glass.transition,
].join(' ');

// Modern Card mit Hover-Effekt
export const glassCardHoverClasses = [
  glassCardClasses,
  'hover:bg-[var(--card-bg-hover)]',
  'hover:shadow-[var(--shadow-card-hover)]',
].join(' ');

// Tracked Tile (mit grünem Glow)
export const trackedTileClasses = [
  glassCardClasses,
  designTokens.tile.tracked.ring,
  designTokens.tile.tracked.glow,
].join(' ');

// Untracked Tile (mit reduzierter Opazität)
export const untrackedTileClasses = [
  glassCardClasses,
  designTokens.tile.untracked.opacity,
].join(' ');

/**
 * Helper-Funktion: Tile-Klassen basierend auf Tracking-Status
 */
export function getTileClasses(isTracked: boolean): string {
  return isTracked ? trackedTileClasses : untrackedTileClasses;
}

/**
 * Type Export für TypeScript Auto-Completion
 */
export type DesignTokens = typeof designTokens;
