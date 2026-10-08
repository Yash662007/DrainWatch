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
  // We use a Network-First strategy for the HTML/JS so changes are always picked up if online.
  // We fallback to Cache if offline.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
