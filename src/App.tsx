import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useStore } from './store/useStore';
import { useAuth } from './hooks/useAuth';

function App() {
  const darkMode = useStore((state) => state.darkMode);

  // Initialize Firebase authentication listener
  useAuth();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AppRoutes />
      <PWAInstallPrompt />
    </BrowserRouter>
  );
}

export default App;
