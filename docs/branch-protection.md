# Branch Protection for `main`

Dieses Projekt nutzt GitHub, daher lassen sich Branch-Protection-Regeln nicht
allein durch eine Codeänderung aktivieren. Damit Administrator:innen die
Absicherung des `main`-Branches schnell einrichten können, gibt es das Skript
`scripts/apply-branch-protection.sh`.

## Voraussetzungen

- [GitHub CLI](https://cli.github.com/) (`gh`) ist lokal installiert.
- Du hast Administrator:innenrechte für das Zielrepository.
- Du bist über `gh auth login` authentifiziert **oder** setzt die Variable
  `GITHUB_TOKEN` (wird automatisch als `GH_TOKEN` übernommen).

## Verwendung

```bash
./scripts/apply-branch-protection.sh <owner/repo> [branch]
```

Beispiel für dieses Repository:

```bash
./scripts/apply-branch-protection.sh winter-guardians/winter-arc-app main
```

Der Standard-Branch ist `main`. Möchtest du einen anderen Branch schützen,
übergib ihn als zweiten Parameter.

## Eingestellte Regeln

Das Skript konfiguriert folgende Schutzmechanismen:

- Administrator:innen müssen die Regeln ebenfalls befolgen (`enforce_admins`).
- Pull Requests benötigen mindestens eine Freigabe und veraltete Reviews werden
  automatisch verworfen.
- Force-Pushes, das Löschen des Branches und das Blockieren neuer Branches sind
  deaktiviert.
- Diskussionen in Pull Requests müssen vor dem Merge aufgelöst sein.
- Syncs von Forks sind weiterhin erlaubt, ebenso wie ein linearer Verlauf.

Diese Einstellungen können bei Bedarf direkt im Skript angepasst werden. Nach
dem Ausführen meldet das Skript den Status des API-Aufrufs. Sollte ein Fehler
auftreten (z. B. unzureichende Berechtigungen oder ein falscher Repositoryname),
werden die Details ausgegeben.
