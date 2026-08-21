// Service Worker for AMKAR JUNIOR CRM Push Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push
self.addEventListener('push', (event) => {
  let data = {
    title: '⚡ Новая заявка! - АМКАР ЮНИОР',
    body: 'Поступила новая заявка в CRM',
    icon: '/favicon.png',
    badge: '/favicon.png',
    tag: 'amkar-lead-' + Date.now(),
    data: { url: '/crm' },
  };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/favicon.png',
      badge: data.badge || '/favicon.png',
      tag: data.tag,
      data: data.data || { url: '/crm' },
      vibrate: [200, 100, 200],
      requireInteraction: true,
      actions: [
        { action: 'open_leads', title: 'Открыть заявку' },
        { action: 'dismiss', title: 'Закрыть' }
      ]
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = (event.notification.data && event.notification.data.url) || '/crm';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window client is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.postMessage({ type: 'OPEN_LEADS_TAB' });
          }
          return;
        }
      }
      // If not open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
