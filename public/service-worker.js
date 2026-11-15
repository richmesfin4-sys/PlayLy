const CACHE_NAME = "digital-bridge-track2-v3";
const CORE_ASSETS = [
  "/module/db-player.js",
  "/module/i18n/en.json",
  "/module/i18n/am.json",
  "/savanna/assets/media/va-future-audio.mp3",
  "/savanna/assets/captions/va-future-en.vtt",
  "/savanna/assets/captions/va-future-am.vtt",
  "/savanna/assets/captions/va-future-ad-en.vtt",
  "/savanna/assets/captions/va-future-ad-am.vtt",
  "/savanna/pages/concept-with-navigation.html",
  "/savanna/pages/jobs.html",
  "/documents/lesson-document.html",
  "/demo/blank.html",
  "/api/v1/lessons/va-future",
  "/api/v1/jobs/accessible-va?lang=en",
  "/api/v1/jobs/accessible-va?lang=am"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(CORE_ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
    })
  );
});
