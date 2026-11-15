/* Service Worker for Savanna Track 2 Offline Pack */
const CACHE_NAME = 'savanna-offline-pack-v1';
const OFFLINE_URLS = [
  '/',
  '/demo/blank.html',
  '/module/db-player.js',
  '/assets/media/demo-lesson.m4a',
  '/assets/media/demo-lesson.txt',
  '/assets/media/demo-lesson.vtt',
  '/assets/media/demo-lesson.am.vtt',
  '/module/i18n/en.json',
  '/module/i18n/am.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS.filter(Boolean)).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/demo/blank.html') || caches.match('/');
        }
      });
    })
  );
});
