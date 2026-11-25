/*
 * Offline support for the public site only.
 *
 * Admin pages are never cached: their HTML can contain booking details, and a
 * shared device must not serve a signed-in screen after logout. API and RSC
 * responses are never cached either, for the same reason.
 */
const CACHE_NAME = "tikling-v3";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [OFFLINE_URL, "/manifest.json"];

/** Public routes whose HTML may be cached for offline reading. */
const PUBLIC_NAVIGATION = /^\/(?:$|book$|hikes(?:\/|$)|privacy$|terms$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function isCacheableAsset(request, url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/")) return false;
  if (request.headers.has("range")) return false;
  return ["font", "image", "script", "style"].includes(request.destination);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Private surfaces always go straight to the network.
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/admin") || url.pathname.startsWith("/api/")) return;
    // Next.js client-navigation payloads carry per-request state.
    if (url.searchParams.has("_rsc")) return;
  }

  if (request.mode === "navigate") {
    if (!PUBLIC_NAVIGATION.test(url.pathname)) return;
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL) || new Response("Offline", { status: 503 });
        })
    );
    return;
  }

  if (!isCacheableAsset(request, url)) return;

  // Static assets: serve from cache, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached || new Response("Offline", { status: 503 }));
      return cached || network;
    })
  );
});
