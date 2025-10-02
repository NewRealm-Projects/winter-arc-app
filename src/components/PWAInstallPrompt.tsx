import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import type { BeforeInstallPromptEvent } from '../types';

function PWAInstallPrompt() {
  const pwaInstallPrompt = useStore((state) => state.pwaInstallPrompt);
  const setPwaInstallPrompt = useStore((state) => state.setPwaInstallPrompt);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setPwaInstallPrompt(promptEvent);

      const dismissedAt = localStorage.getItem('pwa-install-dismissed');
      if (!dismissedAt && !window.matchMedia('(display-mode: standalone)').matches) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);
    return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
  }, [setPwaInstallPrompt]);

  useEffect(() => {
    if (!pwaInstallPrompt) {
      return;
    }
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (!dismissedAt && !window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(true);
    }
  }, [pwaInstallPrompt]);

  const handleInstall = async () => {
    if (!pwaInstallPrompt) {
      return;
    }

    setIsVisible(false);
    await pwaInstallPrompt.prompt();
    const { outcome } = await pwaInstallPrompt.userChoice;

    if (outcome === 'accepted') {
      setPwaInstallPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    } else {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!isVisible || !pwaInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-winter-600 to-winter-700 dark:from-winter-700 dark:to-winter-800 rounded-2xl shadow-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="text-4xl" aria-hidden>
            📲
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">App installieren</h3>
            <p className="text-sm text-winter-100 mb-4">
              Installiere Winter Arc für ein besseres Erlebnis und Offline-Zugriff.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2 bg-white text-winter-600 rounded-lg font-semibold hover:bg-winter-50 transition-colors"
              >
                Jetzt installieren
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-winter-800/50 text-white rounded-lg hover:bg-winter-800/70 transition-colors"
              >
                Später
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PWAInstallPrompt;
