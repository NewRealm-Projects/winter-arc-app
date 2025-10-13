# 1Password Quick Start Guide

Schnellanleitung für die Einrichtung von 1Password für lokale Entwicklung und CI/CD.

---

## ✅ Phase 1: 1Password Vault einrichten (5-10 Minuten)

### Schritt 1: Items im Vault "winter-arc-app" erstellen

Erstellen Sie folgende Items in Ihrem 1Password Vault:

#### **Item 1: Firebase Production**

Typ: `API Credential`

| Feld-Name | Wert (Beispiel) |
|-----------|-----------------|
| `api_key` | Ihr Firebase API Key (AIza...) |
| `auth_domain` | `your-project.firebaseapp.com` |
| `project_id` | `your-project-id` |
| `storage_bucket` | `your-project.appspot.com` |
| `messaging_sender_id` | `123456789` |
| `app_id` | `1:123:web:abc` |

#### **Item 2: Firebase Staging** (falls vorhanden)

Typ: `API Credential`

Gleiche Felder wie Production, aber mit Staging-Werten.

#### **Item 3: Sentry**

Typ: `API Credential`

| Feld-Name | Wert (Beispiel) |
|-----------|-----------------|
| `auth_token` | `sntrys_...` |
| `organization` | `newrealm` |
| `project` | `javascript-react` |
| `dsn` | `https://...@sentry.io/...` |

#### **Item 4: GitHub Deployment**

Typ: `API Credential`

| Feld-Name | Wert |
|-----------|------|
| `pages_deploy_token` | Ihr GitHub Personal Access Token |

#### **Item 5: Google Services** (Optional)

Typ: `API Credential`

| Feld-Name | Wert |
|-----------|------|
| `gemini_api_key` | Ihr Gemini API Key |
| `recaptcha_site_key` | Ihr reCAPTCHA Site Key |

---

## ✅ Phase 2: Lokale Entwicklung (5 Minuten)

### Schritt 1: 1Password CLI installieren

**Windows:**
```powershell
winget install AgileBits.1Password.CLI
```

**macOS:**
```bash
brew install 1password-cli
```

**Linux:**
```bash
# Download von: https://1password.com/downloads/command-line/
```

### Schritt 2: Bei 1Password CLI anmelden

```bash
# Konto hinzufügen
op account add

# Anmelden
eval $(op signin)  # macOS/Linux
# Oder für Windows PowerShell:
# op signin
```

### Schritt 3: Zugriff testen

```bash
# Items im Vault auflisten
op item list --vault winter-arc-app

# Secret abrufen
op read "op://winter-arc-app/Firebase Production/api_key"
```

### Schritt 4: Dev Server starten

**Option A: Mit `op run` (empfohlen)**

```bash
# Production Environment
npm run dev:1p-prod

# Staging Environment
npm run dev:1p-staging
```

**Option B: Mit PowerShell-Skript (Windows)**

```powershell
# Production
.\scripts\load-env-from-1password.ps1 production
npm run dev

# Staging
.\scripts\load-env-from-1password.ps1 staging
npm run dev
```

**Option C: Mit Bash-Skript (macOS/Linux)**

```bash
# Production
source scripts/load-env-from-1password.sh production
npm run dev

# Staging
source scripts/load-env-from-1password.sh staging
npm run dev
```

---

## ✅ Phase 3: GitHub Actions einrichten (10 Minuten)

### Schritt 1: Service Account erstellen

1. Gehen Sie zu Ihren [1Password Service Accounts](https://my.1password.com/developer/serviceaccounts)
2. Klicken Sie auf **Create Service Account**
3. Name: `GitHub Actions - Winter Arc App`
4. Vault-Zugriff: `winter-arc-app` (Read-Only)
5. Kopieren Sie das **Service Account Token** (beginnt mit `ops_`)

### Schritt 2: Token zu GitHub hinzufügen

1. Gehen Sie zu: `https://github.com/NewRealm-Projects/winter-arc-app/settings/secrets/actions`
2. Klicken Sie auf **New repository secret**
3. Name: `OP_SERVICE_ACCOUNT_TOKEN`
4. Value: `ops_xxxxxxxxxxxxxxxxxxxxx`
5. Klicken Sie auf **Add secret**

### Schritt 3: Workflows aktivieren

```bash
# Backup der alten Workflows erstellen
mv .github/workflows/deploy-production.yml .github/workflows/deploy-production.backup.yml
mv .github/workflows/deploy-staging.yml .github/workflows/deploy-staging.backup.yml

# 1Password Workflows aktivieren
mv .github/workflows/deploy-production.1password.yml .github/workflows/deploy-production.yml
mv .github/workflows/deploy-staging.1password.yml .github/workflows/deploy-staging.yml

# Committen
git add .github/workflows/
git commit -m "chore: migrate to 1Password secrets management"
git push
```

### Schritt 4: Workflow testen

1. Gehen Sie zu **Actions** Tab auf GitHub
2. Wählen Sie **Deploy Production** oder **Deploy Staging**
3. Klicken Sie auf **Run workflow**
4. Warten Sie auf erfolgreichen Durchlauf

---

## ✅ Phase 4: Cleanup (5 Minuten)

### Schritt 1: Lokale .env Dateien entfernen

```bash
# Alte .env Dateien löschen (VORSICHT: Backup erstellen!)
# Diese enthalten noch echte Secrets
rm .env
rm .env.local
rm .env.production

# .env.example behalten für Dokumentation
```

### Schritt 2: GitHub Secrets entfernen

Nachdem Sie bestätigt haben, dass 1Password funktioniert:

1. Gehen Sie zu Repository Settings → Secrets and variables → Actions
2. Entfernen Sie folgende Secrets (nicht mehr benötigt):
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_GEMINI_API_KEY`
   - `VITE_RECAPTCHA_SITE_KEY`
   - `SENTRY_AUTH_TOKEN`
   - `PAGES_DEPLOY_TOKEN` (falls übertragen)

**WICHTIG:** Behalten Sie `OP_SERVICE_ACCOUNT_TOKEN`!

### Schritt 3: .gitignore aktualisieren

Die Datei sollte bereits `.env*` ignorieren. Bestätigen Sie:

```bash
git check-ignore .env
# Sollte ausgeben: .env
```

---

## 🧪 Verifikation

Bestätigen Sie, dass alles funktioniert:

### Lokal

```bash
# Dev Server starten
npm run dev:1p-prod

# Build erstellen
npm run build:1p-prod

# App sollte im Browser funktionieren
```

### CI/CD

```bash
# Manuellen Workflow-Trigger durchführen
# Actions → Deploy Staging → Run workflow

# Prüfen Sie:
# 1. Workflow läuft erfolgreich durch
# 2. App ist unter staging.winterarc.newrealm.de erreichbar
# 3. Firebase-Verbindung funktioniert
```

### Sicherheit

```bash
# Keine Secrets im Repository
npm run lint:secrets

# Keine Secrets in Git-Historie
node scripts/check-secrets.mjs --history
```

---

## 🚨 Troubleshooting

### Fehler: "op: command not found"

```bash
# 1Password CLI neu installieren
# Windows: winget install AgileBits.1Password.CLI
# macOS: brew install 1password-cli
```

### Fehler: "[ERROR] 401: Invalid token"

```bash
# Neu anmelden
eval $(op signin)
```

### Fehler: "Item not found"

```bash
# Item-Namen prüfen (case-sensitive!)
op item list --vault winter-arc-app

# Exakte Namen verwenden:
# - "Firebase Production" (nicht "firebase production")
# - "Firebase Staging"
# - "Sentry"
# - etc.
```

### Fehler: GitHub Actions "401 Unauthorized"

1. Service Account Token in GitHub Secrets prüfen
2. Token neu generieren in 1Password
3. GitHub Secret `OP_SERVICE_ACCOUNT_TOKEN` aktualisieren

### App startet nicht / Firebase-Fehler

```bash
# Secrets anzeigen (zum Debuggen)
op read "op://winter-arc-app/Firebase Production/api_key"
op read "op://winter-arc-app/Firebase Production/project_id"

# Prüfen, ob Werte korrekt sind
```

---

## 📚 Weitere Ressourcen

- **Vollständige Dokumentation**: [docs/1PASSWORD_SETUP.md](./1PASSWORD_SETUP.md)
- **Sicherheits-Incident-Response**: [docs/SECURITY_INCIDENT_RESPONSE.md](./SECURITY_INCIDENT_RESPONSE.md)
- **1Password CLI Docs**: https://developer.1password.com/docs/cli/
- **GitHub Actions Integration**: https://github.com/1password/load-secrets-action

---

## ✅ Checkliste

Verwenden Sie diese Checkliste für die Migration:

### Setup
- [ ] 1Password Vault "winter-arc-app" erstellt
- [ ] Items für Firebase Production angelegt
- [ ] Items für Firebase Staging angelegt (falls vorhanden)
- [ ] Items für Sentry angelegt
- [ ] Items für GitHub Deployment angelegt
- [ ] Items für Google Services angelegt (optional)

### Lokal
- [ ] 1Password CLI installiert
- [ ] Bei 1Password CLI angemeldet
- [ ] Secrets erfolgreich abgerufen (`op read`)
- [ ] Dev Server startet mit `npm run dev:1p-prod`
- [ ] App funktioniert lokal mit 1Password Secrets

### GitHub Actions
- [ ] Service Account erstellt
- [ ] `OP_SERVICE_ACCOUNT_TOKEN` zu GitHub Secrets hinzugefügt
- [ ] Workflows auf 1Password umgestellt
- [ ] Test-Deployment erfolgreich (Staging)
- [ ] Test-Deployment erfolgreich (Production)

### Cleanup
- [ ] Lokale `.env` Dateien entfernt
- [ ] Alte GitHub Secrets entfernt
- [ ] Security-Scan bestätigt: keine Secrets im Repo
- [ ] Team informiert über neue Workflows

### Dokumentation
- [ ] README.md aktualisiert
- [ ] CLAUDE.md aktualisiert
- [ ] Team-Onboarding-Docs aktualisiert

---

**Setup-Zeit**: ~20-30 Minuten
**Letzte Aktualisierung**: 2025-10-13
