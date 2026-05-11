// Vandan - Service Worker
// Strategy: HTML + JS = ALWAYS network (never stale), Images/CSS = cache-first for offline
const CACHE_NAME = 'vandan-v52.19';

const CACHE_ONLY_ASSETS = [
  '/css/style.css',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/og-image.png',
  '/manifest.json'
];

// Never cache these — always fetch fresh
const NO_CACHE_PATTERNS = ['.html', '.js', '/api/'];

const shouldSkipCache = (url) => {
  const pathname = new URL(url).pathname;
  return NO_CACHE_PATTERNS.some(p => pathname.includes(p)) || pathname === '/';
};

// Install: Pre-cache only images + CSS
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets...');
      return cache.addAll(CACHE_ONLY_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML & JS: ALWAYS network, no cache stored
// - Images/CSS: Cache-first (fast), fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // HTML, JS, API → always fetch from network, never serve from cache
  if (shouldSkipCache(request.url)) {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(() => {
        // Offline fallback for HTML pages only
        if (url.pathname.endsWith('.html') || url.pathname === '/') {
          return caches.match('/index.html');
        }
      })
    );
    return;
  }

  // Static Assets: Cache-first
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request).then((networkResponse) => {
        // Don't cache API or HTML/JS in this block either
        return networkResponse;
      });
    })
  );
});
