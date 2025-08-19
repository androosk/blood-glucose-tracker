self.addEventListener('push', function(event) {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey,
      type: data.type
    },
    actions: [
      {
        action: 'log',
        title: 'Log Reading',
      },
      {
        action: 'snooze',
        title: 'Snooze 10 min',
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'log') {
    clients.openWindow('/dashboard/add?from=notification');
  } else if (event.action === 'snooze') {
    // Handle snooze logic
  } else {
    clients.openWindow('/dashboard');
  }
});