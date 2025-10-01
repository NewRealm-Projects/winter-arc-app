# FIXES.md

**🔧 Gelöste Probleme & Lösungen**

Diese Datei dokumentiert alle bereits gelösten Probleme im Winter Arc Projekt. **WICHTIG: Immer zuerst hier nachsehen, bevor du ein Problem als "neu" behandelst!**

---

## ⚠️ WICHTIG: Vor der Fehlerbehebung lesen!

**BEVOR du an einem Bug/Problem arbeitest:**
1. ✅ Diese FIXES.md Datei durchsuchen (Ctrl+F)
2. ✅ Issue-Beschreibung mit gelösten Problemen vergleichen
3. ✅ Lösung anwenden, falls bereits dokumentiert
4. ✅ Neue Probleme hier dokumentieren, nachdem sie gelöst wurden

**Ziel:** Vermeidung von redundanter Arbeit und Kreislauf-Debugging

---

## 📋 Inhaltsverzeichnis

- [Web Deployment Issues](#web-deployment-issues)
- [Icon/Font Loading Issues](#iconfont-loading-issues)
- [Notification Issues](#notification-issues)
- [Build Issues](#build-issues)
- [Firebase Issues](#firebase-issues)
- [UI/UX Issues](#uiux-issues)

---

## Web Deployment Issues

### ✅ Vector Icons 404-Fehler auf GitHub Pages

**Problem:**
```
GET https://wilddragonking.github.io/assets/node_modules/@expo/vector-icons/.../Ionicons.ttf
net::ERR_ABORTED 404 (Not Found)
```

**Symptome:**
- Icons werden nicht angezeigt (leere Boxen)
- Console zeigt 404-Fehler für `.ttf` Dateien
- MaterialCommunityIcons, Ionicons, etc. nicht geladen

**Root Cause:**
- Vector Icon Fonts werden nicht in den Web-Build gebundelt
- `assetBundlePatterns` fehlt in `app.json`
- Post-export Script patcht keine `/node_modules` Pfade

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
