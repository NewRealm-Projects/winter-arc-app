# GitHub Secrets Setup für Release Management

## 🔐 Benötigtes Secret: PAGES_DEPLOY_TOKEN

Dieses Secret ermöglicht den Workflows, in die Pages-Repos zu deployen.

---

## 📋 Schritt 1: Personal Access Token (PAT) erstellen

1. **Gehe zu GitHub Settings:**
   - Öffne: https://github.com/settings/tokens
   - Oder: Profil (oben rechts) → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Erstelle neuen Token:**
   - Klicke: **"Generate new token"** → **"Generate new token (classic)"**

3. **Token konfigurieren:**
   ```
   Note: Winter Arc Pages Deploy Token
   Expiration: No expiration (oder 1 Jahr)

   Scopes (Berechtigungen):
   ✅ repo (Full control of private repositories)
      ├── ✅ repo:status
      ├── ✅ repo_deployment
      ├── ✅ public_repo
      └── ✅ repo:invite
   ```

4. **Token generieren:**
   - Klicke: **"Generate token"**
   - ⚠️ **WICHTIG:** Kopiere den Token SOFORT (wird nur einmal angezeigt!)
   - Beispiel: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## 📋 Schritt 2: Secret im Source-Repo hinzufügen

### Repository: `NewRealm-Projects/winter-arc-app`

1. **Öffne Repository Settings:**
   - Gehe zu: https://github.com/NewRealm-Projects/winter-arc-app/settings/secrets/actions
   - Oder: Repo → Settings → Secrets and variables → Actions

2. **Neues Secret erstellen:**
   - Klicke: **"New repository secret"**

3. **Secret-Details eingeben:**
   ```
   Name:  PAGES_DEPLOY_TOKEN
   Value: [Dein kopierter Token aus Schritt 1]
   ```

4. **Speichern:**
   - Klicke: **"Add secret"**

---

## ✅ Verification

Nach dem Hinzufügen solltest du sehen:

```
Repository secrets (1)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name                    Updated
PAGES_DEPLOY_TOKEN     just now
```

---

## 🧪 Test: Workflow manuell triggern

1. **Gehe zu Actions:**
   - https://github.com/NewRealm-Projects/winter-arc-app/actions

2. **Wähle Workflow:**
   - "Deploy Staging" oder "Deploy Production"

3. **Manuell triggern (falls verfügbar):**
   - Klicke: "Run workflow"
   - Branch: `develop` (für Staging) oder `main` (für Prod)
   - Klicke: "Run workflow"

4. **Workflow Status prüfen:**
   - Sollte grün werden ✅
   - Falls rot ❌: Log prüfen auf Fehler

---

## 🚨 Troubleshooting

### Fehler: "Resource not accessible by integration"

**Ursache:** Token hat nicht die richtigen Berechtigungen

**Lösung:**
1. Lösche den Token auf GitHub
2. Erstelle neuen Token mit `repo` scope
3. Update das Secret im Repo

### Fehler: "Permission denied"

**Ursache:** Token ist abgelaufen oder ungültig

**Lösung:**
1. Prüfe Token-Ablaufdatum: https://github.com/settings/tokens
2. Generiere neuen Token
3. Update das Secret

### Fehler: "Repository not found"

**Ursache:** Pages-Repos existieren nicht oder sind privat

**Lösung:**
1. Prüfe ob Repos existieren:
   - https://github.com/NewRealm-Projects/winter-arc-app-prod
   - https://github.com/NewRealm-Projects/winter-arc-app-staging
2. Stelle sicher, dass sie public oder der Token Zugriff hat

---

## 🔄 Optional: Environment Secrets

Falls du **zusätzliche Sicherheit** möchtest, kannst du Environments nutzen:

### Environment "production" erstellen:

1. Gehe zu: Repo → Settings → Environments
2. Klicke: "New environment"
3. Name: `production`
4. Füge Secret hinzu: `PAGES_DEPLOY_TOKEN`
5. Optional: Füge Protection Rules hinzu (Required reviewers)

### Environment "staging" erstellen:

1. Wiederhole für `staging`
2. Keine Protection Rules nötig

**Vorteil:** Secrets sind pro Environment isoliert

---

## 📚 Weitere Informationen

- GitHub PAT Docs: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token
- GitHub Actions Secrets: https://docs.github.com/en/actions/security-guides/encrypted-secrets
- Deployment Workflow Docs: Siehe `README.md` → "Release Management & Deployment"

---

**Erstellt:** 2025-10-09
**Version:** 1.0
