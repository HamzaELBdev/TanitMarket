// Firebase Cloud Messaging background service worker.
// Runs outside the Next.js bundle, so config is duplicated here (these are all
// public NEXT_PUBLIC_* values already exposed in the client bundle, not secrets).
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAXvs9O9C55kj2j9HmVqtuI5P5XVY-obj4',
  authDomain: 'studio-558122280-a3fef.firebaseapp.com',
  projectId: 'studio-558122280-a3fef',
  storageBucket: 'studio-558122280-a3fef.firebasestorage.app',
  messagingSenderId: '243426479784',
  appId: '1:243426479784:web:9f72c90b42dd012cbe3c9d',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'TanitMarket';
  const body = payload.notification?.body || '';
  const link = payload.data?.link || '/';

  self.registration.showNotification(title, {
    body,
    icon: '/logoBg.png',
    badge: '/logoMono.png',
    data: { url: link },
  });
});

// Pass-through fetch handler: some installability checks look for an active
// service worker that controls navigation, without needing real caching.
self.addEventListener('fetch', () => {});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
