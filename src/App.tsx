import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import SystemIndicator from './components/SystemIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { usePagePerf, useNetworkToast } from './hooks/usePagePerf';
import { getRouterBasename } from './lib/router';

function App() {
  // Initialize Firebase authentication listener
  useAuth();

  // Track page performance
  usePagePerf();

  // Show network status toasts
  useNetworkToast();

  const routerBaseName = getRouterBasename(import.meta.env.BASE_URL);

  return (
    <ErrorBoundary>
      <BrowserRouter basename={routerBaseName}>
        <AppRoutes />
        <PWAInstallPrompt />
        <SystemIndicator />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
