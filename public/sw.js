self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    try {
      const data = event.data ? await event.data.json() : {};

      // Support multiple payload shapes (FCM v1 webpush, data-only, custom)
      const notif = data.notification || data.data?.notification || {};
      const title = notif.title || data.title || data.data?.title || 'TRIBE';
      const body = notif.body || data.body || data.data?.body || 'Neue Nachricht';
      const icon = notif.icon || data.icon || data.data?.icon || '/icon-192.svg';
      const badge = notif.badge || data.badge || data.data?.badge || '/icon-192.svg';
      const link = data.fcmOptions?.link || data.data?.link || '/';

      await self.registration.showNotification(title, {
        body,
        icon,
        badge,
        data: { url: link, __raw: data },
      });
    } catch (e) {
      // Fallback generic notification
      await self.registration.showNotification('TRIBE', {
        body: 'Neue Nachricht',
        icon: '/icon-192.svg',
        badge: '/icon-192.svg',
      });
    }
  })());
});

self.addEventListener('notificationclick', (event) => {
  const url = (event.notification?.data && event.notification.data.url) || '/';
  event.notification.close();
  event.waitUntil((async () => {
    const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const client = allClients.find((c) => 'focus' in c && c.url.includes(self.location.origin));
    if (client) {
      client.navigate(url);
      return client.focus();
    }
    return clients.openWindow(url);
  })());
});