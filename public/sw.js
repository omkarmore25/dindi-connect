// Dindi Connect - Service Worker
const CACHE_NAME = 'dindi-connect-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/calendar.html',
  '/auth.html',
  '/css/style.css',
  '/js/main.js',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/og-image.png',
  '/manifest.json'
];

// Install: Pre-cache all static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching static assets...');
      return cache.addAll(STATIC_ASSETS);
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

// Fetch: Network first, fall back to cache for API calls. Cache first for static files.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and Cloudinary/external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) return;

  // For API requests: network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'You are offline.' }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // For static files: cache-first strategy
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    }))
  );
});
