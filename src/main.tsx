import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import './index.css'
import './styles/theme.css'
import './styles/tokens.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/ToastProvider'
import './features/notes/trackingSync'

declare global {
  interface Window {
    SENTRY_RELEASE?: {
      id?: string
    }
  }
}

// Initialize Sentry
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: window.SENTRY_RELEASE?.id,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of transactions in dev, lower in production
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
  });
  console.warn('✅ Sentry initialized');
} else {
  console.warn('⚠️ Sentry DSN not configured')
  Sentry.init({
    dsn:
      import.meta.env.VITE_SENTRY_DSN ??
      'https://a6c368bdbb6514ab4e4f989f23d882d4@o4510114201731072.ingest.de.sentry.io/4510155533516880',
    environment: import.meta.env.MODE,
    sendDefaultPii: true,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    enableLogs: true,
  })
}

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root container element not found')
}

const root = createRoot(container)

root.render(
  <StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ThemeProvider>
  </StrictMode>,
)
