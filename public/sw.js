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
      const link = data.fcmOptions?.link || data.data?.link || '/chat?view=community';
      const messageId = data.message_id || data.data?.message_id || data.data?.messageId || null;
      const groupId = data.group_id || data.data?.group_id || data.data?.groupId || null;

      await self.registration.showNotification(title, {
        body,
        icon,
        badge,
        data: { url: link, messageId, groupId, __raw: data },
        actions: [
          { action: 'reply', title: 'Schnell antworten' },
          { action: 'like_heart', title: '❤️' },
          { action: 'like_thumbsup', title: '👍' },
        ],
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
  const baseUrl = '/chat?view=community';
  const data = event.notification?.data || {};
  const url = data.url || baseUrl;
  const messageId = data.messageId || null;
  const groupId = data.groupId || null;

  event.notification.close();
  event.waitUntil((async () => {
    const openOrFocus = async (targetUrl) => {
      const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      const client = allClients.find((c) => 'focus' in c && c.url.includes(self.location.origin));
      if (client) {
        client.navigate(targetUrl);
        return client.focus();
      }
      return clients.openWindow(targetUrl);
    };

    if (event.action === 'like_heart' || event.action === 'like_thumbsup') {
      const emoji = event.action === 'like_heart' ? '❤️' : '👍';
      const target = `${baseUrl}&action=like&emoji=${encodeURIComponent(emoji)}${messageId ? `&messageId=${encodeURIComponent(messageId)}` : ''}${groupId ? `&groupId=${encodeURIComponent(groupId)}` : ''}`;
      return openOrFocus(target);
    }

    if (event.action === 'reply') {
      const quick = 'Bin dabei!';
      const target = `${baseUrl}&action=quick-reply&text=${encodeURIComponent(quick)}${groupId ? `&groupId=${encodeURIComponent(groupId)}` : ''}${messageId ? `&replyTo=${encodeURIComponent(messageId)}` : ''}`;
      return openOrFocus(target);
    }

    return openOrFocus(url || baseUrl);
  })());
});