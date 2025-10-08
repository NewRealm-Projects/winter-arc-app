import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/ui/ToastProvider';
import { useAuth } from './hooks/useAuth';
import { usePagePerf, useNetworkToast } from './hooks/usePagePerf';
import packageJson from '../package.json';
import { getRouterBasename } from './lib/router';

const appVersion = packageJson?.version ?? '0.0.0';
const versionLabel = `v${appVersion}`;

function App() {
  // Initialize Firebase authentication listener
  useAuth();

  // Track page performance
  usePagePerf();

  // Show network status toasts
  useNetworkToast();

  const routerBaseName = getRouterBasename(import.meta.env.BASE_URL);

  return (
    <ToastProvider>
      <ErrorBoundary>
        <BrowserRouter basename={routerBaseName}>
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
