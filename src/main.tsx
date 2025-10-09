import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import './styles/tokens.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './components/ui/ToastProvider'
import './features/notes/trackingSync'
import { initializeSentry } from './services/sentryService'

// Initialize Sentry error tracking
initializeSentry()

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
