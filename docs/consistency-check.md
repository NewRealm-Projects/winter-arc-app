# Firestore Data Consistency Check

Umfassendes Validierungs-Skript für alle Datenstrukturen im Winter Arc Projekt.

## 📋 Übersicht

Das Skript `scripts/consistency-check.mjs` prüft die Integrität aller Firestore-Daten:

### Geprüfte Bereiche

1. **Migration Status** (`days` → `entries`)
   - Prüft, ob alle User migriert wurden
   - Identifiziert verwaiste `days` Collections
   - Validiert Migration-Flags in User-Dokumenten

2. **Streak-Berechnung**
   - Neuberechnung mit gewichteter Logik (70% Threshold)
   - Vergleich mit gespeicherten Werten
   - Identifiziert inkonsistente `streakScore` und `dayStreakMet` Felder

3. **Triple-Storage Synchronisation**
   - Prüft Konsistenz zwischen:
     - `tracking/{userId}/entries/{date}`
     - `users/{userId}/checkins/{date}`
     - `users/{userId}/trainingLoad/{date}`
   - Identifiziert orphaned records
   - Validiert Zeitstempel-Synchronität

4. **Schema-Validierung**
   - Prüft Pflichtfelder in User-Dokumenten
   - Identifiziert deprecated Fields (`DailyTracking.recovery`)
   - Validiert `enabledActivities`

5. **Wochen-Aggregationen**
   - Neuberechnung aller `weeks/{weekId}` Dokumente
   - Validiert `streakDays` und `totalPctAvg`
   - Identifiziert veraltete Daten

6. **Gruppen-Integrität**
   - Prüft, ob alle Member-IDs gültige User sind
   - Identifiziert verwaiste Gruppen

## 🚀 Installation

### Voraussetzungen

1. **Firebase Admin SDK installieren:**
   ```bash
   npm install firebase-admin --save-dev
   ```

2. **Service Account Key herunterladen:**
   - Gehe zu [Firebase Console](https://console.firebase.google.com/)
   - Wähle dein Projekt
   - Einstellungen → Service Accounts
   - "Neuen privaten Schlüssel generieren"
   - Speichere die JSON-Datei als `scripts/serviceAccountKey.json`

3. **Sicherheit:**
   ```bash
   # serviceAccountKey.json zur .gitignore hinzufügen
   echo "scripts/serviceAccountKey.json" >> .gitignore
   ```

   **⚠️ WICHTIG**: Service Account Keys niemals in Git committen!

### Alternative: Environment Variable

Statt der JSON-Datei kannst du auch die Environment Variable setzen:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"
```

## 📖 Verwendung

### Basis-Check (Read-Only)

Prüft alle User, macht keine Änderungen:

```bash
node scripts/consistency-check.mjs
```

### Spezifischen User prüfen

```bash
node scripts/consistency-check.mjs --user=abc123xyz
```

### Dry-Run (zeigt was gefixt würde)

```bash
node scripts/consistency-check.mjs --dry-run
```

### Auto-Fix (mit Bestätigung)

```bash
node scripts/consistency-check.mjs --fix
```

## 📊 Output

### Console Output

Farbcodierte Echtzeit-Ausgabe:
- ✓ Grün: Alles OK
- ⚠️  Gelb: Warnung
- ❌ Rot: Fehler

### Log-Datei

Detaillierter Report mit Timestamp:
```
consistency_check_2025-10-10T12-30-45-000Z.log
```

### JSON-Report

Strukturierte Fehler-Liste für weitere Verarbeitung:
```json
{
  "migration": [
    {
      "userId": "abc123",
      "type": "not_migrated",
      "details": {
        "daysCount": 42,
        "entriesCount": 0,
        "message": "User has days data but migrated flag is false or missing"
      },
      "timestamp": "2025-10-10T12:30:45.000Z"
    }
  ],
  "streak": [...],
  "tripleStorage": [...],
  "schema": [...],
  "weekAggregation": [...],
  "userData": [...],
  "groups": [...]
}
```

## 🔧 Häufige Probleme

### Problem: "firebase-admin not installed"

**Lösung:**
```bash
npm install firebase-admin --save-dev
```

### Problem: "service account key not found"

**Lösung:**
1. Lade Service Account Key aus Firebase Console herunter
2. Speichere als `scripts/serviceAccountKey.json`
3. Füge zu `.gitignore` hinzu

### Problem: "permission denied"

**Lösung:**
Stelle sicher, dass der Service Account die Rolle "Firebase Admin SDK Administrator Service Agent" hat.

### Problem: Skript hängt

**Lösung:**
- Prüfe Firewall/Proxy-Einstellungen
- Prüfe Firebase-Projekt-Status
- Starte mit `--user=<id>` für einen einzelnen User

## 📈 Typische Inkonsistenzen

### 1. Nicht migrierte User

**Problem:**
```
❌ User JohnDoe not migrated (42 days found)
```

**Bedeutung:** User hat alte `days` Collection, aber `migrated` Flag ist `false`

**Fix:** Migration erneut ausführen (automatisch beim nächsten Login)

### 2. Verwaiste Days

**Problem:**
```
⚠️  User JohnDoe has orphaned days data (42 documents)
```

**Bedeutung:** User ist migriert, aber alte `days` Collection existiert noch

**Fix:** `days` Collection manuell löschen (nach Bestätigung)

### 3. Streak-Score Mismatch

**Problem:**
```
⚠️  Found 12 days with inconsistent streak scores
```

**Bedeutung:** Gespeicherter `streakScore` weicht von berechneten ab

**Fix:** Neuberechnung und Update aller betroffenen Einträge

### 4. Orphaned Check-ins

**Problem:**
```
⚠️  Triple-storage issues: 5 orphaned check-ins, 0 orphaned training loads
```

**Bedeutung:** Check-in existiert, aber Training Load fehlt

**Fix:** Training Load für betroffene Tage neu berechnen

### 5. Deprecated Recovery Field

**Problem:**
```
⚠️  Found 18 entries with deprecated recovery field
```

**Bedeutung:** Alte `DailyTracking.recovery` Struktur wird verwendet

**Fix:** Field entfernen, Daten sind in Check-ins migriert

## 🛠️ Auto-Fix (Geplant)

Das Skript kann folgende Probleme automatisch beheben:

- [ ] Migration von `days` zu `entries`
- [ ] Cleanup alter `days` Collections
- [ ] Neuberechnung von Streak-Scores
- [ ] Training Load für Check-ins generieren
- [ ] Deprecated Fields entfernen
- [ ] Default `enabledActivities` setzen
- [ ] Wochen-Aggregationen neu berechnen

**Status:** Aktuell Placeholder, wird bei `--fix` Flag angezeigt

## 🔐 Sicherheit

- Service Account Keys sind **hochsensibel**
- Niemals in Git committen
- Nicht in CI/CD Logs ausgeben
- Lokale Ausführung empfohlen
- Bei Bedarf Keys rotieren

## 📚 Weiterführende Dokumentation

- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Security Rules](../firestore.rules)
- [Migration Service](../src/services/migration.ts)
- [Progress Utilities](../src/utils/progress.ts)
- [Check-in Service](../src/services/checkin.ts)

## 🤝 Beitragen

Verbesserungsvorschläge und Bugfixes sind willkommen!

1. Branch erstellen: `git checkout -b fix/consistency-check`
2. Änderungen committen
3. Pull Request erstellen

## 📝 Changelog

### v1.0.0 (2025-10-10)
- ✅ Initiale Version
- ✅ 6 Validierungs-Phasen
- ✅ JSON + Log Export
- ⏳ Auto-Fix (geplant)

---

**Hinweis:** Dieses Skript ist für administrative Zwecke. Reguläre User sollten die App verwenden, Migrationen laufen automatisch.
