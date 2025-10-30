# Winter Arc - OpenSpec Documentation

Zentrale Dokumentation für spec-driven Development mit OpenSpec, Task Master AI und spezialisierten Agents.

## 📚 Struktur

```
openspec/
├── AGENTS.md                 # OpenSpec Agent Workflow
├── DECISIONS.md              # Architektur-Entscheidungen
├── INCONSISTENCIES.md        # Bekannte Inkonsistenzen
├── project.md                # Projekt-Übersicht
├── agents/                   # Agent-System
│   ├── README.md             # Agent-Definitionen & Workflows
│   ├── agents-archive/       # Alte .agent/ Definitionen
│   └── claude-archive/       # Alte .claude/ Commands
├── changes/                  # OpenSpec Change Proposals
├── specs/                    # Feature Specifications
├── docs/                     # Zusätzliche Dokumentation
│   └── archive/              # Archivierte Root-Docs
└── workflows/                # Development Workflows
```

## 🚀 Quick Start

### 1. OpenSpec Workflow
Für neue Features oder Breaking Changes:
```bash
# 1. Prüfe aktive Changes
openspec list

# 2. Prüfe Specs
openspec list --specs

# 3. Erstelle Change Proposal
# Siehe: openspec/AGENTS.md
```

### 2. Task Master AI
Für Projekt-Management und Task-Tracking:
```bash
# Tasks listen
npx task-master list

# Neue Task erstellen
npx task-master add

# Task Status setzen
npx task-master status <task-id> in-progress
```

### 3. Specialized Agents
Für Quality Gates und strukturierte Entwicklung:
```bash
# Siehe: openspec/agents/README.md
# - UI-Refactor Agent
# - PWA/Performance Agent
# - Test/Guard Agent
# - Docs/Changelog Agent
```

## 📖 Wichtige Dokumente

### Entwicklung
- **OpenSpec Workflow**: `AGENTS.md`
- **Agent System**: `agents/README.md`
- **Architektur-Entscheidungen**: `DECISIONS.md`
- **Change Proposals**: `changes/*/proposal.md`

### Projekt-Info
- **Projekt-Übersicht**: `project.md`
- **Spezifikationen**: `specs/*/spec.md`
- **Inkonsistenzen**: `INCONSISTENCIES.md`

### Archive
- **Alte Agent-Definitionen**: `agents/agents-archive/`
- **Claude Commands**: `agents/claude-archive/`
- **Root-Dokumentation**: `docs/archive/`

## 🔄 Migration Status

### ✅ Konsolidiert
- Agent-Definitionen → `agents/README.md`
- OpenSpec Workflow → `AGENTS.md`
- Task Master AI → `.taskmaster/`

### 📦 Archiviert
- `.agent/` → `agents/agents-archive/`
- `.claude/` → `agents/claude-archive/`
- `CLAUDE.md`, `CODEX.md`, `PHASE3-POLISH-PROPOSAL.md` → `docs/archive/`

### 🗑️ Entfernt
- Build-Artefakte (dist/, coverage/, etc.)
- Reports (reports/)
- Deployment-Artefakte (ops/)
- Temporäre Dateien (_ul, stats.html, etc.)
- Migrations-Scripts (migrate-to-1password*.ps1/sh)

## 🛠️ Tools

### Task Master AI
```bash
# Initialisiert in .taskmaster/
npx task-master --help
```

### OpenSpec
```bash
# Validierung
openspec validate <change-id> --strict

# Listen
openspec list
openspec list --specs
```

### Quality Gates
```bash
# Alle Checks
npm run test:all

# Individual
npm run lint
npm run typecheck
npm test
npm run build
```

## 📝 Workflow-Übersicht

1. **Neue Feature-Idee**
   - PRD erstellen in `.taskmaster/docs/prd.txt`
   - Mit AI diskutieren und verfeinern

2. **OpenSpec Proposal** (wenn nötig)
   - Change Proposal erstellen
   - Validation durchführen
   - Approval einholen

3. **Task Master AI**
   - PRD parsen: `npx task-master parse-prd`
   - Komplexität analysieren
   - Tasks expandieren
   - Implementation starten

4. **Agent System**
   - Passenden Agent wählen
   - Quality Gates beachten
   - Artefakte sammeln
   - PR erstellen

5. **Review & Merge**
   - CI/CD Checks grün
   - Code Review
   - Merge zu `develop`
   - Deploy bei Bedarf

## 🔗 Siehe auch

- GitHub Copilot Instructions: `.github/copilot-instructions.md`
- Contributing Guide: `CONTRIBUTING.md`
- Changelog: `CHANGELOG.md`
- Security: `SECURITY.md`
