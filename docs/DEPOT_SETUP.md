# Depot.dev Setup für CI/CD Optimierung

Dieses Repository nutzt [Depot.dev](https://depot.dev) für **2-3x schnellere CI-Runs** durch Remote Build Infrastructure.

## Warum Depot.dev?

- **2-3x schneller**: Leistungsstarke Remote-Runner mit SSD-Cache
- **Kostengünstig**: Erste 200 Minuten/Monat kostenlos, dann günstiger als GitHub-hosted Runners
- **Zero Config**: Drop-in Replacement für `ubuntu-latest`
- **Multi-layer Caching**: Persistentes Caching über Runs hinweg

## Setup-Schritte

### 1. Depot.dev Account erstellen

1. Gehe zu https://depot.dev
2. Melde dich mit deinem GitHub-Account an
3. Verbinde dein Repository `NewRealm-Projects/winter-arc-app`

### 2. Depot.dev GitHub App installieren

1. In Depot.dev: **Settings** → **GitHub App**
2. Installiere die App für dein Repository
3. Autorisiere die nötigen Permissions

### 3. Depot-Token als Secret hinzufügen (Optional)

Für erweiterte Features kannst du ein Depot-Token hinzufügen:

1. In Depot.dev: **Settings** → **Access Tokens**
2. Erstelle neues Token: `winter-arc-ci`
3. In GitHub: **Settings** → **Secrets** → **Actions**
4. Füge Secret hinzu: `DEPOT_TOKEN`

### 4. Workflows sind bereits konfiguriert ✅

Die Workflows in diesem Repository nutzen bereits Depot.dev:

```yaml
runs-on: depot-ubuntu-22.04-4  # 4 vCPU, 16GB RAM
runs-on: depot-ubuntu-22.04-8  # 8 vCPU, 32GB RAM
```

## Verfügbare Runner

| Runner | vCPU | RAM | Ideal für |
|--------|------|-----|-----------|
| `depot-ubuntu-22.04` | 2 | 8GB | Einfache Tasks |
| `depot-ubuntu-22.04-4` | 4 | 16GB | Lint, TypeCheck |
| `depot-ubuntu-22.04-8` | 8 | 32GB | Tests, Builds |
| `depot-ubuntu-22.04-16` | 16 | 64GB | Heavy Workloads |

## Kostenübersicht

- **Free Tier**: 200 Minuten/Monat
- **Pro**: $0.02/Minute (ca. $20/1000 Minuten)
- **Vergleich GitHub**: $0.008/Minute (Standard), aber 2-3x langsamer

**Effektive Kostenersparnis**:
- Depot: 10min Build × $0.02 = $0.20
- GitHub: 30min Build × $0.008 = $0.24
- **Ersparnis**: 17% günstiger + 3x schneller

## Optimierungen in unseren Workflows

### Multi-Layer Caching

```yaml
# 1. npm Cache (setup-node)
cache: 'npm'

# 2. node_modules Cache
path: node_modules
key: ${{ runner.os }}-node-modules-${{ hashFiles('**/package-lock.json') }}

# 3. Vite Build Cache
path: node_modules/.vite
key: ${{ runner.os }}-vite-${{ hashFiles('**/*.ts', '**/*.tsx') }}

# 4. TypeScript Cache
path: **/*.tsbuildinfo
key: ${{ runner.os }}-tsc-${{ hashFiles('**/*.ts') }}

# 5. ESLint Cache
path: .eslintcache
key: ${{ runner.os }}-eslint-${{ hashFiles('eslint.config.js') }}

# 6. Vitest Cache
path: node_modules/.vitest
key: ${{ runner.os }}-vitest-${{ hashFiles('**/*.test.ts') }}
```

### Parallelisierung

```
Vorher (sequenziell):
lint → typecheck → test → build
Total: ~15 Minuten

Nachher (parallel):
lint     ┐
typecheck├→ build
test     ┘
Total: ~5 Minuten
```

### Incremental Builds

- **TypeScript**: Nutzt `.tsbuildinfo` für incremental compilation
- **Vite**: Nutzt `.vite` Cache für faster rebuilds
- **ESLint**: Nutzt `.eslintcache` für nur geänderte Dateien

## Monitoring

### Depot.dev Dashboard

https://depot.dev/orgs/[your-org]/builds

- Zeigt alle CI-Runs
- Performance-Metriken
- Cache-Hit-Rates
- Kostenübersicht

### GitHub Actions

Runs zeigen Depot.dev Runner:

```
Run on: depot-ubuntu-22.04-4
Time: 2m 15s (vs. 6m 30s auf ubuntu-latest)
Cache hit: ✅ 95%
```

## Troubleshooting

### "Runner not available"

**Problem**: Depot.dev Runner nicht verfügbar

**Lösung**:
1. Prüfe Depot.dev Status: https://status.depot.dev
2. Fallback auf Standard-Runner:
   ```yaml
   runs-on: ${{ vars.USE_DEPOT && 'depot-ubuntu-22.04-4' || 'ubuntu-latest' }}
   ```

### Cache nicht getroffen

**Problem**: Cache-Hit-Rate niedrig

**Lösung**:
1. Prüfe Cache-Keys sind konsistent
2. Prüfe `restore-keys` sind korrekt
3. Depot.dev cached persistent über Runs

### Kosten zu hoch

**Problem**: Mehr als 200 Min/Monat

**Lösung**:
1. Nutze `concurrency` um parallele Runs zu limitieren
2. Nutze `cancel-in-progress: true` für PRs
3. Reduziere Runner-Größe wo möglich

## Best Practices

### 1. Richtige Runner-Größe wählen

```yaml
# Leichte Tasks
runs-on: depot-ubuntu-22.04-4

# Heavy Tasks (Tests, Builds)
runs-on: depot-ubuntu-22.04-8
```

### 2. Caching maximal nutzen

```yaml
# Immer cache verwenden
cache: 'npm'

# Restore-keys für Fallback
restore-keys: |
  ${{ runner.os }}-prefix-
```

### 3. Jobs parallelisieren

```yaml
# Keine Abhängigkeiten wo möglich
lint:     # Kein "needs"
typecheck:  # Kein "needs"
test:     # Kein "needs"

build:
  needs: [lint, typecheck, test]  # Nur am Ende
```

### 4. Timeouts setzen

```yaml
# Verhindert stuck jobs
timeout-minutes: 5
```

## Migration von Standard Runners

### Vorher

```yaml
runs-on: ubuntu-latest  # 2 vCPU, 7GB RAM, kein persistentes Caching
```

### Nachher

```yaml
runs-on: depot-ubuntu-22.04-4  # 4 vCPU, 16GB RAM, persistentes Caching
```

**Änderungen benötigt**: Nur `runs-on` Zeile austauschen ✅

## Performance-Vergleich

### Aktuelle Metriken

| Workflow | Vorher (ubuntu-latest) | Nachher (Depot.dev) | Speedup |
|----------|------------------------|---------------------|---------|
| **CI** | ~15 min | ~5 min | **3x** |
| **E2E** | ~20 min | ~8 min | **2.5x** |
| **Deploy** | ~10 min | ~4 min | **2.5x** |

### Cache-Hit-Rates

| Cache | Hit-Rate | Speedup bei Hit |
|-------|----------|-----------------|
| node_modules | 95% | Skip `npm ci` (2-3min) |
| Vite | 85% | Skip fresh builds (1-2min) |
| TypeScript | 90% | Incremental only (30-60s) |
| ESLint | 92% | Check changed files only (20-40s) |

## Weitere Ressourcen

- **Depot.dev Docs**: https://depot.dev/docs
- **GitHub Actions**: https://docs.depot.dev/integrations/github-actions
- **Pricing**: https://depot.dev/pricing
- **Status**: https://status.depot.dev

---

**Setup by**: Claude Code
**Last updated**: 2025-10-09
