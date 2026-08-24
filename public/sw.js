// Service Worker for AMKAR JUNIOR CRM Background Web Push
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push (received even when the tab / browser is in background or closed)
self.addEventListener('push', (event) => {
  let data = {
    title: '⚡ Новая заявка! — АМКАР ЮНИОР',
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

  const title = data.title;
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.png',
    badge: data.badge || '/favicon.png',
    tag: data.tag || 'amkar-notif-' + Date.now(),
    renotify: false,
    requireInteraction: true,
    data: data.data || { url: '/crm' },
    vibrate: [300, 100, 300, 100, 300],
    actions: [
      { action: 'open_crm', title: '👀 Открыть заявку' },
      { action: 'dismiss', title: 'Закрыть' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
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
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.postMessage({ type: 'OPEN_LEADS_TAB' });
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
