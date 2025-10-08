# Sentry Usage Rules

Diese Regeln dienen als Leitfaden für die Konfiguration und Nutzung von Sentry in unseren Projekten.

## Fehler- und Exception-Tracking

- Nutze `Sentry.captureException(error)`, um Exceptions zu erfassen und in Sentry zu protokollieren.
- Verwende den Aufruf in `try`/`catch`-Blöcken oder überall dort, wo Exceptions zu erwarten sind.

## Tracing

- Erzeuge Spans für bedeutende Aktionen in der Anwendung, z.\u00a0B. Button-Klicks, API-Calls und Funktionsaufrufe.
- Vergib aussagekr\u00e4ftige Namen und Operations f\u00fcr Custom-Spans.
- Verwende `Sentry.startSpan`, um einen Span zu erstellen. Kind-Spans k\u00f6nnen innerhalb eines Parent-Spans existieren.

### Custom-Span-Instrumentierung in Komponentenaktionen

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

### Custom-Span-Instrumentierung in API-Calls

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

## Logging

- Stelle sicher, dass Sentry mit `import * as Sentry from "@sentry/react"` importiert wird, wenn Logs verwendet werden.
- Aktiviere Logging \u00fcber `Sentry.init({ enableLogs: true })`.
- Greife \u00fcber `const { logger } = Sentry` auf den Logger zu.
- Nutze die `consoleLoggingIntegration`, um bestimmte `console`-Fehlertypen automatisch zu erfassen, ohne jede Logger-Funktion einzeln zu instrumentieren.

### Konfiguration

#### Basiskonfiguration

```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://a6c368bdbb6514ab4e4f989f23d882d4@o4510114201731072.ingest.de.sentry.io/4510155533516880",

  enableLogs: true,
});
```

#### Logger-Integration

```javascript
Sentry.init({
  dsn: "https://a6c368bdbb6514ab4e4f989f23d882d4@o4510114201731072.ingest.de.sentry.io/4510155533516880",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
```

### Logger-Beispiele

Verwende `logger.fmt` als Template-Literal-Funktion, um Variablen in strukturierte Logs zu \u00fcberf\u00fchren.

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```
