// Vandan - Service Worker
const CACHE_NAME = 'vandan-v51.61'; 
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/calendar.html',
  '/auth.html',
  '/dashboard.html',
  '/group.html',
  '/competition.html',
  '/manage-competition.html',
  '/edit-competition.html',
  '/book-group.html',
  '/reset-password.html',
  '/contact.html',
  '/refund-policy.html',
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

// Fetch: NETWORK FIRST for everything to ensure latest changes are seen
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // NETWORK FIRST STRATEGY
  event.respondWith(
    fetch(request).then((response) => {
      // If we got a valid response, cache it and return
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
      }
      return response;
    }).catch(() => {
      // If network fails, try the cache
      return caches.match(request);
    })
  );
});
