const CACHE_NAME = "tikling-v2";
const PRECACHE_URLS = ["/", "/book", "/hikes"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    // Precache is best-effort — a single 404 would otherwise abort install.
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Never cache API responses — they can contain admin/session data and go
  // stale (e.g. auth state, booking lists) in the Cache Storage.
  const url = new URL(event.request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          if (cached) return cached;
          return new Response("Offline", { status: 503 });
        });

      // Stale-while-revalidate: serve cache immediately, refresh in background.
      if (cached) {
        return cached;
      }

      return networkFetch;
    })
  );
});
