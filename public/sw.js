// Winter Arc PWA Service Worker
// Handles push notifications and offline support

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(clients.claim());
});

// Push Notification Handler
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification Click Handler
self.addEventListener('notificationclick', function (event) {
  console.log('[SW] Notification click received.');
  event.notification.close();
  event.waitUntil(clients.openWindow('https://app.winterarc.newrealm.de'));
});

// Fetch Handler - Network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  // Network-first strategy for API calls
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 503,
        });
      })
    );
  }
});
