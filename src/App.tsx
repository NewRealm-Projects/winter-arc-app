import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import AppRoutes from './routes';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import SystemIndicator from './components/SystemIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';
import { usePagePerf, useNetworkToast } from './hooks/usePagePerf';
import { getRouterBasename } from './lib/router';
import { waitForAuth } from './firebase/auth';

function App() {
  const [authReady, setAuthReady] = useState(false);

  // Wait for auth to initialize before rendering
  useEffect(() => {
    waitForAuth()
      .then(() => {
        setAuthReady(true);
      })
      .catch((error) => {
        console.error('Auth initialization error:', error);
        setAuthReady(true); // Continue anyway to show login screen
      });
  }, []);

  // Initialize Firebase authentication listener
  useAuth();

  // Track page performance
  usePagePerf();

  // Show network status toasts
  useNetworkToast();

  const routerBaseName = getRouterBasename(import.meta.env.BASE_URL);

  // Show splash screen while auth initializes
  if (!authReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-winter-500 to-winter-700">
        <div className="text-center">
          <div className="text-6xl mb-4">❄️</div>
          <div className="text-white text-lg font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <BrowserRouter basename={routerBaseName}>
        <AppRoutes />
        <PWAInstallPrompt />
        <SystemIndicator />
        <SpeedInsights />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
