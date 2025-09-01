// Push event listener
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  let data;
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('Failed to parse push data:', e);
    data = {
      title: 'Blood Sugar Reminder',
      body: 'Time to check your blood sugar',
      type: 'reminder'
    };
  }

  const options = {
    body: data.body || 'Time to check your blood sugar',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: data.tag || 'blood-sugar-reminder',
    requireInteraction: true, // Keep notification visible until user interacts
    vibrate: [200, 100, 200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey,
      type: data.type || 'reminder',
      readingType: data.readingType,
      mealId: data.mealId
    },
    actions: [
      {
        action: 'log',
        title: '📝 Log Reading',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'snooze',
        title: '⏰ Snooze 10min',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Blood Sugar Reminder', 
      options
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click:', event.action, event.notification.data);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  let url = '/dashboard';
  
  if (event.action === 'log') {
    // Open add reading page with context
    url = '/dashboard/add?from=notification';
    if (notificationData.readingType) {
      url += `&type=${notificationData.readingType}`;
    }
    if (notificationData.mealId) {
      url += `&meal=${notificationData.mealId}`;
    }
  } else if (event.action === 'snooze') {
    // Schedule a new notification in 10 minutes
    const snoozeTime = 10 * 60 * 1000; // 10 minutes
    self.registration.showNotification('Blood Sugar Reminder (Snoozed)', {
      body: 'Snooze time is up! Time to check your blood sugar.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'snoozed-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: notificationData,
      actions: [
        {
          action: 'log',
          title: '📝 Log Reading',
        }
      ]
    });
    return; // Don't open window for snooze
  } else {
    // Default click - open dashboard
    url = '/dashboard';
  }
  
  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if app not already open
      return clients.openWindow(url);
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event.notification.tag);
});

// Background sync for offline notifications
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-reminder') {
    event.waitUntil(sendBackgroundReminder());
  }
});

function sendBackgroundReminder() {
  // This would check for pending reminders when back online
  console.log('Background reminder sync');
  return Promise.resolve();
}