# Agent Guardrails

## Codacy Compliance (verbindlich)

Codacy muss für jeden Commit grün sein, sonst blockieren wir den Merge.

| Check | Anforderung |
| --- | --- |
| ESLint/TSLint | `npm run lint` liefert keine Fehler oder Warnungen |
| Prettier | `npm run format:check` meldet **OK**, Dateien formatiert |
| TypeScript | `npm run typecheck` ohne Fehler |
| Tests | `npm test -- --coverage` fehlerfrei, ≥ 80 % Statements/Branches/Lines |
| Security/Quality | In Codacy keine "Critical" oder "Major" Issues |

### So reproduzierst du Codacy lokal

```bash
npm ci
npm run lint
npm run format:check
npm run typecheck
npm run test -- --coverage
```

Alternativ mit Yarn:

```bash
yarn install --frozen-lockfile
yarn lint
yarn format:check
yarn typecheck
yarn test --coverage
```

Oder mit PNPM:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test -- --coverage
```

### Typische Ursachen und schnelle Fixes

- Unused imports/vars:

  ```ts
  // schlecht
  import x from 'x'; // unbenutzt
  const y = 1;

  // gut
  // ungenutzte entfernen oder mit _ kennzeichnen
  ```

- any/fehlende Typen:

  ```ts
  // schlecht
  function handle(a: any) { /* ... */ }

  // gut
  function handle(a: UserInput): Result { /* ... */ }
  ```

- console.log im App-Code:

  ```ts
  // schlecht
  console.log('debug');

  // gut
  logger.debug('message'); // oder entfernen
  ```

- Magic Numbers:

  ```ts
  // schlecht
  if (retries > 3) { /* ... */ }

  // gut
  const MAX_RETRIES = 3;
  if (retries > MAX_RETRIES) { /* ... */ }
  ```

- Komplexe Funktionen: max. ~50 Zeilen, Komplexität senken, in Hilfsfunktionen teilen.
- Zyklen/Imports: keine zyklischen Abhängigkeiten, shared Types in eigenes Modul legen.

### Commit-/PR-Checklist (muss erfüllt sein)

- [ ] `npm run lint` ohne Findings
- [ ] `npm run format:write` ausgeführt bzw. `format:check` grün
- [ ] `npm run typecheck` grün
- [ ] `npm test -- --coverage` grün, Coverage ≥ 80 %
- [ ] Keine `console.*` im Produktionscode
- [ ] Keine TODO/FIXME im Diff oder mit Issue verlinkt
- [ ] Funktionslänge/Komplexität ok, Magic Numbers extrahiert
- [ ] Neue/angepasste Funktionen mit Typen und Tests
- [ ] Inhalte für **Privatsphäre** & **Nutzungsbedingungen** im Settings-Screen (inkl. Übersetzungen) geprüft und aktuell gehalten

### Wenn Codacy trotzdem rot ist

- [Codacy Dashboard öffnen](https://app.codacy.com/gh/<ORG>/<REPO>).
- Issue anklicken, Regeltext lesen, lokalen Linter mit `--fix` ausführen.
- Prettier/ESLint-Regeln der bestehenden Config respektieren, keine Ad-hoc-Ausnahmen.

## Agent-Code: Qualitätsregeln

- Strikte Typen, keine impliziten `any`.
- Side-effects minimieren, reine Funktionen bevorzugen.
- Happy- und Unhappy-Path testen.
- Env-Zugriffe kapseln, keine Secrets im Code.

```ts
// handler.ts
export interface AgentEvent {
  readonly type: 'trigger';
  readonly payload: Record<string, unknown>;
}

export function handleAgentEvent(event: AgentEvent): string {
  if (!event.payload.userId) {
    throw new Error('userId missing');
  }
  return `handled:${String(event.payload.userId)}`;
}

// handler.test.ts
import { describe, expect, it } from 'vitest';
import { handleAgentEvent } from './handler';

describe('handleAgentEvent', () => {
  it('returns id for valid payload', () => {
    expect(handleAgentEvent({ type: 'trigger', payload: { userId: 42 } }))
      .toBe('handled:42');
  });

  it('throws when userId missing', () => {
    expect(() => handleAgentEvent({ type: 'trigger', payload: {} }))
      .toThrow('userId missing');
  });
});
```

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
