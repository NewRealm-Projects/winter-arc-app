# Agent Guardrails

## Codequalität & PR-Workflow (Codacy)

- Alle Pull Requests müssen den Codacy-Status **Passed** erreichen.
- Vor jedem PR sind `npm run lint && npm run format && npm run typecheck && npm run test` lokal auszuführen.
- Agenten dürfen keinen Code mergen, der Codacy-Checks oder Pipeline-Checks nicht besteht.

### PR-Checkliste
- [ ] Codacy Passed
- [ ] Lint/Format/Typecheck/Test grün
- [ ] a11y-Basics geprüft (Kontrast, Focus, ARIA bei neuen Elementen)
- [ ] i18n-Strings statt Hardcodes verwendet
- [ ] Screenshots/GIFs bei UI-Änderungen angehängt
- [ ] Changelog-Eintrag aktualisiert
