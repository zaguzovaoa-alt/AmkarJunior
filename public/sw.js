// Service Worker for AMKAR JUNIOR CRM Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const title = data.title || 'АМКАР ЮНИОР';
      const options = {
        body: data.body || 'Новое уведомление',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: data.url || '/crm',
        vibrate: [200, 100, 200]
      };
      event.waitUntil(self.registration.showNotification(title, options));
    } catch (e) {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('АМКАР ЮНИОР', {
          body: text,
          icon: '/favicon.ico',
        })
      );
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/crm') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/crm');
      }
    })
  );
});
