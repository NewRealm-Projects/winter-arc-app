# 🛡️ Security Policy – Winter Arc App

## Supported Versions

Die folgenden Versionen der **Winter Arc App** werden derzeit aktiv mit Sicherheitsupdates versorgt:

| Version | Supportstatus         |
|----------|-----------------------|
| 5.1.x    | ✅ Aktiv (Main Branch) |
| 5.0.x    | ❌ Keine Updates mehr  |
| 4.0.x    | ✅ LTS Support         |
| < 4.0    | ❌ Nicht unterstützt   |

---

## Reporting a Vulnerability

Falls du eine Sicherheitslücke oder verdächtiges Verhalten in der App oder API entdeckst:

1. **Bitte nicht öffentlich posten.**  
   Erstelle **keinen** GitHub Issue oder Pull Request mit sicherheitsrelevanten Informationen.

2. **Private Meldung:**  
   Sende eine vertrauliche E-Mail an  
   **security@newrealm.dev**  
   *(alternativ kannst du über GitHub eine Direktnachricht an das [@NewRealm-Projects](https://github.com/NewRealm-Projects) Team senden).*

3. **Ablauf nach Eingang der Meldung:**  
   - Erste Rückmeldung innerhalb von **48 Stunden**  
   - Bewertung und Behebung des Problems innerhalb von **7 Tagen** (je nach Schweregrad)  
   - Veröffentlichung eines Fix-Releases mit klaren Patch-Notes

---

## Disclosure Policy

Sicherheitslücken werden erst öffentlich gemacht, wenn:
- eine geprüfte Lösung implementiert wurde,  
- der Patch im Main-Branch aktiv ist,  
- und betroffene Nutzer ausreichend Zeit zum Aktualisieren hatten.

Wir schätzen verantwortungsvolles Disclosure und nennen gerne Credits für valide Funde in den Release Notes.

---

## Security Best Practices

Für Entwickler und Nutzer:

- Halte deine App-Version aktuell (`npm audit fix` regelmäßig ausführen).
- Speichere **keine Secrets oder API Keys** im Code oder in öffentlichen Repositories.
- Verwende sichere Authentifizierungsmethoden (z. B. OAuth 2.0).
- Aktiviere **2-Faktor-Authentifizierung** für alle Teammitglieder mit GitHub- oder Deployment-Zugriff.

### Automatisierte Secret-Prüfungen

- Führe `npm run lint:secrets` aus, um nach versehentlich eingecheckten Google API Keys zu suchen.
- Der Befehl ist Teil von `npm run lint` und schlägt fehl, wenn ein potentieller Key gefunden wird (Ausgabe wird maskiert).
- Bei einem Fund: Secret aus dem Repository entfernen, den Schlüssel über die Google Cloud Console rotieren und alte Schlüssel widerrufen.
- Anschließend Zugriffs- und Fehlerlogs prüfen, um möglichen Missbrauch zu erkennen und gegebenenfalls Incident-Response einzuleiten.

---

*Letzte Aktualisierung: 08. Oktober 2025*  
© NewRealm Projects. Alle Rechte vorbehalten.
