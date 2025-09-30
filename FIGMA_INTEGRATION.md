# Figma Integration Guide

Dieses Projekt kann mit Figma-Designs integriert werden, um das UI-Design zu verbessern.

## Option 1: Figma Design erstellen und Assets exportieren

### Schritt 1: Figma Design erstellen
1. Erstelle ein neues Figma-Projekt
2. Design die Screens:
   - LoginScreen
   - HomeScreen mit Wochenübersicht
   - Tracking-Screens (Push-ups, Wasser, Sport, Ernährung)
   - SettingsScreen

### Schritt 2: Design Tokens exportieren
Exportiere Farben, Typography, Spacing als Design Tokens:

```json
{
  "colors": {
    "primary": "#007AFF",
    "pushups": "#FF6B6B",
    "water": "#4ECDC4",
    "sport": "#95E1D3",
    "nutrition": "#FFD93D",
    "success": "#00D084"
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32
  }
}
```

### Schritt 3: Assets exportieren
- Icons als SVG (oder PNG @1x, @2x, @3x für React Native)
- Bilder optimiert exportieren
- In `assets/` Ordner ablegen

## Option 2: Figma to Code Plugins

### React Native Figma Plugin
1. Installiere "Figma to React Native" Plugin in Figma
2. Selektiere dein Design
3. Exportiere als React Native StyleSheet
4. Füge die Styles in deine Screens ein

### Anima Plugin
1. Installiere "Anima" Plugin
2. Exportiere React Code direkt aus Figma
3. Passe den generierten Code an die App-Struktur an

## Option 3: Figma Inspect Mode

1. Teile dein Figma-Design mit Entwicklern
2. Nutze Figma's Inspect Mode um:
   - Exakte Maße abzulesen
   - Farben zu kopieren
   - Abstände zu messen
   - Schriftgrößen zu übernehmen

## Aktuelles Design System

### Farben
```typescript
// Light Mode
background: '#F5F5F5'
card: '#FFFFFF'
text: '#000000'
textSecondary: '#666666'
primary: '#007AFF'
border: '#E5E5E5'

// Dark Mode
background: '#000000'
card: '#1C1C1E'
text: '#FFFFFF'
textSecondary: '#8E8E93'
primary: '#0A84FF'
border: '#38383A'

// Feature Colors
pushups: '#FF6B6B'
water: '#4ECDC4'
sport: '#95E1D3'
nutrition: '#FFD93D'
success: '#00D084'
```

### Typography
```typescript
greeting: { fontSize: 28, fontWeight: '800' }
title: { fontSize: 20, fontWeight: '700' }
subtitle: { fontSize: 16, fontWeight: '600' }
body: { fontSize: 16 }
caption: { fontSize: 14 }
label: { fontSize: 12, fontWeight: '600' }
```

### Spacing
```typescript
padding: 20px (Standard für Screens)
gap: 12px (zwischen Cards)
borderRadius: 16px (Cards), 12px (Buttons)
```

## Design-Komponenten die bereits existieren

1. **WeeklyOverview** - 7 Progress Ringe
2. **QuickStat** - Statistik Cards mit Icon
3. **ActionButton** - Große farbige Buttons
4. **SettingsRow** - Einstellungs-Zeilen mit Switch

## Nächste Schritte

1. Erstelle ein Figma-Design basierend auf dem aktuellen Code
2. Verfeinere das Design (bessere Farben, Abstände, Icons)
3. Exportiere Design Tokens und Assets
4. Integriere in die App

## Hilfreiche Figma Resources

- Figma Community: https://www.figma.com/community
- React Native UI Kits
- Mobile App Design Templates
- Color Palette Generators
