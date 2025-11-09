// Winter Arc PWA Service Worker
// Handles push notifications and offline support

// Installation: defer activation until explicit client message
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker (waiting)...');
});

let BASE_URL = self.registration.scope; // default to scope

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(clients.claim());
});

// Message-based control: allow page to trigger skipWaiting & update BASE_URL
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'SW_ACTIVATE_NOW') {
    console.log('[SW] Received SW_ACTIVATE_NOW, calling skipWaiting');
    self.skipWaiting();
  }
  if (type === 'SW_SET_BASE_URL' && typeof payload === 'string') {
    BASE_URL = payload;
    console.log('[SW] BASE_URL updated to:', BASE_URL);
  }
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
  const target = BASE_URL || 'https://app.winterarc.newrealm.de';
  event.waitUntil(clients.openWindow(target));
});

// Fetch Handler - Network-first strategy for API calls
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response(JSON.stringify({ error: 'Offline' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 503,
      }))
    );
    return;
  }
  // Optional: could add cache-first for static assets here later
});
