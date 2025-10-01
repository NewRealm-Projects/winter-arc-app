
# Winter Arc – Development Guidelines & Knowledge Memory

**Version:** 2.3
**Last Updated:** 2025-10-01
**Project:** Winter Arc Fitness Tracker

---


## 📑 Meta Rules & Documentation Policy

**Wichtig:**
- Es gibt nur noch zwei zentrale Doku-Dateien: `CLAUDE.md` (Entwicklung, Wissen, Fixes, Lessons Learned) und `README.md` (Projektüberblick, Einstieg).
- Alle neuen Erfahrungen, Fixes und Erkenntnisse werden in `CLAUDE.md` **integriert, verdichtet und sinnvoll zusammengeführt** – niemals einfach nur angehängt.
- Die Memory-Sektion wird regelmäßig in die Hauptstruktur eingearbeitet und komprimiert.
- Keine weitere `.md`-Datei außer `README.md` und `CLAUDE.md`.

**Vorgehen:**
1. Vor jeder Problemlösung: `CLAUDE.md` durchsuchen (Memory beachten!)
2. Neue Erkenntnisse/Fixes immer so einarbeiten, dass sie bestehendes Wissen verbessern oder ersetzen
3. Redundanzen vermeiden, Wissen verschmelzen
4. Nach jeder Änderung: README und CLAUDE.md aktuell halten

---

## 📝 Project Overview

Cross-platform fitness tracker built with **Expo + React Native + TypeScript**, deployed on **Web, iOS, Android**.

### Features

* Push-ups, Sport, Protein, Water, Weight tracking
* HomeScreen with inline logging + quick-add buttons
* Interactive Weight Graph (7–30 days, dual line with body fat)
* Leaderboard with group codes + points
* Theme support (light/dark/auto)
* Settings (profile, theme, notifications)

### Tech Stack

* **Framework:** Expo + React Native
* **Backend:** Firebase (Auth + Firestore)
* **Auth:** Google OAuth
* **Navigation:** React Navigation (modals)
* **Deployment:** GitHub Pages (Actions)
* **State:** React Context
* **Security:** Socket.dev, Firebase Rules, App Check

---

## ⚙️ Setup & Commands

```bash
# Install
npm install

# Run
npm start          # Dev server
npm run web        # Web
npm run android    # Android
npm run ios        # iOS (macOS)


# 🧠 Memory: Lessons Learned & Fixes (kompakt)

**Web Deployment:**
- Fonts/Icons müssen explizit in `assetBundlePatterns` (app.json) gebündelt werden, sonst 404 auf GitHub Pages.
- Nach dem Expo-Export müssen Asset-Pfade ggf. per Script (`post-export.cjs`) angepasst werden, damit sie auf Subdomains funktionieren.

**Notifications:**
- `expo-notifications` gibt auf Web eine Warnung aus, wenn native Handler gesetzt werden. Lösung: Platform-Check vor Handler-Setzen.

**Build:**
- Web-Build kann durch nicht-web-kompatiblen Code (z.B. Notifications) fehlschlagen. Immer Platform-Checks nutzen.

**Firebase:**
- Bisher keine kritischen Fixes nötig, läuft stabil.

**UI/UX:**
- Weight Graph und Entries werden manchmal nicht angezeigt, wenn Daten fehlen oder nach Logging nicht neu geladen werden. Lösung: Nach jeder Mutation `loadAllData()` aufrufen.

**Allgemein:**
- Fixes und Erfahrungen werden regelmäßig in diese Memory-Sektion übernommen, verdichtet und in die Hauptstruktur integriert.

**Lösung:**
1. **app.json** erweitern:
   ```json
   {
     "expo": {
       "assetBundlePatterns": [
         "assets/**/*",
         "node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/*.ttf"
       ]
     }
   }
   ```

2. **scripts/post-export.cjs** erweitern:
   ```javascript
   // In index.html patching
   { pattern: /"\/node_modules/g, replacement: `"${prefix}/node_modules` }

   // In JS bundle patching
   { pattern: /"\/node_modules/g, replacement: `"${prefix}/node_modules` }
   ```

**Dateien geändert:**
- `app.json` - Line 10-13
- `scripts/post-export.cjs` - Lines 62, 73

**Verifizierung:**
- `npm run build:web` zeigt alle 20 Icon-Fonts im Asset-Output
- Keine 404-Fehler in der Browser-Console
- Icons werden korrekt angezeigt

**Gefixt am:** 2025-10-01
**Commit:** `fix: resolve vector icons 404 and web notification warnings`

---

## Icon/Font Loading Issues

### ✅ Siehe "Vector Icons 404-Fehler" oben

---

## Notification Issues

### ✅ expo-notifications Warning auf Web

**Problem:**
```
[expo-notifications] Listening to push token changes is not yet fully supported on web.
Adding a listener will have no effect.
```

**Symptome:**
- Warnung in Browser-Console beim App-Start
- Keine funktionale Auswirkung, aber nervige Console-Spam
- Tritt nur auf Web auf (nicht iOS/Android)

**Root Cause:**
- `Notifications.setNotificationHandler()` wird auf Web ausgeführt
- Web unterstützt keine nativen Push-Notifications
- Fehlende Platform-Check in `src/services/notifications.ts`

**Lösung:**
`src/services/notifications.ts` anpassen:

```typescript
import { Platform } from 'react-native';

// Configure notification behavior (only on native platforms)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}
```

**Dateien geändert:**
- `src/services/notifications.ts` - Lines 4-15

**Verifizierung:**
- Keine Warnung in Browser-Console
- Notifications funktionieren weiterhin auf Native

**Gefixt am:** 2025-10-01
**Commit:** `fix: resolve vector icons 404 and web notification warnings`

---

## Build Issues

### ✅ Expo Web Build mit Notification-Fehlern

**Problem:** Build schlägt fehl oder zeigt Warnungen wegen Notification-Code auf Web

**Lösung:** Siehe "expo-notifications Warning auf Web" oben

---

### ✅ Asset Pfad-Probleme nach Expo Export

**Problem:** Assets (Bilder, Fonts) werden mit absoluten Pfaden gebundelt, funktionieren nicht auf Subdomains

**Lösung:**
- `post-export.cjs` Script nutzen
- Environment Variable `EXPO_PUBLIC_URL` setzen
- Siehe `scripts/post-export.cjs` für Implementierung

**Gefixt am:** Bereits vor 2025-10-01 (initial setup)

---

## Firebase Issues

### 🔄 Häufige Firebase-Fehler

**Noch keine dokumentierten Fixes** - Firebase läuft aktuell stabil

---

## UI/UX Issues

### 🔄 Weight Graph nicht sichtbar

**Status:** Bereits in CODEX.md dokumentiert
**Siehe:** CODEX.md - "Issue: Weight graph not showing" (Line ~900)

---

### 🔄 Entries nicht sofort sichtbar nach Logging

**Status:** Bereits in CODEX.md dokumentiert
**Siehe:** CODEX.md - "Issue: Entries not displaying after logging" (Line ~863)

**Quick Fix:** `loadAllData()` nach jeder Mutation aufrufen

---

## 📝 Template für neue Fixes

Wenn du ein neues Problem löst, füge es hier mit folgendem Format hinzu:

```markdown
### ✅ [Problem Titel]

**Problem:**
[Kurze Beschreibung + Fehlermeldung]

**Symptome:**
- [Was der User sieht/erlebt]
- [Console-Ausgaben]

**Root Cause:**
[Warum tritt das Problem auf?]

**Lösung:**
[Code-Änderungen mit Beispielen]

**Dateien geändert:**
- [Dateiname] - Line X-Y

**Verifizierung:**
[Wie testet man, dass es funktioniert?]

**Gefixt am:** YYYY-MM-DD
**Commit:** [Commit Message/Hash]
```

---

## 🗂️ Archiv (Ältere Fixes)

*Keine älteren Fixes vorhanden - Dies ist die erste Version von FIXES.md*

---

**Letzte Aktualisierung:** 2025-10-01
**Version:** 1.0.0
**Maintainer:** Development Team