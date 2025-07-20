self.addEventListener('push', function(event) {
  const data = event.data?.json();
  self.registration.showNotification(data.title || "Push!", {
    body: data.body || "Du hast eine neue Nachricht",
    icon: '/icon-192.svg'
  });
});