// Service worker: lets the installed app open instantly and play solo without internet.
// Pages and code: network first (so updates arrive), falling back to the cached copy offline.
// Card photos and icons: cache first (they rarely change).
const CACHE = "hdd-v2";
const CORE = ["/", "/config.js", "/css/styles.css", "/js/main.js", "/js/views.js", "/js/state.js", "/js/net.js", "/js/fx.js",
  "/shared/themes.js", "/shared/engine.js", "/shared/football-cards.js", "/shared/cricket-cards.js",
  "/images/manifest.json", "/manifest.webmanifest", "/icons/icon-192.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname === "/ws" || url.pathname === "/health") return;
  const cacheFirst = url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/");
  e.respondWith(cacheFirst
    ? caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }))
    : fetch(e.request).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res; }).catch(() => caches.match(e.request)));
});
