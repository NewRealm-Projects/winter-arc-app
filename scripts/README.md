# Scripts Directory

Administrative und Maintenance-Skripte für das Winter Arc Projekt.

## 📋 Verfügbare Skripte

### 🔍 Consistency Check (`consistency-check.mjs`)

**Zweck:** Umfassende Validierung aller Firestore-Datenstrukturen

**Usage:**
```bash
# Basis-Check (read-only)
npm run check:consistency

# Mit Auto-Fix (mit Bestätigung)
npm run check:consistency:fix

# Spezifischen User prüfen
node scripts/consistency-check.mjs --user=abc123

# Dry-run
node scripts/consistency-check.mjs --dry-run
```

**Features:**
- ✅ Migration Status Check (days → entries)
- ✅ Streak-Validierung (gewichtete Logik)
- ✅ Triple-Storage Sync (entries/checkins/trainingLoad)
- ✅ Schema-Validierung
- ✅ Wochen-Aggregationen
- ✅ Gruppen-Integrität

**Dokumentation:** [docs/consistency-check.md](../docs/consistency-check.md)

**Requirements:**
- Firebase Admin SDK (`npm install firebase-admin --save-dev`)
- Service Account Key (`scripts/serviceAccountKey.json`)

---

### 🧹 Cleanup Repository (`cleanup-repo.mjs`)

**Zweck:** Repository von ungenutzten Dateien bereinigen

**Usage:**
```bash
# Cleanup ausführen
npm run clean

# Dry-run (zeigt was gelöscht würde)
npm run clean:dry-run

# Mit Force (ohne Bestätigung)
node scripts/cleanup-repo.mjs --force
```

**Features:**
- Unreferenzierte Markdown-Dateien
- Ungenutzte Images
- Temporäre Dateien (.log, .tmp, etc.)
- Build-Artefakte

---

### 🔐 Check Secrets (`check-secrets.mjs`)

**Zweck:** Scannt Code nach hardcodierten Secrets

**Usage:**
```bash
npm run lint:secrets
```

**Features:**
- Firebase API Keys
- Environment Variables
- Tokens und Credentials

---

### 📊 Check Budgets (`check-budgets.mjs`)

**Zweck:** Validiert Performance-Budgets

**Usage:**
```bash
npm run perf:budget
```

**Features:**
- Bundle-Größe Check
- Lighthouse-Score Validierung
- Build-Zeit Monitoring

---

### 🛡️ Apply Branch Protection (`apply-branch-protection.sh`)

**Zweck:** Setzt Branch Protection Rules via GitHub API

**Usage:**
```bash
./scripts/apply-branch-protection.sh
```

**Requirements:**
- `GITHUB_TOKEN` Environment Variable
- Repository Admin-Rechte

---

## 🔒 Sicherheit

### Service Account Keys

**NIEMALS** committen:
- `scripts/serviceAccountKey.json`
- Beliebige `*.key`, `*.pem` Dateien
- `.env` Files mit Credentials

**Bereits in .gitignore:**
```
scripts/serviceAccountKey.json
.env
.env.local
.env.production
```

### Best Practices

1. **Lokale Ausführung:** Admin-Skripte nur lokal ausführen
2. **Key Rotation:** Service Account Keys regelmäßig erneuern
3. **Least Privilege:** Minimale Berechtigungen für Service Accounts
4. **Audit Logs:** Prüfe Firebase Audit Logs nach Skript-Ausführung

---

## 📦 Dependencies

### Produktions-Dependencies
Keine - Skripte verwenden nur Node.js built-ins

### Dev-Dependencies (Optional)
- `firebase-admin` - Für consistency-check.mjs

---

## 🤝 Neue Skripte hinzufügen

### 1. Skript erstellen

```bash
touch scripts/my-script.mjs
chmod +x scripts/my-script.mjs
```

### 2. Shebang hinzufügen

```javascript
#!/usr/bin/env node

// Your script here
```

### 3. package.json Script hinzufügen

```json
{
  "scripts": {
    "my-script": "node scripts/my-script.mjs"
  }
}
```

### 4. Dokumentation

- Kurze Beschreibung in dieser README
- Ausführliche Docs in `docs/` (falls komplex)

---

## 🐛 Troubleshooting

### Problem: "Permission denied"

**Lösung:**
```bash
chmod +x scripts/my-script.mjs
```

### Problem: "Cannot find module"

**Lösung:**
```bash
npm install
# oder für spezifisches Modul:
npm install firebase-admin --save-dev
```

### Problem: "Firebase permission denied"

**Lösung:**
1. Prüfe Service Account Permissions
2. Erneuere Service Account Key
3. Prüfe Firestore Security Rules

---

## 📚 Ressourcen

- [Node.js ESM Modules](https://nodejs.org/api/esm.html)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [GitHub CLI](https://cli.github.com/)
- [Shellcheck](https://www.shellcheck.net/) für Bash-Skripte

---

**Hinweis:** Alle Skripte sind für Wartungs- und Admin-Zwecke. Reguläre User sollten die Web-App verwenden.
