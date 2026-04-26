// Dindi Connect - Service Worker
const CACHE_NAME = 'dindi-connect-v3';
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

// Fetch: Network first for HTML, Cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests (Cloudinary, Razorpay, etc.)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // For API requests: network only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => new Response(JSON.stringify({ error: 'You are offline.' }), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // For HTML pages: ALWAYS network first (never serve stale HTML from cache)
  if (request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(
      fetch(request).then((response) => {
        // Update the cache with the fresh HTML
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      }).catch(() => caches.match(request)) // Fall back to cache only if offline
    );
    return;
  }

  // For static assets (CSS, JS, images): cache first for speed
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      return response;
    }))
  );
});
