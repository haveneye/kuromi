importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBV_rnTIqxLquQAJ2i14S-Lin2y0bCIF3Q",
  authDomain: "kuromi-app.firebaseapp.com",
  projectId: "kuromi-app",
  storageBucket: "kuromi-app.firebasestorage.app",
  messagingSenderId: "713556925410",
  appId: "1:713556925410:web:76ef2b7dcff8138ad637bb"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  return self.registration.showNotification(data.title || '아이에게 메시지가 왔어요 💌', {
    body: data.body || '쿠로미 메시지함에서 확인해보세요.',
    data: {
      url: data.url || self.registration.scope,
      childName: data.childName || ''
    }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : self.registration.scope;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (windows) => {
    for (const client of windows) {
      if (new URL(client.url).origin === new URL(targetUrl).origin && 'navigate' in client) {
        await client.navigate(targetUrl);
        return client.focus();
      }
    }
    return clients.openWindow(targetUrl);
  }));
});