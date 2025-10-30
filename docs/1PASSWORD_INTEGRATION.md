# 1Password Integration - Winter Arc App

## Überblick

Die Winter Arc App verwendet 1Password für sichere Credential-Verwaltung. Statt lokaler .env Dateien nutzen wir direkte 1Password Referenzen.

## Setup

### 1. 1Password CLI installieren

```powershell
winget install AgileBits.1Password.CLI
```

### 2. 1Password Account verbinden

```powershell
op account add
op signin --account my.1password.com
```

### 3. Credentials in 1Password

Stelle sicher, dass diese Items in der "Winter-Arc-App" Vault existieren:

- **winter-arc-postgres**: Database URL in password field
- **Firebase Production** (optional): Für Migration
- **Google Services** (optional): OAuth credentials

## Verwendung

### Entwicklung mit 1Password

```powershell
# Direkte 1Password Integration
npm run dev:1p

# Oder manuell
op run --env-file=.env.local -- npm run dev
```

### Environment Datei Format

Die `.env.local` Datei nutzt 1Password Referenzen:

```bash
# Direct 1Password References
DATABASE_URL="op://Winter-Arc-App/winter-arc-postgres/password"
GOOGLE_CLIENT_ID="op://Winter-Arc-App/Google Services/client_id"
```

## Scripts

- `npm run dev:1p` - Start mit 1Password Integration
- `npm run 1p:explore` - 1Password Vault erkunden
- `npm run 1p:generate` - .env.local aus 1Password generieren

## Sicherheit

✅ **Vorteile:**

- Keine echten Credentials in Dateien
- Zentrale Credential-Verwaltung
- Automatische Rotation möglich
- Team-sicherer Credential-Austausch

❌ **Keine lokalen Secrets:**

- `.env.local` enthält nur op:// Referenzen
- Echte Werte nur in 1Password
- Git-safe Environment-Dateien

## Troubleshooting

### Nicht angemeldet

```powershell
op signin --account my.1password.com
```

### Item nicht gefunden

```powershell
op item list --vault="Winter-Arc-App"
```

### Database Test

```bash
http://localhost:3000/database
```

## Migration von lokalen .env

1. **Backup erstellen**: Sichere deine aktuellen .env Werte
2. **1Password Items erstellen**: Übertrage Credentials nach 1Password
3. **Referenzen aktualisieren**: Ersetze Werte mit op:// URLs
4. **Testen**: Nutze `npm run dev:1p` zum Testen

## Production Deployment

Für Production müssen die 1Password Service Accounts oder CI/CD Integration konfiguriert werden:

```yaml
# GitHub Actions Example
- name: Deploy with 1Password
  run: |
    op run --env-file=.env.production -- npm run build
  env:
    OP_SERVICE_ACCOUNT_TOKEN: ${{ secrets.OP_SERVICE_ACCOUNT_TOKEN }}
```
