'use client';

import { useEffect } from 'react';

/**
 * PWA Service Worker Registration
 * Registers the service worker in production only
 */
export function PWARegister() {
  useEffect(() => {
    if (
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        })
        .then((registration) => {
          console.log('[PWA] Service Worker registered:', registration.scope);
          
          // Check for updates
          registration.update();
        })
        .catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
