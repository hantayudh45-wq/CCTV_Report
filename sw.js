/* Service worker: membuat aplikasi bisa dibuka tanpa sinyal.
   Naikkan angka versi di bawah setiap kali index.html diubah, supaya HP mengambil versi baru. */
var CACHE = 'laporan-cctv-v133';
var SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'logo-copy-computer.PNG', 'copycomputer-tech-bg.jpg', 'assets/backgrounds/app-background.webp', 'cctv.html', 'servisan/index.html', 'servisan/app.html', 'servisan/manifest.webmanifest', 'nota.html', 'operasional.html', 'jadwal.html', 'absensi.html', 'cek-servisan.html'];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var ok = url.origin === self.location.origin || url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!ok) return;
  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      // Always check the network first so GitHub Pages updates are not hidden by an old cached app.
      return fetch(req, { cache: 'no-store' }).then(function (res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function () {
        return cache.match(req, { ignoreSearch: true }).then(function (hit) {
          return hit || cache.match('index.html');
        });
      });
    })
  );
});


/* Web Push chat pelanggan servis */
self.addEventListener('push', function (event) {
  var data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  var title = data.title || 'COPY COMPUTER · Pesan pelanggan baru';
  var body = data.body || 'Ada pesan chat pelanggan baru.';
  var target = data.url || new URL('servisan/app.html#jobs', self.registration.scope).href;
  event.waitUntil((async function () {
    var clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    var visibleClient = clientsList.find(function (client) {
      return client.visibilityState === 'visible' && client.focused;
    });
    if (visibleClient) {
      visibleClient.postMessage({ type: 'SERVICE_CHAT_PUSH', title: title, body: body, ticket: data.ticket || '' });
      return;
    }
    await self.registration.showNotification(title, {
      body: body,
      icon: new URL('icon-192.png', self.registration.scope).href,
      badge: new URL('icon-192.png', self.registration.scope).href,
      tag: 'service-chat-' + (data.ticket || 'new'),
      renotify: true,
      data: { url: target }
    });
  })());
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var target = (event.notification.data && event.notification.data.url) ||
    new URL('servisan/app.html#jobs', self.registration.scope).href;
  event.waitUntil((async function () {
    var windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < windows.length; i++) {
      if ('focus' in windows[i]) {
        await windows[i].focus();
        windows[i].navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
