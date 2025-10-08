import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/ToastProvider';
import { useAuth } from './hooks/useAuth';
import { usePagePerf, useNetworkToast } from './hooks/usePagePerf';
import packageJson from '../package.json';

const appVersion = packageJson?.version ?? '0.0.0';
const versionLabel = `v${appVersion}`;

function App() {
  // Initialize Firebase authentication listener
  useAuth();

  // Track page performance
  usePagePerf();

  // Show network status toasts
  useNetworkToast();

  return (
    <ToastProvider>
      <ErrorBoundary>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AppRoutes />
          <PWAInstallPrompt />
          <div className="version-bubble" aria-label={`App version ${appVersion}`}>
            {versionLabel}
          </div>
        </BrowserRouter>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
