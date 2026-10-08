const CACHE_NAME = 'drainwatch-cache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/tokens.css',
  '/css/base.css',
  '/css/clay.css',
  '/js/main.js',
  '/js/router.js',
  '/js/store.js',
  '/icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Only intercept GET requests for static assets — never cache-fallback API
  // calls (POST/PATCH submissions must fail cleanly offline so the app's own
  // offline queue in js/ui/offline.js can handle them).
  if (event.request.method !== 'GET' || new URL(event.request.url).pathname.startsWith('/api/')) {
    return;
  }
  // Network-First so changes are always picked up if online; fall back to cache if offline.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
